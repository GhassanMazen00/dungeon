// One streaming interface over three providers.
//
// Gemini and the OpenAI-shaped APIs (Groq, OpenRouter) disagree about message
// format, auth header and stream envelope, so each gets a thin adapter and the
// rest of the app never knows which one answered.

import { PROVIDERS, PROVIDER_ORDER, PARAMS, STORAGE, keyShapeWarning } from './config.js';

/* ---------------------------------------------------------------- selection */

/**
 * Providers with a key that stands a chance of authenticating, in preference
 * order. A key of the wrong shape is skipped rather than tried first: it can
 * only 401, and letting it head the chain delays every single reply behind a
 * request that cannot succeed.
 */
export const availableProviders = () =>
  PROVIDER_ORDER.filter((id) => PROVIDERS[id]?.key?.trim() && !keyShapeWarning(id));

/** Every provider holding a key, including unusable ones — for diagnostics. */
export const configuredProviders = () =>
  PROVIDER_ORDER.filter((id) => PROVIDERS[id]?.key?.trim());

let active = availableProviders()[0] ?? null;

/* A model that answered once is tried first next time, so the walk below
   normally costs nothing after the first success. */
const remembered = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.models) ?? '{}');
  } catch {
    return {};
  }
})();

function rememberModel(id, model) {
  remembered[id] = model;
  try {
    localStorage.setItem(STORAGE.models, JSON.stringify(remembered));
  } catch {
    /* storage unavailable — we just re-walk next load */
  }
}

/**
 * Candidate models for a provider, the last known-good one first — including
 * when that model came from live discovery and is not in the configured list.
 * Without this the walk repeats every dead model on every single message.
 */
function modelsFor(id) {
  const list = PROVIDERS[id].models;
  const won = remembered[id];
  if (!won) return [...list];
  return [won, ...list.filter((m) => m !== won)];
}

/* ------------------------------------------------- live free-model discovery */

// OpenRouter retires `:free` variants without notice — the API answers
// "This model is unavailable for free. The paid version is available now"
// and helpfully suggests the PAID slug. Following that suggestion would start
// charging the account, so it is ignored entirely. Instead the catalogue is
// read and filtered on price, which is the only way to be certain a model is
// actually free.

const CATALOGUE_TTL = 6 * 60 * 60 * 1000;

const isZeroCost = (m) => {
  const p = m?.pricing ?? {};
  const zero = (v) => v !== undefined && v !== null && Number(v) === 0;
  return zero(p.prompt) && zero(p.completion);
};

// Prefer capable general-purpose models; demote tiny ones and reasoning models
// (their <think> blocks wreck a one-line answer).
const rank = (id) => {
  let score = 50;
  if (/llama-4|llama-3\.3/i.test(id)) score += 45;
  else if (/deepseek-chat|deepseek-v3/i.test(id)) score += 42;
  else if (/qwen.*(2\.5|3)/i.test(id)) score += 38;
  else if (/gemma-3/i.test(id)) score += 34;
  else if (/mistral-small|mistral-nemo/i.test(id)) score += 30;
  else if (/gpt-oss|glm|kimi/i.test(id)) score += 26;
  if (/\br1\b|reason|thinking|qwq/i.test(id)) score -= 60;
  if (/(^|[^0-9])([1-3])b([^0-9]|$)/i.test(id)) score -= 25;
  return score;
};

let cataloguePromise = null;

