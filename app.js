'use strict';

/* ==========================================================================
   Constants
   ========================================================================== */

const PROVIDERS = ['claude', 'gpt', 'gemini'];

const PROVIDER_LABELS = { claude: 'Claude', gpt: 'GPT', gemini: 'Gemini' };

const SESSION_KEY_PREFIX = 'aiarena:key:';

const CITATION_INSTRUCTION =
  '當你的回答參考了使用者上傳的文件內容時，請在相關段落後標注【文件參考】。\n' +
  '如有多份文件，請標注【來源：{文件名}】。';

const QUICK_PROMPTS = {
  summary: '請針對上述文件或對話內容，提供簡潔的重點摘要。',
  keywords: '請萃取上述內容的關鍵字或核心概念，以條列方式呈現。',
  outline: '請根據上述內容，生成結構化目錄（含主題與子主題）。',
  faq: '請針對上述內容，生成 5 個常見問題及對應解答。',
};

// Hardcoded fallback list shown before the GPT key is verified. Replaced
// with the real dynamically-fetched model list once verification succeeds.
const GPT_FALLBACK_MODELS = [
  { id: 'gpt-5.6', label: 'GPT-5.6' },
  { id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra' },
  { id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna' },
  { id: 'gpt-5.5', label: 'GPT-5.5' },
];

// Only GPT-5.5 and GPT-5.6 series models (e.g. gpt-5.6-sol/-terra/-luna) are offered.
const GPT_ALLOWED_MODEL_PATTERN = /^gpt-5\.(5|6)/;

/* ==========================================================================
   State
   ========================================================================== */

const state = {
  apiKeys: { claude: '', gpt: '', gemini: '' },
  models: { claude: 'claude-sonnet-5', gpt: 'gpt-5.6', gemini: 'gemini-3.5-flash' },
  histories: { claude: [], gpt: [], gemini: [] },
  pdf: { name: '', text: '' },
  sending: false,
};

const dom = {};

/* ==========================================================================
   Init
   ========================================================================== */

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheDom();
  restoreKeysFromSession();
  populateGptModelSelect(GPT_FALLBACK_MODELS.map((m) => m.id), true);
  PROVIDERS.forEach((p) => {
    updateBadge(p);
    syncColumnDisabledState(p);
  });
  bindEvents();
}

function cacheDom() {
  dom.statusIndicator = document.getElementById('statusIndicator');
  dom.settingsBtn = document.getElementById('settingsBtn');
  dom.settingsModal = document.getElementById('settingsModal');
  dom.settingsCloseBtn = document.getElementById('settingsCloseBtn');

  dom.checkboxes = {
    claude: document.getElementById('claude-enabled'),
    gpt: document.getElementById('gpt-enabled'),
    gemini: document.getElementById('gemini-enabled'),
  };
  dom.selects = {
    claude: document.getElementById('claude-model'),
    gpt: document.getElementById('gpt-model'),
    gemini: document.getElementById('gemini-model'),
  };
  dom.badges = {
    claude: document.getElementById('claude-badge'),
    gpt: document.getElementById('gpt-badge'),
    gemini: document.getElementById('gemini-badge'),
  };
  dom.columns = {
    claude: document.querySelector('.column--claude'),
    gpt: document.querySelector('.column--gpt'),
    gemini: document.querySelector('.column--gemini'),
  };
  dom.columnBodies = {
    claude: document.getElementById('claude-messages'),
    gpt: document.getElementById('gpt-messages'),
    gemini: document.getElementById('gemini-messages'),
  };
  dom.providerControls = {
    claude: document.querySelector('.provider-control[data-provider="claude"]'),
    gpt: document.querySelector('.provider-control[data-provider="gpt"]'),
    gemini: document.querySelector('.provider-control[data-provider="gemini"]'),
  };

  dom.pdfDropzone = document.getElementById('pdfDropzone');
  dom.pdfUploadBtn = document.getElementById('pdfUploadBtn');
  dom.pdfInput = document.getElementById('pdfInput');
  dom.pdfTag = document.getElementById('pdfTag');
  dom.pdfFileName = document.getElementById('pdfFileName');
  dom.pdfRemoveBtn = document.getElementById('pdfRemoveBtn');

  dom.messageInput = document.getElementById('messageInput');
  dom.sendBtn = document.getElementById('sendBtn');
  dom.downloadAllBtn = document.getElementById('downloadAllBtn');

  dom.keyInputs = {
    claude: document.getElementById('claude-key'),
    gpt: document.getElementById('gpt-key'),
    gemini: document.getElementById('gemini-key'),
  };
  dom.keyStatus = {
    claude: document.getElementById('claude-key-status'),
    gpt: document.getElementById('gpt-key-status'),
    gemini: document.getElementById('gemini-key-status'),
  };
  dom.verifyButtons = Array.from(document.querySelectorAll('.btn--verify'));
}

/* ==========================================================================
   Event binding
   ========================================================================== */

function bindEvents() {
  dom.settingsBtn.addEventListener('click', openSettings);
  dom.settingsCloseBtn.addEventListener('click', closeSettings);
  dom.settingsModal.addEventListener('click', (e) => {
    if (e.target === dom.settingsModal) closeSettings();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dom.settingsModal.hidden) closeSettings();
  });

  PROVIDERS.forEach((p) => {
    dom.checkboxes[p].addEventListener('change', () => syncColumnDisabledState(p));

    dom.selects[p].addEventListener('change', () => {
      state.models[p] = dom.selects[p].value;
      updateBadge(p);
    });

    dom.keyInputs[p].addEventListener('input', () => {
      state.apiKeys[p] = dom.keyInputs[p].value.trim();
      saveKeyToSession(p, state.apiKeys[p]);
      setKeyStatus(p, '', '');
    });
  });

  dom.verifyButtons.forEach((btn) => {
    btn.addEventListener('click', () => handleVerify(btn.dataset.provider, btn));
  });

  document.querySelectorAll('[data-action="clear"]').forEach((btn) => {
    btn.addEventListener('click', () => clearColumn(btn.dataset.provider));
  });

  document.querySelectorAll('[data-action="copy-column"]').forEach((btn) => {
    btn.addEventListener('click', () => copyColumn(btn.dataset.provider));
  });

  PROVIDERS.forEach((p) => {
    dom.columnBodies[p].addEventListener('click', (e) => {
      const copyBtn = e.target.closest('[data-action="copy-message"]');
      if (!copyBtn) return;
      const bubble = copyBtn.closest('.message');
      const content = bubble.querySelector('.message__content');
      copyText(content.textContent);
    });
  });

  document.querySelectorAll('.btn--quick').forEach((btn) => {
    btn.addEventListener('click', () => handleSend(QUICK_PROMPTS[btn.dataset.prompt]));
  });

  dom.sendBtn.addEventListener('click', () => handleSend());
  dom.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  dom.downloadAllBtn.addEventListener('click', downloadAll);

  dom.pdfUploadBtn.addEventListener('click', () => dom.pdfInput.click());
  dom.pdfInput.addEventListener('change', () => {
    const file = dom.pdfInput.files && dom.pdfInput.files[0];
    if (file) handlePdfFile(file);
  });
  dom.pdfRemoveBtn.addEventListener('click', removePdf);

  dom.pdfDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.pdfDropzone.classList.add('is-dragover');
  });
  dom.pdfDropzone.addEventListener('dragleave', () => {
    dom.pdfDropzone.classList.remove('is-dragover');
  });
  dom.pdfDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.pdfDropzone.classList.remove('is-dragover');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handlePdfFile(file);
  });
}

