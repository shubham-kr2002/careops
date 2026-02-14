# CareOps Manual Setup Guide

This document outlines the manual setup steps required to get CareOps fully operational.

---

## Table of Contents
1. [Quick Start with Docker](#quick-start-with-docker)
2. [Login Credentials](#login-credentials)
3. [Environment Variables](#environment-variables)
4. [External API Keys](#external-api-keys)
5. [Database Setup](#database-setup)
6. [OAuth Configuration](#oauth-configuration)
7. [Docker & DevOps](#docker--devops)
8. [Production Deployment](#production-deployment)

---

## Quick Start with Docker

### Prerequisites
- **Docker Desktop** (Windows/Mac) or **Docker Engine + Docker Compose** (Linux)
- **Git**

### One-Command Start

```bash
# Clone and start everything
git clone https://github.com/shubham-kr2002/careops.git
cd careops
docker compose up -d
```

Wait ~30 seconds for all services to initialize, then open:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs

### Windows Quick Start
```bash
start-careops.bat up
```

### Linux/Mac Quick Start
```bash
chmod +x start-careops.sh
./start-careops.sh up
```

---

## Login Credentials

After the database is seeded (automatically done by Docker), use these credentials:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Owner (Admin)** | `admin@careops.com` | `Admin@123` | Full access to all features |
| **Staff** | `staff@careops.com` | `Staff@123` | Inbox, Bookings, Forms (no Inventory) |

> **Note:** These are development credentials created by `seed_data.py`. Change them in production!

---

## Environment Variables

### Backend (.env)

Create a `.env` file in `careops-backend/` with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/careops

# JWT Secret (generate a secure random string)
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys (see External API Keys section)
SENDGRID_API_KEY=your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# AI Service
GROQ_API_KEY=your-groq-api-key

# WhatsApp Business API (Meta Cloud API)
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-business-account-token
WHATSAPP_VERIFY_TOKEN=careops_whatsapp_verify
WHATSAPP_APP_SECRET=your-app-secret

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_DEFAULT_CHANNEL=#careops-notifications

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Cloudinary (alternative to S3)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/integrations/calendar/callback
```

### Frontend (.env.local)

Create a `.env.local` file in `careops-frontend/` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url/api/v1
```

---

## External API Keys

### 1. SendGrid (Email)

1. Go to [SendGrid](https://sendgrid.com/)
2. Create a free account
3. Navigate to Settings → API Keys
4. Create a new API key with "Full Access"
5. Copy the key to your environment variable

**Verification:** Test by sending a test email via the API

### 2. Gmail API (Alternative Email Provider)

Google Gmail API provides another option for sending emails. This is particularly useful if you already have a Google Workspace account.

**Prerequisites:**
- Google Cloud Platform account
- Gmail API enabled in Google Cloud Console

**Setup Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Search for "Gmail API" and enable it
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Set application type to "Desktop App"
6. Download the credentials JSON file
7. Rename to `credentials.json` and place in backend directory

**Environment Variables:**

```env
# Gmail API
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=http://localhost:8000/api/v1/integrations/gmail/callback
GMAIL_EMAIL=your-email@gmail.com
```

**For Production:**
```env
GMAIL_REDIRECT_URI=https://your-domain.com/api/v1/integrations/gmail/callback
```

**How it Works:**
1. User connects Gmail in the UI (OAuth flow)
2. Backend obtains access/refresh tokens
3. Emails are sent via Gmail API using the user's credentials
4. Refresh token is used to maintain access

**Note:** Gmail API has sending limits (500/day for free, higher for Workspace). For higher volumes, consider SendGrid or AWS SES.

### 2. Twilio (SMS)

1. Go to [Twilio](https://twilio.com/)
2. Create a free account
3. Get your Account SID and Auth Token from the console
4. Get a phone number from Phone Numbers section
5. Copy all to your environment variables

**Verification:** Test by sending a test SMS

### 3. Groq (AI)

1. Go to [Groq](https://groq.com/)
2. Create an account
3. Navigate to API Keys
4. Create a new API key
5. Copy to your environment variable

**Note:** Groq provides free tokens that are sufficient for development

**AI Features Enabled:**
- Intent & sentiment detection for customer inquiries
- Demand forecasting from historical booking data
- Staff routing based on skills & availability
- Multi-language translation (auto-detected)
- Language detection for incoming messages
- Contact segmentation (VIP, regular, occasional, at-risk, new, inactive)
- Predictive maintenance for equipment
- AI-powered analytics insights and report summaries

### 3b. WhatsApp Business API (Meta Cloud API)

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a developer account or sign in
3. Create a Business App (type: Business)
4. Add WhatsApp product to your app
5. Get a Phone Number ID:
   - Go to Getting Started
   - Send a test message to link a phone number
   - Copy the Phone Number ID
6. Generate an access token:
   - Create a system user (Business Settings → Users)
   - Grant WHATSAPP_BUSINESS_MESSAGING permission
   - Create an access token with 24-hour expiration (or never)
7. Get App Secret (Settings → Basic, near your App ID)
8. Set a verify token (any random string like `careops_whatsapp_verify`)

**How it works:**
- Incoming WhatsApp messages → Webhook receives message
- Backend creates Contact + Conversation
- AI processes message and generates response
- Response sent back via WhatsApp API

**Setup webhook URL in Meta Console:**
- Callback URL: `https://your-domain.com/api/v1/webhooks/whatsapp`
- Verify Token: Match the `WHATSAPP_VERIFY_TOKEN` in your .env
- Subscribe to `messages` and `message_status` events

### 3c. Slack Integration

1. Go to [Slack API Console](https://api.slack.com/apps)
2. Create a New App → "From scratch"
3. Name it "CareOps" and select your workspace
4. Go to OAuth & Permissions
5. Add OAuth scopes (Bot Token Scopes):
   - `chat:write`
   - `channels:read`
   - `users:read`
6. Install the app to your workspace → Copy "Bot User OAuth Token"
7. Go to App Settings → Basic Information → get "Signing Secret"
8. Go to Event Subscriptions → enable them
9. Set Request URL: `https://your-domain.com/api/v1/webhooks/slack/events`
10. Subscribe to events: `message.channels`, `message.im`

**How it works:**
- Notifications for new bookings, maintenance alerts, etc.
- Available as a Slack command: `/careops status`, `/careops help`
- Messages can be sent to specific channels or users

### 4. Google Calendar (OAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - Development: `http://localhost:8000/api/v1/integrations/calendar/callback`
   - Production: `https://your-domain.com/api/v1/integrations/calendar/callback`
7. Copy Client ID and Client Secret

### 5. AWS S3 (File Storage)

1. Go to [AWS Console](https://aws.amazon.com/)
2. Create an IAM user with S3 permissions
3. Create an S3 bucket
4. Get the Access Key ID and Secret Access Key
5. Copy to your environment variables

**Alternative: Cloudinary**

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Get your Cloud Name, API Key, and API Secret
4. Copy to your environment variables

---

## Database Setup

### Development

1. Make sure PostgreSQL is running
2. Create a database named `careops`
3. Run migrations:

```bash
cd careops-backend
alembic upgrade head
```

4. (Optional) Seed initial data:

```bash
python seed_data.py
```

### Production

1. Use a managed PostgreSQL service (e.g., Supabase, Neon, RDS)
2. Get the connection string
3. Set as `DATABASE_URL` environment variable
4. Run migrations via CI/CD or manually

---

## OAuth Configuration

### Google Calendar OAuth Flow

The OAuth flow works as follows:

1. User clicks "Connect Google Calendar" in the UI
2. Frontend redirects to backend OAuth initiation endpoint
3. Backend redirects to Google's OAuth consent screen
4. User grants permission
5. Google redirects back to callback URL with authorization code
6. Backend exchanges code for access token
7. Backend stores refresh token in encrypted format
8. Calendar sync begins automatically

**Manual Step:** Ensure the redirect URI in Google Cloud Console matches your deployment URL

---

## Docker & DevOps

### Docker Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Docker Network (careops-network)          │
│                                                                │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐  │
│  │  PostgreSQL  │   │   FastAPI     │   │    Next.js       │  │
│  │  (careops-db)│   │  (backend)    │   │   (frontend)     │  │
│  │   :5432      │◄──│   :8000       │◄──│    :3000         │  │
│  └──────────────┘   └───────────────┘   └──────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Docker Files Overview

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Main orchestration (production-like) |
| `docker-compose.override.yml` | Dev overrides (hot-reload, volume mounts) |
| `careops-backend/Dockerfile` | Backend multi-stage build (Python 3.12) |
| `careops-frontend/Dockerfile` | Frontend multi-stage build (Node 20, standalone) |
| `careops-frontend/Dockerfile.dev` | Frontend dev mode (hot-reload) |
| `.env.example` | Root env template for docker-compose |
| `careops-backend/.env.example` | Backend env template |
| `start-careops.bat` | Windows launch script |
| `start-careops.sh` | Linux/Mac launch script |

### Docker Commands Reference

```bash
# Start all services (PostgreSQL + Backend + Frontend)
docker compose up -d

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Stop all services
docker compose down

# Rebuild containers (after code changes)
docker compose build --no-cache
docker compose up -d

# Clean everything (including database data!)
docker compose down -v
docker system prune -f

# Restart a single service
docker compose restart backend
```

### Development vs Production Mode

**Development** (default with `docker-compose.override.yml` present):
- Source code mounted as volumes for hot-reload
- Backend runs with `--reload` flag
- Frontend runs `npm run dev`
- Debug mode enabled

**Production** (remove or rename `docker-compose.override.yml`):
```bash
# Rename override to disable dev mode
mv docker-compose.override.yml docker-compose.override.yml.bak

# Build production images
docker compose build --no-cache

# Start in production mode
docker compose up -d
```

### Environment Variables for Docker

Docker Compose automatically loads a `.env` file from the project root. Create one from the template:

```bash
cp .env.example .env
# Edit .env with your values
```

Key variables to set:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DB` | `careops` | Database name |
| `SECRET_KEY` | dev default | App secret (CHANGE IN PROD!) |
| `JWT_SECRET_KEY` | dev default | JWT signing key (CHANGE IN PROD!) |
| `GROQ_API_KEY` | empty | Groq AI API key (optional) |
| `SENDGRID_API_KEY` | empty | SendGrid email key (optional) |

### Health Checks

All services have built-in health checks:

| Service | Check Method | Interval |
|---------|-------------|----------|
| PostgreSQL | `pg_isready` | 10s |
| Backend | `curl http://localhost:8000/health` | 30s |
| Frontend | `wget http://localhost:3000` | 30s |

### Docker Troubleshooting

**Container won't start:**
```bash
docker compose logs <service-name>
docker compose build --no-cache <service-name>
```

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

**Database connection refused:**
```bash
# Ensure db is healthy first
docker compose up -d db
docker compose logs db
# Then start backend
docker compose up -d backend
```

**Reset everything:**
```bash
docker compose down -v
docker compose up -d
```

---

## Production Deployment

### Option 1: Docker on VPS (DigitalOcean/AWS EC2/Hetzner)

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone and configure
git clone https://github.com/shubham-kr2002/careops.git
cd careops
cp .env.example .env

# 4. Edit .env with production values
nano .env
# Set: SECRET_KEY, JWT_SECRET_KEY, GROQ_API_KEY, etc.
# Set: APP_ENV=production, DEBUG=false

# 5. Remove dev override for production
mv docker-compose.override.yml docker-compose.override.yml.bak

# 6. Build and start
docker compose build --no-cache
docker compose up -d

# 7. Verify
docker compose ps
curl http://localhost:8000/health
```

### Option 2: Frontend on Vercel + Backend on Railway

**Frontend (Vercel):**
1. Push code to GitHub
2. Go to [Vercel](https://vercel.com/) → Import repository
3. Set root directory to `careops-frontend`
4. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url/api/v1`
5. Deploy

**Backend (Railway/Render):**
1. Go to [Railway](https://railway.app/) → New Project → Deploy from GitHub
2. Set root directory to `careops-backend`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add PostgreSQL addon
5. Set all environment variables (SECRET_KEY, JWT_SECRET_KEY, DATABASE_URL, etc.)
6. Deploy

### Option 3: Database on Supabase

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Get the connection string from Settings → Database
4. Use in your backend's `DATABASE_URL`

---

## Phase 10: Advanced AI Features (New)

### Analytics Dashboard

**Endpoint:** `GET /api/v1/analytics/overview?period=30d`

Features:
- KPI cards: Bookings, Contacts, Revenue, Forms, Conversations, Low Stock
- Period selector: 7d, 30d, 90d
- Growth indicators vs previous period
- Access: `/dashboard/analytics`

**Available Endpoints:**
- `GET /analytics/overview` — KPI aggregation
- `GET /analytics/trends` — Time-series data (bookings, contacts, revenue)
- `GET /analytics/ai-insights` — AI-generated business insights

### Reports Dashboard

**Endpoint:** `GET /api/v1/reports/weekly` or `/monthly`

Features:
- Weekly/Monthly comparison reports
- Metric changes with % deltas
- AI-powered report summary
- CSV export for offline analysis
- Access: `/dashboard/reports`

**Available Endpoints:**
- `GET /reports/weekly` — Weekly metrics
- `GET /reports/monthly` — Monthly metrics
- `POST /reports/ai-summary` — AI analysis with recommendations
- `GET /reports/export?period=monthly` — CSV download

### Equipment & Maintenance

**Endpoints:** `GET/POST /api/v1/equipment/`

Features:
- Equipment inventory tracking
- Status: active, needs_maintenance, out_of_service
- Maintenance logging (routine, repair, inspection)
- AI predictive maintenance with risk levels
- Access: `/dashboard/maintenance`

**Available Endpoints:**
- `POST /equipment/` — Create equipment
- `GET /equipment/` — List all equipment
- `GET /equipment/{id}` — Get details
- `PATCH /equipment/{id}` — Update
- `DELETE /equipment/{id}` — Delete
- `POST /equipment/{id}/maintenance` — Log maintenance
- `GET /equipment/{id}/maintenance` — View history
- `GET /equipment/predictions/all` — AI predictions (risk scoring)

### AI Enhancement Endpoints

**Language Services:**
- `POST /api/v1/ai/translate` — Translate text to any language
- `POST /api/v1/ai/detect-language` — Auto-detect message language

**Analytics:**
- `POST /api/v1/ai/segment-contacts` — AI contact segmentation (VIP, regular, etc.)
- `POST /api/v1/ai/maintenance-predictions` — Equipment maintenance needs

### Public Chatbot API

**Endpoint:** `POST /api/public/workspaces/{slug}/chat` (no authentication)

Features:
- Floating chat widget for website visitors
- No login required
- Auto-creates Contact on first message
- AI processes inquiries using same models as internal system
- Optionally collects visitor name/email

**Frontend Component:**
```tsx
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget'

export default function MyPage() {
  return (
    <>
      {/* Your page content */}
      <ChatbotWidget 
        workspaceSlug="your-workspace-slug"
        primaryColor="#3b82f6"
        title="CareOps Assistant"
      />
    </>
  )
}
```

### WhatsApp Integration

**Features:**
- Incoming message → Auto-create Contact + Conversation
- AI processes message with full context
- Response sent back via WhatsApp
- Activity tracked on contact record

**Webhook Verification:**
At startup, Meta sends verification request to:
```
GET /api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=careops_whatsapp_verify&hub.challenge=CHALLENGE_STRING
```
Backend responds with the challenge token.

**Incoming Messages:**
```
POST /api/v1/webhooks/whatsapp
Content: WhatsApp message payload
```
Response: `{"status": "ok"}`

### Slack Integration

**Features:**
- Send booking notifications to channels
- Maintenance alerts for equipment
- `/careops status` command
- Connect your Slack workspace in Settings

**Webhook Endpoint:**
```
POST /api/v1/webhooks/slack/events
```

**Slash Command Endpoint:**
```
POST /api/v1/webhooks/slack/commands
```

---

## Quick Start Checklist

### Docker Method (Recommended)
- [ ] Install Docker Desktop
- [ ] Clone repository: `git clone https://github.com/shubham-kr2002/careops.git`
- [ ] Run: `docker compose up -d`
- [ ] Open http://localhost:3000
- [ ] Login with `admin@careops.com` / `Admin@123`
- [ ] (Optional) Set `GROQ_API_KEY` in `.env` for AI features
- [ ] (Optional) Set `SENDGRID_API_KEY` for email
- [ ] (Optional) Set WhatsApp/Slack credentials

### Manual Method
- [ ] Install PostgreSQL, Python 3.12+, Node.js 20+
- [ ] Create PostgreSQL database named `careops`
- [ ] Copy `careops-backend/.env.example` → `careops-backend/.env`
- [ ] Set `SECRET_KEY` and `JWT_SECRET_KEY` in `.env`
- [ ] Run: `cd careops-backend && pip install -r requirements.txt`
- [ ] Run migrations: `alembic upgrade head`
- [ ] Seed data: `python seed_data.py`
- [ ] Start backend: `uvicorn app.main:app --reload`
- [ ] In new terminal: `cd careops-frontend && npm install && npm run dev`
- [ ] Open http://localhost:3000
- [ ] Login with `admin@careops.com` / `Admin@123`

### Verify Features
- [ ] Test Analytics dashboard: `/dashboard/analytics`
- [ ] Test Reports: `/dashboard/reports`
- [ ] Test Maintenance: `/dashboard/maintenance`
- [ ] Test Bookings: `/dashboard/bookings`
- [ ] Test Inbox: `/dashboard/inbox`

---

## Troubleshooting

### Common Issues

**"Connection refused" errors**
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct

**Email/SMS not sending**
- Verify API keys are correct
- Check API key permissions
- Check for sandbox mode restrictions

**OAuth callback not working**
- Verify redirect URI matches exactly in Google Console
- Check firewall/network settings

**AI features not working**
- Verify Groq API key is set
- Check API key has remaining quota

**WhatsApp messages not received**
- Verify webhook callback URL is accessible from internet
- Check webhook is subscribed to "messages" event
- Verify WHATSAPP_VERIFY_TOKEN matches Meta Console
- Check app secret is correct
- Ensure phone number is in the right format (international)

**Slack notifications not sending**
- Verify bot token has correct scopes (`chat:write`, `channels:read`)
- Check channel name is correct (with # prefix)
- Verify Slack app is installed to workspace
- Check signing secret for webhook verification

**Analytics/Reports pages showing no data**
- Ensure database migrations have run: `alembic upgrade head`
- Check backend API is accessible: `http://localhost:8000/api/v1/analytics/overview`
- Verify auth token is being sent in requests
- Check timestamps on bookings/contacts are recent

**Chatbot widget not appearing**
- Verify `workspaceSlug` matches your workspace's slug
- Check browser console for errors
- Ensure API endpoint is accessible: `POST /api/public/workspaces/{slug}/chat`
- Check CORS is configured correctly in backend

---

## Testing New Phase 10 Features

### Testing Analytics Endpoints

```bash
# Get KPI overview for last 30 days
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/analytics/overview?period=30d

# Get trend data
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/analytics/trends?period=30d

# Get AI insights
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/analytics/ai-insights
```

### Testing AI Features

```bash
# Translate text
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "target_language": "es"}' \
  http://localhost:8000/api/v1/ai/translate

# Detect language
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola mundo"}' \
  http://localhost:8000/api/v1/ai/detect-language

# Segment contacts
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/ai/segment-contacts
```

### Testing Public Chatbot (No Auth Required)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to book an appointment",
    "visitor_name": "John Doe",
    "visitor_email": "john@example.com"
  }' \
  http://localhost:8000/api/public/workspaces/your-workspace-slug/chat
```

Expected response:
```json
{
  "response": "I'd be happy to help you book an appointment. Could you let me know which service you're interested in?",
  "intent": "booking",
  "sentiment": "positive",
  "conversation_id": "uuid",
  "contact_id": "uuid"
}
```

### Testing Equipment Endpoints

```bash
# List all equipment
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/equipment/

# Get maintenance predictions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/equipment/predictions/all
```

---

## Support

For issues or questions, refer to:
- Backend API docs: `http://localhost:8000/docs`
- Project documentation in `docs/`