/** Zero-cost OpenRouter model IDs, best first. Cached for six hours. */
async function freeModels() {
  try {
    const cached = JSON.parse(localStorage.getItem('doctor_catalogue_v1') ?? 'null');
    if (cached && Date.now() - cached.at < CATALOGUE_TTL && cached.ids?.length) return cached.ids;
  } catch {
    /* fall through to a fetch */
  }

  // One in-flight fetch, however many callers.
  cataloguePromise ??= (async () => {
    const res = await fetch(`${'https://openrouter.ai/api/v1'}/models`, {
      headers: { Authorization: `Bearer ${PROVIDERS.openrouter.key}` }
    });
    if (!res.ok) throw new Error(`catalogue ${res.status}`);
    const body = await res.json();
    const ids = (body.data ?? [])
      .filter(isZeroCost)
      .map((m) => m.id)
      .sort((a, b) => rank(b) - rank(a));
    if (!ids.length) throw new Error('no free models listed');
    try {
      localStorage.setItem('doctor_catalogue_v1', JSON.stringify({ at: Date.now(), ids }));
    } catch {
      /* ignore */
    }
    return ids;
  })();

  try {
    return await cataloguePromise;
  } finally {
    cataloguePromise = null;
  }
}

export const currentProvider = () => active;
export const providerLabel = (id = active) => PROVIDERS[id]?.label ?? 'offline';

export function setProvider(id) {
  if (PROVIDERS[id]?.key?.trim()) active = id;
  return active;
}

/* ------------------------------------------------------------------ adapters */

/** Gemini: system prompt is its own field, and roles are user/model. */
function geminiRequest(cfg, model, system, messages) {
  return {
    url: cfg.endpoint(model),
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.key },
    body: {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature: PARAMS.temperature,
        maxOutputTokens: PARAMS.maxTokens,
        topP: PARAMS.topP
      },
      // The persona is deliberately unpleasant; without this the model refuses
      // its own tone. Genuine-distress handling lives in the system prompt.
      safetySettings: [
        'HARM_CATEGORY_HARASSMENT',
        'HARM_CATEGORY_HATE_SPEECH',
        'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'HARM_CATEGORY_DANGEROUS_CONTENT'
      ].map((category) => ({ category, threshold: 'BLOCK_ONLY_HIGH' }))
    }
  };
}

