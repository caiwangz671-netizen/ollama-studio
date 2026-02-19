// State Management
const state = {
  currentModel: "",
  chats: [],
  currentChatId: null,
  settings: {
    endpoint: "http://127.0.0.1:11434",
    // Generation
    system_prompt: "",
    num_ctx: 4096,
    max_tokens: 2048,
    temperature: 0.7,
    top_p: 0.9,
    repeat_penalty: 1.1,
    seed: null,
    // Tools
    rag_enabled: true,
    rag_threshold: 0.35,
    rag_limit: 5,
    web_search_enabled: true
  },
  isGenerating: false
};

// DOM Elements
const elements = {
  chatList: document.getElementById("historyList"),
  modelSelect: document.getElementById("modelSelect"),
  scanBtn: document.getElementById("scanBtn"),
  chatContainer: document.getElementById("chatArea"),
  chatInput: document.getElementById("inputBox"),
  sendBtn: document.getElementById("sendBtn"),
  attachBtn: document.getElementById("attachBtn"),
  micBtn: document.getElementById("micBtn"),
  fileInput: document.getElementById("fileInput"),
  attachmentBar: document.getElementById("attachmentBar"),
  newChatBtn: document.getElementById("newChatBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  currentModelDisplay: document.getElementById("currentModelDisplay"),
  statusIndicator: document.getElementById("statusIndicator"),
  
  // Settings Inputs - General
  settingEndpoint: document.getElementById("endpointInput"),
  
  // Settings Inputs - Generation
  settingSystemPrompt: document.getElementById("systemPromptInput"),
  settingNumCtx: document.getElementById("numCtxInput"),
  settingMaxTokens: document.getElementById("maxTokensInput"),
  settingMaxTokenPresetBtns: document.querySelectorAll(".max-token-preset"),
  settingTemperature: document.getElementById("tempInput"),
  settingTopP: document.getElementById("topPInput"),
  settingRepeatPenalty: document.getElementById("repeatPenaltyInput"),
  settingSeed: document.getElementById("seedInput"),
  
  // Settings Displays
  settingTempDisplay: document.getElementById("tempValue"),
  settingTopPDisplay: document.getElementById("topPValue"),
  settingRepeatPenaltyDisplay: document.getElementById("repeatPenaltyValue"),
  
  // Settings Inputs - Tools
  settingRagEnabled: document.getElementById("ragEnabledInput"),
  settingRagThreshold: document.getElementById("ragThresholdInput"),
  settingRagLimit: document.getElementById("ragLimitInput"),
  settingWebSearchEnabled: document.getElementById("webSearchEnabledInput"),
  
  settingRagThresholdDisplay: document.getElementById("ragThresholdValue"),
  settingRagLimitDisplay: document.getElementById("ragLimitValue"),
  
  // Tabs
  tabBtns: document.querySelectorAll(".tab-btn"),
  tabContents: document.querySelectorAll(".tab-content"),

  // RAG Status
  ragStatusContainer: document.getElementById("ragStatusContainer"),
  ragStatus: document.getElementById("ragStatus"),
  ragStatusText: document.getElementById("ragStatusText"),
  // Search
  searchInput: document.getElementById("chatSearchInput"),
  
  // Database Modal
  dbBtn: document.getElementById("dbBtn"),
  dbModal: document.getElementById("dbModal"),
  closeDbBtn: document.getElementById("closeDbBtn"),
  refreshDbBtn: document.getElementById("refreshDbBtn"),
  memoryList: document.getElementById("memoryList"),
  memorySearchInput: document.getElementById("memorySearchInput"),
  addMemoryBtn: document.getElementById("addMemoryBtn"),
  exportDbBtn: document.getElementById("exportDbBtn"),
  clearAllDbBtn: document.getElementById("clearAllDbBtn"),
  batchDeleteBtn: document.getElementById("batchDeleteBtn"),
  selectAllMemories: document.getElementById("selectAllMemories"),
  batchActionBar: document.getElementById("batchActionBar"),
  cancelBatchBtn: document.getElementById("cancelBatchBtn"),
  totalMemories: document.getElementById("totalMemories"),
  selectedMemories: document.getElementById("selectedMemories"),
  displayedMemories: document.getElementById("displayedMemories"),
  vramEstimator: document.getElementById("vramEstimator"),
  vramModel: document.getElementById("vramModel"),
  vramParams: document.getElementById("vramParams"),
  vramQuant: document.getElementById("vramQuant"),
  vramCtx: document.getElementById("vramCtx"),
  vramKvPerToken: document.getElementById("vramKvPerToken"),
  vramWeights: document.getElementById("vramWeights"),
  vramKv: document.getElementById("vramKv"),
  vramOverhead: document.getElementById("vramOverhead"),
  vramSafety: document.getElementById("vramSafety"),
  vramTotal: document.getElementById("vramTotal")
};

// Knowledge Base State
const kbState = {
  allMemories: [],
  filteredMemories: [],
  selectedIds: new Set(),
  searchQuery: ""
};

const vramDisplayCache = {
  model: "",
  params: "",
  quant: "",
  ctx: "",
  kvPerToken: "",
  weights: "",
  kv: "",
  overhead: "",
  safety: "",
  total: ""
};

const pendingAttachments = [];
let activeSpeechRecognition = null;
let isListening = false;

// Tool Definitions
const webSearchTool = {
  type: "function",
  function: {
    name: "web_search",
    description: "Search the internet for real-time information, news, or specific data not present in your training data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to execute."
        }
      },
      required: ["query"]
    }
  }
};

// Model capabilities cache
const modelCapabilities = {
  supportsTools: new Map() // modelName -> boolean
};

function shouldProvideTools(userText) {
  if (state.settings.web_search_enabled === false) return false;
  const query = (userText || "").toLowerCase();
  return /搜索|查一下|联网|最新|新闻|天气|汇率|股票|行情|现在|实时|今天|本周|今年|日期|时间|价格|版本|发布|更新|官网|链接/i.test(query);
}

// Copy Code Function
window.copyCode = function(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  const code = wrapper.querySelector('code').innerText;
  
  navigator.clipboard.writeText(code).then(() => {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> 已复制`;
    btn.classList.add('copied');
    
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
};

function createAttachmentId() {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

function updateAttachmentBar() {
  if (!elements.attachmentBar) return;
  if (pendingAttachments.length === 0) {
    elements.attachmentBar.classList.add("hidden");
    elements.attachmentBar.innerHTML = "";
    return;
  }
  elements.attachmentBar.classList.remove("hidden");
  elements.attachmentBar.innerHTML = "";
  pendingAttachments.forEach(att => {
    const chip = document.createElement("div");
    chip.className = "attachment-chip";
    chip.innerHTML = `
      <span>${att.name}</span>
      <span>${formatFileSize(att.size)}</span>
      <button data-id="${att.id}" title="移除">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
    chip.querySelector("button").addEventListener("click", () => {
      removeAttachmentById(att.id);
    });
    elements.attachmentBar.appendChild(chip);
  });
}

function removeAttachmentById(id) {
  const index = pendingAttachments.findIndex(att => att.id === id);
  if (index !== -1) {
    pendingAttachments.splice(index, 1);
    updateAttachmentBar();
  }
}

function addAttachmentFromFile(file) {
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("附件过大，请选择 10MB 以内的文件");
    return;
  }
  const id = createAttachmentId();
  const attachment = {
    id,
    name: file.name,
    size: file.size,
    mime: file.type || "",
    kind: "document",
    dataUrl: "",
    base64: "",
    text: ""
  };
  const ext = file.name.toLowerCase();
  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");
  const isText = file.type.startsWith("text/") || ext.endsWith(".md") || ext.endsWith(".txt") || ext.endsWith(".json") || ext.endsWith(".csv");
  const reader = new FileReader();
  if (isImage) {
    attachment.kind = "image";
    reader.onload = () => {
      const dataUrl = reader.result || "";
      attachment.dataUrl = dataUrl;
      attachment.base64 = String(dataUrl).split(",")[1] || "";
      pendingAttachments.push(attachment);
      updateAttachmentBar();
    };
    reader.readAsDataURL(file);
    return;
  }
  if (isAudio) {
    attachment.kind = "audio";
    reader.onload = () => {
      attachment.dataUrl = reader.result || "";
      pendingAttachments.push(attachment);
      updateAttachmentBar();
    };
    reader.readAsDataURL(file);
    return;
  }
  if (isText) {
    attachment.kind = "document";
    reader.onload = () => {
      attachment.text = reader.result || "";
      pendingAttachments.push(attachment);
      updateAttachmentBar();
    };
    reader.readAsText(file);
    return;
  }
  reader.onload = () => {
    attachment.dataUrl = reader.result || "";
    pendingAttachments.push(attachment);
    updateAttachmentBar();
  };
  reader.readAsDataURL(file);
}

function handleFileInputChange(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => addAttachmentFromFile(file));
  e.target.value = "";
}

function renderMessageAttachments(messageDiv, attachments) {
  if (!attachments || attachments.length === 0) return;
  const container = document.createElement("div");
  container.className = "message-attachments";
  attachments.forEach(att => {
    if (att.kind === "image" && att.dataUrl) {
      const img = document.createElement("img");
      img.className = "attachment-preview-image";
      img.src = att.dataUrl;
      img.alt = att.name || "image";
      container.appendChild(img);
      return;
    }
    if (att.kind === "audio" && att.dataUrl) {
      const audio = document.createElement("audio");
      audio.className = "attachment-audio";
      audio.controls = true;
      audio.src = att.dataUrl;
      container.appendChild(audio);
      return;
    }
    if (att.kind === "document") {
      const doc = document.createElement("div");
      doc.className = "attachment-doc";
      const name = document.createElement("div");
      name.className = "attachment-doc-name";
      name.textContent = `${att.name} (${formatFileSize(att.size)})`;
      doc.appendChild(name);
      if (att.text) {
        const preview = document.createElement("div");
        preview.className = "attachment-doc-preview";
        preview.textContent = att.text.slice(0, 600);
        doc.appendChild(preview);
      } else if (att.dataUrl) {
        const link = document.createElement("a");
        link.href = att.dataUrl;
        link.download = att.name || "file";
        link.textContent = "下载文件";
        link.style.fontSize = "12px";
        link.style.color = "var(--accent-color)";
        doc.appendChild(link);
      }
      container.appendChild(doc);
      return;
    }
  });
  messageDiv.appendChild(container);
}

