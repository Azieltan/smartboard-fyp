# SmartBoard FYP

A modern, AI-powered task management platform featuring real-time collaboration, smart automation, and a comprehensive admin dashboard.

## Key Features

- **Smarty AI Automation**: Natural language task and reminder management using n8n and DeepSeek.
- **Admin Dashboard**: Comprehensive stats, user management, and system monitoring.
- **Google OAuth Integration**: Seamless social login and profile completion.
- **Task Management**: Structured tasks with subtasks, labels, and priorities.
- **Real-time Notifications**: Instant updates for task assignments and system alerts.
- **Collaborative Workspace**: Friend system and shared group tasks.

## Project Structure

- `apps/frontend`: Next.js React application.
- `apps/backend`: Node.js Express server.
- `packages/`: Shared logic and types.
- `scripts/`: Utility scripts for dev and testing.


## Getting Started

Follow these steps to set up the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/Azieltan/smartboard-fyp.git
cd smartboard-fyp
```

### 2. Install Dependencies
Install all dependencies for the monorepo (frontend and backend):
```bash
npm install
```

### 3. Environment Setup
You need to set up environment variables for both the frontend and backend.

#### Backend
Use the provided `apps/backend/.env.example` as a starting point. Do NOT commit a `.env` file that contains real secrets.

- To create a local `.env` file from the example (cross-platform):

```bash
cd apps/backend
npm run env:setup
# then open .env and fill in the real secret values
```

If you need to share secrets with a teammate, use a secure channel (encrypted chat, password manager, or GitHub Secrets for CI/CD), not a public repository.

#### Frontend
Create a file named `.env.local` in `apps/frontend/` and add the required variables (e.g., Firebase config, API URL). Do not commit real keys to public repos.


### 4. Running the Application

You can start both the backend and frontend simultaneously from the root directory:

```bash
npm run dev
```

This will launch:
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001`


## Typecheck / Build

Run these before demo to catch TypeScript issues early.

```bash
# Backend build (tsc)
npm -w apps/backend run build

# Frontend typecheck (no emit)
npx tsc -p apps/frontend/tsconfig.json --noEmit
```

## E2E Smoke Test (PowerShell)

There is a small end-to-end smoke test script that validates core flows (auth, friend request, DM, task submission/review, notifications).

Prereqs:

- Backend running on `http://localhost:3001`
- Demo login exists:
	- Email: `test_theme@example.com`
	- Password: `123456`

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\selftest.ps1
```

The script creates a temporary second user automatically and prints a compact JSON summary (no JWTs).
