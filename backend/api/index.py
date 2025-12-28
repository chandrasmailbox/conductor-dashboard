from fastapi import FastAPI, APIRouter, HTTPException
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import re
import base64
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

# -----------------------------
# LAZY MONGO CONNECTION (Vercel-safe)
# -----------------------------
def get_db():
    mongo_url = os.environ.get("MONGODB_URI")
    db_name = os.environ.get("DB_NAME")

    if not mongo_url or not db_name:
        raise RuntimeError("Missing MONGO_URL or DB_NAME environment variables")

    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]

# -----------------------------
# FASTAPI APP + ROUTER
# -----------------------------
app = FastAPI()
api_router = APIRouter(prefix="/api")

# -----------------------------
# CONSTANTS
# -----------------------------
GITHUB_API_BASE = "https://api.github.com"
GITHUB_RAW_BASE = "https://raw.githubusercontent.com"

# -----------------------------
# MODELS
# -----------------------------
class RepoRequest(BaseModel):
    repo_url: str

class Task(BaseModel):
    name: str
    status: str
    commit_sha: Optional[str] = None
    subtasks: List[str] = []

class Phase(BaseModel):
    name: str
    tasks: List[Task]
    status: str

class Track(BaseModel):
    name: str
    path: str
    status: str

class ConductorProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    repo_url: str
    repo_name: str
    owner: str
    product_name: Optional[str] = None
    product_description: Optional[str] = None
    tracks: List[Track] = []
    phases: List[Phase] = []
    overall_completion: float = 0.0
    total_tasks: int = 0
    completed_tasks: int = 0
    in_progress_tasks: int = 0
    pending_tasks: int = 0
    blocked_tasks: int = 0
    last_synced: str = ""
    setup_state: Dict[str, Any] = {}
    commits: List[Dict[str, Any]] = []

class RepoCache(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    repo_url: str
    data: Dict[str, Any]
    cached_at: str

# -----------------------------
# HELPERS
# -----------------------------
def parse_repo_url(url: str) -> tuple:
    patterns = [
        r"github\.com[/:]([^/]+)/([^/\.]+)",
        r"^([^/]+)/([^/]+)$"
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1), match.group(2).replace('.git', '')
    raise ValueError("Invalid GitHub repository URL")

def parse_task_status(line: str) -> tuple:
    line = line.strip()
    if line.startswith("- [x]"):
        sha_match = re.search(r'\[([a-f0-9]{7,40})\]', line)
        sha = sha_match.group(1) if sha_match else None
        name = re.sub(r'\[([a-f0-9]{7,40})\]', '', line[5:]).strip()
        name = re.sub(r'^Task:\s*', '', name).strip()
        return name, "completed", sha
    elif line.startswith("- [~]"):
        sha_match = re.search(r'\[([a-f0-9]{7,40})\]', line)
        sha = sha_match.group(1) if sha_match else None
        name = re.sub(r'\[([a-f0-9]{7,40})\]', '', line[5:]).strip()
        name = re.sub(r'^Task:\s*', '', name).strip()
        return name, "in_progress", sha
    elif line.startswith("- [ ]"):
        name = line[5:].strip()
        name = re.sub(r'^Task:\s*', '', name).strip()
        if "blocked" in name.lower():
            return name, "blocked", None
        return name, "pending", None
    return None, None, None

def parse_plan_md(content: str) -> List[Phase]:
    phases = []
    current_phase = None
    current_task = None
    lines = content.split('\n')

    for line in lines:
        if line.startswith("## Phase"):
            if current_phase:
                phases.append(current_phase)
            phase_name = line.replace("##", "").strip()
            current_phase = Phase(name=phase_name, tasks=[], status="pending")

        elif line.strip().startswith("- ["):
            name, status, sha = parse_task_status(line)
            if name:
                task = Task(name=name, status=status, commit_sha=sha, subtasks=[])
                if current_phase:
                    current_phase.tasks.append(task)
                current_task = task

        elif line.strip().startswith("- [ ]") and current_task and line.startswith("  "):
            subtask_name = line.strip()[5:].strip()
            current_task.subtasks.append(subtask_name)

    if current_phase:
        phases.append(current_phase)

    for phase in phases:
        if not phase.tasks:
            phase.status = "pending"
        elif all(t.status == "completed" for t in phase.tasks):
            phase.status = "completed"
        elif any(t.status in ["completed", "in_progress"] for t in phase.tasks):
            phase.status = "in_progress"
        else:
            phase.status = "pending"

    return phases

def parse_tracks_md(content: str) -> List[Track]:
    tracks = []
    lines = content.split('\n')

    for line in lines:
        if "Track:" in line:
            status = "pending"
            if "[x]" in line or "✓" in line:
                status = "completed"
            elif "[~]" in line:
                status = "in_progress"

            name_match = re.search(r'Track:\s*(.+?)(?:\*|$)', line)
            if name_match:
                name = name_match.group(1).strip()

                path_match = re.search(r'\*Link:\s*\[([^\]]+)\]', line)
                if not path_match:
                    path_match = re.search(r'\(([^)]+)\)', line)
                path = path_match.group(1) if path_match else ""

                tracks.append(Track(name=name, path=path, status=status))

    return tracks

async def fetch_github_file(owner: str, repo: str, path: str) -> Optional[str]:
    async with httpx.AsyncClient() as client:
        for branch in ["master", "main"]:
            url = f"{GITHUB_RAW_BASE}/{owner}/{repo}/{branch}/{path}"
            try:
                response = await client.get(url, timeout=30.0)
                if response.status_code == 200:
                    return response.text
            except Exception as e:
                logging.error(f"Error fetching {path}: {e}")
    return None

async def fetch_github_contents(owner: str, repo: str, path: str = "") -> List[Dict]:
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=30.0)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logging.error(f"Error fetching contents: {e}")
    return []

