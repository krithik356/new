# Employee Contribution Automation API

Backend API for Employee Contribution Automation System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
NODE_ENV=development
```

3. Run the server:
```bash
npm run dev
```

4. Seed the database (optional):
```bash
npm run seed
```

## API Endpoints

- `/api/health` - Health check
- `/api/auth/login` - User login
- `/api/auth/users` - Create user (Admin only)
- `/api/departments` - Department management
- `/api/employees` - Employee management
- `/api/contributions` - Contribution management
- `/api/contributions/export` - Export contributions to Excel

