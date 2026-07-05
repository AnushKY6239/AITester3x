"""RAG pipeline: PDF ingest -> chunk -> embed (Ollama) -> store (ChromaDB) -> retrieve -> answer (Groq)."""

from __future__ import annotations

import os
import time
import uuid
from pathlib import Path
from typing import Any

import chromadb
import requests
from groq import Groq

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "data"
CHROMA_DIR = Path(__file__).resolve().parent / "chroma_store"
COLLECTION_NAME = "rag_explorer"

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "nomic-embed-text-v2-moe:latest")

GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
TOP_K = 4


# ---------------------------------------------------------------------------
# PDF reading + chunking
# ---------------------------------------------------------------------------
def read_pdf(pdf_path: Path) -> str:
    """Extract text from a PDF using pypdf."""
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)
    return "\n\n".join(pages).strip()


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Simple recursive-style character splitter with overlap."""
    if not text:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = end - overlap
    return chunks


# ---------------------------------------------------------------------------
# Embedding via Ollama
# ---------------------------------------------------------------------------
def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings from the local Ollama server."""
    url = f"{OLLAMA_HOST.rstrip('/')}/api/embed"
    resp = requests.post(
        url,
        json={"model": EMBED_MODEL, "input": texts},
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["embeddings"]


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]


# ---------------------------------------------------------------------------
# ChromaDB storage
# ---------------------------------------------------------------------------
def get_client() -> chromadb.api.ClientAPI:
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def get_collection():
    client = get_client()
    return client.get_or_create_collection(name=COLLECTION_NAME)


def store_chunks(chunks: list[str], source_name: str) -> None:
    collection = get_collection()
    # Clear previous docs for a clean re-ingest.
    existing = collection.get()
    if existing and existing.get("ids"):
        collection.delete(ids=existing["ids"])

    embeddings = embed_texts(chunks)
    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = [{"source": source_name, "index": i} for i in range(len(chunks))]
    collection.add(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)


def retrieve_chunks(query: str, top_k: int = TOP_K) -> list[dict[str, Any]]:
    collection = get_collection()
    if collection.count() == 0:
        return []
    q_emb = embed_query(query)
    results = collection.query(query_embeddings=[q_emb], n_results=top_k)
    out = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    dists = results.get("distances", [[]])[0]
    for doc, meta, dist in zip(docs, metas, dists):
        out.append(
            {
                "content": doc,
                "source": meta.get("source", "unknown"),
                "index": meta.get("index", 0),
                "distance": float(dist),
                "score": round(1.0 - float(dist), 4),
            }
        )
    return out


# ---------------------------------------------------------------------------
# LLM answer via Groq
# ---------------------------------------------------------------------------
def build_prompt(query: str, contexts: list[str]) -> str:
    context_block = "\n\n".join(f"[Chunk {i + 1}]\n{c}" for i, c in enumerate(contexts))
    return (
        "You are a helpful assistant answering questions strictly based on the provided context.\n"
        "If the answer is not contained in the context, say you don't know.\n"
        "Cite the chunk numbers you used.\n\n"
        f"CONTEXT:\n{context_block}\n\n"
        f"QUESTION:\n{query}\n\n"
        "ANSWER:"
    )


def generate_answer(query: str, contexts: list[str]) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY environment variable is not set. Set it before starting the server."
        )
    client = Groq(api_key=GROQ_API_KEY)
    prompt = build_prompt(query, contexts)
    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": "You are a precise RAG assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1024,
    )
    return completion.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Ingestion orchestration
# ---------------------------------------------------------------------------
def ingest_all() -> dict[str, Any]:
    pdf_files = sorted(list(DATA_DIR.glob("*.pdf")))
    if not pdf_files:
        raise FileNotFoundError(f"No PDF files found in {DATA_DIR}")

    all_chunks: list[str] = []
    file_stats: list[dict[str, Any]] = []
    for pdf in pdf_files:
        t0 = time.time()
        text = read_pdf(pdf)
        chunks = chunk_text(text)
        all_chunks.extend(chunks)
        file_stats.append(
            {
                "file": pdf.name,
                "chars": len(text),
                "chunks": len(chunks),
                "time_sec": round(time.time() - t0, 2),
            }
        )

    t1 = time.time()
    store_chunks(all_chunks, source_name=", ".join(p.name for p in pdf_files))
    store_time = round(time.time() - t1, 2)

    return {
        "files": file_stats,
        "total_chunks": len(all_chunks),
        "embed_model": EMBED_MODEL,
        "store_time_sec": store_time,
    }
