# Pharmacy Management System

This repository is the initial scaffold for a secure pharmacy operations system.
It intentionally contains configuration, architecture, and project structure only;
business features will be added phase by phase.

## Technology

- Frontend: React, TypeScript, Vite
- Backend: Python, FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL
- Authentication: JWT with role-based authorization
- Forecasting: Pandas, NumPy, scikit-learn

## Layout

- `frontend/` — responsive React application
- `backend/` — FastAPI service, database migrations, and tests
- `docs/` — architecture, API, and data-design documentation
- `infra/` — local container configuration

## Next step

Start Phase 1 by implementing the FastAPI application configuration, database
connection, Alembic migration setup, and authenticated user/role endpoints.
