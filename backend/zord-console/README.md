# Zord Ingestion Console

A fully functional frontend for the Zord Ingestion Console, built with Next.js 14, TypeScript, and Tailwind CSS.

## Quick Start

### Local Development
```bash
npm install
npm run dev
```

### Production Deployment
```bash
# Run in background
docker-compose up -d --build
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

### Local Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Production Deployment

#### Docker Production Build
```bash
# Build and run production container
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

#### Docker Management Commands
```bash
# View logs
docker-compose logs frontend

# Rebuild without cache
docker-compose build --no-cache

# Remove containers and volumes
docker-compose down -v
```

### Docker Configuration

The project includes production-ready Docker setup:
- **Dockerfile**: Multi-stage production build with optimized Next.js standalone output
- **docker-compose.yml**: Production orchestration
- **.dockerignore**: Optimized build context

**Production Port:** `3000`
**Network:** Uses `zord-network` for integration with backend services

#### Dependencies

The project uses `sharp` for image optimization in production mode. This is automatically installed when you run:
```bash
npm install
```

If you add it manually, ensure you update the lock file:
```bash
npm install sharp
```

### Troubleshooting

#### Docker Build Issues
- **"public folder not found"**: Ensure `.dockerignore` doesn't exclude the `public` directory
- **"sharp module missing"**: Run `npm install` locally first, then rebuild with `docker-compose up -d --build`

For detailed development guidelines, see [documents/CONTRIBUTING.md](./documents/CONTRIBUTING.md).
