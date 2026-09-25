# SupportNova 🚀
### AI-Powered Customer Complaint Resolution Intelligence & Dual-Pipeline Ground-Truth Validation

SupportNova now runs on a Python FastAPI backend with SQLite/SQLAlchemy persistence. The React frontend and its API contract remain unchanged. The former Express implementation is retained as `server.ts` under the `npm run dev:legacy` and `npm run start:legacy` commands for migration comparison only.

SupportNova is an enterprise-grade customer complaint resolution and quality assurance platform. It combines **Google Gemini Generative AI (Pipeline 1)**, a **Deterministic Ground-Truth Rule Matrix Engine (Pipeline 2)**, and an **Independent Python 3.10 Cross-Verification Engine** to provide automated triage, classification, policy validation, hallucination detection, SLA tracking, and audit-logged manual review.

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Key Features & Capabilities](#-key-features--capabilities)
- [Prerequisites](#-prerequisites)
- [Quick Start: Running Locally](#-quick-start-running-locally)
  - [1. Clone / Navigate to Project](#1-clone-or-navigate-to-project)
  - [2. Install Node.js Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Verify Python Environment](#4-verify-python-environment)
  - [5. Run Development Server](#5-run-development-server)
- [Testing & Quality Checks](#-testing--quality-checks)
- [User Roles & Demo Personas](#-user-roles--demo-personas)
- [Knowledge Base & Document Uploads](#-knowledge-base--document-uploads)
- [API Endpoints Summary](#-api-endpoints-summary)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🏛 System Architecture

SupportNova leverages a **three-tier intelligence and verification architecture**:

```
                              ┌───────────────────────────────────┐
                              │    Incoming Customer Complaint    │
                              └─────────────────┬─────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
      ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
      │  Pipeline 1: GenAI   │      │ Pipeline 2: Rules    │      │    Python Engine     │
      │   (Google Gemini)    │      │  (Deterministic SOP) │      │  (validator.py 3.10) │
      ├──────────────────────┤      ├──────────────────────┤      ├──────────────────────┤
      │ • Category / Urgency │      │ • Rule Matrix Match  │      │ • Schema Validation  │
      │ • Entity Extraction  │      │ • Policy Retrieval   │      │ • Document Parsing   │
      │ • Response & Summary │      │ • Refund/Replacement │      │ • Adversarial Shield │
      │ • Escalation Notes   │      │ • Multi-Dept Routing │      │ • Cross-Engine Score │
      └──────────┬───────────┘      └──────────┬───────────┘      └──────────┬───────────┘
                 │                             │                             │
                 └─────────────────────────────┼─────────────────────────────┘
                                               ▼
                              ┌───────────────────────────────────┐
                              │   Comparison & Consensus Engine   │
                              │  (Verification Score, SLA Alert)  │
                              └─────────────────┬─────────────────┘
                                                ▼
                              ┌───────────────────────────────────┐
                              │  Review Queue / Escalation Portal │
                              └───────────────────────────────────┘
```

1. **Pipeline 1 (Generative AI)**: Powered by Google Gemini (`@google/genai`) for multi-faceted sentiment analysis, contextual issue extraction, empathetic customer draft generation, and clarification queries. (Includes built-in deterministic heuristic fallback when no API key is supplied).
2. **Pipeline 2 (Deterministic Rule Matrix)**: Strict SOP policy engine cross-referencing return periods, refund limits, priority matrix, and SLA target deadlines.
3. **Python 3.10 Ground-Truth Validator**: Independent execution layer running `validator.py` via child process to validate JSON schemas, scan for prompt injection/adversarial threats, extract and chunk uploaded documents (PDF, DOCX, TXT), and calculate cross-engine consistency scores.

---

## ✨ Key Features & Capabilities

- **Role-Based Access Control (RBAC)**: Custom portals and permission sets for **Customers**, **Agents**, **Reviewers**, **Managers**, and **Administrators**.
- **Knowledge Base Ingestion**: Python-driven parser for `.docx`, `.pdf`, `.txt`, and `.md` policies with traceable chunk IDs, SHA-256 hashes, and version lifecycle management (*Active*, *Superseded*, *Draft*).
- **Adversarial & Injection Shield**: Pre-processing sanitization, strip-tag filters, and prompt-injection detection to prevent complaint override attacks.
- **Deduplication Engine**: Jaccard word-token similarity matching alongside exact order reference matching to flag near-duplicate complaints.
- **SLA & Risk Tracking**: Real-time SLA breach countdowns with automated risk status detection (*Normal*, *Approaching Risk*, *Breached*).
- **Audited Reviewer Overrides**: Full governance audit trail capturing original vs. modified categories, routing, compensation, and approval notes.
- **Reporting & Export**: One-click JSON and CSV data exports with live resolution metrics and validation compliance charts.

---

## 📋 Prerequisites

Before starting, ensure your local development machine has:

1. **Node.js**: `v18.0.0` or later (`v20.x` LTS recommended). Check with:
   ```bash
   node -v
   ```
2. **npm** (comes with Node.js) or **bun** / **yarn** / **pnpm**:
   ```bash
   npm -v
   ```
3. **Python**: Python `3.8+` (`3.10+` recommended).
   ```bash
   python3 --version
   ```
   > **Note**: `validator.py` uses **Python Standard Library only** (`json`, `sys`, `re`, `io`, `zlib`, `base64`, `hashlib`, `xml.etree.ElementTree`). **No `pip install` required!**
4. *(Optional)* **Google Gemini API Key**: For live LLM intelligence. (Without it, SupportNova automatically uses its built-in offline deterministic intelligence engine).

---

## 🚀 Quick Start: Running Locally

### 1. Clone or Navigate to Project

Open your terminal and clone or switch into the project directory:

```bash
git clone <repository-url>
cd supportnova
```

### 2. Install Dependencies

Install the Node.js packages:

```bash
npm install
```

*(Alternatively, with bun: `bun install`)*

> Windows PowerShell users can run the same `npm install` command from the project folder. The repository already includes `node_modules`, but installing again is safe after a fresh clone.

Install the FastAPI backend dependencies:

```bash
python -m pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Open `.env` in your editor:

```env
# SupportNova Environment Variables
PORT=3000
HOST=0.0.0.0

# Optional: Add your Google Gemini API Key for Live Pipeline 1 GenAI
# If omitted or left empty, the application runs seamlessly in offline deterministic mode!
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Verify Python Environment

SupportNova calls `python3` to execute the ground-truth validator and document parser (`validator.py`). Test that Python 3 is accessible:

```bash
python3 -c "import validator; print('Python Validator OK')"
```

On Windows, use:

```powershell
python -c "import validator; print('Python Validator OK')"
```

Python is used through the standard library only; no `pip install` step is required.

### 5. Build the frontend

The FastAPI application serves the production frontend from `dist/`:

```bash
npm run build
```

### 6. Run Development Server

Start the FastAPI server:

```bash
npm run dev
```

You should see output similar to:
```
INFO:     Uvicorn running on http://0.0.0.0:3000
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

Keep this terminal running. To stop the server, press `Ctrl+C`.

For frontend-only Vite development, use a second terminal:

```bash
npm run dev:frontend
```

The FastAPI API remains at **http://localhost:3000**. The Vite development page is normally at **http://localhost:5173**.

### 7. Run the production server

Validate, build, and start:

```bash
npm run lint
npm run build
```

Then start the Node server:

```bash
npm start
```

The production server is available at **http://localhost:3000**.

### Authentication

The login and signup screens are served by the same Express/Vite server, so use the application URL above rather than opening `index.html` directly.

- **Sign up:** choose **Create Account**, enter a name, email, and password of at least 6 characters. New public accounts are assigned the `Customer` role automatically.
- **Sign in:** use the email and password created during signup.
- **Demo accounts:** click any one-click persona on the login screen. Demo accounts use `demo` as their password when signing in with credentials.
- **Forgot password:** request a reset code from the login screen. In local demo mode, the reset code is displayed in the response message.

Authentication is intentionally in-memory for this demo: registered users, passwords, and sessions reset whenever the server restarts. Do not use real production credentials.

### Backend migration files

| File | Purpose |
|---|---|
| `main.py` | FastAPI application and API-compatible routes |
| `database.py` | SQLite engine and SQLAlchemy initialization |
| `models.py` | SQLAlchemy models for complaints, policies, rules, users, and prompts |
| `ai_pipeline.py` | Python Pipeline 1 implementation |
| `rule_engine.py` | Python deterministic Pipeline 2/comparison implementation |
| `validator.py` | Native imported validation and document parsing engine |
| `seed_data.json` | Exported initial users, complaints, policies, rules, prompts, and test cases |
| `requirements.txt` | Python runtime dependencies |

---

## 🧪 Testing & Quality Checks

Run the TypeScript typechecker and linter:
```bash
npm run lint
```

Build the production bundle:
```bash
npm run build
```

Test the Python validator directly:
```bash
python3 -c "import validator; print('Python Validator OK')"
```

---

## 👥 User Roles & Demo Personas

Use the **Role Selector** dropdown in the top navigation bar to seamlessly experience the platform as different personas:

| Role | Access Level & Key Capabilities |
|---|---|
| **Customer** | Submit complaints, view personal ticket status, review resolutions, send follow-ups. |
| **Agent** | View assigned queue, review dual-pipeline analysis, copy auto-drafted responses, follow SOP guidance. |
| **Reviewer** | Access manual review queue for ambiguous/flagged cases, approve, edit, reassign, or escalate with stored overrides. |
| **Manager** | View team analytics, SLA breach alerts, triage trends, audit logs, and export CSV/JSON reports. |
| **Administrator** | Manage knowledge base, upload `.docx` & `.pdf` policies, toggle active/superseded versions, configure rules & prompts. |

---

## 📄 Knowledge Base & Document Uploads

SupportNova features built-in document parsing and semantic chunking:

1. Switch to the **Administrator** role from the header dropdown.
2. Navigate to **Knowledge Base & Policies**.
3. Click **"Upload Policy Document (.PDF, .DOCX, .TXT)"**.
4. Select a document (e.g., standard policy PDF or Word `.docx` file).
5. The Python parser will automatically:
   - Extract headings and text without third-party binary dependencies.
   - Segment the text into traceable, indexed chunks.
   - Generate SHA-256 integrity hashes and summary metadata.
   - Register the document into active policy memory.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create a Customer account and start a session |
| `POST` | `/api/auth/login` | Sign in with email/password or a demo user ID |
| `POST` | `/api/auth/forgot-password` | Request a local password reset code |
| `POST` | `/api/auth/reset-password` | Reset a password and start a session |
| `POST` | `/api/auth/logout` | End the current session |
| `GET` | `/api/complaints` | Retrieve complaints with optional status & department filters |
| `POST` | `/api/complaints` | Submit a new complaint (triggers 3-way triage & cross-verification) |
| `GET` | `/api/complaints/:id` | Fetch full intelligence packet for a specific complaint |
| `POST` | `/api/complaints/:id/review` | Submit reviewer decisions (Approve / Modify / Escalate) |
| `GET` | `/api/policies` | Retrieve all active and superseded policy documents |
| `POST` | `/api/policies` | Add or update a policy entry |
| `POST` | `/api/policies/:id/toggle-status` | Toggle policy lifecycle (*Active* ⇄ *Superseded*) |
| `POST` | `/api/knowledge-base/upload` | Upload & parse `.docx`, `.pdf`, `.txt` files with Python |
| `GET` | `/api/rules` | Retrieve ground-truth resolution rule matrix |
| `POST` | `/api/rules` | Add or update a rule matrix entry |
| `GET` | `/api/analytics` | Retrieve KPI metrics, SLA statistics, and trend summaries |
| `GET` | `/api/reports/validation` | Retrieve cross-engine compliance & validation score report |
| `GET` | `/api/export` | Export filtered complaint records in JSON or CSV format |

---

## 🛠 Troubleshooting & FAQs

#### 1. Port 3000 is already in use
Set the `PORT` environment variable to another port (e.g., 3001) in `.env`:
```env
PORT=3001
```
Or start with:
```bash
PORT=3001 npm run dev
```

#### 2. `spawn python3 ENOENT` error
This error occurs if Node cannot find `python3` in your PATH.
- **macOS / Linux**: Verify with `which python3`.
- **Windows**: Make sure Python is added to your system `PATH` and that `python3` command is accessible, or create a symlink / copy `python.exe` to `python3.exe` in your Python directory.

#### 3. Do I need a Gemini API Key?
No. While adding a `GEMINI_API_KEY` enables real-time Gemini LLM calls, SupportNova includes a complete, deterministic generative intelligence fallback that executes offline, producing realistic, compliant responses for all 75 system requirements.

#### 4. File upload size limit
The Express server is configured with a 15MB payload limit (`express.json({ limit: '15mb' })`), sufficient for standard PDF and DOCX policy documentation.

---

## 📄 License

This project is licensed under the MIT License.
