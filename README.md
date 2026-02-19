# At Home Real Estate Platform

**Enterprise CRM & Property Management System with AI-Powered Search**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

---

## Overview

At Home is a sophisticated, full-stack real estate management platform featuring:
- **Intelligent RAG-powered search** (FAISS + OpenAI embeddings)
- **Complete Lead CRM** with 9-stage pipeline
- **Property catalog management** with smart tags
- **AI Chatbot assistant** (NOUR) powered by GPT-4
- **Real-time notifications** and activity tracking
- **Role-based access control** (Admin/Agent)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                      │
│              https://athome-frontend.onrender.com                │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼─────────┐     ┌────────▼────────┐
│  Backend API    │     │  RAG Backend    │
│  (Express)      │     │  (FastAPI)      │
│  Port: 3001     │     │  Port: 8001     │
└───────┬─────────┘     └────────┬────────┘
        │                        │
        │                 ┌──────▼──────┐
┌───────▼─────────┐       │   FAISS     │
│   PostgreSQL    │       │   Index     │
│   (Prisma ORM)  │       │   OpenAI    │
└─────────────────┘       └─────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React + TypeScript + Vite | 19.2.4 |
| **Backend** | Express + Prisma | 4.18.3 |
| **RAG Service** | FastAPI + FAISS | 0.100+ |
| **Database** | PostgreSQL | 15+ |
| **AI/ML** | OpenAI GPT-4 + Embeddings | Latest |
| **Deployment** | Render.com | - |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- OpenAI API Key

### 1. Clone & Install

```bash
git clone <repository-url>
cd Agence

# Frontend
npm install

# Backend
cd backend && npm install

# RAG Backend
cd ../rag_backend && pip install -r requirements.txt
```

### 2. Environment Setup

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_RAG_API_URL=http://localhost:8001
```

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/athome"
JWT_SECRET="your-secure-secret-key"
JWT_EXPIRES_IN="7d"
ADMIN_EMAIL="admin@athome.com"
ADMIN_PASSWORD="SecurePassword123!"
```

**RAG Backend** (`rag_backend/.env`):
```env
OPENAI_API_KEY="sk-..."
```

### 3. Database Setup

```bash
cd backend
npx prisma db push    # Create tables
npm run db:seed       # Seed initial data
```

### 4. Start Services

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: RAG Backend
cd rag_backend && python server.py
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8000 |
| Backend API | http://localhost:3001 |
| RAG API | http://localhost:8001 |

---

## Project Structure

```
Agence/
├── src/                      # Frontend source
│   ├── components/           # React components
│   │   ├── admin/           # Admin portal
│   │   └── ui/              # Shared UI
│   ├── services/            # API & business logic
│   ├── hooks/               # Custom React hooks
│   └── types.ts             # TypeScript types
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth & validation
│   │   └── seed.ts          # Database seeder
│   └── prisma/
│       └── schema.prisma    # Database schema
│
├── rag_backend/             # Python RAG service
│   ├── server.py            # FastAPI application
│   ├── faiss_index/         # Vector database
│   └── requirements.txt     # Python dependencies
│
├── docs/                    # Documentation
│   ├── API.md              # API reference
│   ├── DATABASE.md         # Schema documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   ├── SECURITY.md         # Security practices
│   ├── TESTING.md          # Testing guide
│   ├── RAG-SERVICE.md      # RAG documentation
│   ├── COMPONENTS.md       # Frontend components
│   ├── SERVICES.md         # Services & hooks
│   └── BUSINESS-LOGIC.md   # Business workflows
│
├── __tests__/               # Test suites
├── render.yaml              # Render deployment
└── package.json
```

---

## Features

### CRM Lead Management
- **9-stage pipeline**: NEW → CONTACTED → QUALIFIED → VISIT_SCHEDULED → VISIT_COMPLETED → PROPOSAL_SENT → NEGOTIATION → WON/LOST
- **Lead scoring**: Automatic 0-100 scoring based on contact info, urgency, and source
- **Activity tracking**: Complete audit trail of all interactions
- **Smart assignment**: Auto-assign to agents, admin override capability

### Property Catalog
- **Multi-source import**: Mubawab scraper integration
- **Rich metadata**: Features, smart tags, multiple images
- **Category management**: RENT/SALE with price ranges
- **View tracking**: Analytics on property engagement

### AI-Powered Search (RAG)
- **Semantic search**: Natural language property queries
- **Intent detection**: Understands buy/rent/location/features
- **Hybrid ranking**: Vector similarity + keyword matching
- **NOUR Chatbot**: Conversational property assistant

### Real-time Features
- **Notifications**: Lead assignments, status changes
- **Activity feed**: Live dashboard updates
- **WebSocket support**: Real-time data sync

---

## API Overview

### Authentication
```
POST /api/auth/login      # Login
POST /api/auth/register   # Create user (admin only)
GET  /api/auth/me         # Current user
PUT  /api/auth/password   # Change password
```

### Leads
```
GET    /api/leads         # List leads (filtered by role)
POST   /api/leads         # Create lead
GET    /api/leads/:id     # Get lead details
PUT    /api/leads/:id     # Update lead
DELETE /api/leads/:id     # Delete lead (admin only)
```

### Properties
```
GET  /api/properties          # List with filters
GET  /api/properties/featured # Featured properties
GET  /api/properties/:id      # Property details
POST /api/properties/import   # Bulk import (admin)
```

### RAG Search
```
POST /api/search        # Semantic property search
GET  /api/quick-search  # Autocomplete
POST /api/chat          # AI assistant conversation
```

See [docs/API.md](docs/API.md) for complete API reference.

---

## Security

- **Authentication**: JWT with bcrypt password hashing (12 rounds)
- **Authorization**: Role-based access (ADMIN/AGENT)
- **Input Validation**: Zod schemas + DOMPurify sanitization
- **CSRF Protection**: Token-based with constant-time comparison
- **Security Headers**: XSS, clickjacking, MIME sniffing protection

See [docs/SECURITY.md](docs/SECURITY.md) for security details.

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Stack:**
- Jest 29.7.0
- React Testing Library 16.1.0
- Mock factories for leads, users, properties

See [docs/TESTING.md](docs/TESTING.md) for testing guide.

---

## Deployment

### Render.com (Production)

The project includes `render.yaml` for automated deployment:

```bash
# Deploy via Render Blueprint
# Connect repository → Auto-deploys 3 services + PostgreSQL
```

**Services:**
- `athome-frontend` - Static site
- `athome-api` - Node.js backend
- `athome-rag` - Python RAG service
- `athome-db` - PostgreSQL database

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment guide.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [API Reference](docs/API.md) | Complete API endpoint documentation |
| [Database Schema](docs/DATABASE.md) | Prisma models and relationships |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production deployment instructions |
| [Security Practices](docs/SECURITY.md) | Authentication, authorization, validation |
| [Testing Guide](docs/TESTING.md) | Test setup and best practices |
| [RAG Service](docs/RAG-SERVICE.md) | Vector search and AI chatbot |
| [Components](docs/COMPONENTS.md) | React component architecture |
| [Services & Hooks](docs/SERVICES.md) | Frontend service layer |
| [Business Logic](docs/BUSINESS-LOGIC.md) | CRM workflows and rules |

---

## Contributing

1. Create feature branch from `main`
2. Follow existing code patterns
3. Add tests for new features
4. Update documentation
5. Submit PR with clear description

---

## License

Proprietary - All rights reserved.

---

*Built with modern web technologies for the Moroccan real estate market.*
