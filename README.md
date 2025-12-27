# SmartBoard FYP

## 🔒 Security Notice

**IMPORTANT**: This repository previously had sensitive credentials committed to git history. If you cloned this repository before December 26, 2024, please:

1. **Delete your local clone and re-clone the repository** after the git history has been cleaned
2. **Do not use any old credentials** - all credentials have been rotated
3. **Read `SECURITY_REPORT.md`** for full details

For more information:
- 📋 `QUICK_REFERENCE.md` - Quick summary of findings and actions
- 🔐 `SECURITY_REPORT.md` - Detailed security report
- 🧹 `GIT_HISTORY_CLEANUP_GUIDE.md` - Guide for removing secrets from git history

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
