// One streaming interface over three providers.
//
// Gemini and the OpenAI-shaped APIs (Groq, OpenRouter) disagree about message
// format, auth header and stream envelope, so each gets a thin adapter and the
// rest of the app never knows which one answered.

import { PROVIDERS, PROVIDER_ORDER, PARAMS, STORAGE } from './config.js';

/* ---------------------------------------------------------------- selection */

/** Providers that actually have a key, in preference order. */
export const availableProviders = () =>
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

/** Candidate models for a provider, the last known-good one first. */
function modelsFor(id) {
  const list = PROVIDERS[id].models;
  const won = remembered[id];
  return won && list.includes(won) ? [won, ...list.filter((m) => m !== won)] : [...list];
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
    super(`HTTP ${status}`);
    this.status = status;
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
export async function streamReply({ system, messages, signal, onToken, onProvider }) {
  const chain = availableProviders();
  if (!chain.length) throw new Error('No API key configured.');

  // Start from the active provider, then the rest in order.
  const ordered = [active, ...chain.filter((id) => id !== active)].filter(Boolean);
  let lastError = null;

  for (const id of ordered) {
    if (id !== active) {
      active = id;
      onProvider?.(id);
    }

    // Within a provider, walk its models: a retired ID answers 404 and should
    // cost one failed request, not the whole conversation.
    for (const model of modelsFor(id)) {
      const started = performance.now();
      let ttft = 0;
      try {
        const text = await streamOnce(id, model, system, messages, signal, (d, full) => {
          if (!ttft) ttft = Math.round(performance.now() - started);
          onToken?.(d, full);
        });
        rememberModel(id, model);
        return {
          text,
          provider: id,
          model,
          ms: Math.round(performance.now() - started),
          ttft
        };
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        lastError = error;

        const status = error instanceof HttpError ? error.status : 0;
        console.warn(`[${id}/${model}] ${error.message}`);

        if (status && DEAD_PROVIDER.includes(status)) break;      // next provider
        if (status && !DEAD_MODEL.includes(status)) break;        // unknown: don't grind
        // DEAD_MODEL or a network/parse failure: try this provider's next model.
      }
    }
  }

  throw lastError ?? new Error('Every provider refused.');
}

