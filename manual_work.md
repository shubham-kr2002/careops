# CareOps Manual Setup Guide

This document outlines the manual setup steps required to get CareOps fully operational.

---

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [External API Keys](#external-api-keys)
3. [Database Setup](#database-setup)
4. [OAuth Configuration](#oauth-configuration)
5. [Production Deployment](#production-deployment)

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

## Production Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import the repository
4. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = your-production-backend-url
5. Deploy

### Backend (Railway/Render/DigitalOcean)

1. Prepare the backend for production:
   ```bash
   cd careops-backend
   pip install gunicorn
   ```

2. Create a `Procfile`:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

3. Deploy to your preferred platform
4. Set all environment variables

### Database (Supabase)

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Get the connection string from Settings → Database
4. Use in your backend's `DATABASE_URL`

---

## Quick Start Checklist

- [ ] Create PostgreSQL database
- [ ] Set backend environment variables
- [ ] Run database migrations
- [ ] Get SendGrid API key and verify email sending
- [ ] Get Twilio credentials and verify SMS sending
- [ ] Get Groq API key and verify AI responses
- [ ] (Optional) Configure Google Calendar OAuth
- [ ] (Optional) Configure AWS S3 or Cloudinary
- [ ] Start development servers:
  ```bash
  # Terminal 1
  cd careops-backend
  uvicorn app.main:app --reload
  
  # Terminal 2
  cd careops-frontend
  npm run dev
  ```

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

---

## Support

For issues or questions, refer to:
- Backend API docs: `http://localhost:8000/docs`
- Project documentation in `docs/`