async def fetch_github_commits(owner: str, repo: str, per_page: int = 20) -> List[Dict]:
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits?per_page={per_page}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=30.0)
            if response.status_code == 200:
                commits = response.json()
                return [
                    {
                        "sha": c["sha"][:7],
                        "full_sha": c["sha"],
                        "message": c["commit"]["message"].split('\n')[0][:100],
                        "author": c["commit"]["author"]["name"],
                        "date": c["commit"]["author"]["date"],
                        "is_conductor": "conductor" in c["commit"]["message"].lower()
                    }
                    for c in commits
                ]
        except Exception as e:
            logging.error(f"Error fetching commits: {e}")
    return []

# -----------------------------
# ROUTES
# -----------------------------
@api_router.get("/")
async def root():
    return {"message": "Conductor Progress Dashboard API"}

@api_router.post("/repo/analyze", response_model=ConductorProgress)
async def analyze_repository(request: RepoRequest):
    db = get_db()

    try:
        owner, repo = parse_repo_url(request.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    cached = await db.repo_cache.find_one(
        {"repo_url": request.repo_url},
        {"_id": 0}
    )

    if cached:
        cached_time = datetime.fromisoformat(cached["cached_at"].replace('Z', '+00:00'))
        if (datetime.now(timezone.utc) - cached_time).seconds < 60:
            return ConductorProgress(**cached["data"])

    progress = ConductorProgress(
        repo_url=request.repo_url,
        repo_name=repo,
        owner=owner,
        last_synced=datetime.now(timezone.utc).isoformat()
    )

    progress.commits = await fetch_github_commits(owner, repo)

    conductor_paths = ["conductor", ".conductor", "docs/conductor"]
    conductor_contents = []

    for path in conductor_paths:
        contents = await fetch_github_contents(owner, repo, path)
        if contents:
            conductor_contents = contents
            break

    if not conductor_contents:
        progress.product_name = repo
        progress.product_description = "No Conductor context files found in this repository."

        cache_doc = {
            "repo_url": request.repo_url,
            "data": progress.model_dump(),
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        await db.repo_cache.update_one(
            {"repo_url": request.repo_url},
            {"$set": cache_doc},
            upsert=True
        )
        return progress

    for item in conductor_contents:
        name = item.get("name", "")
        if name in ["product.md", "product-requirements.md"]:
            content = await fetch_github_file(owner, repo, item["path"])
            if content:
                lines = content.split('\n')
                for line in lines:
                    if line.startswith("# "):
                        progress.product_name = line[2:].strip()
                        break
                progress.product_description = content[:500] + "..." if len(content) > 500 else content

        elif name == "setup_state.json":
            content = await fetch_github_file(owner, repo, item["path"])
            if content:
                try:
                    import json
                    progress.setup_state = json.loads(content)
                except:
                    pass

        elif name == "tracks.md":
            content = await fetch_github_file(owner, repo, item["path"])
            if content:
                progress.tracks = parse_tracks_md(content)

        elif name == "tracks" and item.get("type") == "dir":
            track_contents = await fetch_github_contents(owner, repo, item["path"])
            for track_dir in track_contents:
                if track_dir.get("type") == "dir":
                    plan_path = f"{track_dir['path']}/plan.md"
                    plan_content = await fetch_github_file(owner, repo, plan_path)
                    if plan_content:
                        phases = parse_plan_md(plan_content)
                        progress.phases.extend(phases)

    all_tasks = []
    for phase in progress.phases:
        all_tasks.extend(phase.tasks)

    progress.total_tasks = len(all_tasks)
    progress.completed_tasks = sum(1 for t in all_tasks if t.status == "completed")
    progress.in_progress_tasks = sum(1 for t in all_tasks if t.status == "in_progress")
    progress.pending_tasks = sum(1 for t in all_tasks if t.status == "pending")
    progress.blocked_tasks = sum(1 for t in all_tasks if t.status == "blocked")

    if progress.total_tasks > 0:
        progress.overall_completion = round(
            (progress.completed_tasks / progress.total_tasks) * 100, 1
        )

    cache_doc = {
        "repo_url": request.repo_url,
        "data": progress.model_dump(),
        "cached_at": datetime.now(timezone.utc).isoformat()
    }
    await db.repo_cache.update_one(
        {"repo_url": request.repo_url},
        {"$set": cache_doc},
        upsert=True
    )

    return progress

@api_router.get("/repo/cached")
async def get_cached_repos():
    db = get_db()
    repos = await db.repo_cache.find({}, {"_id": 0, "repo_url": 1, "cached_at": 1}).to_list(100)
    return repos

# -----------------------------
# REGISTER ROUTER + CORS
# -----------------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,   # IMPORTANT: allows "*"
    allow_origins=["*"],       # or [FRONTEND_ORIGIN] if you want to restrict
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
