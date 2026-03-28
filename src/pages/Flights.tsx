import { useEffect, useState, useMemo } from 'react';
import {
  Plane, MapPin, Clock, Navigation, Gauge, Radio, AlertCircle,
  RefreshCw, Search, Filter, AlertTriangle, Plus, Calendar, Star,
  Wind, Eye, Thermometer, Droplets, ChevronRight, Trash2, Edit,
  ArrowUp, ArrowDown, Check, X, CloudRain, Play, Pause, Wifi, WifiOff,
  Flag, Globe, Settings, Download, Upload, Trash, PlaneLanding, PlaneTakeoff
} from 'lucide-react';
import OperationsMap from '../components/OperationsMap';
import { getAllFlights, getAllAircraft, saveFlight, deleteFlight, getSettings, exportData, importData } from '../lib/db';
import { generateFlightId } from '../lib/calculations';
import { fetchTrafficByCoordinates, type LiveTrafficSnapshot, type LiveTrafficFlight } from '../lib/live-traffic';
import { fetchLocationBriefing, fetchLocationBriefingByCoordinates, type WeatherBriefing } from '../lib/live-weather';
import { fetchCompleteWeatherBriefing, type WeatherBriefingComplete } from '../lib/forecast-api';
import { getDefaultWeather, getWeatherIcon, getWindDirectionName } from '../lib/weather';
import type { FlightLog, FlightRemark, FlightStatus, WeatherConditions } from '../types';
import { REMARK_LABELS, STATUS_COLORS } from '../types';