function buildMessageContentWithAttachments(message) {
  let content = message.content || "";
  const attachments = message.attachments || [];
  const docs = attachments.filter(att => att.kind === "document");
  const docsWithText = docs.filter(att => att.text);
  const docsWithoutText = docs.filter(att => !att.text);
  const audios = attachments.filter(att => att.kind === "audio");
  if (docsWithText.length) {
    const docText = docsWithText.map(doc => `[${doc.name}]\n${doc.text}`).join("\n\n");
    content = `${content}\n\n[文档内容]\n${docText}\n[文档内容结束]`;
  }
  if (docsWithoutText.length) {
    const docNames = docsWithoutText.map(doc => `${doc.name} (${formatFileSize(doc.size)})`).join("\n");
    content = `${content}\n\n[文档附件]\n${docNames}`;
  }
  if (audios.length) {
    const names = audios.map(audio => audio.name).join("、");
    content = `${content}\n\n[音频附件]\n${names}`;
  }
  return content.trim();
}

function buildMessagePayload(message) {
  const content = buildMessageContentWithAttachments(message);
  const payload = { role: message.role, content };
  const images = (message.attachments || []).filter(att => att.kind === "image" && att.base64).map(att => att.base64);
  if (images.length) {
    payload.images = images;
  }
  if (message.tool_calls) {
    payload.tool_calls = message.tool_calls;
  }
  if (message.role === "tool" && message.name) {
    payload.name = message.name;
  }
  return payload;
}

function getSpeakableText(element) {
  const text = element ? element.textContent || "" : "";
  return text.replace(/\s+/g, " ").trim();
}

function toggleSpeechForElement(element, button) {
  if (!window.speechSynthesis) return;
  const isActive = button.dataset.speaking === "true";
  if (isActive) {
    window.speechSynthesis.cancel();
    button.dataset.speaking = "false";
    button.textContent = "朗读";
    return;
  }
  const text = getSpeakableText(element);
  if (!text) return;
  window.speechSynthesis.cancel();
  if (window.__activeSpeakButton) {
    window.__activeSpeakButton.dataset.speaking = "false";
    window.__activeSpeakButton.textContent = "朗读";
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  window.__activeSpeakButton = button;
  button.dataset.speaking = "true";
  button.textContent = "停止";
  utter.onend = () => {
    if (window.__activeSpeakButton === button) {
      button.dataset.speaking = "false";
      button.textContent = "朗读";
      window.__activeSpeakButton = null;
    }
  };
  window.speechSynthesis.speak(utter);
}

function toggleSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("当前浏览器不支持语音输入");
    return;
  }
  if (!activeSpeechRecognition) {
    activeSpeechRecognition = new SpeechRecognition();
    activeSpeechRecognition.lang = "zh-CN";
    activeSpeechRecognition.interimResults = false;
    activeSpeechRecognition.continuous = false;
    activeSpeechRecognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join(" ");
      if (transcript) {
        const current = elements.chatInput.value.trim();
        elements.chatInput.value = current ? `${current} ${transcript}` : transcript;
      }
    };
    activeSpeechRecognition.onend = () => {
      isListening = false;
      if (elements.micBtn) {
        elements.micBtn.classList.remove("recording");
      }
    };
  }
  if (!isListening) {
    isListening = true;
    if (elements.micBtn) {
      elements.micBtn.classList.add("recording");
    }
    activeSpeechRecognition.start();
  } else {
    activeSpeechRecognition.stop();
  }
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initEventListeners();
  scanModels();
  checkRagStatus(); // Check RAG status on load
  renderChatList();
  if (state.chats.length === 0) {
    createNewChat();
  } else if (state.currentChatId) {
    switchChat(state.currentChatId);
  } else {
    switchChat(state.chats[0].id);
  }
});

function loadState() {
  const saved = localStorage.getItem("ollama_client_state");
  if (saved) {
    const parsed = JSON.parse(saved);
    state.chats = parsed.chats || [];
    state.currentChatId = parsed.currentChatId || null;
    state.settings = { ...state.settings, ...(parsed.settings || {}) };
  }
  
  // Populate settings modal
  // General
  elements.settingEndpoint.value = state.settings.endpoint;
  
  // Generation
  elements.settingSystemPrompt.value = state.settings.system_prompt;
  elements.settingNumCtx.value = state.settings.num_ctx || 4096;
  elements.settingMaxTokens.value = state.settings.max_tokens;
  elements.settingTemperature.value = state.settings.temperature;
  elements.settingTopP.value = state.settings.top_p;
  elements.settingRepeatPenalty.value = state.settings.repeat_penalty || 1.1;
  elements.settingSeed.value = state.settings.seed !== null ? state.settings.seed : "";
  
  // Tools
  elements.settingRagEnabled.checked = state.settings.rag_enabled !== false; // Default true
  elements.settingRagThreshold.value = state.settings.rag_threshold || 0.35;
  elements.settingRagLimit.value = state.settings.rag_limit || 5;
  elements.settingWebSearchEnabled.checked = state.settings.web_search_enabled !== false; // Default true
  
  updateRangeDisplays();
  syncMaxTokenPresetState();
  updateVramEstimator();
}

function saveState() {
  localStorage.setItem("ollama_client_state", JSON.stringify({
    chats: state.chats,
    currentChatId: state.currentChatId,
    settings: state.settings
  }));
}

function initEventListeners() {
  // Chat Interactions
  elements.sendBtn.addEventListener("click", sendMessage);
  elements.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  if (elements.attachBtn && elements.fileInput) {
    elements.attachBtn.addEventListener("click", () => elements.fileInput.click());
    elements.fileInput.addEventListener("change", handleFileInputChange);
  }
  if (elements.micBtn) {
    elements.micBtn.addEventListener("click", toggleSpeechRecognition);
  }
  const inputWrapper = elements.chatInput.closest(".input-wrapper");
  if (inputWrapper) {
    inputWrapper.addEventListener("dragover", (e) => {
      e.preventDefault();
      inputWrapper.classList.add("dragover");
    });
    inputWrapper.addEventListener("dragleave", () => {
      inputWrapper.classList.remove("dragover");
    });
    inputWrapper.addEventListener("drop", (e) => {
      e.preventDefault();
      inputWrapper.classList.remove("dragover");
      const files = Array.from(e.dataTransfer?.files || []);
      files.forEach(file => addAttachmentFromFile(file));
    });
  }
  
  elements.newChatBtn.addEventListener("click", () => createNewChat());
  elements.scanBtn.addEventListener("click", scanModels);

  // Search
  elements.searchInput.addEventListener("input", (e) => {
    renderChatList(e.target.value);
  });

  // Model Selection
  elements.modelSelect.addEventListener("change", (e) => {
    state.currentModel = e.target.value;
    updateCurrentModelDisplay();
  });
  
  // Settings
  elements.settingsBtn.addEventListener("click", () => {
    elements.settingsModal.classList.remove("hidden");
  });
  
  elements.closeSettingsBtn.addEventListener("click", () => {
    elements.settingsModal.classList.add("hidden");
  });
  
  elements.saveSettingsBtn.addEventListener("click", () => {
    // General
    state.settings.endpoint = elements.settingEndpoint.value.trim() || "http://127.0.0.1:11434";
    
    // Generation
    state.settings.system_prompt = elements.settingSystemPrompt.value.trim();
    state.settings.num_ctx = parseInt(elements.settingNumCtx.value) || 4096;
    state.settings.max_tokens = parseInt(elements.settingMaxTokens.value) || 2048;
    state.settings.temperature = parseFloat(elements.settingTemperature.value);
    state.settings.top_p = parseFloat(elements.settingTopP.value);
    state.settings.repeat_penalty = parseFloat(elements.settingRepeatPenalty.value);
    const seedVal = elements.settingSeed.value.trim();
    state.settings.seed = seedVal === "" ? null : parseInt(seedVal);
    
    // Tools
    state.settings.rag_enabled = elements.settingRagEnabled.checked;
    state.settings.rag_threshold = parseFloat(elements.settingRagThreshold.value);
    state.settings.rag_limit = parseInt(elements.settingRagLimit.value);
    state.settings.web_search_enabled = elements.settingWebSearchEnabled.checked;
    
    saveState();
    syncMaxTokenPresetState();
    updateVramEstimator();
    elements.settingsModal.classList.add("hidden");
    scanModels(); // Re-scan in case endpoint changed
  });
  
  // Max tokens preset buttons
  elements.settingMaxTokenPresetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.dataset.value, 10);
      if (!isNaN(val)) {
        elements.settingMaxTokens.value = val;
        state.settings.max_tokens = val;
        saveState();
        elements.settingMaxTokenPresetBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        updateVramEstimator();
      }
    });
  });
  
  // Range Inputs
  elements.settingTemperature.addEventListener("input", updateRangeDisplays);
  elements.settingTopP.addEventListener("input", updateRangeDisplays);
  elements.settingRepeatPenalty.addEventListener("input", updateRangeDisplays);
  elements.settingRagThreshold.addEventListener("input", updateRangeDisplays);
  elements.settingRagLimit.addEventListener("input", updateRangeDisplays);
  elements.settingMaxTokens.addEventListener("input", () => {
    syncMaxTokenPresetState();
    updateVramEstimator();
  });
  elements.settingNumCtx.addEventListener("input", updateVramEstimator);

  if (elements.vramEstimator) {
    const vramTitle = elements.vramEstimator.querySelector(".vram-title");
    if (vramTitle) {
      vramTitle.addEventListener("click", () => {
        const collapsed = elements.vramEstimator.dataset.collapsed === "true";
        const next = !collapsed;
        localStorage.setItem("vram_estimator_collapsed", String(next));
        applyVramEstimatorCollapse(next);
      });
    }
    const saved = localStorage.getItem("vram_estimator_collapsed") === "true";
    applyVramEstimatorCollapse(saved);
  }
  
  // Tab Switching
  elements.tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Deactivate all
      elements.tabBtns.forEach(b => b.classList.remove("active"));
      elements.tabContents.forEach(c => c.classList.remove("active"));
      
      // Activate clicked
      btn.classList.add("active");
      const tabId = btn.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });
  
  // Database Modal Interactions
  elements.dbBtn.addEventListener("click", () => {
    elements.dbModal.classList.remove("hidden");
    loadMemories();
  });
  
  elements.closeDbBtn.addEventListener("click", () => {
    elements.dbModal.classList.add("hidden");
  });
  
  elements.refreshDbBtn.addEventListener("click", loadMemories);
  
  // Knowledge Base Actions
  elements.memorySearchInput.addEventListener("input", (e) => {
    kbState.searchQuery = e.target.value;
    filterAndRenderMemories();
  });
  
  elements.addMemoryBtn.addEventListener("click", showAddMemoryDialog);
  elements.exportDbBtn.addEventListener("click", exportKnowledgeBase);
  elements.clearAllDbBtn.addEventListener("click", clearAllMemories);
  elements.batchDeleteBtn.addEventListener("click", batchDeleteMemories);
  elements.selectAllMemories.addEventListener("change", toggleSelectAll);
  elements.cancelBatchBtn.addEventListener("click", exitBatchMode);
  
  // Close modal on outside click
  window.addEventListener("click", (e) => {
    if (e.target === elements.dbModal) {
      elements.dbModal.classList.add("hidden");
      exitBatchMode();
    }
  });
}

