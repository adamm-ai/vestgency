# Deployment Guide

Production deployment instructions for the At Home Real Estate Platform.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Render.com Infrastructure                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ athome-frontend  │  │   athome-api     │                 │
│  │ (Static Site)    │  │   (Node.js)      │                 │
│  │ React + Vite     │  │   Express        │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                     │                            │
│           │            ┌────────▼─────────┐                 │
│           │            │   athome-db      │                 │
│           │            │   (PostgreSQL)   │                 │
│           │            └──────────────────┘                 │
│           │                                                  │
│  ┌────────▼─────────┐                                       │
│  │   athome-rag     │                                       │
│  │   (Python)       │                                       │
│  │   FastAPI        │                                       │
│  └──────────────────┘                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Render Blueprint Deployment

### 1. Connect Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render detects `render.yaml` automatically

### 2. Configure Secrets

Before deploying, set these secrets in Render Dashboard:

**Backend API:**
- `ADMIN_EMAIL` - Admin account email
- `ADMIN_PASSWORD` - Generated automatically, or set manually
- `JWT_SECRET` - Generated automatically

**RAG Backend:**
- `OPENAI_API_KEY` - Your OpenAI API key

### 3. Deploy

Click "Apply" to deploy all services.

---

## Service Configuration

### Frontend (athome-frontend)

**Type:** Static Site

```yaml
name: athome-frontend
type: static
buildCommand: npm install && npm run build
staticPublishPath: ./dist
```

**Environment Variables:**
```env
VITE_APP_NAME=At Home Real Estate
VITE_API_URL=https://athome-api.onrender.com
VITE_RAG_API_URL=https://athome-rag.onrender.com
```

**Cache Headers:**
- Assets (`/assets/*`): 1 year immutable
- Pages: No cache

**SPA Routing:** All routes rewrite to `/index.html`

---

### Backend API (athome-api)

**Type:** Web Service (Node.js)

```yaml
name: athome-api
type: web
runtime: node
buildCommand: npm install && npx prisma generate && npm run build
startCommand: npx prisma db push && npm run db:seed && npm start
```

**Environment Variables:**
```env
NODE_ENV=production
JWT_SECRET=<generated>
JWT_EXPIRES_IN=7d
DATABASE_URL=<from athome-db>
FRONTEND_URL=<from athome-frontend>
ADMIN_EMAIL=admin@athome.com
ADMIN_PASSWORD=<generated>
```

**Health Check:** `GET /health`

---

### RAG Backend (athome-rag)

**Type:** Web Service (Python 3.11)

```yaml
name: athome-rag
type: web
runtime: python
pythonVersion: "3.11"
buildCommand: pip install --no-cache-dir -r requirements.txt
startCommand: python server.py
rootDir: rag_backend
```

**Environment Variables:**
```env
PYTHON_VERSION=3.11
OPENAI_API_KEY=<your-key>
```

**Health Check:** `GET /health`

---

### Database (athome-db)

**Type:** PostgreSQL

```yaml
name: athome-db
type: pserv
plan: free
region: frankfurt
databaseName: athome
user: athome_user
```

---

## Manual Deployment

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb athome

# Apply schema
cd backend
npx prisma db push

# Seed data
npm run db:seed
```

### 2. Backend Deployment

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Start server
NODE_ENV=production npm start
```

### 3. Frontend Deployment

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Serve dist/ folder with any static server
npx serve dist
```

### 4. RAG Backend Deployment

```bash
cd rag_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python server.py
```

---

## Environment Variables Reference

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_APP_NAME` | No | Application name |
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_RAG_API_URL` | Yes | RAG service URL |

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (production/development) |
| `FRONTEND_URL` | Yes | CORS origin |
| `ADMIN_EMAIL` | Yes | Initial admin email |
| `ADMIN_PASSWORD` | Yes | Initial admin password |

### RAG Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `PORT` | No | Server port (default: 8001) |

---

## Pre-Deployment Checklist

### Security
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ chars)
- [ ] Verify FRONTEND_URL for CORS
- [ ] Remove exposed API keys from code
- [ ] Enable HTTPS (automatic on Render)

### Database
- [ ] Database connection verified
- [ ] Schema applied (`prisma db push`)
- [ ] Initial data seeded
- [ ] Backup strategy configured

### Services
- [ ] All health checks passing
- [ ] Environment variables configured
- [ ] Logs accessible
- [ ] Monitoring configured

### Performance
- [ ] Static assets cached (1 year)
- [ ] Gzip compression enabled
- [ ] Database indexes created
- [ ] API rate limiting configured

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Frontend
curl https://athome-frontend.onrender.com

# Backend API
curl https://athome-api.onrender.com/health

# RAG Service
curl https://athome-rag.onrender.com/health
```

### 2. Authentication Test

```bash
curl -X POST https://athome-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@athome.com","password":"your-password"}'
```

### 3. Property Search Test

```bash
curl https://athome-api.onrender.com/api/properties?limit=5
```

---

## Monitoring & Logs

### Render Dashboard
- View logs in real-time
- Monitor resource usage
- Check deployment history

### Log Analysis
```bash
# Common log patterns to monitor:
# - [Error] - Application errors
# - [AUTH] - Authentication events
# - [Database] - Connection issues
```

---

## Scaling Considerations

### Free Tier Limitations
- Services sleep after 15 min inactivity
- Limited concurrent connections
- No automatic backups
- Shared resources

### Upgrade Path
1. **Starter Plan:** Prevents sleep, dedicated resources
2. **Pro Plan:** More memory, priority support
3. **Enterprise:** Custom requirements

### Database Scaling
- Enable connection pooling (PgBouncer)
- Add read replicas for heavy loads
- Consider managed Postgres (Render, Neon, etc.)

---

## Troubleshooting

### Service Won't Start

1. Check environment variables
2. Verify build logs
3. Check health endpoint
4. Review application logs

### Database Connection Failed

1. Verify DATABASE_URL format
2. Check network connectivity
3. Confirm database exists
4. Check user permissions

### CORS Errors

1. Verify FRONTEND_URL in backend
2. Check deployed frontend URL matches
3. Clear browser cache

### Slow Performance

1. Check service wake-up time (free tier)
2. Monitor database query times
3. Review API response sizes
4. Check for N+1 queries

---

## Rollback Procedure

### Render Rollback

1. Go to service in Render Dashboard
2. Click "Deploys" tab
3. Find last working deployment
4. Click "Rollback to this deploy"

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout specific version
git checkout <commit-hash>
git push origin main --force
```
