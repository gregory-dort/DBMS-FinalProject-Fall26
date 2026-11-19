# DBMS-FinalProf-Fall26
Final Group Project for SWEG 4357/5357 Database Management Systems. Grocery Store Inventory Stock System implemented using MySQL connecting to a frontend webpage.

**Start here: [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).** It covers the decisions, architecture, work split and to-do list.
**Writing SQL? Read [docs/DATABASE_GUIDE.md](docs/DATABASE_GUIDE.md).** It covers MySQL setup, the Workbench workflow and file conventions.

## Quick start

Requires Node.js 22+ and MySQL 8.4 LTS.

```bash
npm install
cp server/.env.example server/.env    # set DB_PASSWORD to your local MySQL password
npm run db:reset                      # rebuild the database from db/
npm run dev                           # API on :3001, app on http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start API and web app together |
| `npm run db:reset` | Drop and rebuild the database (order in `db/build-order.txt`) |
| `npm run db:csv` | Regenerate `db/import/02_staging_data.sql` from the Kaggle CSV |
| `npm run typecheck` | Type-check server and client |
