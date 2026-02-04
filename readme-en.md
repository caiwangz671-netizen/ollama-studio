# Ollama Studio

Ollama Studio is a locally running web client for connecting to Ollama and chatting with models.
It provides streaming generation, a RAG knowledge base, tool calling, multimodal input, and full conversation management.
The project positions itself as a visual all-in-one local inference workspace, emphasizing control, extensibility, and low dependency.
All data is processed locally by default, suitable for personal development and small teams.

---

## Features

- Local model chat with streaming responses
- Markdown rendering with code highlighting
- Collapsible thinking trace with elapsed time
- RAG knowledge base retrieval and management
- Built-in web search tool
- VRAM estimation with collapsible display
- Multimodal input: text, speech, images, audio, documents
- Attachment preview and document text injection into context
- Conversation list, auto titles, and search
- Status indicators and tool call status
- One-click code block copy
- Drag-and-drop attachments

---

## Quick Start

### 1. Start the Ollama service

Default address:

```
http://127.0.0.1:11434
```

Make sure Ollama is running and at least one model is pulled.

### 2. Start the local server

Run inside the project directory:

```bash
python3 server.py
```

### 3. Open in browser

```
http://localhost:8000
```

### 4. Customize the Ollama base URL

Set the environment variable to customize the base URL:

```bash
export OLLAMA_BASE_URL=http://127.0.0.1:11434
```

---

## Usage Guide

### Model selection

- A model selector dropdown appears at the top of the sidebar
- Click "Refresh model list" to rescan
- The first available model is auto-selected by default

### Chat and streaming

- Click Send or press Enter to submit input
- Responses stream in gradually
- Status bar shows "Generating" during output

### Markdown and code

- Supports headings, lists, blockquotes, tables, links
- Code blocks support language identifiers and auto-detection
- Highlighting and copy are supported

### Thinking trace

- Recognizes <think> / <thinking> tags
- Thinking content is displayed in a collapsible block
- Automatically shows thinking duration

### Attachments and multimodal

- Click the attachment button to add files
- Drag files onto the input area to upload
- Images show thumbnails
- Audio includes playback controls
- Documents can be previewed or downloaded

### Voice input

- Click the microphone to start speech recognition
- Transcribed text is appended to the input
- Unsupported browsers show a notice

### RAG retrieval

- RAG is enabled by default
- Each chat automatically queries the knowledge base
- Retrieved snippets are injected into the system prompt
- Matches are indicated in the UI

### Tool calling

- Tools are provided based on user input
- Built-in web search tool is available
- Tool results appear in the conversation

### VRAM estimation

- Infers parameter size from model name
- Estimates based on quantization and context length
- Collapsible to reduce clutter

### Conversation management

- Create new conversations
- Delete conversations
- Auto title generation
- Manual renaming
- Search conversation history

### Knowledge base management

- Add new knowledge items
- Edit and delete items
- Bulk delete
- Clear all knowledge
- Export as JSON

---

## Configuration

### General settings

- Ollama base URL

### Generation parameters

- System prompt
- Context length (num_ctx)
- Max output tokens
- Temperature
- Top P
- Repeat penalty
- Seed

### Knowledge base and tools

- Enable RAG
- Retrieval threshold
- Return limit
- Enable web search tool

---

## Interaction Details

- Enter to send, Shift + Enter for newline
- Output updates continuously while generating
- Code blocks include copy buttons
- Thinking blocks can be collapsed or expanded
- Uploaded attachments show removable chips

---

## Core Flow Overview

### Chat flow

1. Read user text and attachments
2. Build message objects and store in the conversation
3. Optionally trigger RAG retrieval
4. Combine system prompt with message history
5. Send a streaming request
6. Stream-render the response

### Tool calling flow

1. Decide whether to provide tool descriptions
2. Model returns tool_calls
3. Frontend executes the tool
4. Tool results are written into the message stream
5. Continue generation until completion

### RAG flow

1. Read user input and attachment text
2. Call /api/rag/query
3. Build retrieved context snippets
4. Inject into the system prompt

---

## API Endpoints

### GET /api/models

- Get the list of Ollama models

### GET /api/models/tool-capable

- Return a recommended model that supports tool calling

### GET /api/rag/status

- Return available embedding models

### GET /api/rag/memories

- Fetch all knowledge base records

### POST /api/chat

- Chat with Ollama
- Streaming response supported

### POST /api/rag/query

- Query the knowledge base

### POST /api/rag/add

- Add a knowledge record

### POST /api/rag/update

- Update a knowledge record

### POST /api/rag/delete

- Delete a single knowledge record

### POST /api/rag/clear

- Clear the knowledge base

### POST /api/tools/web_search

- Web search tool endpoint

---

## Data and Storage

- Knowledge base data is stored in memory.db
- Chat history is stored in browser LocalStorage
- Attachment data is handled in memory
- Attachments are cleared on page refresh

---

## FAQ

### Model list is empty

- Confirm Ollama is running
- Ensure models are pulled
- Click "Refresh model list"

### RAG status not ready

- Ensure an embedding model is available locally
- Wait for initial detection
- It will be unavailable without an embedding model

### Voice input unavailable

- Requires browser support for the SpeechRecognition API
- Use Chrome or Edge

### Web search unavailable

- Depends on duckduckgo_search
- It will fail if not installed

### File upload fails

- Single file size limit is 10MB
- Check browser console for errors

---

## Security and Privacy

- All data is processed locally by default
- Conversations are not uploaded to third-party services
- Web search only triggers external requests when enabled

---

## Directory Structure

- app.js: frontend logic and rendering
- index.html: page structure
- styles.css: styles
- server.py: local server and endpoints
- memory.db: RAG knowledge base data
- README.md: project documentation
- LICENSE: license

---

## License

MIT License
