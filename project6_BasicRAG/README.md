# RAG Explorer Application

A simple Retrieval-Augmented Generation (RAG) application that demonstrates the full pipeline:

1. **Ingest PDF** → Extract text → Chunk → Generate embeddings → Store in ChromaDB
2. **Query** → Embed question → Retrieve top‑k chunks → Generate answer with LLM (Groq)

## Project Structure

```
.
├── backend/          # FastAPI server
│   ├── main.py       # API endpoints
│   └── requirements.txt
├── frontend/         # Vite + React UI
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
└── data/
    └── data/         # Place your PDF files here
```

## Prerequisites

- **Node.js** (v18+ recommended) and npm
- **Python** (3.9+ recommended)
- **Ollama** installed locally with the `nomic-embed-text-v2-moe:latest` model:
  ```bash
  ollama pull nomic-embed-text-v2-moe:latest
  ```
- **Groq API key** – obtain from [groq.com](https://groq.com/) and set as environment variable:
  ```bash
  set GROQ_API_KEY=your_groq_api_key   # Windows CMD
  $env:GROQ_API_KEY="your_groq_api_key" # PowerShell
  export GROQ_API_KEY=your_groq_api_key # Linux/macOS
  ```

## Setup

### 1. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Place your PDF file(s) in `data/data/`

Example:
```
data/
└── data/
    └── vwo_prd.pdf
```

## Running the Application

### Start the backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.

### Start the frontend

```bash
cd frontend
npm run dev
```
The UI will be available at `http://localhost:5173` (Vite default) or `http://localhost:3000` if you changed the port.

## Usage

1. **Load PDF list** – The UI automatically lists PDF files found in `data/data/`.
2. **Ingest** – Select a file and click **Ingest**. The app will:
   - Extract text
   - Split into chunks (~500 characters with 50‑char overlap)
   - Compute embeddings via Ollama (`nomic-embed-text-v2-moe:latest`)
   - Store vectors and text in a local ChromaDB instance (`./backend/chroma_db`)
3. **Chat** – Ask questions about the ingested document. For each query:
   - The question is embedded with the same Ollama model
   - Top‑4 most similar chunks are retrieved from ChromaDB
   - The chunks are sent to Groq (`openchat-3.5-1210` model) together with the question
   - The answer and the retrieved chunks are displayed

## Notes

- The first embedding request may take a moment as Ollama loads the model.
- Changing the PDF requires re‑ingestion; the ChromaDB collection is reused (you can delete the `backend/chroma_db` folder to start fresh).
- Adjust chunk size, overlap, or top‑k by editing the constants in `backend/main.py`.
- The UI shows the distance score (lower = more relevant) for each retrieved chunk.

## Troubleshooting

- **"Ollama is not running"** – Start Ollama with `ollama serve` in a separate terminal.
- **"Model not found"** – Ensure you pulled the correct model: `ollama pull nomic-embed-text-v2-moe:latest`.
- **Groq authentication error** – Verify your `GROQ_API_KEY` is set correctly.
- **CORS issues** – The FastAPI app allows all origins for simplicity; adjust if needed.

Enjoy exploring your documents with RAG!