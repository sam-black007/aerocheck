import { useState, useEffect } from 'react';
import { Cloud, Wind, Thermometer, Droplets, Eye, Sun, CloudRain, Plane, MapPin, Navigation, Gauge } from 'lucide-react';
import { fetchNominatim, fetchOpenAQ, fetchSunTimes, getAQIDescription } from '../lib/apis';
import { getDefaultWeather, getWeatherIcon, getWindDirectionName } from '../lib/weather';
import type { WeatherConditions } from '../types';

export default function WeatherPage() {
  const [location, setLocation] = useState('New York, NY');
  const [searchLocation, setSearchLocation] = useState('');
  const [weather, setWeather] = useState<WeatherConditions>(getDefaultWeather());
  const [airQuality, setAirQuality] = useState<any>(null);
  const [sunTimes, setSunTimes] = useState<any>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleSearch();
  }, []);

  async function handleSearch() {
    if (!searchLocation.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Geocode location
      const results = await fetchNominatim(searchLocation);
      if (results.length === 0) {
        setError('Location not found');
        return;
      }

      const first = results[0];
      setCoordinates({ lat: first.lat, lon: first.lon });
      setLocation(first.name);

      // Fetch additional data
      await Promise.all([
        fetchAirQuality(first.lat, first.lon),
        fetchSolarTimes(first.lat, first.lon),
      ]);

      // Use default weather (in production, fetch real weather)
      setWeather(getDefaultWeather());
    } catch (e) {
      setError('Failed to fetch weather data');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAirQuality(lat: number, lon: number) {
    try {
      const aq = await fetchOpenAQ(lat, lon);
      setAirQuality(aq);
    } catch (e) {
      console.error('Air quality fetch failed', e);
    }
  }

  async function fetchSolarTimes(lat: number, lon: number) {
    try {
      const times = await fetchSunTimes(lat, lon);
      setSunTimes(times);
    } catch (e) {
      console.error('Sun times fetch failed', e);
    }
  }

  const aqiInfo = airQuality ? getAQIDescription(airQuality.aqi) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Weather & Conditions</h1>
          <p className="text-slate-400 mt-1">Real-time weather and air quality data</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Enter location (city, airport ICAO, etc.)"
              value={searchLocation}
              onChange={e => setSearchLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            className="btn-primary px-6"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {location && (
          <p className="text-sm text-sky-400 mt-3 flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            {location}
            {coordinates && (
              <span className="text-slate-500">
                ({coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)})
              </span>
            )}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-400 mt-3">{error}</p>
        )}
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-400 mt-4">Fetching weather data...</p>
        </div>
      ) : (
        <>
          {/* Current Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-sky-400" />
                Current Weather
              </h2>
              
              <div className="text-center mb-6">
                <span className="text-6xl">{getWeatherIcon(weather)}</span>
                <div className="text-4xl font-bold text-white mt-2">{weather.temperature}°C</div>
                <p className="text-slate-400 capitalize">{weather.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Wind className="w-4 h-4" />
                    <span className="text-sm">Wind</span>
                  </div>
                  <span className={`stat-value ${
                    weather.windSpeed > 20 ? 'text-red-400' :
                    weather.windSpeed > 10 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {weather.windSpeed} mph
                  </span>
                  <span className="text-xs text-slate-500">
                    {getWindDirectionName(weather.windDirection)}
                  </span>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Droplets className="w-4 h-4" />
                    <span className="text-sm">Humidity</span>
                  </div>
                  <span className="stat-value text-cyan-400">{weather.humidity}%</span>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Visibility</span>
                  </div>
                  <span className="stat-value text-green-400">{weather.visibility} km</span>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Gauge className="w-4 h-4" />
                    <span className="text-sm">Pressure</span>
                  </div>
                  <span className="stat-value text-purple-400">{weather.pressure} hPa</span>
                </div>
              </div>

              {/* Flying Conditions Assessment */}
              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-3">Flying Assessment</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Wind Conditions</span>
                    <span className={`badge ${
                      weather.windSpeed <= 10 ? 'badge-success' :
                      weather.windSpeed <= 20 ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {weather.windSpeed <= 10 ? 'Good' : weather.windSpeed <= 20 ? 'Marginal' : 'Dangerous'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Visibility</span>
                    <span className={`badge ${weather.visibility >= 5 ? 'badge-success' : 'badge-warning'}`}>
                      {weather.visibility >= 5 ? 'Good' : 'Limited'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Precipitation</span>
                    <span className={`badge ${weather.precipitation === 0 ? 'badge-success' : 'badge-danger'}`}>
                      {weather.precipitation === 0 ? 'None' : 'Present'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Air Quality & Sun Times */}
            <div className="space-y-6">
              {/* Air Quality */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-green-400" />
                  Air Quality Index
                </h2>
                
                {airQuality ? (
                  <>
                    <div className="text-center mb-4">
                      <div className={`text-5xl font-bold ${
                        airQuality.aqi <= 50 ? 'text-green-400' :
                        airQuality.aqi <= 100 ? 'text-yellow-400' :
                        airQuality.aqi <= 150 ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        {airQuality.aqi}
                      </div>
                      <div className={`text-lg font-medium ${
                        aqiInfo?.color === 'green' ? 'text-green-400' :
                        aqiInfo?.color === 'yellow' ? 'text-yellow-400' :
                        aqiInfo?.color === 'orange' ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        {aqiInfo?.level}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-400">PM2.5</div>
                        <div className="font-mono text-white">{airQuality.pm25.toFixed(1)}</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-400">PM10</div>
                        <div className="font-mono text-white">{airQuality.pm10.toFixed(1)}</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-400">O3</div>
                        <div className="font-mono text-white">{airQuality.o3.toFixed(1)}</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-400">NO2</div>
                        <div className="font-mono text-white">{airQuality.no2.toFixed(1)}</div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 mt-4 text-center">
                      {aqiInfo?.advice}
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>Enter a location to see air quality</p>
                  </div>
                )}
              </div>

              {/* Solar Times */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-400" />
                  Solar Information
                </h2>
                
                {sunTimes ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-4 text-center">
                        <Sun className="w-8 h-8 mx-auto text-amber-400 mb-2" />
                        <div className="text-xs text-slate-400">Sunrise</div>
                        <div className="text-lg font-mono text-white">
                          {new Date(sunTimes.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg p-4 text-center">
                        <CloudRain className="w-8 h-8 mx-auto text-orange-400 mb-2" />
                        <div className="text-xs text-slate-400">Sunset</div>
                        <div className="text-lg font-mono text-white">
                          {new Date(sunTimes.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Day Length</span>
                        <span className="font-mono text-white">
                          {Math.floor(parseInt(sunTimes.dayLength) / 3600)}h {Math.floor((parseInt(sunTimes.dayLength) % 3600) / 60)}m
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                      Based on location coordinates for optimal accuracy
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>Solar times will appear for your location</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Aviation Weather Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-400" />
              Pilot Weather Briefing
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-4">
                <h3 className="font-medium text-sky-400 mb-2">VFR Conditions</h3>
                <p className="text-sm text-slate-300">
                  {weather.visibility >= 5 && weather.cloudCeiling >= 3000 && weather.precipitation === 0
                    ? 'Conditions are favorable for VFR flight'
                    : 'Consider IFR procedures or wait for better conditions'}
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <h3 className="font-medium text-amber-400 mb-2">Density Altitude</h3>
                <p className="text-sm text-slate-300">
                  High temperatures reduce aircraft performance.
                  {weather.temperature > 30 && ' Consider lighter loads.'}
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h3 className="font-medium text-green-400 mb-2">Recommendation</h3>
                <p className="text-sm text-slate-300">
                  {weather.windSpeed <= 15 && weather.visibility >= 5 && weather.precipitation === 0
                    ? 'Excellent conditions for flight training'
                    : 'Proceed with caution, consider abbreviated checklist'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
