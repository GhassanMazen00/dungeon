// One streaming interface over three providers.
//
// Gemini and the OpenAI-shaped APIs (Groq, OpenRouter) disagree about message
// format, auth header and stream envelope, so each gets a thin adapter and the
// rest of the app never knows which one answered.

import { PROVIDERS, PROVIDER_ORDER, PARAMS } from './config.js';

/* ---------------------------------------------------------------- selection */

/** Providers that actually have a key, in preference order. */
export const availableProviders = () =>
  PROVIDER_ORDER.filter((id) => PROVIDERS[id]?.key?.trim());

let active = availableProviders()[0] ?? null;

export const currentProvider = () => active;
export const providerLabel = (id = active) => PROVIDERS[id]?.label ?? 'offline';

export function setProvider(id) {
  if (PROVIDERS[id]?.key?.trim()) active = id;
  return active;
}

/* ------------------------------------------------------------------ adapters */

/** Gemini: system prompt is its own field, and roles are user/model. */
function geminiRequest(cfg, system, messages) {
  return {
    url: cfg.endpoint(cfg.model),
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
function openaiRequest(cfg, system, messages, id) {
  return {
    url: cfg.endpoint(cfg.model),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.key}`,
      ...(id === 'openrouter'
        ? { 'HTTP-Referer': location.origin, 'X-Title': 'The Doctor' }
        : {})
    },
    body: {
      model: cfg.model,
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

const RETRYABLE = [408, 429, 500, 502, 503, 504];

async function streamOnce(id, system, messages, signal, onToken) {
  const cfg = PROVIDERS[id];
  const req =
    id === 'gemini'
      ? geminiRequest(cfg, system, messages)
      : openaiRequest(cfg, system, messages, id);

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

  // Start from the active provider, then try the others in order.
  const ordered = [active, ...chain.filter((id) => id !== active)].filter(Boolean);
  let lastError = null;

  for (const id of ordered) {
    const started = performance.now();
    let ttft = 0;
    try {
      if (id !== active) {
        active = id;
        onProvider?.(id);
      }
      const text = await streamOnce(id, system, messages, signal, (d, full) => {
        if (!ttft) ttft = Math.round(performance.now() - started);
        onToken?.(d, full);
      });
      return { text, provider: id, ms: Math.round(performance.now() - started), ttft };
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      lastError = error;
      const retryable = error instanceof HttpError ? RETRYABLE.includes(error.status) : true;
      console.warn(`[${id}] ${error.message}`);
      if (!retryable) throw error;
    }
  }

  throw lastError ?? new Error('Every provider refused.');
}
