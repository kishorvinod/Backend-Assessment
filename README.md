# Backend-Assessment
Logezy - Backend Assignment

## Prerequisites
- Node.js (14+ recommended) and npm
- Docker (or a running PostgreSQL instance)
- Git (optional)


For this project we have used Prisma as the ORM

I have completed Module 1 and 4 in this assessment

## 1. Start Postgres (Docker)
Run a local Postgres container (example):
```bash
run on a local db using postgres image

move into the project directory

1. docker-compose up -d 

   this will create a local db which can be connected with pgadmin
```
If you already have Postgres, ensure it is reachable and note the host/port/credentials.

## 2. Environment variables
1. Copy the example env file:
```bash
cp .env.example .env
```

2. Edit `.env` to set your database connection values (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME) to match the Postgres instance started above.

## 3. Install dependencies
From the project root:
```bash
npm install
```

## 4. Database migrations
Check `package.json` for migration scripts (preferred). Common commands by ORM:

- If the project has a migration script:
```bash
npm run migrate
```

- Prisma:
```bash
npx prisma migrate deploy
# or for dev
npx prisma migrate dev


Then after making .env

1. npx prisma generate
2. npx prisma migrate dev --name initial
3. npm start
```


If no migration system exists, ensure any schema initialization scripts are run or the DB is prepared per project docs.

## 5. Start the application
For production:
```bash
npm start
```
For development with auto-reload (if available):
```bash
npm run dev
```

## 6. Verify
- Watch logs for successful DB connection and server start.
- Open the configured port (e.g., http://localhost:5001) or use API routes to confirm functionality.

## 7. API Documenation 
 - we have swagger funtions  implemeted so
 - http://localhost:5001/api-docs  - will help to test and view all apis 

 also postman collection is attached in project repo