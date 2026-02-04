import json
import os
import sqlite3
import numpy as np
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, parse_qs
from urllib.request import Request, urlopen
try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
DB_PATH = os.path.join(BASE_DIR, "memory.db")

# --- Database & RAG Setup ---

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            embedding BLOB NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
    ''')
    
    # Check if category column exists (migration)
    try:
        c.execute("SELECT category FROM memories LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating database: adding category column")
        c.execute("ALTER TABLE memories ADD COLUMN category TEXT DEFAULT 'General'")
        
    conn.commit()
    conn.close()

init_db()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_embedding(text, model):
    url = f"{OLLAMA_BASE_URL}/api/embeddings"
    payload = {"model": model, "prompt": text}
    headers = {"Content-Type": "application/json"}
    
    req = Request(url, data=json.dumps(payload).encode("utf-8"), method="POST", headers=headers)
    try:
        with urlopen(req, timeout=300) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                return data.get("embedding")
    except Exception as e:
        print(f"Error getting embedding: {e}")
    return None

# Global cache for embed model
CACHED_EMBED_MODEL = None

def get_model_details(model_name):
    try:
        status, data, _ = fetch_ollama("/api/show", method="POST", body=json.dumps({"name": model_name}).encode("utf-8"))
        if status == 200:
            return json.loads(data.decode("utf-8"))
    except Exception as e:
        print(f"Error getting model details for {model_name}: {e}")
    return None

def find_best_embed_model():
    try:
        status, data, _ = fetch_ollama("/api/tags")
        if status == 200:
            payload = json.loads(data.decode("utf-8"))
            models = [m.get("name") for m in payload.get("models", [])]
            
            # 1. Check for models with specific embedding families or capabilities
            for m in models:
                details = get_model_details(m)
                if details:
                    # Check model_info for families
                    model_info = details.get("model_info", {})
                    families = model_info.get("families", [])
                    if "bert" in families or "nomic-bert" in families:
                        return m
                    
                    # Check capabilities (if available in newer Ollama versions)
                    # Note: 'capabilities' field might be at top level or inside details depending on version
                    # My curl check showed it at top level
                    capabilities = details.get("capabilities", []) 
                    if "embedding" in capabilities:
                        return m
            
            # 2. Fallback to name matching
            priorities = ["nomic-embed-text", "mxbai-embed-large", "all-minilm", "snowflake-arctic-embed"]
            for p in priorities:
                for m in models:
                    if p in m:
                        return m
            
            for m in models:
                if "embed" in m or "embedding" in m:
                    return m
            
            # 3. Last resort: use the first available model (not ideal but works)
            if models:
                return models[0]
    except Exception as e:
        print(f"Error finding embed model: {e}")
    return None

def get_embed_model():
    global CACHED_EMBED_MODEL
    if CACHED_EMBED_MODEL:
        return CACHED_EMBED_MODEL
    
    model = find_best_embed_model()
    if model:
        CACHED_EMBED_MODEL = model
    return model

# --- Model Capabilities Logic ---

def find_best_tool_model():
    """
    Finds the best available model that supports tools (function calling).
    Prioritizes known good models.
    """
    try:
        status, data, _ = fetch_ollama("/api/tags")
        if status != 200:
            return None
            
        payload = json.loads(data.decode("utf-8"))
        models = [m.get("name") for m in payload.get("models", [])]
        
        # Priority list of known tool-supporting models
        # Llama 3.1, Mistral, Qwen 2.5, Gemma 2 (some versions), Firefunction
        priorities = [
            "llama3.1", "llama3.2", "qwen2.5", "mistral-nemo", "mistral", 
            "gemma2", "firefunction", "hermes"
        ]
        
        # 1. Check for exact or partial matches in priority list
        for p in priorities:
            for m in models:
                if p in m.lower():
                    # Double check details to be safe? 
                    # For performance, we assume these known families support tools if they are recent versions.
                    # But ideally we should check model details.
                    details = get_model_details(m)
                    if details:
                         # Check template for tool definitions
                         template = details.get("template", "")
                         if "{{ .Tools }}" in template or "{{.Tools}}" in template or "<tool>" in template:
                             return m
                         # Fallback: if it's llama3.1, it definitely supports tools
                         if "llama3.1" in m:
                             return m
        
        # 2. General scan of all models
        for m in models:
            details = get_model_details(m)
            if details:
                template = details.get("template", "")
                if "{{ .Tools }}" in template or "{{.Tools}}" in template:
                    return m
                    
    except Exception as e:
        print(f"Error finding tool model: {e}")
    return None

# --- RAG Logic ---

def cosine_similarity(v1, v2):
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    
    # Avoid division by zero
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return np.dot(v1, v2) / (norm1 * norm2)

def search_memory(query_text, limit=5, threshold=0.35):
    model = get_embed_model()
    if not model:
        return []
    
    query_vec = get_embedding(query_text, model)
    if not query_vec:
        return []
    
    query_vec = np.array(query_vec)
    
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT id, content, embedding, created_at FROM memories")
        rows = c.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            try:
                vec_bytes = row["embedding"]
                vec = np.frombuffer(vec_bytes, dtype=np.float32)
                score = cosine_similarity(query_vec, vec)
                if score >= threshold:
                    results.append({
                        "id": row["id"],
                        "content": row["content"],
                        "score": float(score),
                        "created_at": row["created_at"]
                    })
            except Exception as e:
                print(f"Error processing memory row {row.get('id', 'unknown')}: {e}")
                continue
        
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]
    except Exception as e:
        print(f"Error searching memories: {e}")
        return []

def add_memory(content, category="General"):
    # Validate content
    if not content or not content.strip():
        print("Skipping empty memory content")
        return False
    
    content = content.strip()
    category = category.strip() if category else "General"
    
    if len(content) < 10:
        print("Skipping too short memory content")
        return False
    
    model = get_embed_model()
    if not model:
        print("No embedding model available")
        return False
    
    # Check for duplicates using vector similarity
    # Use a high threshold (e.g., 0.9) to detect near-duplicates
    existing = search_memory(content, limit=1, threshold=0.9)
    if existing:
        print(f"Skipping duplicate memory (score: {existing[0]['score']:.2f})")
        return False
    
    vec = get_embedding(content, model)
    if not vec:
        print("Failed to generate embedding")
        return False
    
    vec_bytes = np.array(vec, dtype=np.float32).tobytes()
    
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("INSERT INTO memories (content, category, embedding) VALUES (?, ?, ?)", (content, category, vec_bytes))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error adding memory to database: {e}")
        return False

def clear_all_memories():
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("DELETE FROM memories")
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error clearing memories: {e}")
        return False

def delete_memory(memory_id):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
        conn.commit()
        deleted = c.rowcount > 0
        conn.close()
        return deleted
    except Exception as e:
        print(f"Error deleting memory: {e}")
        return False

def update_memory(memory_id, content):
    # Validate content
    if not content or not content.strip():
        print("Cannot update with empty content")
        return False
    
    content = content.strip()
    if len(content) < 10:
        print("Content too short for update")
        return False
    
    model = get_embed_model()
    if not model:
        print("No embedding model available")
        return False
    
    # Generate new embedding
    vec = get_embedding(content, model)
    if not vec:
        print("Failed to generate embedding for update")
        return False
    
    vec_bytes = np.array(vec, dtype=np.float32).tobytes()
    
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("UPDATE memories SET content = ?, embedding = ? WHERE id = ?", 
                  (content, vec_bytes, memory_id))
        conn.commit()
        updated = c.rowcount > 0
        conn.close()
        return updated
    except Exception as e:
        print(f"Error updating memory: {e}")
        return False

def get_all_memories(limit=100):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT id, content, category, created_at FROM memories ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = c.fetchall()
        conn.close()
        return [{"id": r["id"], "content": r["content"], "category": r["category"] if "category" in r.keys() else "General", "created_at": r["created_at"]} for r in rows]
    except Exception as e:
        print(f"Error getting memories: {e}")
        return []

# --- Existing Server Code ---


def fetch_ollama(path, method="GET", body=None):
    url = f"{OLLAMA_BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    request = Request(url, data=body, method=method, headers=headers)
    try:
        # Increase timeout to 300s (5 minutes) for slower models like DeepSeek
        with urlopen(request, timeout=300) as response:
            return response.status, response.read(), response.headers.get("Content-Type", "application/json")
    except HTTPError as error:
        return error.code, error.read(), error.headers.get("Content-Type", "application/json")
    except URLError as error:
        payload = json.dumps({"error": str(error)}).encode("utf-8")
        return HTTPStatus.BAD_GATEWAY, payload, "application/json"


def fetch_ollama_stream(path, method="POST", body=None):
    url = f"{OLLAMA_BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    request = Request(url, data=body, method=method, headers=headers)
    try:
        # Increase timeout to 300s (5 minutes) for slower models like DeepSeek
        response = urlopen(request, timeout=300)
        return response.status, response, response.headers.get("Content-Type", "application/json")
    except HTTPError as error:
        return error.code, error, error.headers.get("Content-Type", "application/json")
    except URLError as error:
        return None, None, None


# --- Web Search Logic ---

def perform_web_search(query, max_results=5):
    if not DDGS:
        return {"error": "duckduckgo-search library not installed. Install with: pip install duckduckgo-search"}
    
    if not query or not query.strip():
        return {"error": "Search query is required"}
    
    try:
        results = []
        # Try multiple backends if one fails or returns empty
        backends = ['api', 'html', 'lite']
        last_error = None
        
        for backend in backends:
            try:
                with DDGS() as ddgs:
                    search_results = ddgs.text(query, max_results=max_results, backend=backend)
                    # Convert generator to list to check if empty
                    search_results_list = list(search_results)
                    
                    if search_results_list:
                        for r in search_results_list:
                            results.append({
                                "title": r.get("title", ""),
                                "href": r.get("href", ""),
                                "body": r.get("body", "")
                            })
                        break # Found results, stop trying backends
            except Exception as e:
                last_error = str(e)
                continue # Try next backend
                
        if not results:
            error_msg = "No search results found. The search service might be blocked or unavailable."
            if last_error:
                error_msg += f" Last error: {last_error}"
            return {"error": error_msg}
            
        return {"results": results}
    except Exception as e:
        return {"error": f"Search failed: {str(e)}"}

class OllamaHandler(BaseHTTPRequestHandler):
    def send_bytes(self, status, content_type, data):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_bytes(status, "application/json", data)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/api/models"):
            status, data, _ = fetch_ollama("/api/tags")
            if status >= 400:
                self.send_bytes(status, "application/json", data)
                return
            try:
                payload = json.loads(data.decode("utf-8"))
                models = [item.get("name") for item in payload.get("models", []) if item.get("name")]
                self.send_json(HTTPStatus.OK, {"models": models})
            except json.JSONDecodeError:
                self.send_json(HTTPStatus.BAD_GATEWAY, {"models": []})
            return

        if self.path == "/api/models/tool-capable":
            try:
                model = find_best_tool_model()
                if model:
                    self.send_json(HTTPStatus.OK, {"model": model})
                else:
                    self.send_json(HTTPStatus.NOT_FOUND, {"error": "No tool-capable model found"})
            except Exception as e:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return

        if self.path == "/api/rag/status":
            try:
                model = get_embed_model()
                self.send_json(HTTPStatus.OK, {"model": model})
            except Exception as e:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return

        if self.path == "/api/rag/memories":
            try:
                memories = get_all_memories()
                self.send_json(HTTPStatus.OK, {"memories": memories})
            except Exception as e:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return

        file_path = urlparse(self.path).path
        if file_path in ["", "/"]:
            file_path = "/index.html"
        if file_path not in ["/index.html", "/styles.css", "/app.js"]:
            file_path = "/index.html"
        full_path = os.path.join(BASE_DIR, file_path.lstrip("/"))
        if not os.path.exists(full_path):
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not Found"})
            return
        with open(full_path, "rb") as file:
            data = file.read()
        content_type = "text/plain"
        if file_path.endswith(".html"):
            content_type = "text/html; charset=utf-8"
        elif file_path.endswith(".css"):
            content_type = "text/css; charset=utf-8"
        elif file_path.endswith(".js"):
            content_type = "application/javascript; charset=utf-8"
        self.send_bytes(HTTPStatus.OK, content_type, data)

    def do_POST(self):
        if self.path == "/api/rag/query":
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else b""
            try:
                data = json.loads(body)
                query = data.get("query", "")
                limit = data.get("limit", 5)
                threshold = data.get("threshold", 0.35)
                
                results = search_memory(query, limit=limit, threshold=threshold)
                self.send_json(HTTPStatus.OK, {"results": results})
            except Exception as e:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return

        if self.path == "/api/rag/add":
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else b""
            try:
                data = json.loads(body)
                content = data.get("content", "")
                category = data.get("category", "General")
                success = add_memory(content, category)
                self.send_json(HTTPStatus.OK, {"success": success})
            except Exception as e:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return
            
        if self.path == "/api/rag/clear":
            try:
                success = clear_all_memories()
                self.send_json(HTTPStatus.OK, {"success": success})
            except Exception as e:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return
            
        if self.path == "/api/rag/delete":
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else b""
            try:
                data = json.loads(body)
                memory_id = data.get("id")
                success = delete_memory(memory_id)
                self.send_json(HTTPStatus.OK, {"success": success})
            except Exception as e:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return
            
        if self.path == "/api/rag/update":
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else b""
            try:
                data = json.loads(body)
                memory_id = data.get("id")
                content = data.get("content", "")
                success = update_memory(memory_id, content)
                self.send_json(HTTPStatus.OK, {"success": success})
            except Exception as e:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return

        if self.path == "/api/tools/web_search":
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else b""
            try:
                data = json.loads(body)
                query = data.get("query", "")
                results = perform_web_search(query)
                self.send_json(HTTPStatus.OK, results)
            except Exception as e:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return
            
        if self.path.startswith("/api/chat"):
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else b""
            
            # 检查是否请求流式
            try:
                body_json = json.loads(body) if body else {}
                is_stream = body_json.get("stream", False)
            except json.JSONDecodeError:
                is_stream = False
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
                return

            if is_stream:
                status, response, content_type = fetch_ollama_stream("/api/chat", method="POST", body=body)
                if response is None:
                    self.send_json(HTTPStatus.BAD_GATEWAY, {"error": "Connection Failed"})
                    return
                
                # If status is error, don't use chunked encoding, just send the body
                if status >= 400:
                    try:
                        error_body = response.read()
                        self.send_bytes(status, content_type, error_body)
                    finally:
                        response.close()
                    return

                self.send_response(status)
                self.send_header("Content-Type", content_type)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Transfer-Encoding", "chunked")
                self.end_headers()

                try:
                    while True:
                        chunk = response.read(4096)
                        if not chunk:
                            break
                        # chunked encoding format: hex(length)\r\nchunk\r\n
                        self.wfile.write(f"{len(chunk):X}\r\n".encode("utf-8"))
                        self.wfile.write(chunk)
                        self.wfile.write(b"\r\n")
                        self.wfile.flush()
                    self.wfile.write(b"0\r\n\r\n")
                    self.wfile.flush()
                except Exception:
                    pass
                finally:
                    response.close()
                return
            else:
                status, data, content_type = fetch_ollama("/api/chat", method="POST", body=body)
                self.send_bytes(status, content_type, data)
                return
        self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not Found"})


def run():
    port = int(os.environ.get("PORT", "8000"))
    server = HTTPServer(("0.0.0.0", port), OllamaHandler)
    server.serve_forever()


if __name__ == "__main__":
    run()
