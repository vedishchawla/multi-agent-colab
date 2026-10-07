# CollaborAI – Collaborative Multi-Agent Decision Intelligence System

> **PS-27: Collaborative Multi-Agent Coordination System**  
> A general-purpose multi-agent decision intelligence platform where specialized AI agents collaborate over a shared blackboard, detect conflicts, negotiate trade-offs, re-evaluate assumptions, escalate deadlocks to humans, and produce unified recommendations with full claim attribution.

---

## Architecture Overview

```
                      User Goal (Arbitrary or Demo Preset)
                                       │
                                       ▼
                       [Goal Decomposition Agent]
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
        [Dynamic Workstreams]               [Dynamic Agent Registry]
                     │                                   │
                     └─────────────────┬─────────────────┘
                                       ▼
                     [Parallel Specialist Execution Tier]
                     (Market, Regulatory, Financial, Tech, SRE...)
                                       │
                                       ▼
                        [Shared Blackboard State]
                     (Findings, Assertions, Evidence)
                                       │
                                       ▼
                          [Conflict Detection Engine]
                         (Timeline, Budget, Risk, SLA)
                                       │
                         ┌─────────────┴─────────────┐
                         │ Has Conflicts             │ No Conflicts
                         ▼                           ▼
              [Multi-Round Negotiation]    [Goal Consistency Check]
                         │                           │
          ┌──────────────┴──────────────┐            │
          │ Resolved                    │ Deadlocked │
          ▼                             ▼            │
  [Update Blackboard]          [Human Escalation]    │
          │                             │            │
          │                             ▼            │
          │                    [Human Choice Injected]│
          │                             │            │
          └─────────────────────────────┼────────────┘
                                        ▼
                           [Final Synthesis Agent]
                                        │
                                        ▼
                     Unified Strategic Recommendation
                   + 100% Granular Claim Attribution
```

---

## Features

1. **General-Purpose Decision Intelligence**: Evaluates *any* complex decision (e.g. database migration, market expansion, cloud architecture, build vs buy, AI governance).
2. **Dynamic Agent Registry**: Built-in specialist roster (Market, Regulatory, Financial, Competitive, Technical Architecture, Security, SRE, Clinical Safety) + dynamic specialist fabrication for novel domains.
3. **Shared Blackboard Communication**: Agents post findings with structured quantitative assertions and read peer findings.
4. **Automated Conflict Detection**: Identifies dimensional incompatibilities (timeline clashes, budget breaches, regulatory non-compliance).
5. **Multi-Agent Negotiation**: Conflicting agents exchange structured concessions and proposals.
6. **Human-in-the-Loop Escalation**: Autonomous execution pauses when deadlocks occur, presenting structured options to the human.
7. **Fine-Grained Claim Attribution**: Every sentence in the final synthesis is traced back to originating finding IDs (`FND-*`) and agent names.
8. **Gemini Free Tier Safeguards**: In-memory async token-bucket rate limiter (12 RPM) with exponential backoff and jitter.
9. **Simulation / Offline Mode**: Instant zero-token deterministic simulation for offline evaluation and presentations.
10. **SQLAlchemy 2.0 Persistence**: SQLite async local storage, easily portable to PostgreSQL.
11. **Real-Time WebSocket Streaming**: Pushes live graph execution events to the frontend.

---

## Project Structure

```
CollaborAI/
├── backend/
│   ├── app/
│   │   ├── config.py             # Settings, .env loading, rate limits
│   │   ├── main.py               # FastAPI entrypoint, CORS, lifespan
│   │   ├── schemas/              # Pydantic v2 schemas (SharedState, Agent I/O, Events)
│   │   ├── llm/                  # Gemini Free Tier client, rate limiter, mock provider
│   │   ├── agents/               # Dynamic Agent Registry & base agent
│   │   ├── orchestration/        # Coordination state graph, runner, event hub
│   │   ├── db/                   # SQLAlchemy 2.0 async models & session
│   │   └── api/                  # REST routes (/runs, /scenarios) & WebSockets
│   ├── tests/                    # 14 passing automated tests
│   └── requirements.txt
├── frontend/                     # React 19 + Vite + Tailwind + React Flow (Phase 6)
├── .gitignore
├── .env.example
└── README.md
```

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure your free Gemini API key:

```env
GEMINI_API_KEY="your_api_key_from_google_ai_studio"
GEMINI_MODEL="gemini-3.5-flash-lite"
GEMINI_RATE_LIMIT_RPM=12
SIMULATION_MODE=false
DATABASE_URL="sqlite+aiosqlite:///./collaborai.db"
```

### 3. Run Tests

```bash
cd backend
python -m pytest tests -v
```

### 4. Run Backend & Frontend Locally

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Dashboard: `http://localhost:8000`  
Interactive API Docs: `http://localhost:8000/docs`

---

## 🚀 Free Cloud Deployment on Render

CollaborAI is fully dockerized with a production multi-stage build and includes a `render.yaml` blueprint for 1-click deployment on Render's Free Tier:

1. Push this repository to GitHub.
2. Sign in to **[Render.com](https://render.com)**.
3. Click **New +** → **Web Service** → Select your GitHub repo `Lakhan-18/Multi_Agent_System`.
4. Render will auto-detect the `Dockerfile` and configure:
   - **Environment:** Docker
   - **Plan:** Free
   - **Health Check Path:** `/api/status`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key (or multiple comma-separated keys: `key1,key2,key3`)
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
   - `GEMINI_RATE_LIMIT_RPM`: `12`
   - `SIMULATION_MODE`: `false`
6. Click **Deploy Web Service**. Render will build the unified React SPA + FastAPI backend and give you a live URL (`https://collaborai.onrender.com`).

