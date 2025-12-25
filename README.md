# SmartBoard FYP

A social collaboration platform for teams to manage tasks, schedules, group chats, and automated workflows.

## 📋 Documentation

**New to SmartBoard?**
- 🚀 [**Quick Start Guide**](./QUICK_START.md) - Get started quickly!

**Project Status & Features:**
- 📖 [**Application Status Report (English)**](./APP_STATUS.md)
- 📖 [**应用现状报告 (中文)**](./APP_STATUS_CN.md)
- 📝 [**Implementation Plan**](./implementation_plan.md)

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
You need to run the backend and frontend in separate terminals.

**Terminal 1 (Backend):**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd apps/frontend
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:3001`.
