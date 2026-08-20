# API Overview

Base path: `/api/v1`. FastAPI will publish the definitive OpenAPI document at
`/openapi.json` and Swagger UI at `/docs` once the application is implemented.

| Area | Major endpoints |
| --- | --- |
| Authentication | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Users and roles | `GET/POST /users`, `GET/PATCH /users/{id}`, `GET /roles` |
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/sales-chart` |
| Medicines | `GET/POST /medicines`, `GET/PATCH /medicines/{id}`, `GET /medicines/search` |
| Inventory and batches | `GET /batches`, `POST /inventory/stock-in`, `POST /inventory/adjustments`, `GET /inventory/transactions` |
| Suppliers and purchasing | `GET/POST /suppliers`, `GET/POST /purchases`, `POST /purchases/{id}/receive`, `POST /purchases/{id}/payments` |
| POS and sales | `POST /sales`, `GET /sales`, `GET /sales/{id}`, `POST /sales/{id}/payments`, `GET /sales/{id}/receipt` |
| Customers and prescriptions | `GET/POST /customers`, `GET/PATCH /customers/{id}`, `GET/POST /prescriptions`, `GET /prescriptions/{id}` |
| Reports | `GET /reports/sales`, `GET /reports/profit`, `GET /reports/inventory`, `GET /reports/expiry`, `GET /reports/best-sellers` |
| Notifications | `GET /notifications`, `PATCH /notifications/{id}/read` |
| Forecasts | `GET /forecasts/demand`, `POST /forecasts/runs`, `GET /forecasts/reorder-recommendations` |
| Assistant (optional) | `POST /assistant/questions` |

List endpoints use pagination and appropriate date/filter query parameters.
Write endpoints validate Pydantic request models and return no secret fields.
