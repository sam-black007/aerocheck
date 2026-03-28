# AeroCheck

Model aircraft flight calculator and weather tracker for hobbyist pilots.

## Live Demo

https://sam-black007.github.io/aerocheck/

## What This Build Includes

- React 18 + TypeScript + Vite app structure
- Multi-page dashboard, calculator, simulator, weather, flights, models, analytics, compare, and settings views
- Aircraft performance calculations and advanced physics helpers
- Weather loading with public-source fallbacks
- IndexedDB persistence for aircraft, flights, and settings
- GitHub Pages deployment workflow

## Features

### Flight Calculator

- 15 aircraft types
- Wing loading, thrust-to-weight, suitability score
- Stall speed, cruise speed, and climb estimates
- Motor, propeller, and battery inputs

### Advanced Physics

- Lift and drag coefficients
- Glide ratio
- Turn radius and turn rate
- Stability factor and CG helpers
- Motor and propeller efficiency
- Flight envelope helpers

### Weather

- Public weather and geocoding integrations
- Sunrise and sunset information
- Air-quality support where data is available
- Weather simulator for density-altitude and performance effects

### Flight Data

- Flight log storage
- Aircraft library
- Analytics and model comparison views
- Data export and import

## API Notes

The app is set up so normal users do not need to paste API keys into the UI.

- Built-in public providers are used first.
- Optional premium API integrations can be extended later through environment variables if needed.
- No end-user API setup is required for the current app flow.

## Local Development

Requirements:

- Node.js 18+
- npm

Commands:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

Tests:

```bash
npm run test
npm run lint
```

## Deployment

GitHub Pages deploys automatically from `main` through the workflow in `.github/workflows/deploy.yml`.

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Recharts
- IndexedDB
- Vitest

## License

MIT
