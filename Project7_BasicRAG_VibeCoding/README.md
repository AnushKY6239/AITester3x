# RAG Explorer

A small React + Flask app that demonstrates a complete Retrieval-Augmented Generation (RAG) flow against a PDF (the VWO.com Product Requirements Document).

```
PDF  →  Chunking  →  Embeddings (Ollama)  →  ChromaDB  →  Retrieve top-4  →  Answer (Groq)
```

## Architecture

```
JULY4_BasicRAG/
├── data/data/          # place your .pdf files here
├── server/             # Flask backend (Python)
│   ├── app.py          # REST endpoints
│   ├── rag.py          # ingest / chunk / embed / store / retrieve / generate
│   ├── requirements.txt
│   └── chroma_store/   # created at runtime (persisted vectors)
└── client/             # React frontend (Vite)
    └── src/App.jsx
```

### Stack
- **Frontend:** React (Vite) — visualizes the 6-stage pipeline, ingestion stats, retrieved chunks, and the final answer.
- **Backend:** Flask (`flask-cors`) exposing `/api/health`, `/api/status`, `/api/ingest`, `/api/query`.
- **PDF parsing:** `pypdf`.
- **Chunking:** recursive character splitter, 1000 chars / 150 overlap.
- **Embeddings:** `nomic-embed-text-v2-moe:latest` via local **Ollama** (`/api/embed`).
- **Vector store:** local persistent **ChromaDB** (`chromadb.PersistentClient`).
- **Retrieval:** top-4 nearest chunks by cosine distance.
- **LLM:** **Groq** `openai/gpt-oss-120b` (a.k.a. OpenGPT 120B).

## Prerequisites

1. **Ollama** running locally with the embedding model pulled:
   ```bash
   ollama pull nomic-embed-text-v2-moe:latest
   ```
2. **Python 3.11+** with the server deps:
   ```bash
   pip install -r server/requirements.txt
   ```
3. **Node 18+** for the frontend.
4. A **Groq API key** — get one at https://console.groq.com.

## Running

Set the Groq key in your environment (PowerShell):

```powershell
$env:GROQ_API_KEY = "gsk_..."
```

Put your PDF(s) in `data/data/` (e.g. the VWO PRD).

Start the backend:

```bash
cd server
python app.py          # http://127.0.0.1:5000
```

In another terminal, start the frontend:

```bash
cd client
npm install
npm run dev            # http://127.0.0.1:5173
```

Open http://127.0.0.1:5173, click **Ingest PDF**, then ask questions.

## API

| Method | Path           | Description                                            |
|--------|----------------|--------------------------------------------------------|
| GET    | `/api/health`  | Backend status + model config + key presence           |
| GET    | `/api/status`  | Number of chunks currently stored in ChromaDB          |
| POST   | `/api/ingest`  | Read PDFs, chunk, embed, store                         |
| POST   | `/api/query`   | Body `{"question": "..."}` → `{answer, chunks[4]}`     |

## Notes
- Re-ingesting clears the collection first, so it's idempotent.
- The Vite dev server proxies `/api` → `http://127.0.0.1:5000`, so no CORS config is needed in dev.
- `GROQ_MODEL` and `EMBED_MODEL` can be overridden via environment variables (see `.env.example`).
