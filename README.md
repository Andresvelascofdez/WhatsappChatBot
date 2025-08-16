# WhatsApp Booking Chatbot

Multi-tenant WhatsApp chatbot for appointment booking with Google Calendar integration.

## Architecture

- **Frontend**: WhatsApp Business API (360dialog)
- **Backend**: Cloudflare Workers / Vercel Functions (Node.js/TypeScript)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Calendar**: Google Calendar API
- **Mono-repo**: pnpm workspaces

## Project Structure

```
packages/
├── api/           # Serverless functions (Cloudflare Workers/Vercel)
├── lib/
│   ├── booking/   # Booking logic and slot management
│   ├── gcal/      # Google Calendar integration
│   ├── wa/        # WhatsApp Business API client
│   └── db/        # Database models and migrations
└── tests/         # E2E and integration tests
```

## Features

- Multi-tenant appointment booking
- Real-time slot availability
- Google Calendar integration
- WhatsApp Business API integration
- Automatic hold/release of time slots
- Cancellation and rescheduling
- FAQ responses
- Multi-language support

## Development

### Prerequisites

- Node.js ≥18
- pnpm ≥8
- Supabase account
- Google Cloud Platform account
- WhatsApp Business API account (360dialog)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run database migrations:
```bash
pnpm db:migrate
```

4. Start development:
```bash
pnpm dev
```

### Testing

```bash
pnpm test
```

### Building

```bash
pnpm build
```

## Environment Variables

See `.env.example` for required environment variables.

## Database Schema

The application uses PostgreSQL with Row Level Security (RLS) for multi-tenancy:

- `tenants` - Tenant configuration
- `services` - Services offered by each tenant
- `customers` - Customer information
- `appointments` - Booking appointments
- `faqs` - Frequently asked questions
- `channels` - Communication channels (WhatsApp, Instagram)
- `message_logs` - Message audit trail

## Deployment

### Cloudflare Workers

```bash
pnpm --filter @chatbot/api deploy:cloudflare
```

### Vercel

```bash
pnpm --filter @chatbot/api deploy:vercel
```

## Anti-Error Protocol

This project follows strict development protocols:

- No temporary files or empty classes
- Atomic commits with conventional commit messages
- Pre-commit hooks for code quality
- Comprehensive test coverage (≥75%)
- Database migrations with rollback scripts
- Row Level Security for multi-tenancy

## License

Private - All rights reserved
