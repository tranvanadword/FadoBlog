# FadoBlog Production Checklist

## 1. Environment

Copy `.env.example` to the production environment and configure:

```text
DATABASE_URL="postgresql://user:password@host:5432/fadoblog?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="replace-with-a-strong-password"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5.6"
CRON_SECRET="replace-with-a-random-cron-secret"
```

Keep `.env` private. Do not commit real secrets.

## 2. Database

Run these commands after PostgreSQL is ready:

```powershell
pnpm prisma:generate
pnpm db:deploy
pnpm db:seed
```

`db:deploy` applies existing migrations. `db:seed` creates the first admin account, default categories, tags, pages and one sample post.

## 3. Build

```powershell
pnpm prod:check
pnpm start
```

## 4. Smoke Test

Open these URLs:

- `/api/health`
- `/`
- `/admin/login`
- `/admin/posts`
- `/admin/ai-workflows`
- `/admin/analytics`
- `/page/lien-he`
- `/rss.xml`
- `/sitemap.xml`

Expected health check:

```json
{
  "ok": true,
  "checks": {
    "database": "postgresql",
    "openAi": "configured",
    "cronSecret": "configured"
  }
}
```

## 5. Scheduled AI Workflow

Call scheduled workflows from a cron service:

```text
POST https://your-domain.com/api/ai/run-scheduled
Authorization: Bearer <CRON_SECRET>
```

Recommended schedule: every 1-6 hours, depending on content volume.

Do not pass `CRON_SECRET` in the URL query string. Use the `Authorization` header or `x-cron-secret` header.

## 6. Backup

Before launch, prepare backups for:

- PostgreSQL database.
- Cloudflare R2 bucket `fadoblog-media` or `public/uploads` media files when running locally.
- Environment variables.

Run a restore test at least once before using the site for real content.
