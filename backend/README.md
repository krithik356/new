# Employee Contribution Automation System – Backend

Node.js + Express + MongoDB backend managing departments, employees, users, and contribution allocations across Academy, Intensive, and NIAT products.

## Prerequisites

- Node.js 18+
- MongoDB Atlas cluster or local MongoDB instance

## Environment Variables

Copy `.env.example` to `.env` and update values:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/contributions_db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

Optional:

- `CORS_ORIGIN` – override default `*`
- `MONGODB_DB` – explicit database name when using Atlas connection strings without database suffix

## Installation & Scripts

```
npm install
npm run dev     # nodemon server
npm start       # production mode
npm run seed    # populate database with sample data
```

The seed script creates:

- 1 Admin user (`admin@organization.com` / `Admin@123`)
- 3 Departments with HOD accounts (`{DEPT_CODE}@organization.com`)
- Sample employees and baseline contributions

## API Overview

All JSON responses share `{ success, data?, message? }` structure.

### Auth

- `POST /api/auth/login` – obtain JWT
- `POST /api/auth/users` – Admin only, create Admin/HOD accounts

### Departments

- `GET /api/departments` – Admin list
- `GET /api/departments/:id` – Admin or owning HOD
- `POST /api/departments` – Admin create
- `PUT /api/departments/:id` – Admin update/assign HOD

### Employees

- `GET /api/employees?department=<id>` – Admin or owning HOD
- `POST /api/employees/seed` – Admin bulk insert employees

### Contributions

- `GET /api/contributions/all?cycle=2025-Q4` – Admin list (filtered)
- `GET /api/contributions/department/:departmentId` – Admin or owning HOD
- `POST /api/contributions` – HOD submit (enforces 100% total)
- `PUT /api/contributions/:id` – HOD (own dept) or Admin update
- `DELETE /api/contributions/:id` – Admin delete

### Export

- `GET /api/contributions/export?cycle=2025-Q4` – Admin download Excel (`exceljs`)

Headers:

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="contributions_<cycle>.xlsx"
```

## Development Notes

- JWT payload includes `{ id, role, department }`
- Middleware: `authenticate`, `authorizeRole`, `validateRequest`, global `errorHandler`
- `validators.js` enforces contribution totals (Academy + Intensive + NIAT = 100)
- `mongoose` schemas include required indexes and referential integrity
- Excel export populates department/HOD/submitter metadata in a single sheet

## Manual Verification Checklist

1. `npm run seed`
2. `npm run dev`
3. Login with seeded Admin (`/api/auth/login`)
4. Set `Authorization: Bearer <token>`
5. Create or update contributions via HOD account
6. Hit `/api/contributions/export` to confirm Excel download

