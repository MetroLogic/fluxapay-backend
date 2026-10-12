# Contributing to Fluxapay Backend

Thank you for your interest in contributing to **Fluxapay**! Fluxapay is an open-source payment gateway on the Stellar blockchain enabling merchants to accept stablecoins (USDC) and settle in fiat.

---

## 🛠 Development Workflow

### Prerequisites
- **Node.js**: v18+ or v20+
- **Docker & Docker Compose** (for PostgreSQL)
- **Git**

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/MetroLogic/fluxapay-backend.git
   cd fluxapay-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start local database with Docker Compose:
   ```bash
   docker compose up -d postgres
   ```
5. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
6. Run database migrations:
   ```bash
   npx prisma db push
   ```
7. Start development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing & Quality Standards

Before submitting a Pull Request, ensure all tests and linter checks pass:

- **Run tests**: `npm test`
- **Lint code**: `npm run lint`
- **Check TypeScript types**: `npx tsc --noEmit`
- **Format code**: `npm run format`

---

## 🔀 Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `chore:` Maintenance, dependency, or configuration tasks
- `test:` Adding or updating tests
- `refactor:` Code change that neither fixes a bug nor adds a feature
