// Configuration.
//
// Providers are ordered: the first one with a key is used, and the rest are
// failover. Gemini is first because its free tier resets daily, its Flash
// models are the fastest of the three, and it handles Arabic properly.
//
// Keys live in the page source. That is unavoidable on a static host and is an
// accepted trade here: every provider below is configured to a free model, so
// the worst case is someone burning a daily quota, not a bill.

export const PROVIDERS = {
  gemini: {
    label: 'Gemini Flash',
    // Paste a key from https://aistudio.google.com/apikey — free, resets daily.
    key: '',
    model: 'gemini-2.0-flash',
    endpoint: (model) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
  },
  groq: {
    label: 'Groq',
    // https://console.groq.com/keys — fastest tokens/sec of the three.
    key: '',
    model: 'llama-3.3-70b-versatile',
    endpoint: () => 'https://api.groq.com/openai/v1/chat/completions'
  },
  openrouter: {
    label: 'OpenRouter',
    key: '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',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
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
  provider: 'doctor_provider_v1'
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
