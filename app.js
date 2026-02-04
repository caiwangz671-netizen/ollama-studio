:root {
  /* Enhanced Dark Theme with Transparency Support */
  --bg-color: #0f1115; /* Fallback */
  --bg-gradient: radial-gradient(circle at 10% 20%, rgb(20, 24, 33) 0%, rgb(15, 17, 21) 90%);
  
  /* Glassmorphism Variables */
  --glass-bg: rgba(23, 26, 33, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-highlight: rgba(255, 255, 255, 0.05);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  --glass-blur: blur(24px); /* Stronger blur */
  --glass-noise: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");

  /* Sidebar */
  --sidebar-bg: rgba(23, 26, 33, 0.6);
  --sidebar-border: rgba(255, 255, 255, 0.08);
  
  --text-primary: #e6e8ee;
  --text-secondary: #a7b0c0;
  
  --accent-color: #2563eb;
  --accent-hover: #1d4ed8;
  
  /* Input & Surfaces */
  --input-bg: rgba(0, 0, 0, 0.25);
  --input-border: rgba(255, 255, 255, 0.1);
  --surface-hover: rgba(255, 255, 255, 0.08);
  
  --message-user-bg: rgba(37, 99, 235, 0.85);
  --message-ai-bg: rgba(31, 36, 48, 0.5);
  
  --danger-color: #ef4444;
  --success-color: #10b981;
  --warning-color: #f59e0b;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: var(--bg-color);
  background-image: 
    radial-gradient(circle at 15% 50%, rgba(37, 99, 235, 0.12), transparent 30%),
    radial-gradient(circle at 85% 30%, rgba(16, 163, 127, 0.12), transparent 30%);
  color: var(--text-primary);
  height: 100vh;
  overflow: hidden;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.app-container {
  display: flex;
  height: 100%;
}

/* Sidebar Glass */
.sidebar {
  width: 260px;
  background: var(--sidebar-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 20px;
  flex-shrink: 0;
  z-index: 20;
  box-shadow: 1px 0 20px rgba(0, 0, 0, 0.2);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.sidebar-section label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.flex-grow {
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.history-list {
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px; /* Space for scrollbar */
}

/* Search Box */
.search-box {
  margin-bottom: 12px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  padding-left: 32px;
  background: var(--input-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  opacity: 0.5;
  pointer-events: none;
}

/* History Grouping */
.history-group {
  margin-bottom: 12px;
}

.history-group:last-child {
  margin-bottom: 0;
}

.history-group-title {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 4px 10px;
  margin-bottom: 4px;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* History Item Improvements */
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  gap: 4px;
  border: 1px solid transparent;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  transform: translateX(2px);
}

.history-item.active {
  background: rgba(37, 99, 235, 0.15);
  color: var(--text-primary);
  border-color: rgba(37, 99, 235, 0.3);
}

.history-item-title {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 4px;
}

.history-item-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.history-item:hover .history-item-actions,
.history-item.active .history-item-actions {
  opacity: 1;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  transition: all 0.2s ease;
}

.icon-btn svg {
  width: 14px;
  height: 14px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  transform: scale(1.05);
}

.icon-btn:active {
  transform: scale(0.95);
}

.icon-btn.delete-btn:hover {
  color: var(--danger-color);
  background: rgba(239, 68, 68, 0.1);
}

/* Rename Input */
.rename-input {
  width: 100%;
  background: var(--input-bg);
  border: 1px solid var(--accent-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 14px;
  padding: 4px 8px;
  outline: none;
}

.select-wrapper {
  display: flex;
  gap: 8px;
}

select {
  flex-grow: 1;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

select:hover {
  border-color: var(--surface-hover);
}

select:focus {
  border-color: var(--accent-color);
}

.sidebar-footer {
  border-top: 1px solid var(--sidebar-border);
  padding-top: 16px;
}

/* Main Content */
.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0; /* Prevent flex item overflow */
}

/* Top Bar Glass */
.top-bar {
  height: 60px;
  border-bottom: 1px solid var(--sidebar-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(15, 17, 21, 0.3);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  box-shadow: 0 1px 20px rgba(0, 0, 0, 0.1);
}

/* Category Tags */
.category-tag {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background-color: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
  padding: 2px 8px;
  border-radius: 10px;
  margin-right: 8px;
  border: 1px solid rgba(37, 99, 235, 0.2);
  display: inline-block;
  vertical-align: middle;
}

/* Memory Items */
.memory-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--sidebar-border);
  border-radius: 10px;
  margin-bottom: 10px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.memory-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.current-model-info {
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.3px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}

.chat-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 80px 24px 24px; /* Top padding for top-bar */
  display: flex;
  flex-direction: column;
  gap: 24px;
  scroll-behavior: smooth;
}

.welcome-screen {
  text-align: center;
  margin-top: 120px;
  color: var(--text-secondary);
  animation: fadeIn 0.8s ease-out;
}

.welcome-screen h1 {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}

/* Slide Up Animation for Messages */
.message {
  display: flex;
  margin-bottom: 24px;
  gap: 16px;
  animation: slideUpFade 0.5s cubic-bezier(0.2, 0.9, 0.3, 1);
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(30px); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--sidebar-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-secondary);
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

.message.user .avatar {
  background: var(--accent-color);
  color: white;
}

.message.assistant .avatar {
  background: #10a37f;
  color: white;
}

.message-content {
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.6;
  position: relative;
  word-wrap: break-word;
  max-width: calc(100% - 120px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

/* Message Bubble Glass */
.message.assistant .message-content {
  background: rgba(31, 36, 48, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--text-primary);
  border-top-left-radius: 4px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.message.user .message-content {
  background: rgba(37, 99, 235, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: white;
  border-top-right-radius: 4px;
  box-shadow: 0 8px 24px -6px rgba(37, 99, 235, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Markdown Styles */
.message-content h1, 
.message-content h2, 
.message-content h3, 
.message-content h4 {
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.message-content h1:first-child,
.message-content h2:first-child {
  margin-top: 0;
}

.message-content ul, 
.message-content ol {
  margin: 12px 0;
  padding-left: 24px;
}

.message-content li {
  margin-bottom: 6px;
}

.message-content blockquote {
  border-left: 3px solid var(--accent-color);
  background: rgba(37, 99, 235, 0.05);
  margin: 16px 0;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  color: var(--text-secondary);
  font-style: italic;
}

.message-content a {
  color: var(--accent-color);
  text-decoration: none;
  border-bottom: 1px dashed var(--accent-color);
  transition: all 0.2s;
}

.message-content a:hover {
  border-bottom-style: solid;
  opacity: 0.8;
}

.message-content table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 16px 0;
  font-size: 14px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--sidebar-border);
}

.message-content th, 
.message-content td {
  border-bottom: 1px solid var(--sidebar-border);
  padding: 10px 14px;
  text-align: left;
}

.message-content th {
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  border-right: 1px solid var(--sidebar-border);
}

.message-content td {
  border-right: 1px solid var(--sidebar-border);
}

.message-content tr:last-child td {
  border-bottom: none;
}

.message-content tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

/* Code Block Glass */
.code-block-wrapper {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(13, 17, 23, 0.6);
  border: 1px solid var(--sidebar-border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--sidebar-border);
  font-size: 12px;
  color: var(--text-secondary);
}

.code-lang {
  font-family: monospace;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.8;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.1);
}

.copy-btn.copied {
  color: #10a37f;
  background: rgba(16, 163, 127, 0.1);
  border-color: rgba(16, 163, 127, 0.2);
}

.message-content pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  background: transparent; /* Wrapper has bg */
}

.message-content code {
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  line-height: 1.5;
}

.message-attachments {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-preview-image {
  max-width: 320px;
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.attachment-audio {
  width: 100%;
}

.attachment-doc {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px 12px;
}

.attachment-doc-name {
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.attachment-doc-preview {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: pre-wrap;
  max-height: 160px;
  overflow: auto;
}

.message-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.message-action-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.message-action-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent-color);
}

/* Inline code */
.message-content :not(pre) > code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 6px;
  color: #e6e8ee;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Thinking Box Smoothness */
.thinking-box {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05));
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.thinking-box::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(99, 102, 241, 0.6) 50%, 
    transparent 100%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.thinking-box.thinking-active::before {
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.thinking-box[open] {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08));
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.1);
}

.thinking-box summary {
  cursor: pointer;
  font-weight: 500;
  opacity: 0.85;
  user-select: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  list-style: none;
  padding: 4px 0;
}

.thinking-box summary::-webkit-details-marker {
  display: none;
}

.thinking-box summary::before {
  content: "▶";
  font-size: 10px;
  margin-right: 8px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  color: rgba(99, 102, 241, 0.7);
}

.thinking-box[open] summary::before {
  transform: rotate(90deg);
}

.thinking-box summary:hover {
  opacity: 1;
  transform: translateX(2px);
}

.thinking-box[open] summary {
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.15);
  padding-bottom: 10px;
}

.thinking-icon {
  transition: all 0.3s ease;
  filter: grayscale(0);
}

.thinking-label {
  font-size: 13px;
  letter-spacing: 0.3px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    filter: grayscale(0);
  }
  50% {
    transform: scale(1.1);
    filter: grayscale(0) brightness(1.2);
  }
}

.thinking-content {
  animation: slideDown 0.3s ease;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.thinking-content p {
  margin: 8px 0;
}

.thinking-content:first-child {
  margin-top: 0;
}

.thinking-content:last-child {
  margin-bottom: 0;
}

/* Input Area Glass */
.input-area {
  position: relative;
  padding: 24px;
  background: rgba(15, 17, 21, 0.6);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid var(--sidebar-border);
  z-index: 10;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--input-border);
  border-radius: 16px;
  display: flex;
  align-items: flex-end;
  padding: 10px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.input-wrapper.dragover {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2), inset 0 2px 4px rgba(0,0,0,0.1);
}

.attachment-bar {
  max-width: 800px;
  margin: 0 auto 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attachment-bar.hidden {
  display: none;
}

.attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
}

.attachment-chip button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
}

.attachment-chip button:hover {
  color: var(--text-primary);
}

.input-tool-btn {
  margin-right: 6px;
}

.input-tool-btn.recording {
  color: var(--accent-color);
  background: rgba(37, 99, 235, 0.15);
}

.input-wrapper:focus-within {
  border-color: var(--accent-color);
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2), inset 0 2px 4px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

textarea {
  flex-grow: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.5;
  padding: 8px 12px;
  outline: none;
  resize: none;
  max-height: 200px;
  font-family: inherit;
}

.input-footer {
  max-width: 800px;
  margin: 10px auto 0;
  text-align: center;
  position: relative;
}

.tip {
  font-size: 12px;
  color: #525866;
  opacity: 0.8;
}

/* Buttons */
.btn-primary {
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: #3b4252;
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.btn-icon, .btn-icon-small, .btn-ghost {
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.btn-icon:active, .btn-icon-small:active, .btn-ghost:active {
  transform: scale(0.92);
}

.btn-icon-small {
  background: transparent;
  border: 1px solid var(--input-border);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0 10px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  font-size: 12px;
}

.btn-icon-small:hover {
  background: var(--sidebar-border);
  color: var(--text-primary);
  border-color: var(--sidebar-border);
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  transform: translateX(4px);
}

/* Typing Cursor */
.typing-cursor::after {
  content: "▋";
  display: inline-block;
  vertical-align: middle;
  animation: blink 1s step-start infinite;
  color: var(--accent-color);
  margin-left: 4px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* RAG Status Animation */
.rag-status-container {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 16px;
  z-index: 100;
  pointer-events: none;
}

.rag-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(23, 26, 33, 0.9);
  border: 1px solid var(--accent-color);
  border-radius: 24px;
  font-size: 13px;
  color: var(--text-primary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transform: translateY(20px) scale(0.9);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.rag-status.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.rag-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--accent-color);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
}

.modal.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

/* Modal Content Glass */
.modal-content {
  background: rgba(23, 26, 33, 0.9);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  width: 440px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  transform: scale(1) translateY(0);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.modal.hidden .modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--sidebar-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

/* Tab Content Animation */
.tab-content {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  display: none;
}

.tab-content.active {
  display: block;
  animation: fadeInTab 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes fadeInTab {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Tool Status Fade */
.tool-status {
  animation: slideInLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border-left: 3px solid var(--accent-color);
  margin: 12px 0;
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Tabs */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 20px;
  gap: 20px;
}

.tab-btn {
  padding: 10px 4px;
  background: transparent;
  border: none;
  position: relative;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent-color);
}

.tab-btn::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent-color);
  transform: scaleX(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.tab-btn.active::after {
  transform: scaleX(1);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--accent-color);
  background: rgba(0, 0, 0, 0.3);
}

.toggle-switch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.help-text {
  font-size: 12px;
  color: #525866;
  margin-top: 6px;
  display: block;
  line-height: 1.4;
}

.preset-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.preset-btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--input-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.preset-btn.active {
  background: rgba(92, 99, 255, 0.2);
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.vram-estimator {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 260px;
  padding: 12px 12px 10px;
  border-radius: 12px;
  background: rgba(18, 20, 28, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  font-size: 12px;
  z-index: 20;
  backdrop-filter: blur(12px);
}

.vram-title {
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.vram-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  opacity: 0.8;
}

.vram-toggle::before {
  content: "▾";
  display: block;
  transition: transform 0.2s ease;
}

.vram-estimator[data-collapsed="true"] .vram-toggle::before {
  transform: rotate(-90deg);
}

.vram-estimator[data-collapsed="true"] .vram-row,
.vram-estimator[data-collapsed="true"] .vram-total,
.vram-estimator[data-collapsed="true"] .vram-note {
  display: none;
}

.vram-row,
.vram-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.vram-row span:last-child,
.vram-total span:last-child {
  text-align: right;
  color: var(--text-primary);
}

.vram-total {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  font-weight: 600;
}

.vram-note {
  margin-top: 6px;
  opacity: 0.7;
  line-height: 1.3;
}

/* Range Input Styling */
input[type=range] {
  -webkit-appearance: none;
  width: 100%;
  background: transparent;
  margin: 10px 0;
}

input[type=range]:focus {
  outline: none;
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

input[type=range]::-webkit-slider-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -5px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}

input[type=range]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-style: italic;
  opacity: 0.6;
}
