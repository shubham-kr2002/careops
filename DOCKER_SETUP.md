# CareOps Docker Setup

Complete containerized setup for CareOps with PostgreSQL, FastAPI backend, and Next.js frontend.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2+
- Git

## Quick Start

### Windows
```bash
start-careops.bat up
```

### Linux/Mac
```bash
chmod +x start-careops.sh
./start-careops.sh up
```

## Manual Docker Commands

### Start All Services
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
```

### Stop Services
```bash
docker-compose down
```

### Rebuild Containers
```bash
docker-compose build --no-cache
```

### Clean Everything (including data)
```bash
docker-compose down -v
docker system prune -f
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js 14 React Application |
| Backend API | http://localhost:8000 | FastAPI Python Backend |
| API Docs | http://localhost:8000/docs | Swagger/OpenAPI Documentation |
| PostgreSQL | localhost:5432 | PostgreSQL 14 Database |

## Default Login Credentials

After running `start-careops.bat up` or `./start-careops.sh up`, the database is automatically seeded with test users:

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

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/careops
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
APP_ENV=development
DEBUG=true
FRONTEND_URL=http://localhost:3000
```

### Frontend (docker-compose.yml)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
API_URL=http://backend:8000/api/v1
```

## Volume Mounts

| Volume | Container Path | Description |
|--------|----------------|-------------|
| postgres_data | /var/lib/postgresql/data | Database persistence |
| ./careops-backend | /app | Backend source code |
| ./careops-frontend | /app | Frontend source code |

## Health Checks

All services include health checks:
- **Database**: `pg_isready` check every 10s
- **Backend**: HTTP health endpoint check every 30s
- **Frontend**: HTTP check every 30s

## Development Workflow

1. **Start containers**: `./start-careops.sh up`
2. **View logs**: `./start-careops.sh logs`
3. **Make code changes** - volumes auto-sync
4. **Restart if needed**: `./start-careops.sh restart`
5. **Stop**: `./start-careops.sh down`

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port 3000 or 8000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

### Container Won't Start
```bash
# Check logs
docker-compose logs <service-name>

# Rebuild
docker-compose build --no-cache
```

### Permission Denied (Linux/Mac)
```bash
chmod +x start-careops.sh
```

## Production Deployment

For production deployment:

1. Update `docker-compose.yml` environment variables
2. Use proper secrets management
3. Enable SSL/TLS
4. Configure backup strategy
5. Set up monitoring and alerting

See `architecture.md` for production deployment details.

## Security Notes

- Secrets are passed via environment variables
- Non-root users in containers
- Health checks enabled
- Volumes for data persistence
- Network isolation

## Support

For issues or questions, refer to:
- Backend: `careops-backend/README.md`
- Frontend: `careops-frontend/README.md`
- Architecture: `architecture.md`