/* ==========================================================================
   Settings modal
   ========================================================================== */

function openSettings() {
  dom.settingsModal.hidden = false;
}

function closeSettings() {
  dom.settingsModal.hidden = true;
}

function setKeyStatus(provider, kind, text) {
  const el = dom.keyStatus[provider];
  el.textContent = text;
  el.className = 'key-status' + (kind ? ` key-status--${kind}` : '');
}

/* ==========================================================================
   sessionStorage — API keys only, never localStorage
   ========================================================================== */

function saveKeyToSession(provider, key) {
  try {
    if (key) {
      sessionStorage.setItem(SESSION_KEY_PREFIX + provider, key);
    } else {
      sessionStorage.removeItem(SESSION_KEY_PREFIX + provider);
    }
  } catch (err) {
    /* sessionStorage unavailable (e.g. private mode) — key just stays in memory */
  }
}

function restoreKeysFromSession() {
  PROVIDERS.forEach((p) => {
    let key = '';
    try {
      key = sessionStorage.getItem(SESSION_KEY_PREFIX + p) || '';
    } catch (err) {
      key = '';
    }
    if (key) {
      state.apiKeys[p] = key;
      dom.keyInputs[p].value = key;
    }
  });
}

/* ==========================================================================
   Verification
   ========================================================================== */