function updateRangeDisplays() {
  elements.settingTempDisplay.textContent = elements.settingTemperature.value;
  elements.settingTopPDisplay.textContent = elements.settingTopP.value;
  elements.settingRepeatPenaltyDisplay.textContent = elements.settingRepeatPenalty.value;
  elements.settingRagThresholdDisplay.textContent = elements.settingRagThreshold.value;
  elements.settingRagLimitDisplay.textContent = elements.settingRagLimit.value;
}

function syncMaxTokenPresetState() {
  const current = parseInt(elements.settingMaxTokens.value, 10);
  elements.settingMaxTokenPresetBtns.forEach(btn => {
    const val = parseInt(btn.dataset.value, 10);
    if (!isNaN(val) && val === current) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function formatGb(value) {
  if (Number.isNaN(value) || !isFinite(value)) return "-";
  return `${value.toFixed(2)} GB`;
}

function formatMb(value) {
  if (Number.isNaN(value) || !isFinite(value)) return "-";
  return `${value.toFixed(2)} MB`;
}

function updateVramText(key, value, element) {
  if (!element) return;
  if (vramDisplayCache[key] === value) return;
  vramDisplayCache[key] = value;
  element.textContent = value;
}

function parseModelSpec(modelName) {
  const name = (modelName || "").toLowerCase();
  const sizeMatch = name.match(/(\d+(\.\d+)?)\s*b/);
  const sizeB = sizeMatch ? parseFloat(sizeMatch[1]) : 7;
  let quant = "q4";
  if (name.includes("q2")) quant = "q2";
  else if (name.includes("q3")) quant = "q3";
  else if (name.includes("q4")) quant = "q4";
  else if (name.includes("q5")) quant = "q5";
  else if (name.includes("q6")) quant = "q6";
  else if (name.includes("q8")) quant = "q8";
  else if (name.includes("fp16") || name.includes("f16")) quant = "f16";
  else if (name.includes("fp32") || name.includes("f32")) quant = "f32";
  return { sizeB, quant };
}

function quantBits(quant) {
  if (quant === "q2") return 2;
  if (quant === "q3") return 3;
  if (quant === "q4") return 4;
  if (quant === "q5") return 5;
  if (quant === "q6") return 6;
  if (quant === "q8") return 8;
  if (quant === "f16") return 16;
  if (quant === "f32") return 32;
  return 4;
}

function updateVramEstimator() {
  if (!elements.vramEstimator) return;
  const model = state.currentModel || "未选择";
  const { sizeB, quant } = parseModelSpec(state.currentModel);
  const bits = quantBits(quant);
  const numCtx = parseInt(elements.settingNumCtx.value, 10) || state.settings.num_ctx || 4096;
  const params = sizeB * 1e9;
  const weightGb = (params * (bits / 8)) / (1024 ** 3);
  const kvPerTokenMbPerB = 0.065;
  const kvPerTokenMb = sizeB * kvPerTokenMbPerB;
  const kvGb = (numCtx * kvPerTokenMb) / 1024;
  const runtimeOverheadGb = Math.max(0.3, (weightGb + kvGb) * 0.03);
  const safetyGb = Math.max(0.5, (weightGb + kvGb + runtimeOverheadGb) * 0.08);
  const total = weightGb + kvGb + runtimeOverheadGb + safetyGb;

  updateVramText("model", model, elements.vramModel);
  updateVramText("params", `${sizeB}B`, elements.vramParams);
  updateVramText("quant", quant.toUpperCase(), elements.vramQuant);
  updateVramText("ctx", `${numCtx}`, elements.vramCtx);
  updateVramText("kvPerToken", formatMb(kvPerTokenMb), elements.vramKvPerToken);
  updateVramText("weights", formatGb(weightGb), elements.vramWeights);
  updateVramText("kv", formatGb(kvGb), elements.vramKv);
  updateVramText("overhead", formatGb(runtimeOverheadGb), elements.vramOverhead);
  updateVramText("safety", formatGb(safetyGb), elements.vramSafety);
  updateVramText("total", formatGb(total), elements.vramTotal);
}

function applyVramEstimatorCollapse(collapsed) {
  if (!elements.vramEstimator) return;
  elements.vramEstimator.dataset.collapsed = collapsed ? "true" : "false";
}

function updateCurrentModelDisplay() {
  elements.currentModelDisplay.textContent = state.currentModel || "选择一个模型开始对话";
  updateVramEstimator();
}

// RAG Status Management
async function checkRagStatus() {
  const statusEl = elements.ragStatus;
  const textEl = elements.ragStatusText;
  
  // Initial state: show checking
  textEl.textContent = "正在检测 RAG 模型...";
  statusEl.classList.add("visible");
  
  try {
    const response = await fetch("/api/rag/status");
    if (response.ok) {
      const data = await response.json();
      if (data.model) {
        // Success
        textEl.textContent = `RAG 就绪: ${data.model}`;
        // Enable DB button if it was disabled (optional)
        const spinner = statusEl.querySelector(".rag-spinner");
        if (spinner) spinner.style.display = "none";
        
        setTimeout(() => {
          statusEl.classList.remove("visible");
        }, 10000);
      } else {
        // No model found
        textEl.textContent = "RAG 未启用 (需下载 embedding 模型)";
        const spinner = statusEl.querySelector(".rag-spinner");
        if (spinner) spinner.style.display = "none";
        
        setTimeout(() => {
          statusEl.classList.remove("visible");
        }, 10000);
      }
    } else {
        throw new Error("Status check failed");
    }
  } catch (e) {
    console.error("RAG status check error:", e);
    textEl.textContent = "RAG 状态检测失败";
    const spinner = statusEl.querySelector(".rag-spinner");
    if (spinner) spinner.style.display = "none";
    setTimeout(() => {
        statusEl.classList.remove("visible");
    }, 5000);
  }
}

// Database Management
async function loadMemories() {
  const list = elements.memoryList;
  list.innerHTML = '<div class="loading-spinner" style="margin: 20px auto;"></div>';
  
  try {
    const response = await fetch("/api/rag/memories");
    if (!response.ok) throw new Error("Failed to load memories");
    
    const data = await response.json();
    kbState.allMemories = data.memories || [];
    kbState.searchQuery = "";
    kbState.selectedIds.clear();
    elements.memorySearchInput.value = "";
    
    filterAndRenderMemories();
    updateStats();
  } catch (e) {
    list.innerHTML = `<div class="error-msg" style="text-align:center; padding: 20px;">加载失败: ${e.message}</div>`;
  }
}

function filterAndRenderMemories() {
  const query = kbState.searchQuery.toLowerCase().trim();
  
  if (!query) {
    kbState.filteredMemories = kbState.allMemories;
  } else {
    kbState.filteredMemories = kbState.allMemories.filter(mem => 
      mem.content.toLowerCase().includes(query)
    );
  }
  
  renderMemoryList(kbState.filteredMemories);
  updateStats();
}

function renderMemoryList(memories) {
  const list = elements.memoryList;
  list.innerHTML = "";
  
  if (memories.length === 0) {
    const emptyMsg = kbState.searchQuery ? 
      `未找到包含"${kbState.searchQuery}"的知识条目` : 
      '暂无知识库记录，点击"添加"按钮创建第一条知识';
    list.innerHTML = `<div class="empty-state" style="text-align:center; padding: 40px; color: var(--text-secondary);">${emptyMsg}</div>`;
    return;
  }
  
  memories.forEach(mem => {
    const item = document.createElement("div");
    item.className = "memory-item";
    item.style.padding = "12px";
    item.style.borderBottom = "1px solid var(--border-color)";
    item.style.display = "flex";
    item.style.gap = "12px";
    item.style.alignItems = "flex-start";
    item.style.transition = "background 0.2s";
    
    // Checkbox for batch selection
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = kbState.selectedIds.has(mem.id);
    checkbox.onchange = (e) => {
      e.stopPropagation();
      if (checkbox.checked) {
        kbState.selectedIds.add(mem.id);
      } else {
        kbState.selectedIds.delete(mem.id);
      }
      updateBatchMode();
    };
    
    const contentDiv = document.createElement("div");
    contentDiv.style.flex = "1";
    contentDiv.style.minWidth = "0"; // 允许文本截断
    
    const textP = document.createElement("p");
    textP.textContent = mem.content;
    textP.style.margin = "0 0 4px 0";
    textP.style.lineHeight = "1.5";
    textP.style.wordBreak = "break-word";
    
    const dateSpan = document.createElement("span");
    try {
      const isoDate = mem.created_at.replace(' ', 'T');
      const date = new Date(isoDate);
      if (!isNaN(date.getTime())) {
        dateSpan.textContent = date.toLocaleString('zh-CN');
      } else {
        dateSpan.textContent = mem.created_at;
      }
    } catch (e) {
      dateSpan.textContent = mem.created_at;
    }
    dateSpan.style.fontSize = "12px";
    dateSpan.style.color = "var(--text-secondary)";
    
    contentDiv.appendChild(textP);
    contentDiv.appendChild(dateSpan);
    
    // Action buttons
    const actionsDiv = document.createElement("div");
    actionsDiv.style.display = "flex";
    actionsDiv.style.gap = "4px";
    actionsDiv.style.flexShrink = "0";
    
    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "btn-icon";
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    editBtn.title = "编辑";
    editBtn.onclick = () => editMemory(mem);
    
    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon delete-btn";
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    deleteBtn.title = "删除";
    deleteBtn.onclick = () => deleteMemory(mem.id);
    
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    
    item.appendChild(checkbox);
    item.appendChild(contentDiv);
    item.appendChild(actionsDiv);
    
    list.appendChild(item);
  });
}

async function clearAllMemories() {
  const count = kbState.allMemories.length;
  
  if (count === 0) {
    alert("知识库已经是空的");
    return;
  }
  
  if (!confirm(`⚠️ 警告：即将删除所有 ${count} 条知识库记录！\n\n此操作不可撤销，确定要继续吗？`)) {
    return;
  }
  
  // 二次确认
  if (!confirm("请再次确认：真的要清空整个知识库吗？")) {
    return;
  }
  
  try {
    const response = await fetch("/api/rag/clear", {
      method: "POST"
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      alert(`✅ 成功清空 ${count} 条知识库记录`);
      exitBatchMode();
      loadMemories();
    } else {
      alert("清空失败：" + (data.error || "未知错误"));
    }
  } catch (e) {
    console.error("Clear error:", e);
    alert("清空出错: " + e.message);
  }
}

async function deleteMemory(id) {
  if (!confirm("确定要删除这条记忆吗？删除后将无法恢复。")) return;
  
  try {
    const response = await fetch("/api/rag/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    
    if (response.ok) {
      loadMemories();
    } else {
      alert("删除失败");
    }
  } catch (e) {
    console.error("Delete error:", e);
    alert("删除出错: " + e.message);
  }
}

// New Knowledge Base Functions
function updateStats() {
  elements.totalMemories.textContent = kbState.allMemories.length;
  elements.selectedMemories.textContent = kbState.selectedIds.size;
  elements.displayedMemories.textContent = kbState.filteredMemories.length;
}

function updateBatchMode() {
  const hasSelection = kbState.selectedIds.size > 0;
  elements.batchActionBar.style.display = hasSelection ? "flex" : "none";
  elements.batchDeleteBtn.style.display = hasSelection ? "block" : "none";
  document.getElementById("batchActionText").textContent = `已选中 ${kbState.selectedIds.size} 项`;
  
  // Update select all checkbox
  const allVisible = kbState.filteredMemories.every(m => kbState.selectedIds.has(m.id));
  elements.selectAllMemories.checked = hasSelection && allVisible;
  elements.selectAllMemories.indeterminate = hasSelection && !allVisible;
  
  updateStats();
}

function toggleSelectAll(e) {
  if (e.target.checked) {
    kbState.filteredMemories.forEach(m => kbState.selectedIds.add(m.id));
  } else {
    kbState.filteredMemories.forEach(m => kbState.selectedIds.delete(m.id));
  }
  filterAndRenderMemories();
}

function exitBatchMode() {
  kbState.selectedIds.clear();
  elements.batchActionBar.style.display = "none";
  elements.batchDeleteBtn.style.display = "none";
  filterAndRenderMemories();
}

async function batchDeleteMemories() {
  const count = kbState.selectedIds.size;
  if (!confirm(`确定要删除选中的 ${count} 条记忆吗？删除后将无法恢复。`)) return;
  
  try {
    const ids = Array.from(kbState.selectedIds);
    let successCount = 0;
    
    for (const id of ids) {
      const response = await fetch("/api/rag/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) successCount++;
    }
    
    alert(`成功删除 ${successCount}/${count} 条记忆`);
    exitBatchMode();
    loadMemories();
  } catch (e) {
    console.error("Batch delete error:", e);
    alert("批量删除出错: " + e.message);
  }
}

function showAddMemoryDialog() {
  const content = prompt("请输入知识内容（至少10个字符）：");
  if (!content) return;
  
  if (content.trim().length < 10) {
    alert("知识内容至少需要10个字符");
    return;
  }
  
  addMemoryContent(content.trim());
}

async function addMemoryContent(content) {
  try {
    const response = await fetch("/api/rag/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      alert("知识添加成功！");
      loadMemories();
    } else {
      alert("添加失败：" + (data.error || "未知错误"));
    }
  } catch (e) {
    console.error("Add memory error:", e);
    alert("添加出错: " + e.message);
  }
}

function editMemory(mem) {
  const newContent = prompt("编辑知识内容：", mem.content);
  if (!newContent || newContent === mem.content) return;
  
  if (newContent.trim().length < 10) {
    alert("知识内容至少需要10个字符");
    return;
  }
  
  updateMemoryContent(mem.id, newContent.trim());
}

async function updateMemoryContent(id, content) {
  try {
    const response = await fetch("/api/rag/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      alert("知识更新成功！");
      loadMemories();
    } else {
      alert("更新失败：" + (data.error || "未知错误"));
    }
  } catch (e) {
    console.error("Update memory error:", e);
    alert("更新出错: " + e.message);
  }
}

function exportKnowledgeBase() {
  if (kbState.allMemories.length === 0) {
    alert("知识库为空，无法导出");
    return;
  }
  
  const exportData = {
    version: "1.0",
    exported_at: new Date().toISOString(),
    count: kbState.allMemories.length,
    memories: kbState.allMemories.map(m => ({
      content: m.content,
      created_at: m.created_at
    }))
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `knowledge_base_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  alert(`成功导出 ${kbState.allMemories.length} 条知识`);
}

// Model Management
async function scanModels() {
  elements.scanBtn.classList.add("rotating"); // Add CSS animation class if exists
  elements.statusIndicator.textContent = "正在扫描模型...";
  
  const fetchUrl = "/api/models"; 
  
  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error("Failed to fetch models");
    const data = await response.json();
    const allModels = data.models || [];
    
    // Filter out embedding models
    const models = allModels.filter(m => {
        const name = (m.name || m).toLowerCase();
        return !name.includes("embed") && !name.includes("bert");
    });
    
    renderModelList(models);
    
    // Auto-select first model if none selected or current not in list
    if (models.length > 0) {
        const modelNames = models.map(m => m.name || m);
        if (!state.currentModel || !modelNames.includes(state.currentModel)) {
            state.currentModel = modelNames[0];
            elements.modelSelect.value = state.currentModel;
        } else {
            elements.modelSelect.value = state.currentModel;
        }
    } else {
        state.currentModel = "";
    }
    updateCurrentModelDisplay();
    elements.statusIndicator.textContent = "就绪";
  } catch (error) {
    console.error("Scan models error:", error);
    elements.statusIndicator.textContent = "扫描失败";
    // Keep existing options if any
  } finally {
    elements.scanBtn.classList.remove("rotating");
  }
}

function renderModelList(models) {
  elements.modelSelect.innerHTML = "";
  if (models.length === 0) {
    const option = document.createElement("option");
    option.textContent = "未找到模型";
    option.disabled = true;
    elements.modelSelect.appendChild(option);
    return;
  }
  
  models.forEach(model => {
    const name = model.name || model;
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    elements.modelSelect.appendChild(option);
  });
}

// Chat Logic
function createNewChat() {
  const newChat = {
    id: Date.now().toString(),
    title: "新对话",
    messages: [],
    timestamp: Date.now()
  };
  state.chats.unshift(newChat);
  switchChat(newChat.id);
  saveState();
}

function switchChat(chatId) {
  state.currentChatId = chatId;
  state.isGenerating = false; // Reset generating state
  renderChatList();
  renderMessages();
  saveState();
  
  // Enable/Disable input based on state
  elements.chatInput.disabled = false;
  elements.sendBtn.disabled = false;
}

function deleteChat(e, chatId) {
  e.stopPropagation();
  if (confirm("确定要删除这个对话吗？")) {
    state.chats = state.chats.filter(c => c.id !== chatId);
    if (state.chats.length === 0) {
      createNewChat();
    } else if (state.currentChatId === chatId) {
      switchChat(state.chats[0].id);
    } else {
      renderChatList();
      saveState();
    }
  }
}

function renderChatList(searchQuery) {
  if (typeof searchQuery === 'undefined') {
    searchQuery = elements.searchInput ? elements.searchInput.value : "";
  }
  elements.chatList.innerHTML = "";
  
  let filteredChats = state.chats;
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filteredChats = state.chats.filter(chat => 
      (chat.title || "新对话").toLowerCase().includes(lowerQuery)
    );
  }
  
  const groups = groupChatsByDate(filteredChats);
  
  // Sort groups: Today, Yesterday, Earlier
  const groupOrder = ["今天", "昨天", "更早"];
  
  groupOrder.forEach(groupName => {
    if (groups[groupName] && groups[groupName].length > 0) {
      // Create Group Header
      const groupHeader = document.createElement("div");
      groupHeader.className = "history-group";
      
      const groupTitle = document.createElement("div");
      groupTitle.className = "history-group-title";
      groupTitle.textContent = groupName;
      groupHeader.appendChild(groupTitle);
      
      // Add items
      groups[groupName].forEach(chat => {
        const item = createChatHistoryItem(chat);
        groupHeader.appendChild(item);
      });
      
      elements.chatList.appendChild(groupHeader);
    }
  });
}

function groupChatsByDate(chats) {
  const groups = { "今天": [], "昨天": [], "更早": [] };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  
  chats.forEach(chat => {
    // Default to now if no timestamp (legacy compatibility)
    const ts = chat.timestamp || parseInt(chat.id) || Date.now();
    
    if (ts >= today) {
      groups["今天"].push(chat);
    } else if (ts >= yesterday) {
      groups["昨天"].push(chat);
    } else {
      groups["更早"].push(chat);
    }
  });
  
  return groups;
}

function createChatHistoryItem(chat) {
  const item = document.createElement("div");
  item.className = `history-item ${chat.id === state.currentChatId ? "active" : ""}`;
  item.onclick = () => switchChat(chat.id);
  
  // Title Container
  const titleContainer = document.createElement("div");
  titleContainer.className = "history-item-title";
  titleContainer.textContent = chat.title || "新对话";
  titleContainer.title = chat.title || "新对话";
  
  // Actions Container
  const actions = document.createElement("div");
  actions.className = "history-item-actions";
  
  // Rename Button
  const renameBtn = document.createElement("button");
  renameBtn.className = "icon-btn";
  renameBtn.title = "重命名";
  renameBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>`;
  renameBtn.onclick = (e) => {
    e.stopPropagation();
    startRename(chat.id, titleContainer, item);
  };
  
  // Delete Button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "icon-btn delete-btn";
  deleteBtn.title = "删除";
  deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>`;
  deleteBtn.onclick = (e) => deleteChat(e, chat.id);
  
  actions.appendChild(renameBtn);
  actions.appendChild(deleteBtn);
  
  item.appendChild(titleContainer);
  item.appendChild(actions);
  
  return item;
}

function startRename(chatId, titleEl, itemEl) {
  const currentTitle = titleEl.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentTitle;
  input.className = "rename-input";
  
  // Replace title with input
  titleEl.replaceWith(input);
  input.focus();
  input.select();
  
  // Handle save on Enter or Blur
  const save = () => {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== currentTitle) {
      renameChat(chatId, newTitle);
    } else {
      // Revert if empty or unchanged
      if (input.parentNode) {
          input.replaceWith(titleEl);
      }
    }
  };
  
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      save();
    } else if (e.key === "Escape") {
      if (input.parentNode) {
        input.replaceWith(titleEl);
      }
    }
    e.stopPropagation(); // Prevent triggering chat switch
  };
  
  input.onclick = (e) => e.stopPropagation();
  
  input.onblur = () => {
    // Small timeout to allow other clicks to process first if needed
    setTimeout(save, 100);
  };
}

function renameChat(chatId, newTitle) {
  const chat = state.chats.find(c => c.id === chatId);
  if (chat) {
    chat.title = newTitle;
    saveState();
    renderChatList(elements.searchInput.value);
  }
}

function renderMessages() {
  const currentChat = state.chats.find(c => c.id === state.currentChatId);
  if (!currentChat) return;
  
  elements.chatContainer.innerHTML = "";
  
  if (currentChat.messages.length === 0) {
    elements.chatContainer.innerHTML = `
      <div class="welcome-screen">
        <h1>Ollama Studio</h1>
        <p>选择模型并发送消息以开始对话</p>
      </div>`;
    return;
  }
  
  currentChat.messages.forEach(msg => {
    // Skip tool messages - they are for model context only
    if (msg.role !== "tool") {
      appendMessageToUI(msg.role, msg.content, msg.attachments);
    }
  });
  scrollToBottom();
}

function appendMessageToUI(role, content, attachments = []) {
  // Remove welcome screen if exists
  const welcome = elements.chatContainer.querySelector(".welcome-screen");
  if (welcome) welcome.remove();

  const div = document.createElement("div");
  div.className = `message message-${role}`;
  
  // Avatar
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  if (role === "user") {
      avatar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  } else {
      avatar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
  }
  
  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  const messageBody = document.createElement("div");
  messageBody.className = "message-body";
  contentDiv.appendChild(messageBody);
  
  if (role === "assistant") {
    updateMessageContent(contentDiv, content);
  } else {
    messageBody.textContent = content;
  }
  
  if (attachments && attachments.length > 0) {
    renderMessageAttachments(contentDiv, attachments);
  }
  
  if (role === "assistant") {
    const actions = document.createElement("div");
    actions.className = "message-actions";
    const speakBtn = document.createElement("button");
    speakBtn.className = "message-action-btn";
    speakBtn.textContent = "朗读";
    speakBtn.addEventListener("click", () => {
      toggleSpeechForElement(contentDiv, speakBtn);
    });
    actions.appendChild(speakBtn);
    contentDiv.appendChild(actions);
  }
  
  div.appendChild(avatar);
  div.appendChild(contentDiv);
  
  elements.chatContainer.appendChild(div);
  return contentDiv; // Return for streaming updates
}

function parseModelOutput(text) {
  // Support multiple thinking tag formats
  const thinkStartRegex = /<think>|&lt;think&gt;|<thinking>|&lt;thinking&gt;|\[THINKING\]/i;
  const thinkEndRegex = /<\/think>|&lt;\/think&gt;|<\/thinking>|&lt;\/thinking&gt;|\[\/THINKING\]/i;
  
  const startMatch = text.match(thinkStartRegex);
  if (!startMatch) {
    return { thinking: null, content: text, isThinking: false };
  }
  
  const startIndex = startMatch.index;
  const startLen = startMatch[0].length;
  
  const prefix = text.substring(0, startIndex);
  
  // Search for end tag AFTER the start tag
  const remaining = text.substring(startIndex + startLen);
  const endMatch = remaining.match(thinkEndRegex);
  
  if (!endMatch) {
    // Still thinking
    const thinking = remaining.trim();
    return { thinking, content: prefix.trim(), isThinking: true };
  }
  
  const endLen = endMatch[0].length;
  const thinkingLen = endMatch.index; // Index relative to 'remaining'
  
  const thinking = remaining.substring(0, thinkingLen).trim();
  const content = (prefix + remaining.substring(thinkingLen + endLen)).trim();
  
  return { thinking, content, isThinking: false };
}

function isServerRenderedHtml(text) {
  if (!text) return false;
  return /<pre[\s>]|<code[\s>]|<div class="code-block-wrapper"|<span class="hljs"/i.test(text);
}

function looksLikeEscapedHtml(text) {
  if (!text) return false;
  return /&lt;pre[\s>]|&lt;code[\s>]|&lt;div class=&quot;code-block-wrapper&quot;|&lt;span class=&quot;hljs&quot;/i.test(text);
}

function decodeHtmlEntities(input) {
  if (!input) return input;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
}

function normalizeServerRenderedHtml(text) {
  if (!text) return text;
  if (looksLikeEscapedHtml(text)) {
    const decoded = decodeHtmlEntities(text);
    if (isServerRenderedHtml(decoded)) {
      return decoded;
    }
  }
  return text;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(text) {
  if (!text) return "";
  let escaped = escapeHtml(text);
  escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  escaped = escaped.replace(/_([^_]+)_/g, "<em>$1</em>");
  escaped = escaped.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="attachment-preview-image" />');
  escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return escaped;
}

function splitTableRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map(cell => cell.trim());
}

function isTableSeparator(line) {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  const cells = splitTableRow(trimmed);
  if (!cells.length) return false;
  return cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function parseTableAlignments(line) {
  return splitTableRow(line).map(cell => {
    if (/^:-+:$/.test(cell)) return "center";
    if (/^:-+$/.test(cell)) return "left";
    if (/^-+:$/.test(cell)) return "right";
    return "";
  });
}

function renderCodeBlock(lang, code) {
  const normalizedLang = (lang || "").toLowerCase();
  const isAutoLanguage = !normalizedLang || normalizedLang === "plaintext";
  const langLabel = isAutoLanguage ? "自动" : normalizedLang;
  const codeClass = isAutoLanguage ? "hljs" : `hljs language-${normalizedLang}`;
  const codeEscaped = escapeHtml(code || "");
  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-lang">${langLabel}</span>
        <button class="copy-btn" onclick="copyCode(this)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          复制
        </button>
      </div>
      <pre><code class="${codeClass}">${codeEscaped}</code></pre>
    </div>
  `;
}

function renderBlocks(text) {
  if (!text) return "";
  let html = "";
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let blockquote = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html += `<p>${renderInline(paragraph.join("<br>"))}</p>`;
    paragraph = [];
  };

  const flushList = () => {
    if (!listType) return;
    html += `<${listType}>${listItems.join("")}</${listType}>`;
    listType = null;
    listItems = [];
  };

  const flushBlockquote = () => {
    if (!blockquote.length) return;
    html += `<blockquote>${renderInline(blockquote.join("<br>"))}</blockquote>`;
    blockquote = [];
  };

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "") {
      flushParagraph();
      flushList();
      flushBlockquote();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushBlockquote();
      const level = headingMatch[1].length;
      html += `<h${level}>${renderInline(headingMatch[2])}</h${level}>`;
      continue;
    }

    const blockquoteMatch = line.match(/^\s*>\s?(.*)$/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      blockquote.push(blockquoteMatch[1]);
      continue;
    } else {
      flushBlockquote();
    }

    const nextLine = lines[i + 1];
    if (nextLine && line.includes("|") && isTableSeparator(nextLine)) {
      flushParagraph();
      flushList();
      flushBlockquote();
      const headerCells = splitTableRow(line);
      const alignments = parseTableAlignments(nextLine);
      let rows = [];
      let j = i + 2;
      while (j < lines.length) {
        const rowLine = lines[j];
        if (!rowLine.trim()) break;
        if (!rowLine.includes("|")) break;
        if (isTableSeparator(rowLine)) break;
        rows.push(splitTableRow(rowLine));
        j++;
      }
      const headHtml = headerCells.map((cell, idx) => {
        const align = alignments[idx] ? ` style="text-align:${alignments[idx]};"` : "";
        return `<th${align}>${renderInline(cell)}</th>`;
      }).join("");
      const bodyHtml = rows.map(row => {
        const cellsHtml = row.map((cell, idx) => {
          const align = alignments[idx] ? ` style="text-align:${alignments[idx]};"` : "";
          return `<td${align}>${renderInline(cell)}</td>`;
        }).join("");
        return `<tr>${cellsHtml}</tr>`;
      }).join("");
      html += `<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
      i = j - 1;
      continue;
    }

    const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(`<li>${renderInline(orderedMatch[1])}</li>`);
      continue;
    }

    const unorderedMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(`<li>${renderInline(unorderedMatch[1])}</li>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushBlockquote();
  return html;
}

function renderMarkdown(text, isStreaming = false) {
  if (!text) return "";
  const fenceRegex = /```([\w-]+)?\n([\s\S]*?)```/g;
  let html = "";
  let lastIndex = 0;
  let match;
  while ((match = fenceRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    html += renderBlocks(before);
    html += renderCodeBlock(match[1] || "", match[2] || "");
    lastIndex = match.index + match[0].length;
  }
  const remaining = text.slice(lastIndex);
  if (isStreaming) {
    const fenceStart = remaining.lastIndexOf("```");
    if (fenceStart !== -1) {
      const before = remaining.slice(0, fenceStart);
      html += renderBlocks(before);
      const fenceText = remaining.slice(fenceStart + 3);
      const newlineIndex = fenceText.indexOf("\n");
      const lang = newlineIndex === -1 ? fenceText.trim() : fenceText.slice(0, newlineIndex).trim();
      const code = newlineIndex === -1 ? "" : fenceText.slice(newlineIndex + 1);
      html += renderCodeBlock(lang, code);
      return html;
    }
  }
  html += renderBlocks(remaining);
  return html;
}

function applySyntaxHighlight(container) {
  if (typeof hljs === "undefined") return;
  container.querySelectorAll("pre code").forEach((block) => {
    const classList = block.classList;
    const wrapper = block.closest(".code-block-wrapper");
    const langLabel = wrapper ? wrapper.querySelector(".code-lang") : null;
    const declaredLanguage = Array.from(classList).find((name) => name.startsWith("language-"));
    const hasPlaintext =
      classList.contains("language-plaintext") ||
      classList.contains("lang-plaintext") ||
      classList.contains("plaintext");
    const isExplicitLanguage = declaredLanguage && !hasPlaintext;

    if (isExplicitLanguage) {
      hljs.highlightElement(block);
      if (langLabel) {
        langLabel.textContent = declaredLanguage.replace("language-", "");
      }
      return;
    }

    if (hasPlaintext) {
      classList.remove("language-plaintext");
      classList.remove("lang-plaintext");
      classList.remove("plaintext");
    }

    const text = block.textContent || "";
    const result = hljs.highlightAuto(text);
    block.innerHTML = result.value;
    block.className = `hljs${result.language ? ` language-${result.language}` : ""}`;
    if (langLabel) {
      langLabel.textContent = result.language || "自动";
    }
  });
}

function updateMessageContent(container, text, isStreaming = false) {
  const { thinking, content, isThinking } = parseModelOutput(text);
  const normalizedThinking = normalizeServerRenderedHtml(thinking);
  const normalizedContent = normalizeServerRenderedHtml(content);
  const contentRoot = container.querySelector(".message-body") || container;
  
  // Handle Thinking Box
  let thinkingBox = contentRoot.querySelector(".thinking-box");
  
  if (thinking !== null && thinking.trim()) {
    if (!thinkingBox) {
      thinkingBox = document.createElement("details");
      thinkingBox.className = "thinking-box";
      thinkingBox.open = true; // Default open during thinking
      
      const summary = document.createElement("summary");
      
      // Create thinking icon with animation
      const icon = document.createElement("span");
      icon.className = "thinking-icon";
      icon.innerHTML = "🤔";
      icon.style.display = "inline-block";
      icon.style.marginRight = "6px";
      
      const label = document.createElement("span");
      label.className = "thinking-label";
      label.textContent = "思考过程";
      
      summary.appendChild(icon);
      summary.appendChild(label);
      
      const thinkingContent = document.createElement("div");
      thinkingContent.className = "thinking-content";
      
      thinkingBox.appendChild(summary);
      thinkingBox.appendChild(thinkingContent);
      
      // Store start time for duration tracking
      thinkingBox.dataset.startTime = Date.now();
      
      // Insert at the top
      contentRoot.prepend(thinkingBox);
    }
    
    // Update content
    const thinkingContentDiv = thinkingBox.querySelector(".thinking-content");
    
    if (isServerRenderedHtml(normalizedThinking)) {
      thinkingContentDiv.innerHTML = normalizedThinking;
    } else {
      thinkingContentDiv.innerHTML = renderMarkdown(normalizedThinking, isStreaming);
    }
    applySyntaxHighlight(thinkingContentDiv);
    
    // Add cursor animation to thinking box if currently thinking
    if (isThinking && isStreaming) {
      thinkingContentDiv.classList.add("typing-cursor");
      thinkingBox.classList.add("thinking-active");
      
      // Animate thinking icon
      const icon = thinkingBox.querySelector(".thinking-icon");
      if (icon) {
        icon.style.animation = "pulse 1.5s ease-in-out infinite";
      }
    } else {
      thinkingContentDiv.classList.remove("typing-cursor");
      thinkingBox.classList.remove("thinking-active");
      
      // Stop icon animation
      const icon = thinkingBox.querySelector(".thinking-icon");
      if (icon) {
        icon.style.animation = "none";
      }
    }
    
    // Handle Auto-Collapse with smooth animation
    if (!isThinking && !thinkingBox.hasAttribute("data-auto-collapsed")) {
      // Calculate thinking duration
      const startTime = parseInt(thinkingBox.dataset.startTime);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Update summary with duration
      const label = thinkingBox.querySelector(".thinking-label");
      if (label) {
        label.textContent = `思考过程 (${duration}s)`;
      }
      
      // Auto-collapse after a short delay
      setTimeout(() => {
        thinkingBox.removeAttribute("open");
        thinkingBox.setAttribute("data-auto-collapsed", "true");
        
        // Change icon to completed
        const icon = thinkingBox.querySelector(".thinking-icon");
        if (icon) {
          icon.innerHTML = "✓";
          icon.style.color = "var(--success-color)";
        }
      }, 800);
    }
  } else {
    if (thinkingBox) thinkingBox.remove();
  }
  
  // Handle Main Content
  let mainContentDiv = contentRoot.querySelector(".main-content");
  
  if (!mainContentDiv) {
    mainContentDiv = document.createElement("div");
    mainContentDiv.className = "main-content";
    contentRoot.appendChild(mainContentDiv);
  }
  
  // If server already rendered HTML (e.g., code blocks), render directly
  if (isServerRenderedHtml(normalizedContent)) {
    mainContentDiv.innerHTML = normalizedContent;
  } else {
    mainContentDiv.innerHTML = renderMarkdown(normalizedContent, isStreaming);
  }
  applySyntaxHighlight(mainContentDiv);
  
  // Add cursor to main content if streaming and NOT thinking
  if (isStreaming && !isThinking) {
    mainContentDiv.classList.add("typing-cursor");
  } else {
    mainContentDiv.classList.remove("typing-cursor");
  }
}

function scrollToBottom(force = false) {
  const container = elements.chatContainer;
  const threshold = 100; // px
  
  // If forced, or if user is near the bottom
  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  
  if (force || isNearBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

async function executeTool(toolCall) {
  const functionName = toolCall.function.name;
  let args = toolCall.function.arguments;
  
  // Arguments might be a string or object depending on parsing
  if (typeof args === 'string') {
      try { 
        args = JSON.parse(args); 
      } catch(e) {
        console.error("Failed to parse tool arguments:", e);
        return JSON.stringify({ error: "Invalid tool arguments format" });
      }
  }
  
  // Ensure args is an object
  if (!args || typeof args !== 'object') {
    args = {};
  }

  if (functionName === "web_search") {
    try {
      if (!args.query) {
        return JSON.stringify({ error: "Query parameter is required" });
      }
      const response = await fetch("/api/tools/web_search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: args.query })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      
      // Check if results exist
      if (data.error) {
        return JSON.stringify({ error: data.error });
      }
      if (data.results && data.results.length > 0) {
        // Format results for the model
        const formatted = {
          query: args.query,
          results_count: data.results.length,
          results: data.results.map((r, i) => ({
            index: i + 1,
            title: r.title,
            url: r.href,
            snippet: r.body
          }))
        };
        return JSON.stringify(formatted);
      } else {
        return JSON.stringify({ error: "No search results found", query: args.query });
      }
    } catch (e) {
      console.error("Web search error:", e);
      return JSON.stringify({ error: e.message });
    }
  }
  return JSON.stringify({ error: "Unknown tool: " + functionName });
}

async function extractAndSaveMemory(userText, assistantText) {
  if (state.settings.rag_enabled === false) return;
  
  // Use a separate non-streaming call to analyze the conversation
  const analysisPrompt = `
Analyze the following conversation and extract ONE key fact, user preference, or technical detail that is worth remembering for future context. 
If nothing is worth remembering (e.g., casual greeting, simple question), return "NULL".
Also categorize the memory into one of: "User Preference", "Technical", "General", "Project".

Format the output as JSON: {"content": "...", "category": "..."}

Conversation:
User: ${userText}
Assistant: ${assistantText}
`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: state.currentModel,
        messages: [{ role: "user", content: analysisPrompt }],
        stream: false,
        options: { temperature: 0.1 } // Low temp for extraction
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      let result = data.message?.content || "";
      
      // Clean up JSON markdown if present
      result = result.replace(/```json/g, "").replace(/```/g, "").trim();
      
      if (result.includes("NULL")) return;
      
      try {
        const json = JSON.parse(result);
        if (json.content && json.content !== "NULL") {
          // Send to server
          await fetch("/api/rag/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                content: json.content,
                category: json.category || "General"
            })
          });
          console.log("Memory saved:", json);
        }
      } catch (e) {
        console.warn("Failed to parse memory extraction:", e);
      }
    }
  } catch (e) {
    const isAbort = e?.name === "AbortError" || (e?.message || "").includes("Failed to fetch");
    if (!isAbort) {
      console.error("Memory extraction error:", e);
    }
  }
}

// Core Messaging Logic
async function sendMessage() {
  if (state.isGenerating) return;
  
  const text = elements.chatInput.value.trim();
  const hasAttachments = pendingAttachments.length > 0;
  if (!text && !hasAttachments) return;
  
  if (!state.currentModel) {
    alert("请先选择一个模型");
    return;
  }
  
  // Add user message
  const currentChat = state.chats.find(c => c.id === state.currentChatId);
  const attachments = hasAttachments ? pendingAttachments.map(att => ({ ...att })) : [];
  currentChat.messages.push({ role: "user", content: text, attachments });
  
  // Update Chat Title if it's the first message
  if (currentChat.messages.length === 1) {
    const titleSeed = text || (attachments[0] ? attachments[0].name : "新对话");
    currentChat.title = titleSeed.slice(0, 20) + (titleSeed.length > 20 ? "..." : "");
    renderChatList();
  }
  
  appendMessageToUI("user", text, attachments);
  elements.chatInput.value = "";
  pendingAttachments.length = 0;
  updateAttachmentBar();
  scrollToBottom();
  
  state.isGenerating = true;
  elements.sendBtn.disabled = true;
  
  const isDeepSeek = state.currentModel.toLowerCase().includes("deepseek");
  const isThinkingModel = isDeepSeek || 
                          state.currentModel.toLowerCase().includes("r1") ||
                          state.currentModel.toLowerCase().includes("thinking");
  elements.statusIndicator.textContent = isThinkingModel ? "🤔 深度思考中..." : "正在生成...";
  
  try {
    // 1. RAG Query
    let ragContext = "";
    const queryText = buildMessageContentWithAttachments({ content: text, attachments });
    
    // Only query if RAG is enabled
    if (state.settings.rag_enabled !== false) {
        try {
          const ragRes = await fetch("/api/rag/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                query: queryText,
                limit: state.settings.rag_limit || 5,
                threshold: state.settings.rag_threshold || 0.35
            })
          });
          if (ragRes.ok) {
            const ragData = await ragRes.json();
            if (ragData.results && ragData.results.length > 0) {
              // Format memories with index and score for clarity
              const memories = ragData.results.map((r, i) => `[记忆${i+1}] (关联度: ${(r.score*100).toFixed(0)}%)\n${r.content}`).join("\n\n");
              ragContext = `[系统提示：检索到以下相关历史记忆，请优先基于这些信息回答]\n${memories}\n[记忆结束]\n`;
              
              // Show RAG status in UI
              const statusDiv = document.createElement("div");
              statusDiv.className = "rag-hit-status";
              statusDiv.innerHTML = `📚 已检索到 ${ragData.results.length} 条相关记忆`;
              statusDiv.style.fontSize = "12px";
              statusDiv.style.color = "var(--text-secondary)";
              statusDiv.style.marginTop = "4px";
              statusDiv.style.marginBottom = "8px";
              statusDiv.title = ragData.results.map(r => r.content.slice(0, 50) + "...").join("\n");
              
              const lastUserMsg = elements.chatContainer.lastElementChild;
              if (lastUserMsg) {
                 lastUserMsg.querySelector(".message-content").appendChild(statusDiv);
              }
            }
          }
        } catch (e) {
          console.error("RAG Query Error:", e);
        }
    }

    // 2. Construct Initial Messages Payload
    let messagesPayload = [];
    if (state.settings.system_prompt) {
      messagesPayload.push({ role: "system", content: state.settings.system_prompt });
    }
    if (ragContext) {
      messagesPayload.push({ role: "system", content: ragContext });
    }
    
    // Add history (excluding the new assistant placeholder we are about to create)
    // Actually we haven't created it yet in the history array for the loop
    messagesPayload = messagesPayload.concat(currentChat.messages.map(buildMessagePayload));

    // 3. Tool Loop
    let finished = false;
    let turnCount = 0;
    const MAX_TURNS = 5;
    const executedTools = new Set(); // Track executed tools to prevent loops
    let toolsWereProvided = false; // Track if tools were provided in this iteration
    
    while (!finished && turnCount < MAX_TURNS) {
        turnCount++;
        
        // Prepare UI for this turn
        const assistantMsg = { role: "assistant", content: "" };
        currentChat.messages.push(assistantMsg);
        const responseContentDiv = appendMessageToUI("assistant", "");
        
        // Prepare options, removing null/undefined values
    const options = {
        num_ctx: state.settings.num_ctx || 4096,
        num_predict: state.settings.max_tokens,
        temperature: state.settings.temperature,
        top_p: state.settings.top_p,
        repeat_penalty: state.settings.repeat_penalty || 1.1
    };
    
    // Only add seed if it's a valid number
    if (typeof state.settings.seed === 'number' && !isNaN(state.settings.seed)) {
        options.seed = state.settings.seed;
    }

    const payload = {
      model: state.currentModel,
      messages: messagesPayload,
      stream: true,
      options: options
    };
    
    // Smart tool enabling logic:
    // 1. Only provide tools on first turn (let model decide if it needs them)
    // 2. Only if model is known to support tools (or not yet tested)
    // 3. If model called a tool, next turn should NOT have tools (force final answer)
    // 4. If web search is disabled, never provide tools
    toolsWereProvided = false;
    const modelSupportsTools = modelCapabilities.supportsTools.get(state.currentModel);
    const allowToolsForThisMessage = shouldProvideTools(text);
    
    if (allowToolsForThisMessage && 
        turnCount === 1 && 
        modelSupportsTools !== false) { // undefined or true
        payload.tools = [webSearchTool];
        toolsWereProvided = true;
    }

    // Stream response
        await streamResponse(payload, assistantMsg, responseContentDiv);
        
        // Check for tool calls
        if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
            // Mark model as supporting tools (since it successfully used them)
            if (toolsWereProvided) {
                modelCapabilities.supportsTools.set(state.currentModel, true);
            }
            
            // Update UI to show tool usage
            const statusDiv = document.createElement("div");
            statusDiv.className = "tool-status";
            statusDiv.innerHTML = `<em>⚙️ 正在调用工具: ${assistantMsg.tool_calls[0].function.name}...</em>`;
            statusDiv.style.color = "var(--text-secondary)";
            statusDiv.style.fontSize = "13px";
            statusDiv.style.margin = "8px 0";
            responseContentDiv.appendChild(statusDiv);
            
            // Add Assistant Message (with tool calls) to payload
            messagesPayload.push({
                role: "assistant",
                content: assistantMsg.content || "",
                tool_calls: assistantMsg.tool_calls
            });
            
            // Execute Tools
            for (const toolCall of assistantMsg.tool_calls) {
                // Check for duplicate calls to prevent infinite loops
                let argsStr = "";
                try {
                    argsStr = typeof toolCall.function.arguments === 'string' 
                        ? toolCall.function.arguments 
                        : JSON.stringify(toolCall.function.arguments);
                } catch(e) { argsStr = "error"; }
                
                const toolSignature = `${toolCall.function.name}:${argsStr}`;
                let result;
                
                if (executedTools.has(toolSignature)) {
                    console.warn("Duplicate tool call detected:", toolSignature);
                    result = JSON.stringify({ error: "Tool already executed with these exact arguments. Do not repeat the same call. If no results were found previously, try a different query or answer based on available knowledge." });
                    
                    const dupDiv = document.createElement("div");
                    dupDiv.textContent = "⚠️ 检测到重复调用，已跳过";
                    dupDiv.style.fontSize = "12px";
                    dupDiv.style.color = "orange";
                    responseContentDiv.appendChild(dupDiv);
                } else {
                    executedTools.add(toolSignature);
                    result = await executeTool(toolCall);
                    
                    // Log tool result for debugging
                    console.log("Tool result:", result.substring(0, 200) + (result.length > 200 ? "..." : ""));
                }
                
                // Add Tool Result to payload
                // Include function name for Ollama to properly identify the tool response
                messagesPayload.push({
                    role: "tool",
                    content: result,
                    name: toolCall.function.name
                });
                
                // Save tool result to chat history for persistence
                currentChat.messages.push({
                    role: "tool",
                    content: result,
                    name: toolCall.function.name
                });
                
                // Show result summary in UI
                try {
                    const resultData = JSON.parse(result);
                    const resultDiv = document.createElement("div");
                    resultDiv.className = "tool-result";
                    resultDiv.style.fontSize = "12px";
                    resultDiv.style.color = "var(--text-secondary)";
                    resultDiv.style.marginTop = "4px";
                    
                    if (resultData.error) {
                        resultDiv.innerHTML = `❌ 工具执行失败: ${resultData.error}`;
                        resultDiv.style.color = "orange";
                    } else if (resultData.results_count) {
                        resultDiv.innerHTML = `✅ 找到 ${resultData.results_count} 条搜索结果`;
                    } else {
                        resultDiv.innerHTML = `✅ 工具执行完成`;
                    }
                    
                    responseContentDiv.appendChild(resultDiv);
                } catch (e) {
                    // If result is not JSON, just show generic message
                    const resultDiv = document.createElement("div");
                    resultDiv.textContent = "✅ 工具执行完成";
                    resultDiv.style.fontSize = "12px";
                    resultDiv.style.color = "var(--text-secondary)";
                    responseContentDiv.appendChild(resultDiv);
                }
            }
            
            // Loop continues to get the next response
        } else {
            // No tool calls, this is the final answer
            finished = true;
            
            // Auto-title and RAG Add only on final success
            try {
                if (currentChat.messages.length <= 3) { // 2 messages + 1 assistant = 3 (approx)
                     generateAutoTitle(currentChat.id, text, assistantMsg.content);
                }
                
                // Smart RAG Memory Extraction
                extractAndSaveMemory(text, assistantMsg.content);
                
            } catch (e) { console.error("RAG/Title Error", e); }
        }
    }
    
    // Check if loop exited due to MAX_TURNS
    if (!finished && turnCount >= MAX_TURNS) {
      console.warn("Max tool turns reached");
      const warningDiv = document.createElement("div");
      warningDiv.className = "tool-status";
      warningDiv.innerHTML = `<em>⚠️ 达到最大工具调用次数限制 (${MAX_TURNS})</em>`;
      warningDiv.style.color = "orange";
      warningDiv.style.fontSize = "13px";
      warningDiv.style.margin = "8px 0";
      const lastAssistantBubble = elements.chatContainer.querySelector(".message-assistant:last-child .message-content");
      if (lastAssistantBubble) {
        lastAssistantBubble.appendChild(warningDiv);
      }
    }
    
    saveState();
    
  } catch (error) {
    const isAbort = error?.message === "REQUEST_ABORTED" || error?.name === "AbortError" || (error?.message || "").includes("Failed to fetch");
    if (!isAbort) {
      console.error("Message Error:", error);
    }
    
    // Check for "does not support tools" error
    const isToolError = error.message.includes("does not support tools") || 
                       error.message.includes("tool") && error.message.includes("not supported");
    
    // Check if toolsWereProvided is defined (it might be undefined if error happened before declaration)
    const wasToolsProvided = typeof toolsWereProvided !== 'undefined' ? toolsWereProvided : false;

    if (isToolError && wasToolsProvided) {
        // Mark this model as not supporting tools
        modelCapabilities.supportsTools.set(state.currentModel, false);
        
        const bubbles = elements.chatContainer.querySelectorAll(".message-assistant .message-content");
        const lastBubble = bubbles[bubbles.length - 1];
        
        // Show status
        const statusDiv = document.createElement("div");
        statusDiv.className = "tool-status";
        statusDiv.style.color = "orange";
        statusDiv.innerHTML = "<em>⚠️ 当前模型不支持工具调用，已为此模型禁用工具功能。正在重试...</em>";
        if (lastBubble) lastBubble.appendChild(statusDiv);
        
        // Clean up the failed attempt
        const currentChat = state.chats.find(c => c.id === state.currentChatId);
        
        // Remove failed assistant messages from this attempt
        while (currentChat.messages.length > 0 && 
               currentChat.messages[currentChat.messages.length-1].role !== "user") {
            currentChat.messages.pop();
        }
        
        // Remove UI bubbles from failed attempt
        const failedBubbles = elements.chatContainer.querySelectorAll(".message-assistant");
        failedBubbles.forEach(bubble => {
            // Only remove bubbles from this attempt (check if they're recent/empty)
            const content = bubble.querySelector(".message-content");
            if (content && (content.textContent.trim() === "" || content.textContent.includes("[模型未返回任何内容]"))) {
                bubble.remove();
            }
        });
        
        // Reset state and retry WITHOUT tools
        state.isGenerating = false;
        elements.sendBtn.disabled = false;
        
        // Get the user's message that we need to retry
        const userMessage = currentChat.messages[currentChat.messages.length - 1];
        if (userMessage && userMessage.role === "user") {
            // Retry by setting the input and calling sendMessage
            // But first remove the user message since sendMessage will add it again
            currentChat.messages.pop();
            
            // Set input value and trigger send
            elements.chatInput.value = userMessage.content;
            
            // Wait a bit for UI to update, then send
            setTimeout(() => {
                statusDiv.innerHTML = "<em>🔄 正在重试（不使用工具）...</em>";
                sendMessage(); // This will retry without tools since model is now marked as not supporting them
            }, 500);
            return; // Exit this catch block to avoid further error handling
        } else {
            statusDiv.innerHTML = "<em>❌ 无法重试：找不到用户消息</em>";
        }
    } else if (isAbort) {
        const bubbles = elements.chatContainer.querySelectorAll(".message-assistant .message-content");
        if (bubbles.length > 0) {
            const lastBubble = bubbles[bubbles.length - 1];
            lastBubble.textContent += `\n\n[请求已中止]`;
        }
    } else {
        const safeErrorMessage = isToolError && !wasToolsProvided ? "请求失败" : error.message;
        // If we have an active bubble, append error
        const bubbles = elements.chatContainer.querySelectorAll(".message-assistant .message-content");
        if (bubbles.length > 0) {
            const lastBubble = bubbles[bubbles.length - 1];
            lastBubble.textContent += `\n\n[Error: ${safeErrorMessage}]`;
        }
    }
  } finally {
    state.isGenerating = false;
    elements.sendBtn.disabled = false;
    elements.statusIndicator.textContent = "就绪";
    scrollToBottom();
  }
}

async function generateAutoTitle(chatId, userText, assistantText) {
  // Strip thinking tags and keep it short
  const cleanAssistantText = assistantText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  
  const prompt = `请为下面的对话生成一个简短、精炼的标题（不超过15个字）。
不要使用引号，不要包含"标题"前缀，直接输出标题内容。
对话内容：
用户：${userText.slice(0, 300)}
AI：${cleanAssistantText.slice(0, 300)}`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: state.currentModel,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: { temperature: 0.3, num_predict: 30 }
      })
    });

    if (response.ok) {
        const data = await response.json();
        let newTitle = data.message?.content || data.response;
        if (newTitle) {
            // Strip thinking tags if present in the title response
            newTitle = newTitle.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            newTitle = newTitle.replace(/^["'《》]|["'《》]$/g, '');
            // Update state
            const chat = state.chats.find(c => c.id === chatId);
            if (chat) {
                chat.title = newTitle;
                saveState();
                renderChatList(elements.searchInput ? elements.searchInput.value : "");
            }
        }
    }
  } catch (e) {
    console.error("Auto-title generation failed:", e);
  }
}