/** Groq and OpenRouter both speak the OpenAI chat-completions shape. */
function openaiRequest(cfg, model, system, messages, id) {
  return {
    url: cfg.endpoint(model),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.key}`,
      ...(id === 'openrouter'
        ? { 'HTTP-Referer': location.origin, 'X-Title': 'The Doctor' }
        : {})
    },
    body: {
      model,
      stream: true,
      temperature: PARAMS.temperature,
      max_tokens: PARAMS.maxTokens,
      top_p: PARAMS.topP,
      messages: [{ role: 'system', content: system }, ...messages]
    }
  };
}

/** Pulls the text delta out of one SSE frame, whichever shape it is. */
function deltaFrom(json, id) {
  if (id === 'gemini') {
    return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  }
  return json.choices?.[0]?.delta?.content ?? '';
}

/* ------------------------------------------------------------------ streaming */

class HttpError extends Error {
  constructor(status, body) {
    // Providers put the useful part in the body — OpenRouter's "No endpoints
    // found matching your data policy" is a 404 that says nothing without it.
    let detail = '';
    try {
      const json = JSON.parse(body);
      detail = json?.error?.message ?? json?.message ?? '';
    } catch {
      detail = String(body ?? '').slice(0, 200);
    }
    super(detail ? `${status}: ${detail}` : `HTTP ${status}`);
    this.status = status;
    this.detail = detail;
    this.body = body;
  }
}

// Move to the next MODEL: this one is gone or was rejected outright.
const DEAD_MODEL = [400, 404, 422];
// Move to the next PROVIDER: the key or the service is the problem.
const DEAD_PROVIDER = [401, 402, 403, 408, 429, 500, 502, 503, 504];

async function streamOnce(id, model, system, messages, signal, onToken) {
  const cfg = PROVIDERS[id];
  const req =
    id === 'gemini'
      ? geminiRequest(cfg, model, system, messages)
      : openaiRequest(cfg, model, system, messages, id);

  const res = await fetch(req.url, {
    method: 'POST',
    headers: req.headers,
    signal,
    body: JSON.stringify(req.body)
  });

  if (!res.ok) throw new HttpError(res.status, await res.text().catch(() => ''));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      // OpenRouter sends ": OPENROUTER PROCESSING" keep-alives.
      if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const delta = deltaFrom(JSON.parse(payload), id);
        if (delta) {
          text += delta;
          onToken?.(delta, text);
        }
      } catch {
        // Frame split across reads; the buffer picks it up next pass.
      }
    }
  }

  if (!text.trim()) throw new Error('empty response');
  return text.trim();
}

/**
 * Streams a reply, falling through to the next configured provider on a
 * rate limit or a server error.
 * @returns {Promise<{text:string, provider:string, ms:number, ttft:number}>}
 */
export async function streamReply({ system, messages, signal, onToken, onProvider, onNote }) {
  const chain = availableProviders();
  if (!chain.length) throw new Error('No API key configured.');

  const ordered = [active, ...chain.filter((id) => id !== active)].filter(Boolean);
  let lastError = null;

  /** Try a list of models on one provider. Returns a result, or null. */
  const tryModels = async (id, models) => {
    for (const model of models) {
      const started = performance.now();
      let ttft = 0;
      try {
        const text = await streamOnce(id, model, system, messages, signal, (d, full) => {
          if (!ttft) ttft = Math.round(performance.now() - started);
          onToken?.(d, full);
        });
        rememberModel(id, model);
        return { text, provider: id, model, ms: Math.round(performance.now() - started), ttft };
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        lastError = error;
        const status = error instanceof HttpError ? error.status : 0;
        console.warn(`[${id}/${model}] ${error.message}`);
        if (status && DEAD_PROVIDER.includes(status)) return null;   // provider is the problem
        if (status && !DEAD_MODEL.includes(status)) return null;     // unknown: stop grinding
        // DEAD_MODEL or a transport hiccup: try this provider's next model.
      }
    }
    return null;
  };

  for (const id of ordered) {
    if (id !== active) {
      active = id;
      onProvider?.(id);
    }

    const hit = await tryModels(id, modelsFor(id));
    if (hit) return hit;

    // The configured list is stale. Ask the provider what is actually free
    // right now and try that. This is what keeps the page working as free
    // model IDs come and go, with no edit and no key from anyone.
    if (id === 'openrouter') {
      try {
        onNote?.('finding a working model…');
        const live = await freeModels();
        const fresh = live.filter((m) => !PROVIDERS.openrouter.models.includes(m)).slice(0, 6);
        const second = await tryModels(id, fresh);
        if (second) return second;
      } catch (error) {
        console.warn('[openrouter] catalogue lookup failed:', error.message);
      }
    }
  }

  throw lastError ?? new Error('Every provider refused.');
}




/* ------------------------------------------------------------- diagnostics */

/**
 * Tries every configured provider/model once with a minimal request and
 * reports exactly what came back. Used by the in-page connection check so a
 * failure can be read off the screen instead of guessed at.
 */
export async function probeAll(onResult) {
  const out = [];
  for (const id of PROVIDER_ORDER) {
    const cfg = PROVIDERS[id];
    if (!cfg.key?.trim()) {
      const row = { id, model: '—', ok: false, note: 'no key set' };
      out.push(row);
      onResult?.(row);
      continue;
    }
    const shape = keyShapeWarning(id);
    if (shape) {
      const row = { id, model: '—', ok: false, note: `key skipped — ${shape}` };
      out.push(row);
      onResult?.(row);
      continue;
    }
    for (const model of cfg.models) {
      let row;
      try {
        await streamOnce(id, model, 'Reply with the single word: ok', [{ role: 'user', content: 'ping' }], undefined, () => {});
        row = { id, model, ok: true, note: 'works' };
      } catch (error) {
        row = { id, model, ok: false, note: error.detail || error.message };
      }
      out.push(row);
      onResult?.(row);
      if (row.ok) break; // no need to test the rest of this provider's list
    }
  }
  return out;
}
