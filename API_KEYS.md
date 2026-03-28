# AeroCheck API Configuration

## Overview

AeroCheck integrates with multiple free/public APIs to provide comprehensive aviation weather data.

## API Keys Required

Create a `.env` file in the project root with your API keys:

```env
# Weather APIs
VITE_OPENWEATHER_API_KEY=your_openweathermap_key
VITE_WEATHERAPI_KEY=your_weatherapi_key
VITE_TOMORROW_API_KEY=your_tomorrowio_key

# Aviation APIs
VITE_AVIATIONSTACK_KEY=your_aviationstack_key
VITE_AERODATABOX_KEY=your_rapidapi_key

# Geocoding
VITE_GEOCODEIFY_KEY=your_geocodeify_key
```

## Free API Tiers

### Weather APIs

| API | Free Tier | Features |
|-----|-----------|----------|
| **OpenWeatherMap** | 60 calls/min | Current weather, forecast |
| **WeatherAPI** | 1M calls/month | Aviation weather, alerts |
| **Tomorrow.io** | 500 calls/day | Hyper-local, precipitation |

### Aviation APIs

| API | Free Tier | Features |
|-----|-----------|----------|
| **Aviationstack** | 100 calls/month | Flight tracking |
| **AeroDataBox** | via RapidAPI | Airport data |
| **Aviation Edge** | 1000 calls/month | Airport database |

### Geocoding

| API | Free Tier | Features |
|-----|-----------|----------|
| **Nominatim** | Unlimited | OpenStreetMap data |
| **Geocodeify** | 10k/month | Forward geocoding |

### Environment

| API | Free Tier | Features |
|-----|-----------|----------|
| **OpenAQ** | Unlimited | Air quality data |
| **Sunrise-Sunset** | Unlimited | Solar times |

## How to Get API Keys

### OpenWeatherMap
1. Go to [openweathermap.org/api](https://openweathermap.org/api)
2. Sign up for free
3. Get your API key from dashboard

### WeatherAPI
1. Visit [weatherapi.com](https://www.weatherapi.com)
2. Free tier includes 1M calls/month
3. Get API key from registration

### Aviationstack
1. Sign up at [aviationstack.com](https://aviationstack.com)
2. Free tier: 100 requests/month
3. Used for flight tracking

### AeroDataBox (via RapidAPI)
1. Go to [RapidAPI.com](https://rapidapi.com)
2. Search for "AeroDataBox"
3. Subscribe to free tier

### Nominatim (No Key Required)
- Uses OpenStreetMap data
- Rate limited to 1 request/second
- No API key needed

## Environment Variables

All API keys are prefixed with `VITE_` for Vite security:

```env
# Required for weather
VITE_OPENWEATHER_API_KEY=...

# Optional - enhances data
VITE_WEATHERAPI_KEY=...
VITE_TOMORROW_API_KEY=...

# Optional - aviation features
VITE_AVIATIONSTACK_KEY=...
VITE_AERODATABOX_KEY=...

# Optional - geocoding
VITE_GEOCODEIFY_KEY=...
```

## Security Notes

- Never commit `.env` to version control
- API keys are client-side for demo purposes
- For production, use a backend proxy
- Keys are exposed in client bundle (acceptable for public APIs)

## Fallback Behavior

If no API keys are provided:
- Uses default weather values
- Nominatim used for geocoding (no key needed)
- Limited flight tracking features
