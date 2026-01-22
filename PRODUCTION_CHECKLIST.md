# CiviLabs LMS - Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Variables (Required)
Set these in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled) | [Neon Dashboard](https://neon.tech) |
| `DIRECT_URL` | Neon PostgreSQL direct connection | [Neon Dashboard](https://neon.tech) |
| `NEXTAUTH_SECRET` | Random secret for session encryption | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your production URL | e.g., `https://civilabs.vercel.app` |

### 2. Environment Variables (Recommended)
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | [Google Cloud Console](https://console.cloud.google.com) |
| `UPLOADTHING_SECRET` | File upload secret | [UploadThing](https://uploadthing.com) |
| `UPLOADTHING_APP_ID` | File upload app ID | [UploadThing](https://uploadthing.com) |
| `RESEND_API_KEY` | Email service API key | [Resend](https://resend.com) |

### 3. Environment Variables (Monitoring & Security)
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking DSN | [Sentry](https://sentry.io) |
| `SENTRY_ORG` | Sentry organization slug | Sentry Settings |
| `SENTRY_PROJECT` | Sentry project slug | Sentry Settings |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps | Sentry Settings → Auth Tokens |
| `UPSTASH_REDIS_REST_URL` | Rate limiting Redis URL | [Upstash](https://upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting Redis token | [Upstash](https://upstash.com) |

### 4. Environment Variables (Real-time Chat - Optional)
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `PUSHER_APP_ID` | Pusher app ID | [Pusher](https://pusher.com) |
| `PUSHER_KEY` | Pusher key | [Pusher](https://pusher.com) |
| `PUSHER_SECRET` | Pusher secret | [Pusher](https://pusher.com) |
| `PUSHER_CLUSTER` | Pusher cluster | [Pusher](https://pusher.com) |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher public key | Same as PUSHER_KEY |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher public cluster | Same as PUSHER_CLUSTER |

---

## Deployment Steps

### Step 1: Connect to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link
```

### Step 2: Set Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add all required variables for Production environment

### Step 3: Deploy
```bash
# Deploy to production
vercel --prod
```

### Step 4: Run Database Migrations
After first deployment:
```bash
npx prisma db push
```

### Step 5: Seed Initial Data (Optional)
```bash
npx prisma db seed
```

---

## Post-Deployment Verification

### 1. Test Core Features
- [ ] Homepage loads correctly
- [ ] User can register
- [ ] User can login (email/password)
- [ ] User can login (Google OAuth - if configured)
- [ ] Dashboard displays correctly
- [ ] Course browsing works
- [ ] Course enrollment works
- [ ] Lesson playback works

### 2. Test Admin Features
- [ ] Admin dashboard loads
- [ ] User management works
- [ ] Course management works
- [ ] Reports generation works
- [ ] Audit logs are being recorded

### 3. Verify Monitoring
- [ ] Sentry is receiving errors (trigger a test error)
- [ ] Rate limiting is working (make rapid requests)
- [ ] Audit logs are being created

### 4. Performance Check
- [ ] Page load times are acceptable (<3s)
- [ ] API responses are fast (<500ms)
- [ ] Images are loading from CDN

---

## Security Checklist

- [ ] All API routes are protected with authentication
- [ ] Admin routes check for ADMIN role
- [ ] Rate limiting is active on all API routes
- [ ] CSRF protection is enabled (via NextAuth)
- [ ] XSS protection headers are set
- [ ] Content Security Policy is configured
- [ ] Sensitive data is not exposed in API responses
- [ ] Database credentials are not committed to git

---

## Monitoring & Alerts

### Sentry
- Set up alert rules for:
  - New errors
  - Error spike detection
  - Performance degradation

### Uptime Monitoring (Recommended)
Set up a service like:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Checkly](https://checklyhq.com)
- Vercel Analytics (built-in)

Monitor these endpoints:
- `https://your-domain.com/api/health` - Health check
- `https://your-domain.com` - Homepage

---

## Backup & Recovery

### Database Backups
Neon provides automatic backups. To restore:
1. Go to Neon Dashboard
2. Select your project
3. Go to Branches
4. Create a new branch from a point in time

### Manual Backup
```bash
# Export data
pg_dump $DATABASE_URL > backup.sql

# Import data
psql $DATABASE_URL < backup.sql
```

---

## Scaling Considerations

### When to Scale
- Response times >1s consistently
- Database connection pool exhausted
- Memory usage >80%

### Scaling Options
1. **Vercel Functions**: Increase memory/duration in vercel.json
2. **Database**: Upgrade Neon plan for more connections
3. **CDN**: Already included with Vercel
4. **Rate Limiting**: Upgrade Upstash plan

---

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Sentry Documentation](https://docs.sentry.io)
- [Prisma Documentation](https://www.prisma.io/docs)
