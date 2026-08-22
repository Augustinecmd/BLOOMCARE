# System Architecture

## Design principles

The system is a modular monolith: one React application and one FastAPI service
with clear module boundaries. This keeps the MVP straightforward to deploy while
allowing forecasting or notification workers to be extracted later if scale
requires it.

## Components

```text
React web client
  | HTTPS / JSON
FastAPI API
  |-- API routes: authentication, pharmacy operations, reporting
  |-- application services: authorization and business rules
  |-- persistence: SQLAlchemy + Alembic
  |-- ML service: demand forecasts and reorder recommendations
  |-- worker boundary: scheduled alerts and forecast refreshes (future)
PostgreSQL
```

The frontend contains feature modules, pages, shared components, API clients,
and route protection. The API owns all authorization and validation; the client
is never trusted to enforce permissions or calculate final financial values.

## Operational rules

- Store configuration and secrets in environment variables only.
- Use Argon2 password hashing and short-lived JWT access tokens.
- Apply role checks at route and service boundaries.
- Use database transactions for purchase receipt, sales completion, payments,
  and inventory adjustments.
- Allocate sales from eligible batches by FEFO order in a transaction.
- Keep immutable inventory and financial transaction records; correct through
  documented adjustments or reversals rather than destructive edits.

## AI boundaries

The forecasting service reads aggregated historical sales, creates auditable
forecasts, and persists forecast metadata, results, and confidence information.
Initial models use per-medicine time-series features with a regression baseline.
It must never create orders automatically.

The optional pharmacy assistant retrieves approved database facts such as
medicine labels, stock availability, and pharmacy policies. It must refuse
diagnosis, prescription, dosage selection, and emergency advice, directing users
to a licensed professional where appropriate.
