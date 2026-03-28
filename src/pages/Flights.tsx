import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Gauge,
  MapPin,
  Navigation,
  Plane,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { getAllFlights, getAllAircraft, saveFlight, deleteFlight, getSettings } from '../lib/db';
import { generateFlightId } from '../lib/calculations';
import { fetchTrafficByCoordinates, fetchTrafficByQuery, projectFlightToRadar, type LiveTrafficSnapshot } from '../lib/live-traffic';
import { getDefaultWeather } from '../lib/weather';
import type { FlightLog, Aircraft } from '../types';

function formatDateTime(value?: string | null): string {
  if (!value) {
    return 'Awaiting update';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAltitude(value: number | null): string {
  return value == null ? 'Ground' : `${value.toLocaleString()} ft`;
}

function formatEmergency(value: string): string {
  return value === 'none' ? 'Normal' : value.replace(/_/g, ' ');
}

export default function FlightsPage() {
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [trafficQuery, setTrafficQuery] = useState('');
  const [radiusNm, setRadiusNm] = useState(40);
  const [trafficSnapshot, setTrafficSnapshot] = useState<LiveTrafficSnapshot | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficError, setTrafficError] = useState<string | null>(null);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
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
    void loadLogData();
    void loadInitialTraffic();
  }, []);

  useEffect(() => {
    if (!autoRefresh || !trafficSnapshot) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refreshTraffic(undefined, radiusNm, true);
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [autoRefresh, radiusNm, trafficSnapshot]);

  async function loadLogData() {
    try {
      const [storedFlights, storedAircraft] = await Promise.all([getAllFlights(), getAllAircraft()]);
      setFlights(storedFlights.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()));
      setAircraft(storedAircraft);

      if (storedAircraft.length > 0) {
        setNewFlight((current) => ({
          ...current,
          aircraftId: storedAircraft[0].id,
          aircraftName: storedAircraft[0].name,
        }));
      }
    } catch (error) {
      console.error('Failed to load flight log data', error);
    }
  }

  async function loadInitialTraffic() {
    try {
      const settings = await getSettings();
      const defaultLocation = settings?.defaultLocation?.trim() || 'New York, NY';
      setTrafficQuery(defaultLocation);
      await refreshTraffic(defaultLocation, radiusNm, false);
    } catch (error) {
      console.error('Failed to load initial traffic location', error);
      setTrafficQuery('New York, NY');
      await refreshTraffic('New York, NY', radiusNm, false);
    }
  }

  async function refreshTraffic(rawQuery = trafficQuery, nextRadius = radiusNm, useCachedCenter = false) {
    const query = rawQuery.trim();
    if (!query && !useCachedCenter) {
      setTrafficError('Enter a city or airport before loading the traffic picture.');
      return;
    }

    setTrafficLoading(true);
    setTrafficError(null);

    try {
      const snapshot =
        useCachedCenter && trafficSnapshot
          ? await fetchTrafficByCoordinates(trafficSnapshot.center, nextRadius)
          : await fetchTrafficByQuery(query, nextRadius);

      setTrafficSnapshot(snapshot);
      setSelectedFlightId((current) =>
        snapshot.flights.some((flight) => flight.id === current) ? current : snapshot.flights[0]?.id ?? null
      );
    } catch (error) {
      console.error('Traffic refresh failed', error);
      setTrafficError('The live traffic feed could not be loaded for that location.');
    } finally {
      setTrafficLoading(false);
    }
  }

  async function handleAddFlight() {
    if (!newFlight.aircraftId || !newFlight.date || !newFlight.duration) {
      return;
    }

    const flight: FlightLog = {
      id: generateFlightId(),
      aircraftId: newFlight.aircraftId,
      aircraftName: newFlight.aircraftName || aircraft.find((entry) => entry.id === newFlight.aircraftId)?.name || 'Unknown',
      date: newFlight.date,
      duration: newFlight.duration,
      location: newFlight.location || trafficSnapshot?.center.name || 'Unknown',
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
      await loadLogData();
    } catch (error) {
      console.error('Failed to save flight log entry', error);
    }
  }

  async function handleDeleteFlight(id: string) {
    try {
      await deleteFlight(id);
      await loadLogData();
    } catch (error) {
      console.error('Failed to delete flight', error);
    }
  }

  const totalMinutes = flights.reduce((sum, flight) => sum + flight.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const airborneFlights = useMemo(
    () => (trafficSnapshot?.flights ?? []).filter((flight) => !flight.isOnGround),
    [trafficSnapshot]
  );
  const selectedTrafficFlight =
    trafficSnapshot?.flights.find((flight) => flight.id === selectedFlightId) ?? trafficSnapshot?.flights[0] ?? null;
  const topAltitude =
    airborneFlights.length > 0
      ? Math.max(...airborneFlights.map((flight) => flight.altitudeFeet ?? 0))
      : 0;
  const averageSpeed =
    airborneFlights.length > 0
      ? Math.round(airborneFlights.reduce((sum, flight) => sum + flight.speedKnots, 0) / airborneFlights.length)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="hero-panel px-6 py-7 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.18fr,0.82fr]">
          <div>
            <div className="section-kicker">Airspace monitor</div>
            <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-[0.12em] text-white">
              Live Traffic Scope
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Watch nearby aircraft with live ADS-B traffic around your field, then keep your own RC sorties logged underneath.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="data-chip">{trafficSnapshot?.source || 'airplanes.live ADS-B network'}</span>
              {trafficSnapshot?.updatedAt && <span className="data-chip">Updated {formatDateTime(trafficSnapshot.updatedAt)}</span>}
              <span className="data-chip">{autoRefresh ? 'Auto refresh 20s' : 'Manual refresh'}</span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,12rem,12rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  className="input pl-11"
                  placeholder="Search city, ICAO airport, or flying field"
                  value={trafficQuery}
                  onChange={(event) => setTrafficQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && void refreshTraffic()}
                />
              </div>

              <label className="card flex items-center gap-3 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Radius</div>
                <select
                  className="w-full bg-transparent text-sm text-white outline-none"
                  value={radiusNm}
                  onChange={(event) => setRadiusNm(Number(event.target.value))}
                >
                  <option value={20}>20 nm</option>
                  <option value={40}>40 nm</option>
                  <option value={80}>80 nm</option>
                  <option value={120}>120 nm</option>
                  <option value={180}>180 nm</option>
                </select>
              </label>

              <button className="btn-primary flex items-center justify-center gap-2" onClick={() => void refreshTraffic()} disabled={trafficLoading}>
                <RefreshCw className={`h-4 w-4 ${trafficLoading ? 'animate-spin' : ''}`} />
                {trafficLoading ? 'Refreshing' : 'Refresh'}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              {trafficSnapshot && (
                <>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-sky-300" />
                    {trafficSnapshot.center.name}
                  </span>
                  <span className="text-slate-500">
                    {trafficSnapshot.center.lat.toFixed(4)}, {trafficSnapshot.center.lon.toFixed(4)}
                  </span>
                </>
              )}
              <button
                type="button"
                className={autoRefresh ? 'badge-success' : 'badge-info'}
                onClick={() => setAutoRefresh((current) => !current)}
              >
                {autoRefresh ? 'Auto refresh on' : 'Auto refresh off'}
              </button>
            </div>

            {trafficError && <p className="mt-4 text-sm text-red-300">{trafficError}</p>}
          </div>

          <div className="card p-6">
            <div className="section-kicker">Traffic summary</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Tracked</div>
                <div className="mt-2 font-mono text-3xl text-white">{trafficSnapshot?.flights.length ?? 0}</div>
                <div className="mt-1 text-xs text-slate-400">Aircraft in scope</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Airborne</div>
                <div className="mt-2 font-mono text-3xl text-white">{airborneFlights.length}</div>
                <div className="mt-1 text-xs text-slate-400">Moving traffic</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Avg speed</div>
                <div className="mt-2 font-mono text-3xl text-white">{averageSpeed}</div>
                <div className="mt-1 text-xs text-slate-400">kt among airborne</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Top altitude</div>
                <div className="mt-2 font-mono text-3xl text-white">{topAltitude.toLocaleString()}</div>
                <div className="mt-1 text-xs text-slate-400">ft in this sweep</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <div className="space-y-6">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="section-kicker">Relative radar</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">Airspace Scope</h2>
              </div>
              <div className="text-right text-xs uppercase tracking-[0.22em] text-slate-500">
                {trafficSnapshot ? `${trafficSnapshot.radiusNm} nm radius` : 'Awaiting target area'}
              </div>
            </div>

            <div className="radar-scope aspect-square p-5">
              <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full">
                {[14, 28, 42].map((ringRadius) => (
                  <circle key={ringRadius} cx="50" cy="50" r={ringRadius} fill="none" stroke="rgba(125,211,252,0.14)" />
                ))}
                <line x1="8" y1="50" x2="92" y2="50" stroke="rgba(125,211,252,0.14)" />
                <line x1="50" y1="8" x2="50" y2="92" stroke="rgba(125,211,252,0.14)" />

                {(trafficSnapshot?.flights ?? []).slice(0, 120).map((flight) => {
                  if (!trafficSnapshot) {
                    return null;
                  }

                  const point = projectFlightToRadar(trafficSnapshot.center, flight, trafficSnapshot.radiusNm);
                  if (!point.visible) {
                    return null;
                  }

                  const isSelected = selectedTrafficFlight?.id === flight.id;
                  const fill = flight.emergency !== 'none' ? '#f87171' : flight.isOnGround ? '#f59e0b' : '#7dd3fc';

                  return (
                    <g
                      key={flight.id}
                      transform={`translate(${point.x} ${point.y}) rotate(${flight.heading})`}
                      className="cursor-pointer"
                      onClick={() => setSelectedFlightId(flight.id)}
                    >
                      <path
                        d={isSelected ? 'M0 -3.6 L2.8 3.6 L0 2.1 L-2.8 3.6 Z' : 'M0 -2.8 L2.2 2.8 L0 1.4 L-2.2 2.8 Z'}
                        fill={fill}
                        opacity={isSelected ? 1 : 0.88}
                      />
                    </g>
                  );
                })}

                <circle cx="50" cy="50" r="1.5" fill="#f8fafc" />
                <text x="50" y="5" textAnchor="middle" fill="rgba(226,232,240,0.7)" fontSize="4">N</text>
                <text x="95" y="52" textAnchor="middle" fill="rgba(226,232,240,0.7)" fontSize="4">E</text>
                <text x="50" y="98" textAnchor="middle" fill="rgba(226,232,240,0.7)" fontSize="4">S</text>
                <text x="5" y="52" textAnchor="middle" fill="rgba(226,232,240,0.7)" fontSize="4">W</text>
              </svg>

              <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-slate-950/75 px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-slate-300">
                Live scope
              </div>
              <div className="pointer-events-none absolute bottom-5 right-5 z-10 rounded-full border border-white/10 bg-slate-950/75 px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-slate-300">
                Center {trafficSnapshot?.center.name || 'Pending'}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="section-kicker">Traffic list</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Aircraft in Range</h2>
            </div>

            {trafficSnapshot?.flights.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[48rem]">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.24em] text-slate-500">
                      <th className="px-6 py-4">Callsign</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Altitude</th>
                      <th className="px-6 py-4">Speed</th>
                      <th className="px-6 py-4">Distance</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficSnapshot.flights.map((flight) => {
                      const isSelected = selectedTrafficFlight?.id === flight.id;
                      return (
                        <tr
                          key={flight.id}
                          className={`cursor-pointer border-b border-white/5 transition-colors ${isSelected ? 'bg-sky-500/[0.08]' : 'hover:bg-white/[0.03]'}`}
                          onClick={() => setSelectedFlightId(flight.id)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">{flight.callsign}</div>
                            <div className="text-xs text-slate-500">{flight.registration}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {flight.aircraftType}
                            <div className="text-xs text-slate-500">{flight.description}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">{formatAltitude(flight.altitudeFeet)}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{flight.speedKnots} kt</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{flight.distanceNm} nm</td>
                          <td className="px-6 py-4">
                            <span className={flight.emergency !== 'none' ? 'badge-danger' : flight.isOnGround ? 'badge-warning' : 'badge-success'}>
                              {flight.emergency !== 'none' ? 'Emergency' : flight.isOnGround ? 'Ground' : 'Airborne'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-slate-400">
                {trafficLoading ? 'Loading nearby aircraft...' : 'No traffic returned for this scope yet.'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="section-kicker">Selected target</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Flight Detail</h2>
            {selectedTrafficFlight ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-3xl font-semibold text-white">{selectedTrafficFlight.callsign}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {selectedTrafficFlight.registration} | {selectedTrafficFlight.aircraftType}
                    </div>
                  </div>
                  <span
                    className={
                      selectedTrafficFlight.emergency !== 'none'
                        ? 'badge-danger'
                        : selectedTrafficFlight.isOnGround
                          ? 'badge-warning'
                          : 'badge-success'
                    }
                  >
                    {selectedTrafficFlight.emergency !== 'none'
                      ? 'Emergency'
                      : selectedTrafficFlight.isOnGround
                        ? 'Ground'
                        : 'Airborne'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Altitude</div>
                    <div className="mt-2 font-mono text-2xl text-white">{formatAltitude(selectedTrafficFlight.altitudeFeet)}</div>
                  </div>
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Ground speed</div>
                    <div className="mt-2 font-mono text-2xl text-white">{selectedTrafficFlight.speedKnots} kt</div>
                  </div>
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Heading</div>
                    <div className="mt-2 font-mono text-2xl text-white">{selectedTrafficFlight.heading} deg</div>
                  </div>
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Range</div>
                    <div className="mt-2 font-mono text-2xl text-white">{selectedTrafficFlight.distanceNm} nm</div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Navigation className="h-4 w-4 text-sky-300" />
                      Relative bearing {selectedTrafficFlight.relativeDirection} deg
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Gauge className="h-4 w-4 text-emerald-300" />
                      Squawk {selectedTrafficFlight.squawk}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Clock className="h-4 w-4 text-amber-300" />
                      Seen {selectedTrafficFlight.lastSeenSeconds}s ago
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Plane className="h-4 w-4 text-violet-300" />
                      {formatEmergency(selectedTrafficFlight.emergency)}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Operator</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{selectedTrafficFlight.operator}</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-400">
                Pick an aircraft from the scope or the table to inspect its live altitude, speed, and relative position.
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="section-kicker">Personal records</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">RC Flight Log</h2>
              </div>
              <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4" />
                Log Flight
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Flights</div>
                <div className="mt-2 font-mono text-3xl text-white">{flights.length}</div>
                <div className="mt-1 text-xs text-slate-400">Saved sessions</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Flight time</div>
                <div className="mt-2 font-mono text-3xl text-white">
                  {totalHours}h {remainingMinutes}m
                </div>
                <div className="mt-1 text-xs text-slate-400">Accumulated log</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Avg rating</div>
                <div className="mt-2 font-mono text-3xl text-white">
                  {flights.length > 0
                    ? (flights.reduce((sum, flight) => sum + flight.rating, 0) / flights.length).toFixed(1)
                    : '0.0'}
                </div>
                <div className="mt-1 text-xs text-slate-400">Pilot score</div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {flights.length > 0 ? (
                flights.map((flight) => (
                  <div
                    key={flight.id}
                    className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="font-medium text-white">{flight.aircraftName}</div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          {new Date(flight.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-500" />
                          {flight.duration} min
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          {flight.location}
                        </span>
                      </div>
                      {flight.notes && <p className="text-sm leading-7 text-slate-300">{flight.notes}</p>}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex justify-end gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star
                              key={rating}
                              className={`h-4 w-4 ${rating <= flight.rating ? 'text-amber-300' : 'text-slate-700'}`}
                              fill={rating <= flight.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                          {flight.weather.temperature} deg C | {flight.weather.windSpeed} mph
                        </div>
                      </div>

                      <button
                        className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-300 transition-colors hover:bg-red-500/20"
                        onClick={() => void handleDeleteFlight(flight.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-center text-slate-400">
                  No RC flights logged yet. Add your first sortie once you are ready.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 animate-slide-up">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Log New Flight</h2>
              <button className="rounded-2xl border border-white/10 p-2 text-slate-400 hover:text-white" onClick={() => setShowAddForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Model</label>
                <select
                  className="input"
                  value={newFlight.aircraftId}
                  onChange={(event) => {
                    const selectedAircraft = aircraft.find((entry) => entry.id === event.target.value);
                    setNewFlight({
                      ...newFlight,
                      aircraftId: event.target.value,
                      aircraftName: selectedAircraft?.name || '',
                    });
                  }}
                >
                  {aircraft.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
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
                    onChange={(event) => setNewFlight({ ...newFlight, date: event.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input
                    type="number"
                    className="input"
                    value={newFlight.duration}
                    onChange={(event) => setNewFlight({ ...newFlight, duration: parseInt(event.target.value, 10) })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  className="input"
                  placeholder={trafficSnapshot?.center.name || 'Flying field name'}
                  value={newFlight.location}
                  onChange={(event) => setNewFlight({ ...newFlight, location: event.target.value })}
                />
              </div>

              <div>
                <label className="label">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      className={`rounded-2xl p-2 transition-colors ${
                        rating <= (newFlight.rating || 0)
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      onClick={() => setNewFlight({ ...newFlight, rating })}
                    >
                      <Star className="h-5 w-5" fill={rating <= (newFlight.rating || 0) ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input min-h-[96px]"
                  placeholder="Flight notes, setup tweaks, field impressions"
                  value={newFlight.notes}
                  onChange={(event) => setNewFlight({ ...newFlight, notes: event.target.value })}
                />
              </div>

              <button className="btn-primary w-full" onClick={() => void handleAddFlight()}>
                Save Flight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
