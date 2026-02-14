# CareOps Production Deployment Guide

## Quick Start

This guide covers deploying CareOps to production using Vercel (frontend), Railway/Render (backend), and Supabase (database).

---

## Prerequisites

1. GitHub account with this repository
2. Vercel account (free tier works)
3. Railway or Render account (for backend)
4. Supabase account (free tier works)
5. Groq API key (optional, for AI features)

---

## Step 1: Database (Supabase)

### Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Note your database credentials:
   - Host: `db.xxxxxx.supabase.co`
   - Port: `5432`
   - Password: Your database password

### Get Connection String

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
```

---

## Step 2: Backend (Railway)

### Deploy to Railway

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Set the following environment variables:

```env
SECRET_KEY=your-generated-secret-key
JWT_SECRET_KEY=your-generated-jwt-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
APP_ENV=production
DEBUG=false
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

5. Click "Deploy"

### Get Backend URL

After deployment, note your Railway URL (e.g., `https://careops-backend.up.railway.app`)

---

## Step 3: Frontend (Vercel)

### Deploy to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New..." → "Project"
3. Import this repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `careops-frontend`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL
6. Click "Deploy"

### Get Frontend URL

Note your Vercel URL (e.g., `https://careops.vercel.app`)

---

## Step 4: Update CORS

After deployment, update your backend environment variables:

```env
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## Step 5: Verify Deployment

### Health Check

```bash
# Test backend
curl https://your-railway-url.up.railway.app/health

# Should return: {"success":true,"status":"healthy","timestamp":"..."}
```

### Test API

```bash
# Test root endpoint
curl https://your-railway-url.up.railway.app/

# Should return: {"success":true,"message":"Welcome to CareOps API",...}
```

---

## Optional: AI Features

To enable AI features:

1. Get Groq API key from https://console.groq.com
2. Add to Railway environment:
   ```
   GROQ_API_KEY=your-groq-api-key
   ```
3. Redeploy backend

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `JWT_SECRET_KEY` | Yes | Generate same as above |
| `DATABASE_URL` | Yes | Supabase connection string |
| `APP_ENV` | Yes | Set to `production` |
| `DEBUG` | No | Set to `false` for production |
| `FRONTEND_URL` | Yes | Your Vercel URL |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed origins |
| `GROQ_API_KEY` | No | For AI features |

---

## Troubleshooting

### Backend 500 Error
- Check Railway logs for errors
- Verify DATABASE_URL is correct
- Ensure SECRET_KEY and JWT_SECRET_KEY are set

### Frontend Not Loading
- Check Vercel deployment logs
- Verify NEXT_PUBLIC_API_URL is correct

### CORS Errors
- Update ALLOWED_ORIGINS with your frontend URL
- Redeploy backend

### Database Connection Failed
- Verify Supabase credentials
- Check DATABASE_URL format

---

## Performance Targets

After deployment, verify:

- [ ] Frontend loads in < 0.5 seconds
- [ ] API responds in < 200ms
- [ ] AI responses in < 2 seconds (if enabled)
- [ ] Health check returns healthy

---

## Rollback Procedures

### Backend Rollback (Railway)
1. Go to Railway dashboard
2. Find the last working deployment
3. Click "Redeploy"

### Frontend Rollback (Vercel)
1. Go to Vercel dashboard
2. Click "Deployments"
3. Find the last working deployment
4. Click "..."

---

## Support

- Backend API: Your Railway URL + `/docs` for Swagger docs
- Health: Your Railway URL + `/health`
