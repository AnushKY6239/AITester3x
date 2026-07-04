# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## How to start the application
# 1. Keep Ollama running (separate terminal)
ollama serve

# 2. Pull embedding model (once)
ollama pull nomic-embed-text-v2-moe:latest

# 3. Backend deps
cd C:\Users\Admin\AICourse\July04_RAG\backend
pip install -r requirements.txt

# 4. Edit model in main.py (choose a valid Groq model, e.g. llama3-8b-8192)
#    Make sure the CORS middleware block is present (see full file above).
notepad C:\Users\Admin\AICourse\July04_RAG\backend\main.py   # edit, save

# 5. Stop any old backend processes
Get-Process | Where-Object {
    $_.ProcessName -like "*uvicorn*" -or $_.ProcessName -like "*python*"
} | Stop-Process -Force

# 6. Start backend (with CORS)
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# 7. Frontend deps
cd C:\Users\Admin\AICourse\July04_RAG\frontend
npm install

# 8. Start frontend
npm run dev   # note the URL it prints (e.g. http://localhost:5173/)

