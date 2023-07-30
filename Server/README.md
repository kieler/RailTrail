# Railtrail Backend

## Devlopment setup

### Docker

First fire up the `docker-compose-dev.yml` to get the database running on your system:

```bash
docker-compose -f docker-compose-dev.yml up -d
```

### Express.js

To start developing the express.js backend use the following commands:

```bash
npm install
npm run dev
```

This will start the application and automatically restarts it on file change.

### Prisma

To generate the prisma client and push the changes to the database use this command:

```bash
npm run prisma
```

And if you want to inscept the database with the corresponding prisma schema use the follwing command to start prisma studio:

```bash
npx prisma studio
```
