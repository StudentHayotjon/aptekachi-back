# Railway deployment

This repository contains two independent Node.js services. Create both services from the same GitHub repository in one Railway project, then add PostgreSQL. A railway.json configures one service; it does not create the other services or database.

## One-time Railway settings

| Setting | core-service | ocr-service |
| --- | --- | --- |
| Service name | core-service | ocr-service |
| Root Directory | /apps/core-service | /apps/ocr-service |
| Config File path | /apps/core-service/railway.json | /apps/ocr-service/railway.json |
| Source branch | main | main |

The Config File path is relative to the repository root, independently of Root Directory. Enable automatic deployment from the selected branch. Config files define build/start commands, healthchecks and restart policy; core also runs committed Prisma migrations before starting. Node 24 is selected through package.json engines. Prisma CLI is a production dependency so migrations remain available after dependency pruning.

## Variables

Name the database service `Postgres`, or adjust the references below to its actual name.

core-service:

```dotenv
NODE_ENV=production
PORT=3001
TZ=Asia/Tashkent
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=REPLACE_WITH_A_RANDOM_SECRET
OCR_SERVICE_URL=http://${{ocr-service.RAILWAY_PRIVATE_DOMAIN}}:3000
DMED_MODE=mock
```

Generate a JWT secret locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` and paste it only into Railway Variables.

ocr-service:

```dotenv
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=REPLACE_WITH_YOUR_GEMINI_API_KEY
```

Never commit real secrets or .env files. DMED remains in mock mode. Keep core at one replica while its scheduled jobs run inside the API process.

## Storage and networking

Attach a persistent Volume to core-service at `/app/uploads`; prescription images are stored there. Keep the OCR service private. Generate a public domain for core-service with target port 3001.

Deploy after setting variables and storage. Open `https://YOUR_DOMAIN/health`; expected response is `{"success":true,"message":"OK"}`. This endpoint checks HTTP availability only; separately verify database-backed login and a prescription OCR upload. Review core migration logs and OCR logs if either operation fails.

## Local build checks

Run `npm ci` then `npm run build` from each service directory with Node 24. Core builds Prisma Client before compiling TypeScript. Use `npm run prisma:deploy` only against the intended deployment database; do not run development migrations in production.

## References

- https://docs.railway.com/deployments/monorepo
- https://docs.railway.com/config-as-code/reference
- https://docs.railway.com/variables
- https://docs.railway.com/volumes
- https://railpack.com/languages/node
