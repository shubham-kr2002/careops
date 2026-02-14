# CareOps Backup & Disaster Recovery Guide

## Overview
This document outlines the backup and disaster recovery procedures for the CareOps system.

---

## 1. Database Backup Strategy

### Automated Daily Backups (Supabase)

Supabase provides automatic daily backups. Configure retention:

```bash
# In Supabase Dashboard:
# Settings -> Database -> Backups
# Set retention to 30 days (recommended)
```

### Manual Database Backup

```bash
# Using pg_dump
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > careops_backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -h db.xxx.supabase.co -U postgres -d postgres | gzip > careops_backup_$(date +%Y%m%d).sql.gz
```

### Point-in-Time Recovery (PITR)

Supabase supports PITR. To recover to a specific point:

```bash
# Contact Supabase support or use dashboard
# Select recovery point and create new database
```

---

## 2. Application Backup

### Configuration Files
```bash
# Backup configuration (exclude secrets)
cp .env.production.example backup/
cp docker-compose.yml backup/
cp railway.json backup/
cp vercel.json backup/
```

### Docker Volumes
```bash
# If using local deployment
docker volume backup careops-postgres > postgres_backup_$(date +%Y%m%d).tar.gz
```

---

## 3. Disaster Recovery Procedures

### Scenario 1: Database Failure

1. **Check Supabase Status**
   - Visit https://status.supabase.com
   
2. **If Supabase Down**
   - Wait for Supabase to recover
   - Use latest backup if needed

3. **Restore from Backup**
   ```bash
   psql -h db.xxx.supabase.co -U postgres -d postgres < careops_backup.sql
   ```

### Scenario 2: Backend API Failure

1. **Check Railway/Render Status**
   - Visit Railway dashboard or status.render.com

2. **Rollback Deployment**
   - In Railway dashboard: Deployments → Previous successful deployment → Redeploy

3. **If Complete Loss**
   - Connect Railway to GitHub repo
   - Trigger new deployment

### Scenario 3: Frontend Failure

1. **Check Vercel Status**
   - Visit https://vercel.status.com

2. **Rollback**
   - In Vercel dashboard: Deployments → Previous → Promote to Production

### Scenario 4: Full System Failure

1. **Database**
   - Provision new Supabase project
   - Restore from latest backup

2. **Backend**
   - Deploy new Railway service
   - Update environment variables

3. **Frontend**
   - Deploy to new Vercel project or use existing

---

## 4. Recovery Time Objectives (RTO)

| Component | Target RTO | Procedure |
|-----------|------------|-----------|
| Database | 30 min | Supabase auto-failover + restore |
| Backend API | 15 min | Railway auto-restart or rollback |
| Frontend | 5 min | Vercel CDN failover |

---

## 5. Monitoring & Alerts

### Health Check Endpoints
```bash
# Backend health
curl https://api.yourdomain.com/health

# Response: {"success":true,"status":"healthy","timestamp":"..."}
```

### Uptime Monitoring
- Use UptimeRobot or similar service
- Monitor both frontend and backend
- Set 5-minute check interval

---

## 6. Backup Verification

### Test Restore Monthly

```bash
# 1. Create test database
psql -h localhost -U postgres -c "CREATE DATABASE careops_test_restore;"

# 2. Restore to test
psql -h localhost -U postgres -d careops_test_restore < backup.sql

# 3. Verify data
psql -h localhost -U postgres -d careops_test_restore -c "SELECT COUNT(*) FROM users;"
```

---

## 7. Security Considerations

- Store backups encrypted
- Use separate credentials for backup operations
- Rotate backup credentials quarterly
- Limit access to backup files

---

## 8. Contact Information

| Role | Contact |
|------|---------|
| Supabase Support | support@supabase.com |
| Railway Support | https://railway.app/support |
| Vercel Support | https://vercel.com/support |

---

## Quick Recovery Commands

```bash
# Quick health check
curl -f https://api.yourdomain.com/health || echo "API DOWN"

# Quick frontend check
curl -f https://yourdomain.com || echo "FRONTEND DOWN"

# Database connection test
pg_isready -h db.xxx.supabase.co -U postgres
```
