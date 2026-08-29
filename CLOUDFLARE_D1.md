# FadoBlog Cloudflare D1

Muc tieu: dua database cua FadoBlog len Cloudflare D1, media len R2, va deploy Next.js qua Cloudflare Workers/OpenNext.

## 1. Tao database D1

Dang nhap Cloudflare:

```bash
pnpm exec wrangler login
```

Tao database:

```bash
pnpm cf:d1:create
```

Sau khi tao xong, Cloudflare se tra ve `database_id`. Hay thay gia tri `REPLACE_WITH_D1_DATABASE_ID` trong `wrangler.jsonc` bang ID that.

## 2. Tao bucket media R2

Tao bucket:

```bash
pnpm exec wrangler r2 bucket create fadoblog-media
```

Bucket nay da duoc khai bao san trong `wrangler.jsonc` voi binding `FADOBLOG_MEDIA`.

Neu Cloudflare bao `Please enable R2 through the Cloudflare Dashboard`, hay bat R2 trong Dashboard truoc. Tam thoi co the deploy khong can R2; media metadata van luu D1, con upload file that se gan R2 sau.

## 3. Chay migration D1

Chay local truoc:

```bash
pnpm cf:d1:migrate:local
pnpm cf:d1:seed:local
```

Sau khi on, chay len Cloudflare:

```bash
pnpm cf:d1:migrate:remote
pnpm cf:d1:seed:remote
```

## 4. Khai bao bien moi truong

Tao file `.dev.vars` tu `.dev.vars.example` de preview local tren Cloudflare runtime.

Tren Cloudflare Dashboard, them cac bien sau vao Worker:

```text
FADOBLOG_DATA_BACKEND=d1
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_SITE_URL
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_ROLE
OPENAI_API_KEY
OPENAI_MODEL
CRON_SECRET
```

## 5. Build va deploy

Preview:

```bash
pnpm cf:preview
```

Deploy:

```bash
pnpm cf:deploy
```

Neu build OpenNext tren Windows bi loi doc thu muc trong `.open-next`, hay chay cac lenh Cloudflare trong WSL hoac CI Linux. Next build cua app van co the pass tren Windows, nhung adapter OpenNext hien co canh bao khong tuong thich hoan toan voi Windows.

## 6. Deploy bang GitHub Actions

Workflow `.github/workflows/cloudflare-deploy.yml` da duoc them san. De workflow chay duoc, cau hinh trong GitHub repo:

Secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
NEXTAUTH_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
OPENAI_API_KEY
CRON_SECRET
```

Variables:

```text
NEXTAUTH_URL
NEXT_PUBLIC_SITE_URL
```

Truoc khi workflow deploy, can thay `REPLACE_WITH_D1_DATABASE_ID` trong `wrangler.jsonc` bang database id that cua D1.

## Ghi chu hien tai

FadoBlog hien dang co 3 che do du lieu:

- Local JSON: dung khi chay local va khong co `DATABASE_URL`.
- PostgreSQL/Prisma: dung khi co `DATABASE_URL`.
- Cloudflare D1: dung khi `FADOBLOG_DATA_BACKEND=d1` va Worker co binding `DB`.

Lop D1 adapter hien da phu cac phan loi:

- Settings va navigation.
- Categories, tags, posts, pages.
- Post revisions.
- Media metadata.
- Contact messages.
- Page views va analytics.
- Audit logs nhe.
- User management va login admin.

AI workflow/jobs se noi tiep vao D1 trong buoc sau. Khi bat D1, lan dang nhap dau tien bang env admin co the tao user admin mac dinh trong bang `User`.
