# Canteen Management Backend

A backend service for managing canteen operations, including menu, orders, stores, and users. Built with Node.js, TypeScript, Prisma ORM, and Docker for easy deployment.

## Features

- User authentication (Supabase)
- Prisma ORM for database access
- Dockerized for easy deployment

## Tech Stack

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- Supabase (Authentication)
- Docker

## Getting Started

### Prerequisites

- Node.js (v16+)
- Docker & Docker Compose

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/canteenbackend35/canteen-management-backend.git
   cd canteen-management-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:

   - Copy `.env.example` to `.env` and fill in your values.

4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
5. (Optional) Seed the database:
   ```bash
   npx ts-node prisma/seed.ts
   ```

### Running Locally

- Start the development server:
  ```bash
  npm run dev
  ```

### Using Docker

- Build and start all services:
  ```bash
  docker-compose up --build
  ```

## API Endpoints

See the `src/routes/` folder for available endpoints:

- `/menu` - Menu management
- `/order` - Order processing
- `/store` - Store management
- `/user` - User operations

## Database

- Prisma schema is located at `prisma/schema.prisma`.
- Migrations are in `prisma/migrations/`.

## Global Configuration

### Global Config

Edit `src/config/global.ts` to set global values, such as redirect URLs:

```typescript
export const Global = {
  emailRedirectTo: "cc://auth/callback",
};
```

> **Note:** The `cc` scheme (e.g., `cc://auth/callback`) is referenced in the frontend application's `app.json` for deep linking and redirect purposes. Make sure the scheme matches between frontend and backend. This config here is only for backend reference—keep an eye on the frontend's `app.json` for correct scheme usage.

## Contribution

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request
