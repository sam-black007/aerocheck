# aeroCheck - Model Aircraft Flight Calculator & Weather Tracker

## Concept & Vision

aeroCheck is a comprehensive flight planning tool for hobbyist RC pilots that combines advanced aircraft physics calculations with real-time weather data. The interface feels like a professional aviation cockpit display—technical yet approachable, with a dark theme that evokes flying at dusk and clear data visualization that makes complex physics accessible.

## Design Language

**Aesthetic Direction**: Aviation cockpit meets modern dashboard—dark backgrounds with glowing accent colors, instrument-panel-style cards, and a sense of precision engineering.

**Color Palette**:
- Primary: `#0ea5e9` (Sky Blue - aviation authority)
- Secondary: `#6366f1` (Indigo - technology)
- Accent: `#22c55e` (Green - safe/go indicators)
- Warning: `#f59e0b` (Amber - caution states)
- Danger: `#ef4444` (Red - unsafe conditions)
- Background: `#0f172a` (Dark slate)
- Surface: `#1e293b` (Elevated panels)
- Text: `#f8fafc` (Near white)
- Text Muted: `#94a3b8` (Slate gray)

**Typography**:
- Headings: Inter (700) - clean, aviation-appropriate
- Body: Inter (400) - highly readable
- Data/Numbers: JetBrains Mono - monospace for precision data

**Spatial System**: 8px grid, generous padding (16-24px), card-based layout with subtle borders and shadows

**Motion Philosophy**: Subtle transitions (200-300ms), smooth tab transitions, animated number counters for data updates

## Layout & Structure

**Navigation**: Top navbar with logo and page tabs, mobile hamburger menu
**Page Structure**: 
- Full-width header with page title
- Content in card-based grid layout
- Sticky footer with status indicators

**Pages**:
1. Dashboard - Overview with quick stats and recent activity
2. Calculator - Aircraft physics calculations with 15 aircraft types
3. Weather - Live weather from multiple APIs with conditions
4. Simulator - Weather impact simulator with sliders
5. Flights - Flight log with tracking and export
6. Analytics - Charts and performance trends
7. Compare - Side-by-side model comparison
8. Models - Aircraft library management
9. Settings - API keys and preferences

## Features & Interactions

### Flight Calculator
- 15 aircraft types with pre-configured physics parameters
- Real-time calculation of: lift, drag, glide ratio, stall speed, cruise speed, rate of climb
- Wing loading and thrust-to-weight ratio
- Suitability score based on conditions
- Motor and battery specs calculator

### Weather Integration
- Location-based weather (browser geolocation)
- 7 API sources with fallback
- Wind speed/direction display
- Temperature, humidity, pressure
- Air quality index
- Sunrise/sunset times
- Weather alerts for flying conditions

### Weather Simulator
- Temperature slider (-20°C to +50°C)
- Wind speed slider (0-50 km/h)
- Humidity slider (0-100%)
- Altitude slider (0-3000m)
- Real-time density altitude calculation
- Performance impact preview

### Flight Tracking
- Start/stop flight timer
- Manual altitude and speed entry
- Battery consumption tracking
- Flight path notes
- Export to JSON
- Local storage persistence

### Analytics
- Flight duration trends
- Performance over time
- Best flight records
- Aircraft usage pie chart

### Model Comparison
- Select 2-3 models
- Side-by-side metrics
- Radar chart visualization
- Best model recommendation

## Component Inventory

### AircraftCard
- Aircraft icon, name, type badge
- Key specs (wingspan, weight, motor)
- Quick-calculate button
- Hover: subtle lift shadow

### WeatherWidget
- Current conditions icon
- Temperature large, conditions small
- Wind arrow indicator
- States: loading, loaded, error, no-location

### MetricCard
- Label, large value, unit
- Optional trend indicator
- Color-coded by threshold

### CalculationPanel
- Input fields with units
- Calculate button
- Results grid with explanations

### FlightLogItem
- Date, duration, aircraft
- Conditions summary
- Expand for details

### ComparisonChart
- Radar chart for multiple models
- Legend with aircraft names
- Interactive hover states

## Technical Approach

- Single HTML file with embedded CSS and JavaScript
- LocalStorage for data persistence
- Fetch API for weather data (with CORS proxy if needed)
- Canvas/SVG for charts
- No external dependencies except fonts
- GitHub Pages compatible (no server requirements)
