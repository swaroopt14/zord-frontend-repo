# Zord Ingestion Console

A fully functional frontend for the Zord Ingestion Console, built with Next.js 14, TypeScript, and Tailwind CSS.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

All documentation is available in the [`documents/`](./documents/) folder:

- **[README.md](./documents/README.md)** - Complete project documentation
- **[ARCHITECTURE.md](./documents/ARCHITECTURE.md)** - Architecture and design principles
- **[CONTRIBUTING.md](./documents/CONTRIBUTING.md)** - Development workflow and guidelines
- **[DEBUGGING.md](./documents/DEBUGGING.md)** - Debugging guide and tips
- **[PROJECT_STRUCTURE.md](./documents/PROJECT_STRUCTURE.md)** - Project structure overview

## Key Features

- **Three Role-Based Consoles**: Customer, Ops, and Admin
- **Evidence Trail**: Every ingestion creates visible, timestamped evidence
- **Real-time Updates**: Automatic polling for status updates
- **Dark Theme Login**: Modern split-screen login with image carousel
- **Sign Up & Login**: Complete authentication flow

## Project Structure

```
/app              # Next.js pages (routes)
/components        # React components (feature-based)
/services          # Business logic & API services
/hooks             # Custom React hooks
/utils             # Utility functions
/types             # TypeScript types
/constants         # Application constants
/config            # Configuration files
/documents         # Documentation
```

See [documents/PROJECT_STRUCTURE.md](./documents/PROJECT_STRUCTURE.md) for detailed structure.

## Login Pages

- Customer: `/console/login`
- Ops: `/ops/login`
- Admin: `/admin/login`

All login pages support both **Sign Up** and **Login** modes with social authentication options.

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

For detailed development guidelines, see [documents/CONTRIBUTING.md](./documents/CONTRIBUTING.md).
