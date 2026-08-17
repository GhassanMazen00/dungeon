// The instruments. Every chamber hands the player whatever apparatus its puzzle
// needs, so nobody ever has to reach for developer tools or outside software.
//
// Each tool exports mount(host, data) and is registered in TOOLS at the bottom.

const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach((c) => c !== null && c !== undefined && c !== false &&
    n.append(c instanceof Node ? c : document.createTextNode(String(c))));
  return n;
};

/* ========================================================== I · THE LAMP === */

function mountLamp(host, data) {
  const canvas = el('canvas', { class: 'lamp__canvas' });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let source = null;

  const state = { channel: 'all', lo: 0, hi: 255 };

  const render = () => {
    if (!source) return;
    ctx.drawImage(source, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    const { lo, hi } = state;
    const span = Math.max(1, hi - lo);
    const pick = { red: 0, green: 1, blue: 2 }[state.channel];

    for (let i = 0; i < d.length; i += 4) {
      const v = pick === undefined ? (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) : d[i + pick];
      const out = v <= lo ? 0 : v >= hi ? 255 : ((v - lo) * 255) / span;
      d[i] = d[i + 1] = d[i + 2] = out;
    }
    ctx.putImageData(img, 0, 0);
  };

  const image = new Image();
  image.onload = () => {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    source = image;
    render();
  };
  image.src = data.image;

  const slider = (label, key, value) => {
    const out = el('span', { class: 'lamp__val', text: String(value) });
    const input = el('input', {
      type: 'range', min: '0', max: '255', value: String(value), class: 'lamp__range',
      oninput: (e) => {
        state[key] = Number(e.target.value);
        // Keep the window coherent no matter which handle is dragged.
        if (state.lo > state.hi) {
          if (key === 'lo') state.hi = state.lo;
          else state.lo = state.hi;
        }
        out.textContent = String(state[key]);
        render();
      }
    });
    return { row: el('label', { class: 'lamp__row' }, el('span', { text: label }), input, out), input };
  };

  const loS = slider('floor', 'lo', 0);
  const hiS = slider('ceiling', 'hi', 255);

  const filters = ['all', 'red', 'green', 'blue'].map((name) =>
    el('button', {
      class: `lamp__filter${name === 'all' ? ' is-on' : ''}`,
      type: 'button',
      dataset: name,
      text: name,
      onclick: (e) => {
        state.channel = name;
        host.querySelectorAll('.lamp__filter').forEach((b) => b.classList.remove('is-on'));
        e.currentTarget.classList.add('is-on');
        render();
      }
    })
  );

  host.append(
    el('div', { class: 'lamp' },
      el('div', { class: 'lamp__screen' }, canvas),
      el('div', { class: 'lamp__panel' },
        el('div', { class: 'lamp__filters' }, ...filters),
        loS.row,
        hiS.row,
        el('button', {
          class: 'btn btn--sm', type: 'button', text: 'reset',
          onclick: () => {
            state.lo = 0; state.hi = 255; state.channel = 'all';
            loS.input.value = '0'; hiS.input.value = '255';
            host.querySelectorAll('.lamp__filter').forEach((b) =>
              b.classList.toggle('is-on', b.dataset.name === 'all' || b.textContent === 'all'));
            render();
          }
        })
      )
    )
  );
}

/* ========================================================= II · THE CHOIR === */

function mountChoir(host, data) {
  let picked = [];
  const solved = [];
  const remaining = [...data.words];

  const board = el('div', { class: 'choir__board' });
  const found = el('div', { class: 'choir__found' });
  const status = el('p', { class: 'tool__status' });

  const draw = () => {
    found.replaceChildren(
      ...solved.map((g) =>
        el('div', { class: 'choir__group' },
          el('span', { class: 'choir__group-name', text: g.name }),
          el('span', { class: 'choir__group-words', text: g.words.join(' · ') })
        )
      )
    );
    board.replaceChildren(
      ...remaining.map((w) =>
        el('button', {
          class: `choir__tile${picked.includes(w) ? ' is-picked' : ''}`,
          type: 'button', text: w,
          onclick: () => {
            if (picked.includes(w)) picked = picked.filter((x) => x !== w);
            else if (picked.length < 4) picked.push(w);
            draw();
          }
        })
      )
    );
    submit.disabled = picked.length !== 4;
  };

  const submit = el('button', {
    class: 'btn btn--primary', type: 'button', text: 'sort these four',
    onclick: () => {
      const hit = data.groups.find(
        (g) => picked.length === 4 && picked.every((w) => g.words.includes(w))
      );
      if (hit) {
        solved.push(hit);
        hit.words.forEach((w) => {
          const i = remaining.indexOf(w);
          if (i >= 0) remaining.splice(i, 1);
        });
        picked = [];
        status.textContent = solved.length === 4
          ? 'All four families named. Now read their initials.'
          : `${hit.name}. ${4 - solved.length} to go.`;
        status.className = 'tool__status is-good';
      } else {
        status.textContent = 'Not a family.';
        status.className = 'tool__status is-bad';
        board.classList.add('is-wrong');
        setTimeout(() => board.classList.remove('is-wrong'), 400);
      }
      draw();
    }
  });

  host.append(el('div', { class: 'choir' }, found, board, el('div', { class: 'tool__actions' }, submit), status));
  draw();
}

/* ======================================================= III · THE LATTICE === */

function mountLattice(host, data) {
  const { width, height, rowClues, colClues, givens, solution } = data;
  const target = solution.split('|').map((r) => r.split('').map(Number));

  // 0 = unknown, 1 = filled, 2 = ruled out
  const grid = Array.from({ length: height }, () => Array(width).fill(0));
  const locked = Array.from({ length: height }, () => Array(width).fill(false));
  givens.forEach(([r, c]) => { grid[r][c] = 1; locked[r][c] = true; });

  const status = el('p', { class: 'tool__status' });
  const maxRow = Math.max(...rowClues.map((c) => c.length));
  const maxCol = Math.max(...colClues.map((c) => c.length));

  const table = el('div', { class: 'lattice' });

  const lineDone = (clue, cells) => {
    const runs = [];
    let n = 0;
    for (const v of cells) { if (v === 1) n++; else if (n) { runs.push(n); n = 0; } }
    if (n) runs.push(n);
    const want = clue[0] === 0 ? [] : clue;
    return runs.length === want.length && runs.every((v, i) => v === want[i]);
  };

  const paint = () => {
    table.style.setProperty('--cols', String(width + maxRow));
    table.style.setProperty('--rows', String(height + maxCol));
    const nodes = [];

    // top-left dead corner
    nodes.push(el('div', { class: 'lat__corner', style: `grid-column: 1 / span ${maxRow}; grid-row: 1 / span ${maxCol}` }));

    // column clues
    colClues.forEach((clue, c) => {
      const ok = lineDone(clue, grid.map((r) => r[c]));
      nodes.push(el('div', {
        class: `lat__clue lat__clue--col${ok ? ' is-done' : ''}`,
        style: `grid-column: ${maxRow + c + 1}; grid-row: 1 / span ${maxCol}`
      }, ...(clue[0] === 0 ? ['·'] : clue.map((n) => el('span', { text: String(n) })))));
    });

    for (let r = 0; r < height; r++) {
      const ok = lineDone(rowClues[r], grid[r]);
      nodes.push(el('div', {
        class: `lat__clue lat__clue--row${ok ? ' is-done' : ''}`,
        style: `grid-column: 1 / span ${maxRow}; grid-row: ${maxCol + r + 1}`
      }, ...(rowClues[r][0] === 0 ? ['·'] : rowClues[r].map((n) => el('span', { text: String(n) })))));

      for (let c = 0; c < width; c++) {
        const v = grid[r][c];
        nodes.push(el('button', {
          type: 'button',
          class: `lat__cell${v === 1 ? ' is-filled' : ''}${v === 2 ? ' is-out' : ''}${locked[r][c] ? ' is-locked' : ''}`,
          style: `grid-column: ${maxRow + c + 1}; grid-row: ${maxCol + r + 1}`,
          'aria-label': `row ${r + 1} column ${c + 1}`,
          onclick: () => {
            if (locked[r][c]) return;
            grid[r][c] = (grid[r][c] + 1) % 3;
            paint();
          },
          oncontextmenu: (e) => {
            e.preventDefault();
            if (locked[r][c]) return;
            grid[r][c] = grid[r][c] === 2 ? 0 : 2;
            paint();
          }
        }, v === 2 ? '·' : null));
      }
    }
    table.replaceChildren(...nodes);
  };

  host.append(
    el('div', { class: 'lattice-wrap' }, table),
    el('div', { class: 'tool__actions' },
      el('button', {
        class: 'btn btn--primary', type: 'button', text: 'read the grid',
        onclick: () => {
          const done = grid.every((row, r) => row.every((v, c) => (v === 1) === (target[r][c] === 1)));
          status.textContent = done
            ? 'The pattern resolves. Read what it spells.'
            : 'Not yet. Some line disagrees with its counts.';
          status.className = `tool__status ${done ? 'is-good' : 'is-bad'}`;
        }
      }),
      el('button', {
        class: 'btn btn--sm', type: 'button', text: 'clear',
        onclick: () => {
          for (let r = 0; r < height; r++)
            for (let c = 0; c < width; c++) if (!locked[r][c]) grid[r][c] = 0;
          paint();
          status.textContent = '';
        }
      })
    ),
    el('p', { class: 'tool__hint-line', text: 'click cycles fill → rule-out → blank · right-click to rule out directly' }),
    status
  );
  paint();
}

/* ========================================================== IV · THE LOCK === */

function mountLock(host, data) {
  const { symbols, secret } = data;
  const wheels = Array(secret.length).fill(0);
  const history = [];

  const log = el('div', { class: 'lock__log' });
  const status = el('p', { class: 'tool__status' });

  const drawWheels = () =>
    wheels.map((v, i) =>
      el('div', { class: 'lock__wheel' },
        el('button', { class: 'lock__nudge', type: 'button', text: '▲',
          onclick: () => { wheels[i] = (wheels[i] + 1) % symbols.length; paint(); } }),
        el('div', { class: 'lock__face', text: symbols[v] }),
        el('button', { class: 'lock__nudge', type: 'button', text: '▼',
          onclick: () => { wheels[i] = (wheels[i] - 1 + symbols.length) % symbols.length; paint(); } })
      )
    );

  const row = el('div', { class: 'lock__wheels' });

  const paint = () => row.replaceChildren(...drawWheels());

  const pull = () => {
    const guess = [...wheels];
    let exact = 0;
    const restG = [];
    const restS = [];
    guess.forEach((g, i) => {
      if (g === secret[i]) exact++;
      else { restG.push(g); restS.push(secret[i]); }
    });
    let misplaced = 0;
    const pool = [...restS];
    restG.forEach((g) => {
      const i = pool.indexOf(g);
      if (i >= 0) { misplaced++; pool.splice(i, 1); }
    });

    history.unshift({ guess, exact, misplaced });
    log.replaceChildren(
      ...history.slice(0, 14).map((h) =>
        el('div', { class: 'lock__entry' },
          el('span', { class: 'lock__entry-syms', text: h.guess.map((i) => symbols[i]).join(' ') }),
          el('span', { class: 'lock__score' },
            el('b', { text: String(h.exact) }), ' exact · ',
            el('b', { text: String(h.misplaced) }), ' displaced')
        )
      )
    );

    if (exact === secret.length) {
      status.innerHTML = `The lock gives. Carved on the inside of the shackle: <b>${data.reveal}</b>`;
      status.className = 'tool__status is-good';
    } else {
      status.textContent = `${exact} exact, ${misplaced} displaced.`;
      status.className = 'tool__status';
    }
  };

  host.append(
    el('div', { class: 'lock' }, row,
      el('div', { class: 'tool__actions' },
        el('button', { class: 'btn btn--primary', type: 'button', text: 'pull', onclick: pull })),
      status, log)
  );
  paint();
}

/* ========================================================== V · THE DOOR === */

function mountDoor(host, data) {
  host.append(
    el('div', { class: 'door' },
      el('div', { class: 'door__slots' },
        ...Array.from({ length: data.length }, (_, i) =>
          el('div', { class: 'door__slot', text: '·', 'data-n': String(i + 1) }))
      ),
      el('p', { class: 'tool__hint-line', text: 'no apparatus here — only the four keys you already hold' })
    )
  );
}

/* ------------------------------------------------------------------ registry */

export const TOOLS = {
  lamp: mountLamp,
  choir: mountChoir,
  lattice: mountLattice,
  lock: mountLock,
  door: mountDoor
};
