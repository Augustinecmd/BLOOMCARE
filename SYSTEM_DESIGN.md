# early Pregnancy Monitoring System - System Design

## 1. System overview

A health-monitoring and education platform for pregnant people during early
pregnancy, healthcare providers, and administrators. It records patient-entered
measurements, appointments, and approved education content. It is not a medical
diagnosis, treatment, or emergency service.

## 2. Functional requirements

Patient functions: account registration and authentication; consent capture;
pregnancy profile; daily measurements and symptoms; appointment and medication
reminders; stage-based education; emergency contacts and warning-sign guidance.

Provider functions: authorised patient list, profile and longitudinal record
review, clinical notes, follow-up tracking, and review queues.

Administrator functions: user, provider, facility, education, notification, and
audit-log management.

## 3. Non-functional requirements

- Responsive WCAG 2.2 AA interface with keyboard-accessible forms.
- HTTPS, secure sessions, availability monitoring, backups, and auditability.
- Data minimisation, consent recording, retention policy, and applicable privacy-law compliance.
- Server-side validation, pagination, and clear recovery from failed requests.
- Time-zone-aware dates and reliable notification delivery with retry handling.

## 4. Roles and permissions

| Role          | Permissions                                                                       |
| ------------- | --------------------------------------------------------------------------------- |
| Patient       | Access only their profile, records, reminders, contacts, and education.           |
| Provider      | Access only explicitly assigned patients; add clinical notes and follow-ups.      |
| Administrator | Manage approved users, providers, facilities, content, notifications, and audits. |

Enforce permissions on every server endpoint, not merely in the UI.

## 5. System architecture

`Browser UI -> HTTPS REST API -> application service -> PostgreSQL`

The application service also connects to a background job worker for reminders
and a transactional email/SMS provider. Store secrets in a vault, files in
private encrypted object storage, and send audit events to an append-only log.
Use Node.js/Express (or Django) with PostgreSQL; both support the required REST,
role controls, migrations, and background work.

## 6. Database schema / ERD

`users` 1--* `pregnancies`; `users` 1--* `emergency_contacts`; `pregnancies`
1--* `pregnancy_measurements`, `symptoms`, `appointments`, `medications`, and
`medical_notes`. `healthcare_facilities` 1--* `healthcare_providers`; providers
are linked to patients through `provider_patient_assignments`. `users` 1--*
`notifications` and `audit_logs`; `educational_content` is scoped by week range.

Core fields:

- `users(id, role, name, email unique, phone, date_of_birth, password_hash, consented_at, created_at)`
- `pregnancies(id, user_id FK, lmp_date, estimated_due_date, previous_pregnancies, medical_history, allergies, medications_summary, facility_id FK)`
- `pregnancy_measurements(id, pregnancy_id FK, recorded_at, weight_kg, systolic_bp, diastolic_bp, temperature_c, wellbeing, notes)`
- `symptoms(id, pregnancy_id FK, type, severity, started_at, notes, requires_review)`
- `appointments(id, pregnancy_id FK, provider_id FK, starts_at, status, notes)`
- `medications(id, pregnancy_id FK, name, instructions, reminder_time, active)`
- `medical_notes(id, pregnancy_id FK, provider_id FK, body, created_at)`
- `notifications(id, user_id FK, type, body, scheduled_for, read_at)`
- `audit_logs(id, actor_user_id FK, action, entity_type, entity_id, occurred_at, metadata)`

## 7. Recommended folder structure

```text
early-pregnancy-monitor/
  client/src/{pages,components,services,styles}
  server/src/{routes,controllers,services,middleware,jobs}
  server/migrations/
  server/tests/
  docs/
```

## 8. UI page structure

Public: welcome, sign in, registration, password reset, privacy/consent.
Patient: dashboard, pregnancy profile, daily check-in, symptoms, appointments,
medications, education, emergency support, settings. Provider: patient list,
patient detail, follow-ups. Admin: overview, users, facilities, providers,
content, notifications, audit logs.

## 9. API endpoints

`POST /auth/register`, `POST /auth/login`, `POST /auth/logout`,
`POST /auth/password-reset`; `GET|PATCH /me`; `GET|POST|PATCH /pregnancies`;
`GET|POST /measurements`; `GET|POST /symptoms`; `GET|POST|PATCH /appointments`;
`GET|POST|PATCH /medications`; `GET /education?week=`; `GET /emergency-support`.

Provider routes: `GET /provider/patients`, `GET /provider/patients/:id`,
`POST /provider/patients/:id/notes`, `POST /provider/follow-ups`. Admin routes:
`/admin/users`, `/admin/providers`, `/admin/facilities`, `/admin/content`, and
`/admin/audit-logs`. All endpoints need authenticated, role-checked access.

## 10. Security considerations

Use Argon2id password hashing, short-lived access tokens plus rotating secure
HTTP-only refresh cookies, rate limiting, CSRF protection where cookies are
used, strong server-side validation, parameterised database queries, encrypted
backups, least-privilege database credentials, audit logging, and security
headers. Encrypt sensitive fields where justified and establish documented
breach response, consent withdrawal, retention, and access-review processes.

## 11. Development steps

1. Confirm regulatory, consent, clinical-content, and notification requirements.
2. Build authentication, RBAC, migrations, facilities, and audit logging.
3. Implement profile and dashboard APIs, then the patient UI.
4. Add measurements, symptoms, appointments, medication reminders, and education.
5. Build provider and admin workflows with assignment-based access.
6. Add automated unit, API, accessibility, security, and end-to-end tests.
7. Complete clinical review, threat modelling, backup/recovery testing, and monitored deployment.