async function handleVerify(provider, btn) {
  const apiKey = dom.keyInputs[provider].value.trim();
  if (!apiKey) {
    setKeyStatus(provider, 'error', '✗ 請輸入 API Key');
    return;
  }

  state.apiKeys[provider] = apiKey;
  saveKeyToSession(provider, apiKey);

  setKeyStatus(provider, 'pending', '驗證中…');
  btn.disabled = true;

  try {
    if (provider === 'claude') {
      await verifyClaude(apiKey);
    } else if (provider === 'gpt') {
      const ids = await verifyGptAndFetchModels(apiKey);
      if (ids.length > 0) {
        populateGptModelSelect(ids, false);
      }
    } else if (provider === 'gemini') {
      await verifyGemini(apiKey);
    }
    setKeyStatus(provider, 'success', '✓ 驗證成功');
  } catch (err) {
    setKeyStatus(provider, 'error', `✗ ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

async function verifyClaude(apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || `驗證失敗（${res.status}）`);
  }
}

async function verifyGptAndFetchModels(apiKey) {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || `驗證失敗（${res.status}）`);
  }
  const ids = (data.data || [])
    .map((m) => m.id)
    .filter((id) => GPT_ALLOWED_MODEL_PATTERN.test(id))
    .sort();
  return ids;
}

async function verifyGemini(apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || `驗證失敗（${res.status}）`);
  }
}

/* ==========================================================================
   Model selects
   ========================================================================== */

function populateGptModelSelect(ids, isFallback) {
  const select = dom.selects.gpt;
  select.innerHTML = '';
  ids.forEach((id) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = isFallback
      ? (GPT_FALLBACK_MODELS.find((m) => m.id === id) || {}).label || id
      : id;
    select.appendChild(opt);
  });
  const preferred = ids.includes('gpt-5.6') ? 'gpt-5.6' : ids[0];
  select.value = preferred;
  state.models.gpt = preferred;
  updateBadge('gpt');
}

function updateBadge(provider) {
  const select = dom.selects[provider];
  const option = select.options[select.selectedIndex];
  dom.badges[provider].textContent = option ? option.textContent : state.models[provider];
}

function syncColumnDisabledState(provider) {
  const enabled = dom.checkboxes[provider].checked;
  dom.columns[provider].classList.toggle('column--disabled', !enabled);
  dom.providerControls[provider].classList.toggle('is-disabled', !enabled);
}

/* ==========================================================================
   PDF upload
   ========================================================================== */

async function handlePdfFile(file) {
  if (file.type !== 'application/pdf') {
    setStatus('請上傳 PDF 檔案');
    return;
  }
  setStatus('正在解析 PDF…');
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageTexts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((it) => it.str).join(' '));
    }
    state.pdf = { name: file.name, text: pageTexts.join('\n').trim() };
    dom.pdfFileName.textContent = file.name;
    dom.pdfTag.hidden = false;
    setStatus('');
  } catch (err) {
    setStatus(`PDF 解析失敗：${err.message}`);
  }
}

function removePdf() {
  state.pdf = { name: '', text: '' };
  dom.pdfTag.hidden = true;
  dom.pdfFileName.textContent = '';
  dom.pdfInput.value = '';
}

/* ==========================================================================
   Sending messages
   ========================================================================== */

function buildSystemPrompt() {
  let prompt = CITATION_INSTRUCTION;
  if (state.pdf.text) {
    prompt += `\n\n以下為使用者上傳的文件（來源：${state.pdf.name}）內容：\n\n${state.pdf.text}`;
  }
  return prompt;
}

async function handleSend(overrideText) {
  if (state.sending) return;

  const text = (overrideText !== undefined ? overrideText : dom.messageInput.value).trim();
  if (!text) return;

  const enabledProviders = PROVIDERS.filter(
    (p) => dom.checkboxes[p].checked && state.apiKeys[p]
  );
  if (enabledProviders.length === 0) {
    setStatus('請至少啟用一家並輸入有效的 API Key');
    return;
  }

  dom.messageInput.value = '';
  setSending(true);
  setStatus('正在等待回應…');

  const systemPrompt = buildSystemPrompt();

  enabledProviders.forEach((p) => {
    state.histories[p].push({ role: 'user', content: text });
    appendMessage(p, 'user', text);
  });

  const skeletons = {};
  enabledProviders.forEach((p) => {
    skeletons[p] = appendSkeleton(p);
  });

  const callers = { claude: callClaude, gpt: callGpt, gemini: callGemini };

  const results = await Promise.all(
    enabledProviders.map(async (p) => {
      try {
        const replyText = await callers[p](state.histories[p].slice(), systemPrompt);
        return { provider: p, ok: true, text: replyText };
      } catch (err) {
        return { provider: p, ok: false, error: err.message || String(err) };
      }
    })
  );

  results.forEach((r) => {
    skeletons[r.provider].remove();
    if (r.ok) {
      state.histories[r.provider].push({ role: 'assistant', content: r.text });
      appendMessage(r.provider, 'assistant', r.text);
    } else {
      appendMessage(r.provider, 'error', `錯誤：${r.error}`);
    }
  });

  setSending(false);
  setStatus('');
}

function setSending(sending) {
  state.sending = sending;
  dom.sendBtn.disabled = sending;
  document.querySelectorAll('.btn--quick').forEach((btn) => {
    btn.disabled = sending;
  });
}

function setStatus(text) {
  dom.statusIndicator.textContent = text;
}

/* ==========================================================================
   API calls
   ========================================================================== */

async function callClaude(history, systemPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': state.apiKeys.claude,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: state.models.claude,
      max_tokens: 4096,
      system: systemPrompt,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || `Claude API 錯誤（${res.status}）`);
  }
  return (data.content || []).map((block) => block.text || '').join('');
}

async function callGpt(history, systemPrompt) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${state.apiKeys.gpt}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: state.models.gpt,
      max_completion_tokens: 4096,
      messages,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || `GPT API 錯誤（${res.status}）`);
  }
  return (data.choices && data.choices[0] && data.choices[0].message.content) || '';
}

async function callGemini(history, systemPrompt) {
  const model = state.models.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    state.apiKeys.gemini
  )}`;
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || `Gemini API 錯誤（${res.status}）`);
  }
  const candidate = data.candidates && data.candidates[0];
  const parts = (candidate && candidate.content && candidate.content.parts) || [];
  return parts.map((p) => p.text || '').join('');
}

