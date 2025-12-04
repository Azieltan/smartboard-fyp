# SmartBoard FYP

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
**Ask the project owner for the `.env` file contents.**

#### Backend
Create a file named `.env` in `apps/backend/` and add the required variables (e.g., Supabase credentials, JWT secret).

#### Frontend
Create a file named `.env.local` in `apps/frontend/` and add the required variables (e.g., Firebase config, API URL).

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
