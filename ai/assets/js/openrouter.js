// OpenRouter client: free-model discovery, streaming chat, JSON calls and
// automatic failover when a model rate-limits or dies.

import {
  API_KEY, API_BASE, APP_TITLE, STORAGE, MODEL_CACHE_MS,
  FALLBACK_FREE_MODELS, FAMILY_SCORES, REASONING_PENALTY
} from './config.js';
import { read, write } from '../../../assets/js/core/store.js';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_KEY}`,
  'HTTP-Referer': window.location.origin,
  'X-Title': APP_TITLE
});

/* --- Model discovery ------------------------------------------------------ */

const isFree = (model) => {
  const p = model?.pricing ?? {};
  const zero = (v) => v !== undefined && Number(v) === 0;
  return zero(p.prompt) && zero(p.completion);
};

function scoreModel(model) {
  let score = 0;
  for (const [pattern, value] of FAMILY_SCORES) {
    if (pattern.test(model.id)) {
      score = Math.max(score, value);
    }
  }
  if (REASONING_PENALTY.test(model.id)) score -= 45;
  // Mild bonus for roomier context, capped so it never outranks quality.
  score += Math.min(12, (model.context_length ?? 0) / 32768);
  return score;
}

const prettyName = (model) =>
  (model.name || model.id)
    .replace(/\s*\(free\)\s*/i, '')
    .replace(/^.*?:\s*/, '')
    .trim();

/**
 * Returns free models ranked best-first. Cached for MODEL_CACHE_MS.
 * Falls back to a static list if the catalogue cannot be reached.
 */
export async function discoverModels({ force = false } = {}) {
  const cached = read(STORAGE.models, null);
  if (!force && cached?.at && Date.now() - cached.at < MODEL_CACHE_MS && cached.models?.length) {
    return cached.models;
  }

  try {
    const res = await fetch(`${API_BASE}/models`, { headers: headers() });
    if (!res.ok) throw new Error(`models ${res.status}`);
    const body = await res.json();

    const models = (body.data ?? [])
      .filter(isFree)
      .map((m) => ({ id: m.id, name: prettyName(m), ctx: m.context_length ?? 0, score: scoreModel(m) }))
      .sort((a, b) => b.score - a.score);

    if (!models.length) throw new Error('no free models listed');

    write(STORAGE.models, { at: Date.now(), models });
    return models;
  } catch (error) {
    console.warn('[openrouter] falling back to the static free list:', error.message);
    return FALLBACK_FREE_MODELS.map((id) => ({
      id,
      name: prettyName({ id, name: id.split('/').pop().replace(':free', '') }),
      ctx: 0,
      score: 0
    }));
  }
}

/* --- Model chain ---------------------------------------------------------- */

let chain = [];
let index = 0;

export function setChain(models, preferredId) {
  chain = models.slice(0, 8);
  index = 0;
  if (preferredId) {
    const found = chain.findIndex((m) => m.id === preferredId);
    if (found > 0) {
      chain = [chain[found], ...chain.filter((_, i) => i !== found)];
    } else if (found === -1) {
      const extra = models.find((m) => m.id === preferredId);
      if (extra) chain = [extra, ...chain];
    }
  }
  return current();
}

export const current = () => chain[index] ?? null;
export const getChain = () => chain;

/** Moves to the next model in the chain. Returns false when exhausted. */
function advance() {
  if (index >= chain.length - 1) return false;
  index += 1;
  return true;
}

export function pinModel(id) {
  const found = chain.findIndex((m) => m.id === id);
  if (found >= 0) index = found;
  write(STORAGE.model, id);
  return current();
}

/* --- Response cleanup ----------------------------------------------------- */

/** Strips reasoning scaffolding some models leak into the visible answer. */
export function cleanText(text) {
  return String(text ?? '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\|[^|]*\|>/g, '')
    .trim();
}

/* --- Streaming chat ------------------------------------------------------- */

class HttpError extends Error {
  constructor(status, body) {
    super(`HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function openStream(model, messages, params, signal) {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(),
    signal,
    body: JSON.stringify({ model, messages, stream: true, ...params })
  });
  if (!res.ok) throw new HttpError(res.status, await res.text().catch(() => ''));
  return res;
}

/**
 * Streams a completion, calling onToken for each chunk of text.
 * Retries down the model chain on rate limits and server errors.
 * @returns {Promise<{text:string, model:object, ms:number}>}
 */
export async function streamChat({ messages, params = {}, signal, onToken, onModelChange }) {
  const started = performance.now();
  let attempts = 0;

  while (attempts < chain.length) {
    const model = current();
    if (!model) throw new Error('No model available.');
    attempts += 1;

    try {
      const res = await openStream(model.id, messages, params, signal);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by newlines; keep the trailing partial line.
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          // OpenRouter sends ": OPENROUTER PROCESSING" keep-alive comments.
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;

          try {
            const chunk = JSON.parse(payload);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              text += delta;
              onToken?.(delta, text);
            }
          } catch {
            // A frame split across reads; the buffer will catch it next pass.
          }
        }
      }

      const cleaned = cleanText(text);
      if (!cleaned) throw new Error('empty response');
      return { text: cleaned, model, ms: Math.round(performance.now() - started) };
    } catch (error) {
      if (error.name === 'AbortError') throw error;

      const retryable =
        error instanceof HttpError ? [402, 408, 429, 500, 502, 503, 504].includes(error.status) : true;

      console.warn(`[openrouter] ${model.id} failed:`, error.message);
      if (!retryable || !advance()) throw error;
      onModelChange?.(current());
    }
  }

  throw new Error('Every free model refused. Try again in a minute.');
}

/* --- Non-streaming JSON call --------------------------------------------- */

/** Used by the dungeon, where a whole parsable object matters more than pacing. */
export async function completeJSON({ messages, params = {}, signal, onModelChange }) {
  let attempts = 0;

  while (attempts < chain.length) {
    const model = current();
    if (!model) throw new Error('No model available.');
    attempts += 1;

    try {
      const res = await fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: headers(),
        signal,
        body: JSON.stringify({ model: model.id, messages, ...params })
      });
      if (!res.ok) throw new HttpError(res.status, await res.text().catch(() => ''));

      const body = await res.json();
      const text = cleanText(body.choices?.[0]?.message?.content);
      if (!text) throw new Error('empty response');
      return { text, model };
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      const retryable =
        error instanceof HttpError ? [402, 408, 429, 500, 502, 503, 504].includes(error.status) : true;
      console.warn(`[openrouter] ${model.id} failed:`, error.message);
      if (!retryable || !advance()) throw error;
      onModelChange?.(current());
    }
  }

  throw new Error('Every free model refused. Try again in a minute.');
}

/**
 * Pulls the first JSON object out of a model response, tolerating code fences
 * and any chatter the model wrapped around it.
 */
export function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
