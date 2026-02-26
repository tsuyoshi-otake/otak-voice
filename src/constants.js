export const API_KEY_STORAGE_KEY = 'gpt_api_key';
export const RECOGNITION_LANG_STORAGE_KEY = 'recognition_lang';
export const AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY = 'auto_detect_input_fields';
export const AUTO_CORRECTION_STORAGE_KEY = 'auto_correction';
export const USE_HISTORY_CONTEXT_STORAGE_KEY = 'use_history_context';
export const THEME_STORAGE_KEY = 'theme_mode';
export const AUTO_CORRECTION_PROMPT_STORAGE_KEY = 'auto_correction_prompt';
export const PROOFREADING_PROMPT_STORAGE_KEY = 'proofreading_prompt';
export const SHOW_MODAL_WINDOW_STORAGE_KEY = 'showModalWindow';
export const AUTO_SUBMIT_STORAGE_KEY = 'otak_voice_auto_submit_state';
export const SILENCE_TIMEOUT_STORAGE_KEY = 'silence_timeout';

export const MAX_HISTORY = 10;

export const SITE_TYPES = {
  SYSTEMEXE: 'systemexe',
  TWITTER: 'twitter',
  AI_CHAT: 'ai_chat',
  DEFAULT: 'default'
};

export const GPT_MODELS = {
  CORRECTION: 'gpt-4.1-mini',
  PROOFREADING: 'gpt-5.2',
  EDITING: 'gpt-5.2'
};

export const THEME_MODES = {
  DARK: 'dark',
  LIGHT: 'light'
};

export const DEFAULT_SETTINGS = {
  RECOGNITION_LANG: 'ja-JP',
  AUTO_DETECT_INPUT_FIELDS: true,
  AUTO_CORRECTION: false,
  USE_HISTORY_CONTEXT: false,
  THEME: THEME_MODES.DARK,
  SHOW_MODAL_WINDOW: true,
  AUTO_SUBMIT: false,
  CLEAR_EXISTING_TEXT: false,
  SILENCE_TIMEOUT: 3000, // 無音検出のデフォルトタイムアウト: 3秒
  AUTO_CORRECTION_PROMPT: "You are an assistant that corrects Japanese voice input in real-time. Please correct the content spoken by the user (the last message), fixing typos, grammatical errors, and unnatural expressions to make it a more natural and readable text. Consider the previous conversation history (if any) as context. Output only the corrected text.",
  PROOFREADING_PROMPT: "You are an assistant that proofreads Japanese text. For the entire text provided by the user, correct typos, grammatical errors, and unnatural expressions to make it a more natural and readable text. Please preserve the original meaning and nuance of the text as much as possible. Output only the corrected text."
};

export const PROCESSING_STATE = {
  IDLE: 'idle',
  PROOFREADING: 'proofreading',
  EDITING: 'editing',
  CORRECTING: 'correcting'
};

export const UI_FEEDBACK = {
  BUTTON_HIGHLIGHT_COLOR: '#4CAF50',
  BUTTON_HIGHLIGHT_BORDER: '2px solid #2E7D32',
  SUBMIT_DELAY_MS: 300,
  CLICK_FEEDBACK_DELAY_MS: 500,
};

export const GPT_PARAMS = {
  CORRECTION: { maxTokens: 150, temperature: 0.3 },
  PROOFREADING: { maxTokens: 32768, temperature: 0.5 },
  EDITING: { maxTokens: 32768, temperature: 0.5 },
};

export const PAPER_PLANE_SVG = {
  LINE_SELECTOR: 'line[x1="22"][y1="2"][x2="11"][y2="13"]',
  POLYGON_SELECTOR: 'polygon[points="22 2 15 22 11 13 2 9 22 2"]',
};