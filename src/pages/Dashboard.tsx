import { useEffect, useState } from 'react';
import { 
  Plane, Wind, Thermometer, Droplets, Gauge, Eye, Clock, MapPin, 
  CloudRain, Navigation, ArrowUp, ArrowDown, Sun, Moon, AlertTriangle,
  TrendingUp, Calendar, Star, Users, Activity, Zap, CloudLightning,
  ChevronRight, RefreshCw, Map, BarChart3, Settings, User, LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';
import OperationsMap from '../components/OperationsMap';
import { getDefaultWeather, getWeatherIcon } from '../lib/weather';
import { getAllAircraft, getAllFlights, getSettings } from '../lib/db';
import { fetchLocationBriefing, fetchLocationBriefingByCoordinates, type WeatherBriefing } from '../lib/live-weather';
import { fetchTrafficByCoordinates, type LiveTrafficSnapshot } from '../lib/live-traffic';
import { fetch7DayForecast, type WeatherBriefingComplete } from '../lib/forecast-api';
import type { Aircraft, FlightLog, WeatherConditions } from '../types';
import { REMARK_LABELS, STATUS_COLORS } from '../types';

function StatCard({ icon: Icon, label, value, subtext, color = 'sky' }: { 
  icon: any; label: string; value: string | number; subtext?: string; color?: string 
}) {
  const colorClasses: Record<string, string> = {
    sky: 'text-sky-400 bg-sky-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  };

  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
      {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </div>
  );
}

function WeatherWidget({ weather, location }: { weather: WeatherConditions; location: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-5xl mb-2">{getWeatherIcon(weather)}</div>
          <div className="text-4xl font-bold text-white">{weather.temperature}°C</div>
          <div className="text-slate-400 mt-1">{weather.description}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">{location}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="text-center">
          <Wind className="h-5 w-5 mx-auto text-sky-400 mb-1" />
          <div className="text-lg font-semibold text-white">{weather.windSpeed}</div>
          <div className="text-xs text-slate-500">mph wind</div>
        </div>
        <div className="text-center">
          <Droplets className="h-5 w-5 mx-auto text-cyan-400 mb-1" />
          <div className="text-lg font-semibold text-white">{weather.humidity}%</div>
          <div className="text-xs text-slate-500">humidity</div>
        </div>
        <div className="text-center">
          <Eye className="h-5 w-5 mx-auto text-emerald-400 mb-1" />
          <div className="text-lg font-semibold text-white">{weather.visibility}</div>
          <div className="text-xs text-slate-500">km vis</div>
        </div>
        <div className="text-center">
          <Gauge className="h-5 w-5 mx-auto text-amber-400 mb-1" />
          <div className="text-lg font-semibold text-white">{weather.pressure}</div>
          <div className="text-xs text-slate-500">hPa</div>
        </div>
      </div>
    </div>
  );
}

function RecentFlightCard({ flight }: { flight: FlightLog }) {
  const statusStyle = STATUS_COLORS[flight.status] || STATUS_COLORS.completed;
  
  return (
    <Link to="/flights" className="flight-log-entry block hover:no-underline">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
              {flight.status}
            </span>
            {flight.remarks.slice(0, 2).map((remark, i) => (
              <span key={i} className="text-xs text-slate-400">
                {REMARK_LABELS[remark]?.icon} {REMARK_LABELS[remark]?.label}
              </span>
            ))}
          </div>
          <h3 className="text-lg font-semibold text-white">{flight.aircraftName}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(flight.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {flight.duration} min
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {flight.location}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${star <= flight.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}

function AircraftCard({ aircraft }: { aircraft: Aircraft }) {
  return (
    <Link to="/models" className="model-card block hover:no-underline">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-sky-500/10 flex items-center justify-center">
          <Plane className="h-7 w-7 text-sky-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{aircraft.name}</h3>
          <div className="text-sm text-slate-400 capitalize">{aircraft.type.replace('-', ' ')}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500" />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [weather, setWeather] = useState<WeatherConditions>(getDefaultWeather());
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [briefing, setBriefing] = useState<WeatherBriefing | null>(null);
  const [trafficSnapshot, setTrafficSnapshot] = useState<LiveTrafficSnapshot | null>(null);
  const [weatherLocation, setWeatherLocation] = useState('Loading...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [ac, fl, settings] = await Promise.all([
        getAllAircraft(),
        getAllFlights(),
        getSettings(),
      ]);

      setAircraft(ac);
      setFlights(fl);

      const locationQuery = settings?.defaultLocation?.trim() || 'New York';
      
      try {
        const briefingData = await fetchLocationBriefing(locationQuery);
        setBriefing(briefingData);
        setWeather(briefingData.weather);
        setWeatherLocation(briefingData.location.name);

        const trafficData = await fetchTrafficByCoordinates(briefingData.location, 100);
        setTrafficSnapshot(trafficData);
      } catch (e) {
        console.log('Using default weather');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalFlightTime = flights.reduce((sum, f) => sum + f.duration, 0);
  const avgRating = flights.length > 0 
    ? (flights.reduce((sum, f) => sum + f.rating, 0) / flights.length).toFixed(1)
    : '0.0';
  const successfulFlights = flights.filter(f => f.status === 'completed').length;
  const crashFlights = flights.filter(f => f.status === 'crashed').length;

  const recentFlights = flights.slice(0, 3);
  const topAircraft = aircraft.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Mission Control</h1>
          <p className="text-slate-400 mt-1">Your aviation dashboard overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-success flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard icon={Plane} label="Total Flights" value={flights.length} color="sky" />
        <StatCard icon={Clock} label="Flight Time" value={`${Math.floor(totalFlightTime / 60)}h ${totalFlightTime % 60}m`} color="emerald" />
        <StatCard icon={Star} label="Avg Rating" value={avgRating} subtext="out of 5" color="amber" />
        <StatCard icon={Users} label="Aircraft" value={aircraft.length} subtext="in hangar" color="purple" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeatherWidget weather={weather} location={weatherLocation} />
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">Flight Statistics</h3>
          <div className="space-y-4">
            <div className="data-row">
              <span className="data-label">Successful</span>
              <span className="data-value text-emerald-400">{successfulFlights}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Crashed</span>
              <span className="data-value text-red-400">{crashFlights}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Success Rate</span>
              <span className="data-value">
                {flights.length > 0 ? Math.round((successfulFlights / flights.length) * 100) : 0}%
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Best Conditions</span>
              <span className="data-value text-sky-400">Clear</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="section-title">Live Flight Map</h3>
                  <p className="section-subtitle">Real-time aircraft tracking in your area</p>
                </div>
                <Link to="/flights" className="btn-secondary flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Full Map
                </Link>
              </div>
            </div>
            <div className="h-[400px]">
              <OperationsMap
                center={briefing?.location ?? null}
                flights={trafficSnapshot?.flights ?? []}
                radiusNm={100}
                weatherSummary={{
                  description: weather.description,
                  temperature: weather.temperature,
                  visibility: weather.visibility,
                  windSpeed: weather.windSpeed,
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <Link to="/flights" className="btn-primary w-full flex items-center justify-center gap-2">
                <Plane className="h-4 w-4" />
                Log New Flight
              </Link>
              <Link to="/models" className="btn-secondary w-full flex items-center justify-center gap-2">
                <Activity className="h-4 w-4" />
                Add Aircraft
              </Link>
              <Link to="/calculator" className="btn-secondary w-full flex items-center justify-center gap-2">
                <Gauge className="h-4 w-4" />
                Flight Calculator
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Your Aircraft</h3>
              <Link to="/models" className="text-sm text-sky-400 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {topAircraft.length > 0 ? topAircraft.map(ac => (
                <AircraftCard key={ac.id} aircraft={ac} />
              )) : (
                <div className="text-center py-8 text-slate-400">
                  <Plane className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No aircraft yet</p>
                  <Link to="/models" className="text-sky-400 text-sm hover:underline">Add your first model</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="section-title">Recent Flights</h3>
            <p className="section-subtitle">Your latest flight logs</p>
          </div>
          <Link to="/flights" className="text-sm text-sky-400 hover:underline">View All</Link>
        </div>
        <div className="space-y-4">
          {recentFlights.length > 0 ? recentFlights.map(flight => (
            <RecentFlightCard key={flight.id} flight={flight} />
          )) : (
            <div className="text-center py-12 text-slate-400">
              <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No flights logged yet</p>
              <p className="text-sm mt-2">Start logging your RC flights to track your progress</p>
              <Link to="/flights" className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Log Your First Flight
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Link to="/weather" className="card p-6 hover:border-sky-500/30 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <CloudRain className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Weather Brief</h3>
              <p className="text-sm text-slate-400">7-day forecast</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Check detailed weather conditions and cloud movement for your flying location.</p>
        </Link>

        <Link to="/calculator" className="card p-6 hover:border-sky-500/30 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Gauge className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Flight Calculator</h3>
              <p className="text-sm text-slate-400">Performance analysis</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Calculate wing loading, thrust-to-weight ratio, and flight time estimates.</p>
        </Link>

        <Link to="/analytics" className="card p-6 hover:border-sky-500/30 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Analytics</h3>
              <p className="text-sm text-slate-400">Performance trends</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">View detailed statistics, trends, and insights about your flying history.</p>
        </Link>
      </div>
    </div>
  );
}
