import os
import sys
import shutil
from pathlib import Path
from typing import List

import chromadb
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
from groq import Groq
from pypdf import PdfReader
from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.

# Constants
DATA_DIR = Path(__file__).parent.parent / "data" / "data"
CHROMA_PATH = Path(__file__).parent / "chroma_db"
EMBED_MODEL = "nomic-embed-text-v2-moe:latest"
GROQ_MODEL = "openai/gpt-oss-120b"  # using available Groq model; adjust if needed
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # set env var

# Initialize FastAPI
app = FastAPI(title="RAG Explorer API")

# CORS middleware (allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
collection = chroma_client.get_or_create_collection(name="rag_chunks")

# Initialize Groq client
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY environment variable not set")
groq_client = Groq(api_key=GROQ_API_KEY)


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from PDF file."""
    reader = PdfReader(str(pdf_path))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Simple chunking by characters with overlap."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks


def get_embedding(text: str) -> dict:
    """Get embedding from Ollama model."""
    return ollama.embeddings(model=EMBED_MODEL, prompt=text)


@app.get("/files")
async def list_pdf_files():
    """List PDF files in data/data directory."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    files_set = set()
    for ext in ("*.pdf", "*.PDF"):
        files_set.update(p.name for p in DATA_DIR.glob(ext))
    return {"files": sorted(files_set)}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload PDF to data/data folder."""
    # Ensure directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    file_path = DATA_DIR / file.filename
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "message": "File uploaded successfully"}


@app.post("/ingest")
async def ingest_pdf(filename: str):
    """Read PDF, chunk, embed, and store in ChromaDB."""
    pdf_path = DATA_DIR / filename
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"File {filename} not found in {DATA_DIR}")

    # Extract text
    text = extract_text_from_pdf(pdf_path)

    # Chunk
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No text extracted from PDF")

    # Generate embeddings and store
    ids = []
    embeddings = []
    metadatas = []
    documents = []
    for idx, chunk in enumerate(chunks):
        chunk_id = f"{filename}_chunk_{idx}"
        embedding_res = get_embedding(chunk)
        embedding = embedding_res["embedding"]
        ids.append(chunk_id)
        embeddings.append(embedding)
        metadatas.append({"source": filename, "chunk_index": idx})
        documents.append(chunk)

    # Upsert into collection
    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents,
    )
    return {
        "filename": filename,
        "chunks_indexed": len(chunks),
        "message": "Ingestion completed",
    }


class QueryRequest(BaseModel):
    question: str
    top_k: int = 4


@app.post("/query")
async def query_rag(request: QueryRequest):
    """Retrieve top-k chunks and generate answer using Groq."""
    # Embed query
    query_embedding_res = get_embedding(request.question)
    query_embedding = query_embedding_res["embedding"]

    # Retrieve from Chroma
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=request.top_k,
        include=["documents", "metadatas", "distances"],
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    if not documents:
        return {"answer": "No relevant chunks found.", "chunks": []}

    # Prepare context for LLM
    context = "\n\n---\n\n".join(documents)

    # Call Groq LLM
    chat_completion = groq_client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant. Answer the question based solely on the provided context.",
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {request.question}",
            },
        ],
        model=GROQ_MODEL,
        temperature=0.2,
        max_tokens=500,
    )
    answer = chat_completion.choices[0].message.content

    # Prepare chunk info for display
    chunk_info = [
        {
            "content": doc,
            "metadata": meta,
            "distance": dist,
        }
        for doc, meta, dist in zip(documents, metadatas, distances)
    ]

    return {"answer": answer, "chunks": chunk_info}


# Optional: health check
@app.get("/health")
async def health():
    return {"status": "ok"}