// Pixel Studio — canvas-based editor with tools, undo/redo, mirror mode,
// PNG export, local autosave and cloud submit.
//
// The art itself is a flat array of hex strings, one per cell. The canvas is
// exactly `size` device pixels wide and scaled up with image-rendering:pixelated,
// so painting is a single fillRect and export is a clean nearest-neighbour blit.

import { STORAGE_KEYS } from '../config.js';
import { read, write } from '../core/store.js';
import { el, qs, toast } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { artRef, isOnline } from '../core/db.js';
import { unlock } from './achievements.js';

const EMPTY = '#000000';
const HISTORY_LIMIT = 50;

const SWATCHES = [
  '#000000', '#1a1a1a', '#4d4d4d', '#808080', '#b3b3b3', '#e6e6e6', '#ffffff', '#f5d0c5',
  '#cc0000', '#ff3333', '#ff6666', '#ff9999', '#990000', '#660000', '#ff8800', '#ffaa00',
  '#ffcc00', '#ffff00', '#ccff00', '#66ff33', '#33cc33', '#009933', '#006622', '#004d1a',
  '#00ffcc', '#00ddff', '#0099ff', '#0055ff', '#0033aa', '#001f66', '#6600cc', '#9933ff',
  '#cc66ff', '#ff00ff', '#ff0080', '#cc0066', '#804000', '#a6612a', '#d99a5b', '#f2c894'
];

const TOOLS = [
  { id: 'brush', icon: 'brush', label: 'Brush (B)' },
  { id: 'eraser', icon: 'eraser', label: 'Eraser (E)' },
  { id: 'fill', icon: 'fill', label: 'Fill (G)' },
  { id: 'picker', icon: 'picker', label: 'Pick colour (I)' }
];

