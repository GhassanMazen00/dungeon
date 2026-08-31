// Configuration.
//
// Providers are ordered: the first one with a key is used, and the rest are
// failover. Gemini is first because its free tier resets daily, its Flash
// models are the fastest of the three, and it handles Arabic properly.
//
// Keys live in the page source. That is unavoidable on a static host and is an
// accepted trade here: every provider below is configured to a free model, so
// the worst case is someone burning a daily quota, not a bill.

// Each provider lists candidate models, best first — a starting guess, not a
// promise. OpenRouter retires `:free` variants regularly ("This model is
// unavailable for free... use this slug instead" — which names the PAID slug,
// and must never be followed). When the whole list is stale, providers.js reads
// the live catalogue, keeps only models priced at exactly zero, and remembers
// whichever answers. The page therefore repairs itself with no edit here.
//
// >>> To make this fast and stable for good, put a free Gemini key below.
//     One line, committed once, works for every visitor with no action from
//     them: https://aistudio.google.com/apikey
export const PROVIDERS = {
  gemini: {
    label: 'Gemini Flash',
    // Paste a key from https://aistudio.google.com/apikey — free, resets daily.
    key: 'AQ.Ab8RN6Jd3-6MTJKhtb7GFnpZt4TY0f_VyvVlyLmow-FkVp2dHw',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'],
    endpoint: (model) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
  },
  groq: {
    label: 'Groq',
    // https://console.groq.com/keys — fastest tokens/sec of the three.
    key: '',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    endpoint: () => 'https://api.groq.com/openai/v1/chat/completions'
  },
  openrouter: {
    label: 'OpenRouter',
    key: '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',
    models: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-chat-v3-0324:free',
      'google/gemma-3-27b-it:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'mistralai/mistral-small-3.1-24b-instruct:free',
      'meta-llama/llama-3.2-3b-instruct:free'
    ],
    endpoint: () => 'https://openrouter.ai/api/v1/chat/completions'
  }
};

// Order attempted. First entry with a non-empty key wins; others are failover.
export const PROVIDER_ORDER = ['gemini', 'groq', 'openrouter'];

// Try a key on one device without committing it to the repo. In the browser
// console, or on your phone via a bookmarklet:
//   localStorage.setItem('ai_keys', JSON.stringify({ gemini: 'AIza...' }))
// Anything set here wins over the keys above, for that browser only.
try {
  const local = JSON.parse(localStorage.getItem('ai_keys') ?? '{}');
  for (const [id, key] of Object.entries(local)) {
    if (PROVIDERS[id] && typeof key === 'string') PROVIDERS[id].key = key;
  }
} catch {
  /* malformed or unavailable storage — fall back to the committed keys */
}

export const STORAGE = {
  chat: 'doctor_chat_v1',
  provider: 'doctor_provider_v1',
  models: 'doctor_models_v1'   // last model known to work, per provider
};

// Tuned for latency, not for essays. The persona is terse by design, so a low
// token ceiling costs nothing and returns the first token sooner.
export const PARAMS = {
  temperature: 1.0,
  maxTokens: 400,
  topP: 0.95
};

// Turns of history sent upstream. Short context = faster time-to-first-token.
export const HISTORY_TURNS = 12;