function FlightRemarkBadge({ remark }: { remark: FlightRemark }) {
  const info = REMARK_LABELS[remark];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${info.color} bg-current/10`}>
      {info.icon} {info.label}
    </span>
  );
}

function FlightLogForm({ 
  aircraft, 
  onSave, 
  onCancel,
  currentWeather 
}: { 
  aircraft: any[]; 
  onSave: (flight: FlightLog) => void;
  onCancel: () => void;
  currentWeather: WeatherConditions;
}) {
  const [form, setForm] = useState({
    aircraftId: aircraft[0]?.id || '',
    aircraftName: aircraft[0]?.name || '',
    date: new Date().toISOString().split('T')[0],
    departureTime: new Date().toTimeString().slice(0, 5),
    duration: 10,
    location: '',
    status: 'completed' as FlightStatus,
    rating: 3,
    remarks: ['safe-takeoff', 'safe-landing'] as FlightRemark[],
    notes: '',
    maxAltitude: 0,
    maxSpeed: 0,
    weather: currentWeather,
  });

  const remarkOptions: FlightRemark[] = [
    'perfect-flight', 'safe-takeoff', 'safe-landing', 'turbulent-flight',
    'first-flight', 'maintenance-done', 'upgrade-done',
    'partial-crash', 'crash-landed', 'total-crash',
    'motor-issue', 'radio-glitch', 'battery-failure', 'lost-model'
  ];

  const toggleRemark = (remark: FlightRemark) => {
    setForm(prev => ({
      ...prev,
      remarks: prev.remarks.includes(remark)
        ? prev.remarks.filter(r => r !== remark)
        : [...prev.remarks, remark]
    }));
  };

  const handleSave = () => {
    const flight: FlightLog = {
      id: generateFlightId(),
      aircraftId: form.aircraftId,
      aircraftName: form.aircraftName,
      date: form.date,
      departureTime: form.departureTime,
      duration: form.duration,
      location: form.location,
      weather: form.weather,
      remarks: form.remarks,
      status: form.status,
      rating: form.rating,
      notes: form.notes,
      maxAltitude: form.maxAltitude,
      maxSpeed: form.maxSpeed,
      flightCount: 1,
      createdAt: new Date().toISOString(),
    };
    onSave(flight);
  };

  return (
    <div className="card p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Log New Flight</h2>
      
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Aircraft</label>
            <select
              className="input"
              value={form.aircraftId}
              onChange={e => {
                const ac = aircraft.find(a => a.id === e.target.value);
                setForm(prev => ({ ...prev, aircraftId: e.target.value, aircraftName: ac?.name || '' }));
              }}
            >
              {aircraft.map(ac => (
                <option key={ac.id} value={ac.id}>{ac.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label">Departure Time</label>
            <input type="time" className="input" value={form.departureTime} onChange={e => setForm(prev => ({ ...prev, departureTime: e.target.value }))} />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" className="input" value={form.duration} onChange={e => setForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="label">Location</label>
            <input type="text" className="input" placeholder="Flying field" value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="label">Flight Status</label>
          <div className="grid grid-cols-4 gap-2">
            {(['completed', 'planned', 'aborted', 'crashed'] as FlightStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setForm(prev => ({ ...prev, status }))}
                className={`px-4 py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                  form.status === status
                    ? `${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].text} border ${STATUS_COLORS[status].border}`
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {status === 'completed' && <Check className="h-4 w-4 inline mr-1" />}
                {status === 'crashed' && <X className="h-4 w-4 inline mr-1" />}
                {status}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Flight Remarks</label>
          <div className="flex flex-wrap gap-2">
            {remarkOptions.map(remark => (
              <button
                key={remark}
                onClick={() => toggleRemark(remark)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  form.remarks.includes(remark)
                    ? 'bg-sky-500/30 text-sky-400 border border-sky-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {REMARK_LABELS[remark].icon} {REMARK_LABELS[remark].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setForm(prev => ({ ...prev, rating: star }))}
                className="p-2 transition-transform hover:scale-110"
              >
                <Star className={`h-8 w-8 ${star <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Weather at Location</label>
          <div className="card p-4 bg-slate-800/50">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <Thermometer className="h-5 w-5 mx-auto text-amber-400 mb-1" />
                <div className="text-white font-semibold">{form.weather.temperature}°C</div>
                <div className="text-xs text-slate-500">Temp</div>
              </div>
              <div>
                <Wind className="h-5 w-5 mx-auto text-sky-400 mb-1" />
                <div className="text-white font-semibold">{form.weather.windSpeed} mph</div>
                <div className="text-xs text-slate-500">Wind</div>
              </div>
              <div>
                <Eye className="h-5 w-5 mx-auto text-emerald-400 mb-1" />
                <div className="text-white font-semibold">{form.weather.visibility} km</div>
                <div className="text-xs text-slate-500">Visibility</div>
              </div>
              <div>
                <Droplets className="h-5 w-5 mx-auto text-cyan-400 mb-1" />
                <div className="text-white font-semibold">{form.weather.humidity}%</div>
                <div className="text-xs text-slate-500">Humidity</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[100px]"
            placeholder="Flight notes, observations, what to improve..."
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
            Save Flight Log
          </button>
          <button onClick={onCancel} className="btn-secondary px-6">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FlightsPage() {
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [trafficSnapshot, setTrafficSnapshot] = useState<LiveTrafficSnapshot | null>(null);
  const [weatherBriefing, setWeatherBriefing] = useState<WeatherBriefingComplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FlightStatus | 'all'>('all');
  const [selectedFlight, setSelectedFlight] = useState<FlightLog | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [fl, ac] = await Promise.all([getAllFlights(), getAllAircraft()]);
      setFlights(fl);
      setAircraft(ac);

      if (ac.length > 0) {
        const settings = await getSettings();
        const loc = settings?.defaultLocation?.trim() || 'New York';
        try {
          const briefing = await fetchLocationBriefing(loc);
          const traffic = await fetchTrafficByCoordinates(briefing.location, 150);
          const weather = await fetchCompleteWeatherBriefing(briefing.location.lat, briefing.location.lon);
          setTrafficSnapshot(traffic);
          setWeatherBriefing(weather);
        } catch (e) {
          console.log('Using default data');
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveFlight(flight: FlightLog) {
    await saveFlight(flight);
    await loadData();
    setShowAddForm(false);
  }

  async function handleDeleteFlight(id: string) {
    if (confirm('Delete this flight log?')) {
      await deleteFlight(id);
      await loadData();
      setSelectedFlight(null);
    }
  }

  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      if (filterStatus !== 'all' && f.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return f.aircraftName.toLowerCase().includes(q) || 
               f.location.toLowerCase().includes(q) ||
               f.notes.toLowerCase().includes(q);
      }
      return true;
    });
  }, [flights, filterStatus, searchQuery]);

  const totalTime = flights.reduce((sum, f) => sum + f.duration, 0);
  const avgRating = flights.length > 0 
    ? (flights.reduce((sum, f) => sum + f.rating, 0) / flights.length).toFixed(1)
    : '0.0';
  const successRate = flights.length > 0
    ? Math.round((flights.filter(f => f.status === 'completed').length / flights.length) * 100)
    : 0;

  if (showAddForm) {
    return (
      <div className="animate-fade-in">
        <FlightLogForm
          aircraft={aircraft}
          currentWeather={weatherBriefing?.current || getDefaultWeather()}
          onSave={handleSaveFlight}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Flight Log</h1>
          <p className="text-slate-400 mt-1">Track and analyze your RC flights</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Log Flight
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        <div className="stat-card">
          <div className="text-3xl font-bold text-white">{flights.length}</div>
          <div className="text-sm text-slate-400">Total Flights</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold text-white">{Math.floor(totalTime / 60)}h {totalTime % 60}m</div>
          <div className="text-sm text-slate-400">Total Time</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold text-amber-400">{avgRating}</div>
          <div className="text-sm text-slate-400">Avg Rating</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold text-emerald-400">{successRate}%</div>
          <div className="text-sm text-slate-400">Success Rate</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  className="input pl-11"
                  placeholder="Search flights..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(['all', 'completed', 'planned', 'aborted', 'crashed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                    filterStatus === status
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {filteredFlights.length > 0 ? filteredFlights.map(flight => (
            <div
              key={flight.id}
              className={`p-5 hover:bg-slate-800/50 transition-all cursor-pointer ${
                selectedFlight?.id === flight.id ? 'bg-sky-500/10 border-l-4 border-sky-500' : ''
              }`}
              onClick={() => setSelectedFlight(selectedFlight?.id === flight.id ? null : flight)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_COLORS[flight.status].bg} ${STATUS_COLORS[flight.status].text} ${STATUS_COLORS[flight.status].border} border`}>
                      {flight.status}
                    </span>
                    {flight.remarks.slice(0, 3).map((remark, i) => (
                      <span key={i} className="text-xs text-slate-500">{REMARK_LABELS[remark]?.icon}</span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{flight.aircraftName}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
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
                      {flight.location || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Thermometer className="h-4 w-4" />
                      {flight.weather?.temperature}°C
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind className="h-4 w-4" />
                      {flight.weather?.windSpeed} mph
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`h-4 w-4 ${star <= flight.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                    ))}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFlight(flight.id); }}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selectedFlight?.id === flight.id && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 animate-fade-in">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-400 mb-2">Flight Remarks</h4>
                      <div className="flex flex-wrap gap-2">
                        {flight.remarks.map(remark => (
                          <FlightRemarkBadge key={remark} remark={remark} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-400 mb-2">Weather Conditions</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Temp: <span className="text-white">{flight.weather?.temperature}°C</span></div>
                        <div>Wind: <span className="text-white">{flight.weather?.windSpeed} mph</span></div>
                        <div>Humidity: <span className="text-white">{flight.weather?.humidity}%</span></div>
                        <div>Visibility: <span className="text-white">{flight.weather?.visibility} km</span></div>
                      </div>
                    </div>
                  </div>
                  {flight.notes && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-slate-400 mb-2">Notes</h4>
                      <p className="text-sm text-slate-300 bg-slate-800/50 rounded-xl p-4">{flight.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )) : (
            <div className="p-12 text-center">
              <Plane className="h-16 w-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No flights found</h3>
              <p className="text-slate-500 mb-4">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start logging your RC flights to track your progress'}
              </p>
              <button onClick={() => setShowAddForm(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Log Your First Flight
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
