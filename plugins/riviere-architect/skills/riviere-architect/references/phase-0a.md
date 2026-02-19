# Phase 0A — Generate Wiki with DeepWiki

## Objective

Use [DeepWiki-Open](https://github.com/AsyncFuncAI/deepwiki-open) to automatically generate a comprehensive wiki for the target repository — documentation, architecture diagrams, and component relationships — before reading it in Phase 0A.

## What DeepWiki Does

1. Clones and analyzes the repository structure
2. Creates embeddings of the code for smart retrieval
3. Generates documentation with AI (Gemini, OpenAI, OpenRouter, or Ollama)
4. Produces Mermaid diagrams for architecture and data flow
5. Organizes everything into a structured, navigable wiki

## Setup

### Prerequisites

- Google API key (`GOOGLE_API_KEY`) or OpenAI key (`OPENAI_API_KEY`)
- Docker (Option A) or Python 3.x + Node.js (Option B)

### Option A — Docker (Recommended)

```bash
git clone https://github.com/AsyncFuncAI/deepwiki-open.git
cd deepwiki-open

# Configure API keys
echo "GOOGLE_API_KEY=your_key" > .env
echo "OPENAI_API_KEY=your_key" >> .env

# Start
docker compose up
```

### Option B — Manual

```bash
git clone https://github.com/AsyncFuncAI/deepwiki-open.git
cd deepwiki-open

# Configure
echo "GOOGLE_API_KEY=your_key" > .env

# Backend
python -m pip install poetry==2.0.1 && poetry install -C api
python -m api.main

# Frontend (separate terminal)
npm install && npm run dev
```

DeepWiki runs at `http://localhost:3000`.

## Generate the Wiki

1. Open `http://localhost:3000`
2. Enter the target repository URL (GitHub, GitLab, or Bitbucket)
   - For private repos: click **"+ Add access tokens"** and provide a personal access token
3. Click **"Generate Wiki"**
4. Wait for generation to complete

DeepWiki will produce:

- Structured documentation pages per component/module
- Mermaid architecture and data flow diagrams
- A navigable wiki interface

## Export the Wiki

Once generated, save the wiki content locally so Phase 0A can index it with qmd.

DeepWiki stores its generated output in a cache directory. Locate and copy the markdown files:

```bash
# Wiki output is typically stored in the DeepWiki cache
# Check the app or API for export options, or save pages manually

# Create a local wiki directory for qmd indexing
mkdir -p wiki

# Save generated wiki pages here for Phase 0A
# Either copy from DeepWiki's cache or save pages via the UI
```

Alternatively, if the repository has an existing GitHub wiki, clone it directly:

```bash
git clone https://github.com/your-org/your-repo.wiki.git wiki
```

## Model Selection

| Provider                | When to Use                   | Key Required           |
| ----------------------- | ----------------------------- | ---------------------- |
| Google Gemini (default) | Best quality, recommended     | `GOOGLE_API_KEY`       |
| OpenAI                  | Alternative to Gemini         | `OPENAI_API_KEY`       |
| OpenRouter              | Access to Claude, Llama, etc. | `OPENROUTER_API_KEY`   |
| Ollama                  | Fully local, no API key       | Ollama running locally |

## Ask Feature (Optional)

Use DeepWiki's built-in **Ask** feature to query the repo before Phase 0A:

- "What are the main architectural components?"
- "How does data flow through the system?"
- "What external services does this integrate with?"
- "What are the bounded contexts / domains?"

Capture answers to pre-populate `.riviere/config/discovery-notes.md`.

## Handoff

Once the wiki is generated and saved locally, proceed to Phase 0B to index and search it with qmd.

## Next Phase

Read `references/phase-0b.md`
