# Setup

## Requirements

- Runtime: Node.js 20 or newer
- Package manager: npm
- Database: none
- Other services: OpenAI API key for quiz generation and image OCR

## Install

```bash
npm install
```

## Environment

Required environment variables:

```text
OPENAI_API_KEY=
```

Create `.env.local` for local development:

```bash
OPENAI_API_KEY=your_key_here
```

Never commit real secrets. The repository ignores `.env`, `.env*.local`, and other local environment files.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm test
npm run test:pdf-runtime -- dev
npm run typecheck
npm run lint
npm run build
npm run test:pdf-runtime -- production
```

## Common Problems

### Missing OpenAI Key

Fix:

```bash
printf 'OPENAI_API_KEY=your_key_here\n' > .env.local
```

Use a real key locally. Do not commit `.env.local`.

### PDF Runtime Failures

Fix:

```bash
npm install
npm run test:pdf-runtime -- dev
```

If failures mention PDF.js worker resolution, check `next.config.mjs` and the installed `pdfjs-dist` package.

### Port Already In Use

Fix:

```bash
npm run dev -- -p 3001
```
