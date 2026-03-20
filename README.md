# AeroCheck

> Model Aircraft Flight Calculator & Weather Tracker for hobbyist pilots

[![Deploy](https://github.com/sam-black007/aerocheck/actions/workflows/deploy.yml/badge.svg)](https://github.com/sam-black007/aerocheck/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Live Demo

**Live Website:** https://sam-black007.github.io/aerocheck/

## 🤖 Powered by Claude Code + ECC

Built with [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code) - Enhanced AI-powered development workflow.

### ECC Commands Used:
- `/plan` - Implementation planning
- `/tdd` - Test-driven development
- `/code-review` - Code quality assurance
- `/security` - Security auditing

---

## Features

### 1. Flight Calculator
- **15 aircraft types**: Fixed Wing, Quadcopter, Hexacopter, VTOL, Helicopter, Sailplane, Delta Wing, Biplane, Flying Wing, Park Flyer, Warbird, Jet Turbine, Tricopter, Octocopter, Hot Air Balloon
- Advanced physics engine (lift, drag, glide ratio, stability)
- Wing loading, thrust-to-weight, suitability score
- Stall speed, cruise speed, rate of climb
- Motor and battery specifications

### 2. Advanced Physics Engine
- Lift coefficient (Cl) & drag coefficient (Cd)
- Glide ratio calculator
- Turn radius and turn rate
- Stability factor
- CG position calculator
- Motor & propeller efficiency
- Flight envelope

### 3. Weather Integration (7 APIs)
- OpenWeatherMap, WeatherAPI, Tomorrow.io
- AVWX (Aviation Weather), NOAA
- Air Quality Index (OpenAQ)
- Solar information (sunrise/sunset)
- Weather alerts (wind, rain, temperature)

### 4. Weather Simulator
- Adjust temperature (-20°C to +50°C)
- Adjust wind speed, humidity, altitude
- Calculate density altitude impact
- Performance impact analysis

### 5. Flight Tracking
- GPS route logging
- Altitude and speed tracking
- Battery consumption monitoring
- G-force logging
- Flight path visualization
- Export to JSON

### 6. Analytics Dashboard
- Flight history charts
- Performance trends
- Personal records
- Aircraft usage statistics

### 7. Model Comparison
- Side-by-side aircraft comparison
- Performance metrics charts
- Efficiency analysis
- Best model recommendation

## Pages
- `/` - Dashboard
- `/calculator` - Flight Calculator
- `/simulator` - Weather Simulator
- `/weather` - Live Weather & Air Quality
- `/flights` - Flight Log
- `/models` - Model Library
- `/analytics` - Flight Analytics
- `/compare` - Model Comparison
- `/settings` - Settings

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/sam-black007/aerocheck.git
cd aerocheck

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your API keys to .env
# See API_KEYS.md for setup instructions

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview
```

## API Configuration

See [API_KEYS.md](API_KEYS.md) for detailed setup instructions.

### Quick API Setup

1. **Weather APIs** (all have free tiers):
   - [OpenWeatherMap](https://openweathermap.org/api) - 60 calls/min
   - [WeatherAPI](https://weatherapi.com) - 1M calls/month
   - [Tomorrow.io](https://tomorrow.io) - 500 calls/day
   - [AVWX](https://avwx.rest) - Aviation weather

2. **Aviation APIs**:
   - [Aviationstack](https://aviationstack.com) - 100 calls/month
   - [AeroDataBox](https://rapidapi.com) - via RapidAPI
   - [Aviation Edge](https://aviation-edge.com) - 1000 calls/month
   - NOAA Aviation Weather - Free

3. **No API Key Required**:
   - [Nominatim](https://nominatim.openstreetmap.org) - geocoding
   - [OpenAQ](https://openaq.org) - air quality
   - [Sunrise-Sunset](https://sunrise-sunset.org) - solar times

## Project Structure

```
aerocheck/
├── src/
│   ├── pages/           # Page components
│   ├── lib/            # Utility functions
│   ├── types/          # TypeScript types
│   ├── __tests__/     # Test files
│   └── App.tsx        # Main app component
├── public/
├── .opencode/         # ECC configuration
├── ROADMAP.md         # Feature roadmap
├── API_KEYS.md        # API setup guide
└── package.json
```

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Run ESLint
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Router** - Navigation
- **Recharts** - Data visualization
- **IndexedDB** - Local storage
- **Vitest** - Testing

## Security

- Input validation on all fields
- XSS prevention via React
- IndexedDB sanitization
- Environment variable API keys
- Security audit passed ✓

## License

MIT License

## Acknowledgments

- [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code) - AI development workflow
- Weather data from OpenWeatherMap, WeatherAPI, AVWX
- Aviation data from Aviationstack, AeroDataBox
- Air quality data from OpenAQ
- Icons from Lucide
