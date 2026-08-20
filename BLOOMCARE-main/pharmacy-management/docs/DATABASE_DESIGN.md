# Database Design

All primary keys are UUIDs. Tables include `created_at` and `updated_at` unless
noted otherwise. Monetary values use `numeric(12,2)`, quantities use
`numeric(12,3)`, and dates/times are stored in UTC where applicable.

## Identity and authorization

| Table | Key fields | Relationships |
| --- | --- | --- |
| `roles` | `id`, `name` (unique), `description` | Seeded: admin, pharmacist, cashier, inventory_officer. |
| `users` | `id`, `role_id`, `full_name`, `email` (unique), `password_hash`, `is_active`, `last_login_at` | Many users belong to one role. |

## Catalogue and inventory

| Table | Key fields | Relationships |
| --- | --- | --- |
| `categories` | `id`, `name` (unique), `description` | One category has many medicines. |
| `medicines` | `id`, `category_id`, `name`, `generic_name`, `description`, `minimum_stock_level`, `barcode` (unique nullable), `is_active` | The product master; it holds no batch-specific price or expiry. |
| `suppliers` | `id`, `name`, `contact_name`, `email`, `phone`, `address`, `is_active` | One supplier has many purchases and batches. |
| `batches` | `id`, `medicine_id`, `supplier_id`, `batch_number`, `expiry_date`, `received_quantity`, `available_quantity`, `unit_buying_price`, `unit_selling_price` | Unique on `(medicine_id, batch_number)`; source of FEFO allocation. |
| `inventory_transactions` | `id`, `batch_id`, `transaction_type`, `quantity_delta`, `reference_type`, `reference_id`, `notes`, `performed_by_user_id`, `occurred_at` | Append-only stock ledger for receipt, sale, adjustment, return, and expiry write-off. |

## Procurement

| Table | Key fields | Relationships |
| --- | --- | --- |
| `purchases` | `id`, `supplier_id`, `purchase_number` (unique), `status`, `ordered_at`, `received_at`, `total_amount`, `created_by_user_id` | One purchase has many items and payments. |
| `purchase_items` | `id`, `purchase_id`, `medicine_id`, `batch_id` nullable, `quantity`, `unit_cost`, `line_total` | Batch becomes required once an item is received. |
| `supplier_payments` | `id`, `purchase_id`, `amount`, `method`, `paid_at`, `reference_number` | Records payments to suppliers. |

## Customer, prescription, and sale

| Table | Key fields | Relationships |
| --- | --- | --- |
| `customers` | `id`, `full_name`, `phone`, `email`, `date_of_birth`, `address` | Optional on a sale; patient data is minimized. |
| `prescriptions` | `id`, `customer_id`, `prescriber_name`, `prescriber_license`, `prescription_date`, `notes`, `recorded_by_user_id` | One prescription has many prescribed items and may link to sales. |
| `prescription_items` | `id`, `prescription_id`, `medicine_id`, `dosage`, `instructions`, `quantity_prescribed` | Prescribed product and directions as supplied by the prescriber. |
| `sales` | `id`, `sale_number` (unique), `customer_id` nullable, `prescription_id` nullable, `cashier_user_id`, `status`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `sold_at` | One sale has many items and payments. |
| `sale_items` | `id`, `sale_id`, `medicine_id`, `batch_id`, `quantity`, `unit_price`, `discount_amount`, `line_total`, `unit_cost_at_sale` | Each item references its allocated batch for traceability and profit. |
| `payments` | `id`, `sale_id`, `amount`, `method`, `reference_number`, `paid_at` | A sale can have split payments. |

## Communications and analytics

| Table | Key fields | Relationships |
| --- | --- | --- |
| `notifications` | `id`, `user_id` nullable, `type`, `severity`, `title`, `body`, `entity_type`, `entity_id`, `read_at` | Created by alert rules or authorized staff. |
| `forecast_runs` | `id`, `model_version`, `training_start`, `training_end`, `generated_at`, `metrics_json` | One run produces many predictions. |
| `demand_predictions` | `id`, `forecast_run_id`, `medicine_id`, `forecast_date`, `predicted_quantity`, `reorder_quantity`, `expected_stockout_date`, `confidence_score` | Unique on `(forecast_run_id, medicine_id, forecast_date)`. |

## Essential constraints and indexes

- Check that all quantities and monetary amounts are non-negative where relevant.
- Index medicine names/generic names, `batches(medicine_id, expiry_date)`,
  inventory reference fields, and sales/purchase dates.
- Restrict deleting medicines, suppliers, customers, and users that have history;
  use `is_active` flags instead.
- A completed sale writes `sale_items`, payment records, inventory ledger rows,
  and batch quantity changes in one transaction.