export function initStudio() {
  const canvas = qs('#artCanvas');
  if (!canvas) return;

  const frame = qs('#canvasFrame');
  const ctx = canvas.getContext('2d');

  const saved = read(STORAGE_KEYS.canvas, null);
  let size = saved?.size ?? 16;
  let cells = Array.isArray(saved?.cells) && saved.cells.length === size * size
    ? [...saved.cells]
    : new Array(size * size).fill(EMPTY);

  let color = '#ff3333';
  let tool = 'brush';
  let mirror = false;
  let showGrid = true;
  let painting = false;
  let strokeStart = null;
  let lastCell = null;
  let undoStack = [];
  let redoStack = [];

  /* --- Rendering --------------------------------------------------------- */

  // Measure the column, not the frame: the frame is centred in a flex column
  // and would otherwise shrink to fit the canvas it is supposed to size.
  const displaySize = () => {
    const column = frame.parentElement?.clientWidth || window.innerWidth;
    const max = Math.min(column - 32, 480);
    return Math.max(192, Math.floor(max / size) * size);
  };

  function layout() {
    const px = displaySize();
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${px}px`;
    canvas.style.height = `${px}px`;
    frame.style.setProperty('--cell', `${px / size}px`);
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, size, size);
    for (let i = 0; i < cells.length; i++) {
      const value = cells[i];
      if (!value || value === 'transparent') continue;
      ctx.fillStyle = value;
      ctx.fillRect(i % size, Math.floor(i / size), 1, 1);
    }
  }

  const persist = () => write(STORAGE_KEYS.canvas, { size, cells });

  /* --- History ----------------------------------------------------------- */

  function pushHistory(snapshot) {
    undoStack.push(snapshot);
    if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
    redoStack = [];
    syncHistoryButtons();
  }

  function syncHistoryButtons() {
    qs('#btnUndo').disabled = undoStack.length === 0;
    qs('#btnRedo').disabled = redoStack.length === 0;
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push([...cells]);
    cells = undoStack.pop();
    draw();
    persist();
    syncHistoryButtons();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push([...cells]);
    cells = redoStack.pop();
    draw();
    persist();
    syncHistoryButtons();
  }

  /* --- Painting ---------------------------------------------------------- */

  function cellFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * size);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * size);
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    return { x, y, index: y * size + x };
  }

  function paintAt(x, y, value) {
    cells[y * size + x] = value;
    if (mirror) cells[y * size + (size - 1 - x)] = value;
  }

  /**
   * Bresenham line between two cells. Pointer events are sampled, not
   * continuous, so a fast drag would otherwise leave gaps in the stroke.
   */
  function paintLine(from, to, value) {
    let { x: x0, y: y0 } = from;
    const { x: x1, y: y1 } = to;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    for (;;) {
      paintAt(x0, y0, value);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  function floodFill(startIndex, target, replacement) {
    if (target === replacement) return;
    const queue = [startIndex];
    const seen = new Set(queue);
    while (queue.length) {
      const index = queue.pop();
      if (cells[index] !== target) continue;
      cells[index] = replacement;
      const x = index % size;
      const y = Math.floor(index / size);
      const neighbours = [
        x > 0 ? index - 1 : -1,
        x < size - 1 ? index + 1 : -1,
        y > 0 ? index - size : -1,
        y < size - 1 ? index + size : -1
      ];
      for (const n of neighbours) {
        if (n >= 0 && !seen.has(n) && cells[n] === target) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
  }

  function applyTool(event, isStart) {
    const hit = cellFromEvent(event);
    if (!hit) return;

    if (tool === 'picker') {
      if (!isStart) return;
      setColor(cells[hit.index] || EMPTY);
      setTool('brush');
      return;
    }

    if (tool === 'fill') {
      if (!isStart) return;
      pushHistory([...cells]);
      floodFill(hit.index, cells[hit.index], color);
      draw();
      persist();
      return;
    }

    const value = tool === 'eraser' ? EMPTY : color;
    if (isStart || !lastCell) paintAt(hit.x, hit.y, value);
    else paintLine(lastCell, hit, value);
    lastCell = hit;
    draw();
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    painting = true;
    strokeStart = [...cells];
    lastCell = null;
    applyTool(event, true);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!painting) return;
    applyTool(event, false);
  });

  const endStroke = () => {
    if (!painting) return;
    painting = false;
    lastCell = null;
    // Only record history if the stroke actually changed something.
    if (strokeStart && strokeStart.some((value, i) => value !== cells[i])) {
      pushHistory(strokeStart);
      persist();
    }
    strokeStart = null;
  };

  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('pointerleave', endStroke);

  /* --- Controls ---------------------------------------------------------- */

  function setColor(next) {
    color = next;
    qs('#colorChip').style.background = next;
    qs('#colorHex').textContent = next.toUpperCase();
    qs('#colorPicker').value = /^#[0-9a-f]{6}$/i.test(next) ? next : '#000000';
    qs('#swatches')
      .querySelectorAll('.swatch')
      .forEach((node) => node.classList.toggle('is-active', node.dataset.color === next));
  }

  function setTool(next) {
    tool = next;
    qs('#toolRow')
      .querySelectorAll('.tool')
      .forEach((node) => {
        const active = node.dataset.tool === next;
        node.classList.toggle('is-active', active);
        node.setAttribute('aria-pressed', String(active));
      });
  }

  function resize(next) {
    const previous = { size, cells: [...cells] };
    size = next;
    cells = new Array(size * size).fill(EMPTY);
    // Copy the old art into the top-left of the new canvas so work is not lost.
    for (let y = 0; y < Math.min(previous.size, size); y++) {
      for (let x = 0; x < Math.min(previous.size, size); x++) {
        cells[y * size + x] = previous.cells[y * previous.size + x];
      }
    }
    undoStack = [];
    redoStack = [];
    syncHistoryButtons();
    layout();
    persist();
  }

  function clearCanvas() {
    pushHistory([...cells]);
    cells = new Array(size * size).fill(EMPTY);
    draw();
    persist();
  }

  function randomFill() {
    pushHistory([...cells]);
    cells = cells.map(() => SWATCHES[Math.floor(Math.random() * SWATCHES.length)]);
    draw();
    persist();
  }

  /** Renders the art at 16x scale into an offscreen canvas for download. */
  function exportPNG() {
    const scale = 16;
    const out = document.createElement('canvas');
    out.width = size * scale;
    out.height = size * scale;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.fillStyle = EMPTY;
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0, out.width, out.height);

    const link = el('a', {
      href: out.toDataURL('image/png'),
      download: `ghassan-pixel-${size}x${size}-${Date.now()}.png`
    });
    document.body.append(link);
    link.click();
    link.remove();
    toast('PNG exported.', 'ok');
    unlock('export');
  }

  async function sendToCloud() {
    if (!isOnline()) {
      toast('Cloud is offline — try again later.', 'bad');
      return;
    }
    if (cells.every((value) => value === EMPTY)) {
      toast('Draw something first.', 'info');
      return;
    }

    const button = qs('#btnSend');
    button.disabled = true;
    try {
      // Same record shape as the original build so old gallery entries still render.
      await artRef().push().set({
        id: Date.now(),
        size,
        colors: cells,
        timestamp: new Date().toLocaleString()
      });
      toast('Art sent to Ghassan.', 'ok');
      unlock('artist');
    } catch (error) {
      console.error('[studio] save failed', error);
      toast('Could not send the art.', 'bad');
    } finally {
      button.disabled = false;
    }
  }

  /* --- Build the UI ------------------------------------------------------ */

  qs('#toolRow').replaceChildren(
    ...TOOLS.map((t) =>
      el('button', {
        class: 'tool',
        type: 'button',
        title: t.label,
        'aria-label': t.label,
        'aria-pressed': 'false',
        dataset: { tool: t.id },
        html: icon(t.icon),
        onclick: () => setTool(t.id)
      })
    )
  );

  qs('#swatches').replaceChildren(
    ...SWATCHES.map((hex) =>
      el('button', {
        class: 'swatch',
        type: 'button',
        title: hex,
        'aria-label': `Colour ${hex}`,
        dataset: { color: hex },
        style: `background:${hex}`,
        onclick: () => setColor(hex)
      })
    )
  );

  qs('#colorPicker').addEventListener('input', (event) => setColor(event.target.value));

  qs('#canvasSize').addEventListener('change', (event) => resize(Number(event.target.value)));

  qs('#btnUndo').addEventListener('click', undo);
  qs('#btnRedo').addEventListener('click', redo);
  qs('#btnClear').addEventListener('click', clearCanvas);
  qs('#btnRandom').addEventListener('click', randomFill);
  qs('#btnExport').addEventListener('click', exportPNG);
  qs('#btnSend').addEventListener('click', sendToCloud);

  const mirrorBtn = qs('#btnMirror');
  mirrorBtn.addEventListener('click', () => {
    mirror = !mirror;
    mirrorBtn.classList.toggle('is-on', mirror);
    mirrorBtn.setAttribute('aria-pressed', String(mirror));
    toast(mirror ? 'Mirror mode on.' : 'Mirror mode off.', 'info', 1400);
  });

  const gridBtn = qs('#btnGrid');
  gridBtn.addEventListener('click', () => {
    showGrid = !showGrid;
    frame.classList.toggle('show-grid', showGrid);
    gridBtn.classList.toggle('is-on', showGrid);
    gridBtn.setAttribute('aria-pressed', String(showGrid));
  });

  // Keyboard shortcuts, only while the studio is actually on screen.
  const section = qs('#studio');
  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea, select')) return;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
    if (!inView) return;

    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if (key === 'b') setTool('brush');
    else if (key === 'e') setTool('eraser');
    else if (key === 'g') setTool('fill');
    else if (key === 'i') setTool('picker');
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 200);
  });

  qs('#canvasSize').value = String(size);
  frame.classList.toggle('show-grid', showGrid);
  gridBtn.classList.toggle('is-on', showGrid);
  setColor(color);
  setTool(tool);
  syncHistoryButtons();
  layout();
}
