// Minimal markdown → HTML renderer.
//
// Safety: the input is HTML-escaped FIRST, then markdown tokens are converted.
// Nothing the model writes can introduce a tag, so there is no injection path
// even though we assign the result with innerHTML.

const escapeHTML = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function inline(text) {
  return text
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    // Links: the URL is already escaped, and we only accept http(s).
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function renderMarkdown(source) {
  const escaped = escapeHTML(source);
  const out = [];
  const lines = escaped.split('\n');

  let listType = null;
  let inCode = false;
  let codeLang = '';
  let codeBuffer = [];

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  const flushCode = () => {
    const body = codeBuffer.join('\n');
    out.push(
      `<div class="code-block"><div class="code-block__bar">` +
        `<span>${codeLang || 'code'}</span>` +
        `<button class="code-block__copy" type="button" data-copy>copy</button>` +
        `</div><pre><code>${body}</code></pre></div>`
    );
    codeBuffer = [];
    codeLang = '';
  };

  for (const line of lines) {
    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        closeList();
        inCode = true;
        codeLang = fence[1] ?? '';
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = Math.min(6, heading[1].length + 2);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s*&gt;\s?/.test(line)) {
      closeList();
      out.push(`<blockquote>${inline(line.replace(/^\s*&gt;\s?/, ''))}</blockquote>`);
      continue;
    }

    if (/^\s*([-*+])\s+/.test(line)) {
      if (listType !== 'ul') {
        closeList();
        out.push('<ul>');
        listType = 'ul';
      }
      out.push(`<li>${inline(line.replace(/^\s*([-*+])\s+/, ''))}</li>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== 'ol') {
        closeList();
        out.push('<ol>');
        listType = 'ol';
      }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      continue;
    }

    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      closeList();
      out.push('<hr>');
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  // An unterminated fence still has to render — models get cut off mid-block.
  if (inCode) flushCode();
  closeList();

  return out.join('');
}

/** Wires the copy buttons inside a rendered message. */
export function bindCodeCopy(root) {
  root.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.closest('.code-block')?.querySelector('code')?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = 'copied';
        setTimeout(() => {
          button.textContent = 'copy';
        }, 1400);
      } catch {
        button.textContent = 'blocked';
      }
    });
  });
}
