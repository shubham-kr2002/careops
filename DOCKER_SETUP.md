# CareOps Docker Setup

Complete containerized setup for CareOps with PostgreSQL, FastAPI backend, and Next.js frontend.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2+
- Git

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL + Backend + Frontend)
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Option 2: Local Development (Without Docker for app servers)

```bash
# 1. Start only PostgreSQL in Docker
docker compose up -d db

# 2. Setup backend
cd careops-backend
pip install -r requirements.txt
python setup_db.py        # Create tables
python seed_data.py       # Seed test data
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. In a new terminal - Start frontend
cd careops-frontend
npm install
npm run dev
```

### Windows Batch Script
```bash
start-careops.bat up
```

### Linux/Mac
```bash
chmod +x start-careops.sh
./start-careops.sh up
```

## Docker Commands Reference

```bash
# Start all services
docker compose up -d

# Start only database
docker compose up -d db

# View logs
docker compose logs -f
docker compose logs -f backend   # Backend only

# Stop services
docker compose down

# Rebuild containers
docker compose build --no-cache

# Clean everything (including database data)
docker compose down -v
docker system prune -f
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js React Application |
| Backend API | http://localhost:8000 | FastAPI Python Backend |
| API Docs | http://localhost:8000/docs | Swagger/OpenAPI Documentation |
| PostgreSQL | localhost:5432 | PostgreSQL 14 Database |

## Default Login Credentials

After seeding, the following test users are available:

| Role | Email | Password |
|------|-------|----------|
| Owner | admin@careops.com | Admin@123 |
| Staff | staff@careops.com | Staff@123 |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL  │  │   FastAPI    │  │     Next.js      │  │
│  │    :5432     │  │    :8000     │  │     :3000        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                │                    │             │
│         └────────────────┴────────────────────┘             │
│                       careops-network                        │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables

### Backend (`careops-backend/.env`)

```env
# Required
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/careops

# Application
APP_ENV=development
DEBUG=true
FRONTEND_URL=http://localhost:3000

# AI Features (optional)
GROQ_API_KEY=your-groq-api-key

# WhatsApp Integration (optional)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=careops-webhook-verify-token

# Slack Integration (optional)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
```

### Frontend (`careops-frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Database Setup

### Initial Setup
```bash
# Create all tables from models
python setup_db.py

# Seed test data
python seed_data.py
```

### Using Alembic Migrations
```bash
# Apply all migrations
alembic upgrade head

# Check current revision
alembic current

# Create new migration
alembic revision --autogenerate -m "description"
```

## Volume Mounts

| Volume | Container Path | Description |
|--------|----------------|-------------|
| postgres_data | /var/lib/postgresql/data | Database persistence |
| ./careops-backend | /app | Backend source code (dev) |
| ./careops-frontend | /app | Frontend source code (dev) |

## Health Checks

All services include health checks:
- **Database**: `pg_isready` check every 10s
- **Backend**: HTTP `/health` endpoint check every 30s
- **Frontend**: HTTP check every 30s

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Database Connection Issues
```bash
# Reset database
docker compose down -v
docker compose up -d db

# Recreate tables
python setup_db.py
python seed_data.py
```

### bcrypt/passlib Error
```bash
# Install compatible bcrypt version
pip install bcrypt==4.0.1
```

### Container Won't Start
```bash
# Check logs
docker compose logs <service-name>

# Rebuild
docker compose build --no-cache
```

### Permission Denied (Linux/Mac)
```bash
chmod +x start-careops.sh
```

## Production Deployment

For production deployment:

1. Update environment variables with real secrets
2. Set `APP_ENV=production` and `DEBUG=false`
3. Use proper secrets management (e.g., Docker secrets, Vault)
4. Enable SSL/TLS with a reverse proxy (nginx/traefik)
5. Configure database backups
6. Set up monitoring and alerting
7. Add GROQ_API_KEY for AI features

See `architecture.md` for production deployment details.

## Security Notes

- Secrets passed via environment variables (`.env` files)
- Non-root users in containers
- Health checks enabled for all services
- Named volumes for data persistence
- Network isolation via Docker bridge network
- CORS configured for frontend origin only
