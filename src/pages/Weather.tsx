import { useEffect, useState } from 'react';
import { Cloud, Wind, Droplets, Eye, Sun, CloudRain, Plane, MapPin, Navigation, Gauge } from 'lucide-react';
import { fetchOpenAQ, fetchSunTimes, getAQIDescription } from '../lib/apis';
import { getDefaultWeather, getWeatherIcon, getWindDirectionName } from '../lib/weather';
import { getSettings } from '../lib/db';
import { fetchLiveWeatherByQuery } from '../lib/live-weather';
import type { WeatherConditions } from '../types';

type Coordinates = { lat: number; lon: number };

type AirQualityData = {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
};

type SunTimesData = {
  sunrise: string;
  sunset: string;
  dayLength: number;
};

export default function WeatherPage() {
  const [location, setLocation] = useState('New York, NY');
  const [searchLocation, setSearchLocation] = useState('');
  const [weather, setWeather] = useState<WeatherConditions>(getDefaultWeather());
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [sunTimes, setSunTimes] = useState<SunTimesData | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    void loadInitialLocation();
  }, []);

  async function loadInitialLocation() {
    try {
      const settings = await getSettings();
      const defaultLocation = settings?.defaultLocation?.trim() || 'New York, NY';
      setSearchLocation(defaultLocation);
      await handleSearch(defaultLocation);
    } catch (e) {
      console.error('Failed to load initial location', e);
      setSearchLocation('New York, NY');
      await handleSearch('New York, NY');
    }
  }

  async function handleSearch(rawQuery = searchLocation) {
    const query = rawQuery.trim();
    if (!query) {
      setError('Enter a location to load weather data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchLiveWeatherByQuery(query);

      setCoordinates({ lat: result.location.lat, lon: result.location.lon });
      setLocation(result.location.name);
      setWeather(result.weather);

      await Promise.all([
        fetchAirQuality(result.location.lat, result.location.lon),
        fetchSolarTimes(result.location.lat, result.location.lon),
      ]);

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (e) {
      setError('Failed to fetch weather data for that location');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAirQuality(lat: number, lon: number) {
    try {
      const air = await fetchOpenAQ(lat, lon);
      setAirQuality(air);
    } catch (e) {
      console.error('Air quality fetch failed', e);
      setAirQuality(null);
    }
  }

  async function fetchSolarTimes(lat: number, lon: number) {
    try {
      const times = await fetchSunTimes(lat, lon);
      setSunTimes({
        sunrise: times.sunrise,
        sunset: times.sunset,
        dayLength: Number(times.dayLength),
      });
    } catch (e) {
      console.error('Sun times fetch failed', e);
      setSunTimes(null);
    }
  }

  const aqiInfo = airQuality ? getAQIDescription(airQuality.aqi) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Weather and Conditions</h1>
          <p className="mt-1 text-slate-400">Live weather, air quality, and daylight checks for your flying field</p>
        </div>
        {lastUpdated && <div className="badge badge-info">Updated {lastUpdated}</div>}
      </div>

      <div className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Enter location (city, airport ICAO, etc.)"
              value={searchLocation}
              onChange={(event) => setSearchLocation(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
            />
          </div>
          <button className="btn-primary px-6" onClick={() => void handleSearch()} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {location && (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sky-400">
            <Navigation className="h-4 w-4" />
            {location}
            {coordinates && (
              <span className="text-slate-500">
                ({coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)})
              </span>
            )}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <p className="mt-4 text-slate-400">Fetching weather data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Cloud className="h-5 w-5 text-sky-400" />
                Current Weather
              </h2>

              <div className="mb-6 text-center">
                <span className="text-6xl">{getWeatherIcon(weather)}</span>
                <div className="mt-2 text-4xl font-bold text-white">{weather.temperature} deg C</div>
                <p className="capitalize text-slate-400">{weather.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="stat-card">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Wind className="h-4 w-4" />
                    <span className="text-sm">Wind</span>
                  </div>
                  <span
                    className={`stat-value ${
                      weather.windSpeed > 20 ? 'text-red-400' : weather.windSpeed > 10 ? 'text-amber-400' : 'text-green-400'
                    }`}
                  >
                    {weather.windSpeed} mph
                  </span>
                  <span className="text-xs text-slate-500">{getWindDirectionName(weather.windDirection)}</span>
                </div>

                <div className="stat-card">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Droplets className="h-4 w-4" />
                    <span className="text-sm">Humidity</span>
                  </div>
                  <span className="stat-value text-cyan-400">{weather.humidity}%</span>
                </div>

                <div className="stat-card">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Visibility</span>
                  </div>
                  <span className="stat-value text-green-400">{weather.visibility} km</span>
                </div>

                <div className="stat-card">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Gauge className="h-4 w-4" />
                    <span className="text-sm">Pressure</span>
                  </div>
                  <span className="stat-value text-violet-400">{weather.pressure} hPa</span>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-slate-700/50 p-4">
                <h3 className="mb-3 text-sm font-medium text-white">Flying Assessment</h3>
                <div className="space-y-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-slate-400">Wind Conditions</span>
                    <span className={`badge ${weather.windSpeed <= 10 ? 'badge-success' : weather.windSpeed <= 20 ? 'badge-warning' : 'badge-danger'}`}>
                      {weather.windSpeed <= 10 ? 'Good' : weather.windSpeed <= 20 ? 'Marginal' : 'Dangerous'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-slate-400">Visibility</span>
                    <span className={`badge ${weather.visibility >= 5 ? 'badge-success' : 'badge-warning'}`}>
                      {weather.visibility >= 5 ? 'Good' : 'Limited'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-slate-400">Precipitation</span>
                    <span className={`badge ${weather.precipitation === 0 ? 'badge-success' : 'badge-danger'}`}>
                      {weather.precipitation === 0 ? 'None' : 'Present'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Droplets className="h-5 w-5 text-green-400" />
                  Air Quality Index
                </h2>

                {airQuality ? (
                  <>
                    <div className="mb-4 text-center">
                      <div
                        className={`text-5xl font-bold ${
                          airQuality.aqi <= 50
                            ? 'text-green-400'
                            : airQuality.aqi <= 100
                              ? 'text-yellow-400'
                              : airQuality.aqi <= 150
                                ? 'text-orange-400'
                                : 'text-red-400'
                        }`}
                      >
                        {airQuality.aqi}
                      </div>
                      <div
                        className={`text-lg font-medium ${
                          aqiInfo?.color === 'green'
                            ? 'text-green-400'
                            : aqiInfo?.color === 'yellow'
                              ? 'text-yellow-400'
                              : aqiInfo?.color === 'orange'
                                ? 'text-orange-400'
                                : 'text-red-400'
                        }`}
                      >
                        {aqiInfo?.level}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-700/50 p-3 text-center">
                        <div className="text-xs text-slate-400">PM2.5</div>
                        <div className="font-mono text-white">{airQuality.pm25.toFixed(1)}</div>
                      </div>
                      <div className="rounded-lg bg-slate-700/50 p-3 text-center">
                        <div className="text-xs text-slate-400">PM10</div>
                        <div className="font-mono text-white">{airQuality.pm10.toFixed(1)}</div>
                      </div>
                      <div className="rounded-lg bg-slate-700/50 p-3 text-center">
                        <div className="text-xs text-slate-400">O3</div>
                        <div className="font-mono text-white">{airQuality.o3.toFixed(1)}</div>
                      </div>
                      <div className="rounded-lg bg-slate-700/50 p-3 text-center">
                        <div className="text-xs text-slate-400">NO2</div>
                        <div className="font-mono text-white">{airQuality.no2.toFixed(1)}</div>
                      </div>
                    </div>

                    <p className="mt-4 text-center text-sm text-slate-400">{aqiInfo?.advice}</p>
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <p>Air quality data is not available for this search yet.</p>
                  </div>
                )}
              </div>

              <div className="card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Sun className="h-5 w-5 text-amber-400" />
                  Solar Information
                </h2>

                {sunTimes ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-4 text-center">
                        <Sun className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                        <div className="text-xs text-slate-400">Sunrise</div>
                        <div className="text-lg font-mono text-white">
                          {new Date(sunTimes.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 text-center">
                        <CloudRain className="mx-auto mb-2 h-8 w-8 text-orange-400" />
                        <div className="text-xs text-slate-400">Sunset</div>
                        <div className="text-lg font-mono text-white">
                          {new Date(sunTimes.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-700/50 p-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-400">Day Length</span>
                        <span className="font-mono text-white">
                          {Math.floor(sunTimes.dayLength / 3600)}h {Math.floor((sunTimes.dayLength % 3600) / 60)}m
                        </span>
                      </div>
                    </div>

                    <p className="text-center text-xs text-slate-500">Based on local coordinates for better daylight planning</p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <p>Solar times will appear when location data is available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Plane className="h-5 w-5 text-sky-400" />
              Pilot Weather Briefing
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
                <h3 className="mb-2 font-medium text-sky-400">VFR Conditions</h3>
                <p className="text-sm text-slate-300">
                  {weather.visibility >= 5 && weather.cloudCeiling >= 3000 && weather.precipitation === 0
                    ? 'Conditions are favorable for visual flying.'
                    : 'Visibility, ceiling, or rain suggest a more cautious go/no-go decision.'}
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                <h3 className="mb-2 font-medium text-amber-400">Density Altitude</h3>
                <p className="text-sm text-slate-300">
                  Warm air can soften climb performance and shorten battery endurance.
                  {weather.temperature > 30 ? ' Plan for lighter payloads and longer takeoff rolls.' : ' Current temperature is within a manageable range.'}
                </p>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <h3 className="mb-2 font-medium text-green-400">Recommendation</h3>
                <p className="text-sm text-slate-300">
                  {weather.windSpeed <= 15 && weather.visibility >= 5 && weather.precipitation === 0
                    ? 'Conditions look solid for routine hobby flights.'
                    : 'Proceed with caution and shorten your mission plan if needed.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
