import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Cloud,
  Compass,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Navigation,
  Plane,
  Sun,
  Wind,
} from 'lucide-react';
import OperationsMap from '../components/OperationsMap';
import { getAQIDescription } from '../lib/apis';
import { readCachedCurrentLocation, requestCurrentLocation } from '../lib/current-location';
import { getSettings } from '../lib/db';
import { fetchTrafficByCoordinates, type LiveTrafficSnapshot } from '../lib/live-traffic';
import {
  fetchLocationBriefing,
  fetchLocationBriefingByCoordinates,
  type WeatherBriefing,
} from '../lib/live-weather';
import { getDefaultWeather, getWeatherIcon, getWindDirectionName } from '../lib/weather';

const WEATHER_SCOPE_NM = 35;

function formatShortDateTime(value?: string | null): string {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getOperationalVerdict(briefing: WeatherBriefing | null) {
  const weather = briefing?.weather ?? getDefaultWeather();
  const activeAlerts = briefing?.alerts ?? [];
  const hasSeriousAlert = activeAlerts.some((alert) => ['Moderate', 'Severe', 'Extreme'].includes(alert.severity));

  if (hasSeriousAlert || weather.windSpeed > 20 || weather.visibility < 3 || weather.precipitation > 1) {
    return {
      label: 'Hold',
      badgeClass: 'badge-danger',
      summary: 'Wind, visibility, or active alerts are strong enough that short and conservative operations are the safer call.',
    };
  }

  if (weather.windSpeed > 12 || weather.visibility < 5 || weather.precipitation > 0) {
    return {
      label: 'Caution',
      badgeClass: 'badge-warning',
      summary: 'The field is usable, but it rewards tighter flight planning and more stable aircraft choices.',
    };
  }

  return {
    label: 'Go',
    badgeClass: 'badge-success',
    summary: 'Wind, visibility, and precipitation look supportive for a normal hobby flying session.',
  };
}

function formatDayLength(seconds?: number | null): string {
  if (!seconds) {
    return 'Not available';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

type LocationMode = 'current' | 'saved' | 'search';

export default function WeatherPage() {
  const [searchLocation, setSearchLocation] = useState('');
  const [briefing, setBriefing] = useState<WeatherBriefing | null>(null);
  const [trafficSnapshot, setTrafficSnapshot] = useState<LiveTrafficSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>('saved');

  useEffect(() => {
    void loadInitialLocation();
  }, []);

  async function refreshSupportingTraffic(nextBriefing: WeatherBriefing) {
    try {
      const nextTraffic = await fetchTrafficByCoordinates(nextBriefing.location, WEATHER_SCOPE_NM);
      setTrafficSnapshot(nextTraffic);
    } catch (trafficError) {
      console.error('Nearby traffic lookup failed', trafficError);
      setTrafficSnapshot(null);
    }
  }

  function stampRefresh() {
    setLastUpdated(
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }

  async function loadSavedLocation() {
    try {
      const settings = await getSettings();
      const defaultLocation = settings?.defaultLocation?.trim() || 'New York, NY';
      setSearchLocation(defaultLocation);
      await handleSearch(defaultLocation, 'saved');
    } catch (loadError) {
      console.error('Failed to load saved weather location', loadError);
      setSearchLocation('New York, NY');
      await handleSearch('New York, NY', 'saved');
    }
  }

  async function loadInitialLocation() {
    const cachedLocation = readCachedCurrentLocation();
    if (cachedLocation) {
      setLocationAccuracy(cachedLocation.accuracy);
      const loadedFromCache = await loadByCoordinates(cachedLocation.lat, cachedLocation.lon, 'current');
      if (loadedFromCache) {
        return;
      }
    }

    const located = await handleUseCurrentLocation(true);
    if (!located) {
      await loadSavedLocation();
    }
  }

  async function loadByCoordinates(lat: number, lon: number, mode: LocationMode) {
    setLoading(true);
    setError(null);

    try {
      const nextBriefing = await fetchLocationBriefingByCoordinates(lat, lon);
      setBriefing(nextBriefing);
      setSearchLocation(nextBriefing.location.name);
      setLocationMode(mode);
      stampRefresh();
      await refreshSupportingTraffic(nextBriefing);
      return true;
    } catch (loadError) {
      console.error('Coordinate weather lookup failed', loadError);
      setError('The current-location weather brief could not be loaded.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleUseCurrentLocation(silentOnError = false) {
    setLocating(true);

    if (!silentOnError) {
      setError(null);
    }

    try {
      const currentLocation = await requestCurrentLocation();
      setLocationAccuracy(currentLocation.accuracy);
      return loadByCoordinates(currentLocation.lat, currentLocation.lon, 'current');
    } catch (locationError) {
      console.error('Current location lookup failed', locationError);
      if (!silentOnError) {
        setError(locationError instanceof Error ? locationError.message : 'The browser location could not be used.');
      }
      return false;
    } finally {
      setLocating(false);
    }
  }

  async function handleSearch(rawQuery = searchLocation, mode: LocationMode = 'search') {
    const query = rawQuery.trim();
    if (!query) {
      setError('Enter a city, airport, or field name to build a weather brief.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextBriefing = await fetchLocationBriefing(query);
      setBriefing(nextBriefing);
      setSearchLocation(nextBriefing.location.name);
      setLocationMode(mode);
      setLocationAccuracy(null);
      stampRefresh();
      await refreshSupportingTraffic(nextBriefing);
    } catch (searchError) {
      console.error('Weather search failed', searchError);
      setError('The weather brief could not be loaded for that search.');
    } finally {
      setLoading(false);
    }
  }

  const weather = briefing?.weather ?? getDefaultWeather();
  const airQuality = briefing?.airQuality ?? null;
  const sunTimes = briefing?.sunTimes ?? null;
  const verdict = getOperationalVerdict(briefing);
  const aqiInfo = airQuality ? getAQIDescription(airQuality.aqi) : null;
  const airborneFlights = trafficSnapshot?.flights.filter((flight) => !flight.isOnGround) ?? [];
  const nearestFlight = trafficSnapshot?.flights[0] ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="hero-panel px-6 py-7 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <div>
            <div className="section-kicker">Current location weather</div>
            <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-[0.12em] text-white">
              Live Field Map
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Open the brief on your exact spot, keep the weather tied to that point on the map, and see nearby traffic context around the field before you launch.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="data-chip">{briefing?.source || 'Live weather source'}</span>
              {briefing?.stationId && <span className="data-chip">Station {briefing.stationId}</span>}
              {lastUpdated && <span className="data-chip">Refreshed {lastUpdated}</span>}
              <span className={locationMode === 'current' ? 'badge-success' : locationMode === 'saved' ? 'badge-info' : 'badge-warning'}>
                {locationMode === 'current' ? 'Current location' : locationMode === 'saved' ? 'Saved location' : 'Search location'}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  className="input pl-11"
                  placeholder="Search city, airport ICAO, or flying field"
                  value={searchLocation}
                  onChange={(event) => setSearchLocation(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
                />
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <button className="btn-primary min-w-[12rem]" onClick={() => void handleSearch()} disabled={loading}>
                  {loading ? 'Building brief...' : 'Refresh brief'}
                </button>
                <button
                  className="btn-secondary min-w-[12rem]"
                  onClick={() => void handleUseCurrentLocation()}
                  disabled={locating || loading}
                >
                  {locating ? 'Finding position...' : 'Use my location'}
                </button>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

            {briefing && (
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-sky-300" />
                  {briefing.location.name}
                </span>
                <span className="text-slate-500">
                  {briefing.location.lat.toFixed(4)}, {briefing.location.lon.toFixed(4)}
                </span>
                {locationAccuracy != null && <span className="text-slate-500">Accuracy about {locationAccuracy} m</span>}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="metric-tile sm:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="section-kicker">Surface outlook</div>
                  <div className="mt-3 text-5xl">{getWeatherIcon(weather)}</div>
                </div>
                <span className={verdict.badgeClass}>{verdict.label}</span>
              </div>
              <div className="mt-5 text-5xl font-bold text-white">{weather.temperature} deg C</div>
              <p className="mt-2 text-base text-slate-300">{weather.description}</p>
              <p className="mt-4 text-sm leading-7 text-slate-400">{verdict.summary}</p>
            </div>

            <div className="metric-tile">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Wind</div>
              <div className="mt-2 font-mono text-3xl text-sky-200">{weather.windSpeed} mph</div>
              <div className="mt-1 text-xs text-slate-400">{getWindDirectionName(weather.windDirection)}</div>
            </div>

            <div className="metric-tile">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Visibility</div>
              <div className="mt-2 font-mono text-3xl text-emerald-200">{weather.visibility} km</div>
              <div className="mt-1 text-xs text-slate-400">Ceiling {weather.cloudCeiling} ft</div>
            </div>

            <div className="metric-tile">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Nearby traffic</div>
              <div className="mt-2 font-mono text-3xl text-white">{trafficSnapshot?.flights.length ?? 0}</div>
              <div className="mt-1 text-xs text-slate-400">{airborneFlights.length} airborne targets in scope</div>
            </div>

            <div className="metric-tile">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Observed</div>
              <div className="mt-2 font-mono text-lg text-white">
                {briefing ? formatShortDateTime(briefing.observedAt) : 'Awaiting live source'}
              </div>
              <div className="mt-1 text-xs text-slate-400">{briefing?.sourceDetail || 'Point-linked briefing'}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr,0.88fr]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="section-kicker">Map-centered briefing</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">Current Position Map</h2>
              </div>
              <div className="text-right text-xs uppercase tracking-[0.22em] text-slate-500">{WEATHER_SCOPE_NM} nm airspace overlay</div>
            </div>

            <OperationsMap
              center={briefing?.location ?? null}
              flights={trafficSnapshot?.flights ?? []}
              radiusNm={WEATHER_SCOPE_NM}
              weatherSummary={{
                description: weather.description,
                temperature: weather.temperature,
                visibility: weather.visibility,
                windSpeed: weather.windSpeed,
              }}
            />
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <div className="mb-4 flex items-center gap-3">
                <Compass className="h-5 w-5 text-sky-300" />
                <h2 className="text-xl font-semibold text-white">Point Summary</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="metric-tile">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Humidity</div>
                  <div className="mt-2 font-mono text-2xl text-white">{weather.humidity}%</div>
                </div>
                <div className="metric-tile">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Pressure</div>
                  <div className="mt-2 font-mono text-2xl text-white">{weather.pressure} hPa</div>
                </div>
                <div className="metric-tile">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Precipitation</div>
                  <div className="mt-2 font-mono text-2xl text-white">{weather.precipitation} mm</div>
                </div>
                <div className="metric-tile">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Cloud base</div>
                  <div className="mt-2 font-mono text-2xl text-white">{weather.cloudCeiling} ft</div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center gap-3">
                <Plane className="h-5 w-5 text-sky-300" />
                <h2 className="text-xl font-semibold text-white">Nearby Airspace</h2>
              </div>

              {nearestFlight ? (
                <div className="space-y-3">
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Closest target</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{nearestFlight.callsign}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {nearestFlight.distanceNm} nm | {nearestFlight.altitudeFeet == null ? 'Ground' : `${nearestFlight.altitudeFeet.toLocaleString()} ft`}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="metric-tile">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Tracked</div>
                      <div className="mt-2 font-mono text-2xl text-white">{trafficSnapshot?.flights.length ?? 0}</div>
                    </div>
                    <div className="metric-tile">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Airborne</div>
                      <div className="mt-2 font-mono text-2xl text-white">{airborneFlights.length}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate-400">The nearby traffic overlay will appear once the live ADS-B scope loads around your position.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3">
              <Cloud className="h-5 w-5 text-sky-300" />
              <h2 className="text-xl font-semibold text-white">Field Conditions</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="metric-tile">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Wind className="h-4 w-4 text-sky-300" />
                  Wind
                </div>
                <div className="mt-3 font-mono text-3xl text-white">{weather.windSpeed}</div>
                <div className="mt-1 text-sm text-slate-400">mph from {getWindDirectionName(weather.windDirection)}</div>
              </div>

              <div className="metric-tile">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Droplets className="h-4 w-4 text-cyan-300" />
                  Humidity
                </div>
                <div className="mt-3 font-mono text-3xl text-white">{weather.humidity}%</div>
                <div className="mt-1 text-sm text-slate-400">Surface moisture load</div>
              </div>

              <div className="metric-tile">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Gauge className="h-4 w-4 text-violet-300" />
                  Pressure
                </div>
                <div className="mt-3 font-mono text-3xl text-white">{weather.pressure}</div>
                <div className="mt-1 text-sm text-slate-400">hPa sea-level pressure</div>
              </div>

              <div className="metric-tile">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Eye className="h-4 w-4 text-emerald-300" />
                  Ceiling
                </div>
                <div className="mt-3 font-mono text-3xl text-white">{weather.cloudCeiling}</div>
                <div className="mt-1 text-sm text-slate-400">ft estimated cloud base</div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-sky-400/[0.15] bg-sky-500/[0.08] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-sky-200/70">Wind profile</div>
                <div className="mt-3">
                  <span className={weather.windSpeed <= 10 ? 'badge-success' : weather.windSpeed <= 18 ? 'badge-warning' : 'badge-danger'}>
                    {weather.windSpeed <= 10 ? 'Comfortable' : weather.windSpeed <= 18 ? 'Workable' : 'Demanding'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Hobby aircraft usually stay happiest below 10 to 12 mph unless the platform has stronger penetration.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Visibility check</div>
                <div className="mt-3">
                  <span className={weather.visibility >= 8 ? 'badge-success' : weather.visibility >= 5 ? 'badge-warning' : 'badge-danger'}>
                    {weather.visibility >= 8 ? 'Strong' : weather.visibility >= 5 ? 'Reduced' : 'Poor'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Visual tracking is much easier once visibility stays above 5 km and the ceiling sits comfortably above your mission height.
                </p>
              </div>

              <div className="rounded-[24px] border border-amber-400/[0.15] bg-amber-500/[0.08] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-amber-200/70">Moisture risk</div>
                <div className="mt-3">
                  <span className={weather.precipitation === 0 ? 'badge-success' : 'badge-danger'}>
                    {weather.precipitation === 0 ? 'Dry' : 'Wet'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Any precipitation or heavy mist means more conservative electronics exposure and a shorter mission window.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3">
              <Plane className="h-5 w-5 text-sky-300" />
              <h2 className="text-xl font-semibold text-white">Pilot Notes</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="section-kicker">Mission start</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {weather.windSpeed <= 10
                    ? 'Smooth enough for trim flights, gentle approaches, and lightweight models.'
                    : weather.windSpeed <= 18
                      ? 'Prefer the more stable airframes and keep takeoff runs tidy.'
                      : 'Treat this as a higher-workload day and avoid the floatier aircraft.'}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="section-kicker">Energy planning</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {weather.temperature >= 30
                    ? 'Warm air reduces climb bite and can shorten comfortable battery margins.'
                    : weather.temperature <= 5
                      ? 'Cold packs sag earlier, so budget extra reserve and warm batteries before launch.'
                      : 'Temperature sits in a fairly normal range for routine battery and power planning.'}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="section-kicker">Operational source</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {briefing
                    ? `${briefing.source} is driving this brief${briefing.stationId ? ` through ${briefing.stationId}` : ''}.`
                    : 'Once a location is loaded, the data source and observation freshness appear here.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3">
              <Droplets className="h-5 w-5 text-emerald-300" />
              <h2 className="text-xl font-semibold text-white">Air Quality</h2>
            </div>

            {airQuality ? (
              <>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">US AQI</div>
                    <div className="mt-3 text-5xl font-bold text-white">{airQuality.aqi}</div>
                    <div className="mt-2 text-sm text-slate-300">{aqiInfo?.level || 'Monitoring'}</div>
                  </div>
                  <span
                    className={
                      airQuality.aqi <= 50
                        ? 'badge-success'
                        : airQuality.aqi <= 100
                          ? 'badge-warning'
                          : 'badge-danger'
                    }
                  >
                    {aqiInfo?.advice || 'Review conditions'}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">PM2.5</div>
                    <div className="mt-2 font-mono text-xl text-white">{airQuality.pm25}</div>
                  </div>
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">PM10</div>
                    <div className="mt-2 font-mono text-xl text-white">{airQuality.pm10}</div>
                  </div>
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Ozone</div>
                    <div className="mt-2 font-mono text-xl text-white">{airQuality.o3}</div>
                  </div>
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">NO2</div>
                    <div className="mt-2 font-mono text-xl text-white">{airQuality.no2}</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm leading-7 text-slate-400">Air quality data is not available yet for this location.</p>
            )}
          </div>

          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3">
              <Sun className="h-5 w-5 text-amber-300" />
              <h2 className="text-xl font-semibold text-white">Light Window</h2>
            </div>

            {sunTimes ? (
              <div className="grid gap-3">
                <div className="metric-tile">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Sunrise</div>
                  <div className="mt-2 font-mono text-2xl text-white">
                    {new Date(sunTimes.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="metric-tile">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Sunset</div>
                  <div className="mt-2 font-mono text-2xl text-white">
                    {new Date(sunTimes.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="metric-tile">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Day length</div>
                  <div className="mt-2 font-mono text-2xl text-white">{formatDayLength(sunTimes.dayLength)}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-400">Solar timing appears once location data is available.</p>
            )}
          </div>

          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              <h2 className="text-xl font-semibold text-white">Alerts and Advisories</h2>
            </div>

            {briefing?.alerts.length ? (
              <div className="space-y-3">
                {briefing.alerts.map((alert) => (
                  <div key={alert.id} className="rounded-[24px] border border-amber-400/[0.15] bg-amber-500/[0.08] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge-warning">{alert.severity}</span>
                      <span className="text-sm font-medium text-white">{alert.event}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{alert.headline}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{alert.description}</p>
                    {alert.instruction && <p className="mt-3 text-sm text-amber-100">Instruction: {alert.instruction}</p>}
                    {alert.expires && <div className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">Expires {formatShortDateTime(alert.expires)}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-emerald-400/[0.15] bg-emerald-500/[0.08] p-4">
                <p className="text-sm leading-7 text-slate-300">
                  No active NOAA alerts are associated with this point right now. Continue checking wind and visibility before launch.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
