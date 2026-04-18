# AGENTS.md

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack
- React 19 + Vite 8
- Tailwind CSS v4 (configured via `@tailwindcss/vite` plugin, not the CLI)
- No TypeScript
- No test framework configured

## Structure
- `src/App.jsx` - Main entry point
- `src/components/` - React components
- `src/services/api.js` - API client (axios)

## Notes
- Tailwind v4 uses CSS-first configuration via `@theme` in CSS files, not `tailwind.config.js`
- No pre-commit hooks configured