/* ==========================================================================
   Rendering
   ========================================================================== */

function appendMessage(provider, role, text) {
  const container = dom.columnBodies[provider];
  const el = document.createElement('div');
  el.className = `message message--${role}`;

  const content = document.createElement('div');
  content.className = 'message__content';
  content.textContent = text;
  el.appendChild(content);

  if (role === 'assistant') {
    const actions = document.createElement('div');
    actions.className = 'message__actions';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn--copy-msg';
    copyBtn.textContent = '複製';
    copyBtn.dataset.action = 'copy-message';
    actions.appendChild(copyBtn);
    el.appendChild(actions);
  }

  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

function appendSkeleton(provider) {
  const container = dom.columnBodies[provider];
  const el = document.createElement('div');
  el.className = 'skeleton';

  const bar = document.createElement('div');
  bar.className = 'skeleton__bar';
  el.appendChild(bar);

  for (let i = 0; i < 3; i++) {
    const line = document.createElement('div');
    line.className = 'skeleton__line';
    el.appendChild(line);
  }

  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

function clearColumn(provider) {
  state.histories[provider] = [];
  dom.columnBodies[provider].innerHTML = '';
}

/* ==========================================================================
   Copy / download
   ========================================================================== */

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

function copyColumn(provider) {
  const label = PROVIDER_LABELS[provider];
  const text = state.histories[provider]
    .map((m) => `[${m.role === 'user' ? '使用者' : label}] ${m.content}`)
    .join('\n');
  copyText(text);
}

function downloadAll() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`;

  let out = `=== AI Arena 對話記錄 ===\n日期：${dateStr}\n\n`;

  PROVIDERS.forEach((p) => {
    const label = PROVIDER_LABELS[p];
    const select = dom.selects[p];
    const modelLabel = (select.options[select.selectedIndex] || {}).textContent || state.models[p];
    out += `=== ${label}（${modelLabel}）===\n`;
    state.histories[p].forEach((m) => {
      const who = m.role === 'user' ? '使用者' : label;
      out += `[${who}] ${m.content}\n`;
    });
    out += '\n';
  });

  const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-arena-${now.getTime()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
