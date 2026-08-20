# Development Roadmap

## Phase 0 — Foundation (this scaffold)

Define architecture and data model; create the frontend/backend structure,
environment template, and local PostgreSQL container configuration.

## Phase 1 — Secure core (MVP)

Implement configuration, database session, migrations, roles/users, Argon2
password hashing, JWT authentication, RBAC, error responses, audit baseline,
and automated tests for authentication and authorization.

## Phase 2 — Catalogue and inventory (MVP)

Implement categories, medicines, suppliers, batches, stock receipt, inventory
ledger, FEFO allocation, low-stock/near-expiry queries, and their API tests.

## Phase 3 — Point of sale (MVP)

Implement customer records, cart/sale finalization, discounts, payment records,
receipt data, atomic stock deduction, and transaction history. Build the
dashboard summary and the minimum usable React screens.

## Phase 4 — Pharmacy workflows

Add purchase orders/receipts/payments, prescriptions and prescription history,
notification delivery, report exports, and richer role-specific UI flows.

## Phase 5 — Forecasting

Build reproducible sales-data aggregation, baseline regression/time-series
forecasting, offline evaluation, forecast-run persistence, reorder suggestions,
and dashboard visualizations.

## Phase 6 — Assistant and production hardening

Add the constrained database-grounded assistant, test its safety guardrails,
then complete backups, observability, security review, performance testing,
CI/CD, and deployment documentation.

## MVP definition

The first releasable version includes authentication/RBAC; medicine, supplier,
batch and inventory management; FEFO-aware POS; customer records; dashboard;
low-stock and near-expiry alerts; and core sales/inventory reports. Demand
forecasting, prescription workflows, supplier payments, and the assistant follow
after the transactional core is proven.
