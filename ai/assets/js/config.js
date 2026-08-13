// Configuration for the AI arcade.

// Public by design — this is a hobby page on a static host with no backend to
// hide a key behind. It is scoped to free models only (see openrouter.js), so
// the blast radius of abuse is rate limits, not a bill.
export const API_KEY = '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';

export const API_BASE = 'https://openrouter.ai/api/v1';

export const APP_TITLE = 'Ghassan AI Arcade';

export const STORAGE = {
  models: 'ai_models_cache_v1',
  model: 'ai_model_v1',
  persona: 'ai_persona_v1',
  chat: 'ai_chat_v1',
  run: 'ai_dungeon_run_v1',
  sound: 'ai_sound_v1'
};

// How long the discovered free-model list stays cached.
export const MODEL_CACHE_MS = 6 * 60 * 60 * 1000;

// Used only if the live model list cannot be fetched. Every entry is a `:free`
// variant; the live list is authoritative and replaces this on success.
export const FALLBACK_FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-27b-it:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'openai/gpt-oss-20b:free',
  'z-ai/glm-4.5-air:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.2-3b-instruct:free'
];

// Preference ranking for the discovered list. Higher wins.
export const FAMILY_SCORES = [
  [/llama-4/i, 105],
  [/llama-3\.3/i, 100],
  [/deepseek-chat|deepseek-v3/i, 96],
  [/qwen.*(72b|2\.5|3-)/i, 92],
  [/gemma-3/i, 88],
  [/mistral-small|mistral-nemo/i, 84],
  [/gpt-oss/i, 80],
  [/glm/i, 74],
  [/kimi/i, 72],
  [/gemini.*flash/i, 70],
  [/nemotron/i, 60],
  [/phi/i, 38],
  [/(^|[^0-9])([1-4])b([^0-9]|$)/i, 18]
];

// Reasoning models emit long <think> blocks that ruin the pacing of a joke.
export const REASONING_PENALTY = /\br1\b|reason|thinking|qwq/i;

export const CHAT_PARAMS = { temperature: 0.9, max_tokens: 900, top_p: 0.95 };
export const DUNGEON_PARAMS = { temperature: 1.0, max_tokens: 700, top_p: 0.95 };

// Turns kept in the rolling chat window (excluding the system prompt).
export const HISTORY_TURNS = 24;