async function streamResponse(payload, messageObj, domElement) {
  let response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    const isAbort = e?.name === "AbortError" || (e?.message || "").includes("Failed to fetch");
    if (isAbort) {
      throw new Error("REQUEST_ABORTED");
    }
    throw e;
  }

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errorText = await response.text();
      try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) errorMsg += `: ${errorData.error}`;
          else errorMsg += `: ${errorText}`;
      } catch {
          errorMsg += `: ${errorText.slice(0, 200)}`; // Limit length
      }
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep the last incomplete line
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const json = JSON.parse(line);
          // Handle different Ollama response formats
          const msg = json.message;
          const content = msg?.content || json.response || "";
          
          if (content) {
            messageObj.content += content;
            updateMessageContent(domElement, messageObj.content, true); // true for isStreaming
            scrollToBottom();
          }
          
          // Handle Tool Calls
          if (msg?.tool_calls) {
              if (!messageObj.tool_calls) messageObj.tool_calls = [];
              // Merge or append? Ollama usually sends complete tool calls in one chunk for now
              // We'll append them. 
              // Note: If streaming partial arguments, this logic needs to be more complex.
              // For now, assuming complete tool calls per chunk or non-overlapping.
              msg.tool_calls.forEach(tc => {
                  messageObj.tool_calls.push(tc);
              });
          }
          
          if (json.done) {
            updateMessageContent(domElement, messageObj.content, false);
            return;
          }
        } catch (e) {
          // Partial JSON, ignore
        }
      }
    }
    
    // Process remaining buffer if any
    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer);
        const msg = json.message;
        const content = msg?.content || json.response || "";
        if (content) {
          messageObj.content += content;
        }
        if (msg?.tool_calls) {
          if (!messageObj.tool_calls) messageObj.tool_calls = [];
          msg.tool_calls.forEach(tc => messageObj.tool_calls.push(tc));
        }
      } catch (e) {
        // Ignore invalid JSON in remaining buffer
      }
    }
  } finally {
    // Ensure reader is released
    reader.releaseLock();
  }
  
  // If we get here and content is empty and no tool calls, handle gracefully
  if (!messageObj.content && (!messageObj.tool_calls || messageObj.tool_calls.length === 0)) {
    console.warn("Stream finished with empty content and no tool calls.");
    messageObj.content = "[模型未返回任何内容]";
    updateMessageContent(domElement, messageObj.content, false);
  } else {
     // Final update to remove cursor
     updateMessageContent(domElement, messageObj.content, false);
  }
}
