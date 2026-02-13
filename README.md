# AWCS (Automated Workflow Collaborate System) - SmartBoard

![Project Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Tech Stack](https://img.shields.io/badge/Stack-MERN%2B-blueviolet)

> **A modern, AI-powered collaborative workspace designed to streamline team productivity through intelligent automation and real-time interaction.**

---

## 🌟 Overview

SmartBoard (AWCS) is a comprehensive task management solution that bridges the gap between traditional project management tools and modern AI automation. Built as a Final Year Project for **MMU Diploma in IT**, it integrates advanced features like **Natural Language Processing (NLP)** automation, **Real-time Communication**, and **Role-based Access Control (RBAC)** into a unified, sleek interface.

## 🚀 Key Features

- **🤖 Smarty AI Automation**
  - Execute complex workflows using natural language commands (e.g., "Add John to the Marketing group").
  - Powered by **n8n** and **Groq AI** for intelligent intent recognition.

- **📊 Comprehensive Admin Dashboard**
  - Visual analytics for user engagement and task completion rates.
  - Complete user management system with ban/unban capabilities.

- **💬 Real-Time Collaboration**
  - Instant messaging within groups and direct messages (DM).
  - Live notifications for invites, updates, and reminders using **Socket.io**.

- **🔐 Secure Authentication**
  - Multi-method login support: Email/Password and **Google OAuth**.
  - Robust session management via **Supabase Auth** and **Firebase**.

- **📅 Interactive Scheduler**
  - Sleek calendar interface for seamless task and event planning.
  - Smart conflict detection and automated reminders.

- **👥 Social Connectivity**
  - Friend system with request, accept, decline, and block flows.
  - Shared workspaces for team collaboration.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State/Real-time**: Socket.io Client, SWR
- **UI Components**: Lucide React, Sonner (Toasts), Chart.js

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Server**: Express.js
- **Language**: TypeScript
- **Real-time Engine**: Socket.io

### Infrastructure & Services
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth & Firebase Admin
- **Storage**: Supabase Storage
- **Automation**: n8n (Workflow Automation)

---

## 🏗️ Project Structure

The project follows a **Monorepo** architecture for better code sharing and management:

```
smartboard-fyp/
├── apps/
│   ├── frontend/         # Next.js Application
│   └── backend/          # Express.js API Server
├── packages/             # Shared libraries (types, utilities)
├── scripts/              # Devops and maintenance scripts
└── n8n/                  # Automation workflow definitions
```

---

## ⚡ Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Supabase project credentials
- n8n instance (optional for AI features)

### 1. Clone the Repository
```bash
git clone https://github.com/Azieltan/smartboard-fyp.git
cd smartboard-fyp
```

### 2. Install Dependencies
Install dependencies for all workspaces:
```bash
npm install
```

### 3. Environment Setup

#### Backend Configuration
Copy the example environment file and configure your secrets:
```bash
cd apps/backend
cp .env.example .env
# Edit .env and add your Supabase/Firebase credentials
```

#### Frontend Configuration
Create a local environment file for the Next.js app:
```bash
cd apps/frontend
# Create .env.local with your public API keys and endpoints
```

### 4. Running the Application

Start both the frontend and backend servers concurrently:
```bash
# From the root directory
npm run dev
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`

---

## 🧪 Testing

The project includes scripts to ensure stability.

**Type Checking**
```bash
npm run typecheck --workspace=apps/frontend
```

**Smoke Test (E2E)**
Run the automated PowerShell smoke test to verify core flows:
```powershell
.\scripts\selftest.ps1
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  <sub>Built with ❤️ by Aziel Tan, Wing Kit, and Vincent Lock for MMU Diploma in IT Final Year Project</sub>
</p>
