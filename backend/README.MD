# Conductor Dashboard — Backend (How to run)

This document explains how to run the backend service in the `backend` folder, required environment variables, common troubleshooting steps, and example requests to exercise the API.

> Repo path: `backend/` (file: `server.py`)  
> Main tech: FastAPI, Motor (async MongoDB driver), httpx.  
> Required Python packages are in `backend/requirements.txt`. There is a small `.env` file used for defaults.

## Prerequisites

- Python 3.10+ (3.11 recommended)
- pip
- MongoDB server available and reachable at the `MONGO_URL` you configure (default `mongodb://localhost:27017`).
- Network access to GitHub (the backend fetches raw files & commits from GitHub).

## Environment variables

The backend uses a `.env` file loaded from the `backend` directory. Example `.env` (already present in repo):

```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
```

- MONGO_URL: MongoDB connection string.
- DB_NAME: Database name to use for caching and progress docs.
- CORS_ORIGINS: Comma-separated origins allowed by CORS (default `*`).

If you need to override these, either edit `backend/.env` or export environment variables in your shell.

## Install

1. Open a terminal and change to the `backend` directory:

   cd path/to/conductor-dashboard/backend

2. (Optional but recommended) Create and activate a virtual environment:

   python -m venv .venv
   - On macOS / Linux: source .venv/bin/activate
   - On Windows: .venv\Scripts\activate

3. Install dependencies:

   pip install --upgrade pip
   pip install -r requirements.txt

Notes:
- If you see binary compile errors for packages like cryptography or cffi, ensure build tools are installed (e.g., `build-essential`/`python3-dev` on Linux or Visual Studio Build Tools on Windows).
- If you prefer, use poetry/conda but ensure installed versions are compatible.

## Run the server (development)

From inside the `backend` directory (so `.env` at `./.env` is picked up):

uvicorn server:app --host 0.0.0.0 --port 8000 --reload

- `server:app` — `server.py` exposes the FastAPI app as `app`.
- `--reload` enables autoreload for development.

You should see console logs from FastAPI/uvicorn. By default the API is at:
- http://127.0.0.1:8000/
- Open the automatic API docs at http://127.0.0.1:8000/docs (Swagger UI).

## Example usage

Analyze a repository for "Conductor" progress:

curl example (POST JSON):

curl -X POST "http://127.0.0.1:8000/api/repo/analyze" \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/owner/repo"}'

Response: JSON matching the `ConductorProgress` model — product name, description, tracks, phases, and task statistics (total/completed/pending/etc).

List cached analyzed repos:

curl http://127.0.0.1:8000/api/repo/cached

## How the backend works (brief)

- server.py loads `.env`, connects to MongoDB, and exposes an APIRouter with prefix `/api`.
- The main endpoints:
  - POST `/api/repo/analyze` — accepts `{"repo_url": "<github repo url>"}` and returns computed progress data.
  - GET `/api/repo/cached` — returns previously cached analysis documents.
- The service fetches files from GitHub raw URLs (tries `master` then `main`) and uses simple markdown parsing for `tracks.md`, `plan.md`, `product.md`, and `setup_state.json`.
- Results are cached in MongoDB collection `repo_cache` for quick subsequent responses.

## Common troubleshooting

- MongoDB connection errors:
  - Check that MongoDB is running and accessible at `MONGO_URL`.
  - If Mongo requires authentication, include credentials in the `MONGO_URL`.
- GitHub fetch failures:
  - API rate limits or network issues can prevent fetching files/commits.
  - The code uses raw.githubusercontent.com for file retrieval and api.github.com for commit lists.
- Dependency issues:
  - Use a clean virtual environment and ensure pip is updated.
- Python version errors:
  - Pydantic v2 and some newer libs require Python 3.10+. Use 3.10+.
- If `server.py` fails to import packages, ensure you installed `requirements.txt` into the same Python environment used to run uvicorn.

## Tests & linting

No test harness is included for the backend in the repository root. Requirements include pytest and linters; you can run:

- pytest (if tests added)
- flake8 / mypy / black as desired.

## Add the README file into the repo

If you want, I can add this document to the repository as `backend/README.md`. I can commit it to a new branch if you provide the repo owner and want me to push it. (I will not push anything unless you ask me to.)

## Summary quick commands

cd conductor-dashboard/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload

---
If you'd like, I can:
- Create and commit `backend/README.md` directly to the repository (I will need the target owner/repo details and branch name), or
- Produce a shorter QuickStart file, or
- Add a Dockerfile/docker-compose for easier local run.
