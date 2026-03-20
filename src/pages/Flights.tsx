import { useState, useEffect } from 'react';
import { Plus, Plane, Calendar, Clock, MapPin, Star, Trash2, Edit2, X } from 'lucide-react';
import { getAllFlights, getAllAircraft, saveFlight, deleteFlight } from '../lib/db';
import { generateFlightId } from '../lib/calculations';
import { getDefaultWeather } from '../lib/weather';
import type { FlightLog, Aircraft } from '../types';

export default function FlightsPage() {
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFlight, setNewFlight] = useState<Partial<FlightLog>>({
    aircraftId: '',
    aircraftName: '',
    date: new Date().toISOString().split('T')[0],
    duration: 10,
    location: '',
    notes: '',
    rating: 3,
    weather: getDefaultWeather(),
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const fl = await getAllFlights();
      const ac = await getAllAircraft();
      setFlights(fl.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAircraft(ac);
      if (ac.length > 0) {
        setNewFlight(prev => ({ ...prev, aircraftId: ac[0].id, aircraftName: ac[0].name }));
      }
    } catch (e) {
      console.error('Failed to load data', e);
    }
  }

  async function handleAddFlight() {
    if (!newFlight.aircraftId || !newFlight.date || !newFlight.duration) return;
    
    const flight: FlightLog = {
      id: generateFlightId(),
      aircraftId: newFlight.aircraftId,
      aircraftName: newFlight.aircraftName || aircraft.find(a => a.id === newFlight.aircraftId)?.name || 'Unknown',
      date: newFlight.date,
      duration: newFlight.duration,
      location: newFlight.location || 'Unknown',
      weather: newFlight.weather || getDefaultWeather(),
      notes: newFlight.notes || '',
      rating: newFlight.rating || 3,
    };

    try {
      await saveFlight(flight);
      setShowAddForm(false);
      setNewFlight({
        aircraftId: aircraft[0]?.id || '',
        aircraftName: aircraft[0]?.name || '',
        date: new Date().toISOString().split('T')[0],
        duration: 10,
        location: '',
        notes: '',
        rating: 3,
        weather: getDefaultWeather(),
      });
      loadData();
    } catch (e) {
      console.error('Failed to save flight', e);
    }
  }

  async function handleDeleteFlight(id: string) {
    try {
      await deleteFlight(id);
      loadData();
    } catch (e) {
      console.error('Failed to delete flight', e);
    }
  }

  const totalMinutes = flights.reduce((sum, f) => sum + f.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Flight Log</h1>
          <p className="text-slate-400 mt-1">Track your flying sessions</p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-5 h-5" />
          Log Flight
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Plane className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{flights.length}</div>
              <div className="text-xs text-slate-400">Total Flights</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalHours}h {remainingMinutes}m</div>
              <div className="text-xs text-slate-400">Total Flight Time</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {flights.length > 0 
                  ? (flights.reduce((sum, f) => sum + f.rating, 0) / flights.length).toFixed(1)
                  : '0.0'}
              </div>
              <div className="text-xs text-slate-400">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Log New Flight</h2>
              <button 
                className="text-slate-400 hover:text-white"
                onClick={() => setShowAddForm(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Model</label>
                <select 
                  className="input"
                  value={newFlight.aircraftId}
                  onChange={e => {
                    const ac = aircraft.find(a => a.id === e.target.value);
                    setNewFlight({ 
                      ...newFlight, 
                      aircraftId: e.target.value,
                      aircraftName: ac?.name || ''
                    });
                  }}
                >
                  {aircraft.map(ac => (
                    <option key={ac.id} value={ac.id}>{ac.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input"
                    value={newFlight.date}
                    onChange={e => setNewFlight({ ...newFlight, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input
                    type="number"
                    className="input"
                    value={newFlight.duration}
                    onChange={e => setNewFlight({ ...newFlight, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Flying field name"
                  value={newFlight.location}
                  onChange={e => setNewFlight({ ...newFlight, location: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button
                      key={r}
                      className={`p-2 rounded-lg transition-colors ${
                        r <= (newFlight.rating || 0)
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-700 text-slate-500 hover:text-slate-300'
                      }`}
                      onClick={() => setNewFlight({ ...newFlight, rating: r })}
                    >
                      <Star className="w-5 h-5" fill={r <= (newFlight.rating || 0) ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="How was the flight?"
                  value={newFlight.notes}
                  onChange={e => setNewFlight({ ...newFlight, notes: e.target.value })}
                />
              </div>
              
              <button 
                className="btn-primary w-full"
                onClick={handleAddFlight}
              >
                Save Flight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flight List */}
      {flights.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Model</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Duration</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Location</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Rating</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Weather</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flights.map(flight => (
                  <tr key={flight.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                          <Plane className="w-4 h-4 text-sky-400" />
                        </div>
                        <span className="font-medium text-white">{flight.aircraftName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {new Date(flight.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {flight.duration} min
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        {flight.location}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(r => (
                          <Star 
                            key={r}
                            className={`w-4 h-4 ${
                              r <= flight.rating ? 'text-amber-400' : 'text-slate-600'
                            }`}
                            fill={r <= flight.rating ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-400">
                        {flight.weather.temperature}°C • {flight.weather.windSpeed} mph
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        className="text-slate-400 hover:text-red-400 transition-colors"
                        onClick={() => handleDeleteFlight(flight.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Plane className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-white mb-2">No flights logged yet</h3>
          <p className="text-slate-400 mb-4">Start tracking your flights to see them here</p>
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            Log Your First Flight
          </button>
        </div>
      )}
    </div>
  );
}
