import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, MapPin, Gauge, Plane, Award, Calendar, Activity } from 'lucide-react';
import { calculateAnalytics, getFlightSessions, type FlightAnalytics } from '../lib/flight-tracker';
import { getAllAircraft } from '../lib/db';
import type { Aircraft } from '../types';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<FlightAnalytics | null>(null);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [stats, ac, sess] = await Promise.all([
        calculateAnalytics(),
        getAllAircraft(),
        getFlightSessions(),
      ]);
      setAnalytics(stats);
      setAircraft(ac);
      setSessions(sess.filter((s: any) => !s.isActive));
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const aircraftName = (id: string) => aircraft.find(a => a.id === id)?.name || 'Unknown';

  // Prepare chart data
  const monthlyData = prepareMonthlyData(sessions);
  const aircraftDistribution = prepareAircraftDistribution(sessions);
  const durationData = prepareDurationData(sessions);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Flight Analytics</h1>
        <p className="text-slate-400 mt-1">Track your progress and performance</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Plane className="w-5 h-5" />}
          label="Total Flights"
          value={analytics?.totalFlights || 0}
          color="sky"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Flight Time"
          value={`${analytics?.totalFlightTime || 0} min`}
          color="green"
        />
        <StatCard
          icon={<MapPin className="w-5 h-5" />}
          label="Distance"
          value={`${analytics?.totalDistance || 0} mi`}
          color="amber"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="This Month"
          value={analytics?.flightsThisMonth || 0}
          color="purple"
        />
      </div>

      {/* Records */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Longest Flight</div>
              <div className="text-2xl font-bold text-white">
                {analytics?.longestFlight 
                  ? `${Math.round(((analytics.longestFlight.endTime || 0) - analytics.longestFlight.startTime) / 60000)} min`
                  : 'N/A'}
              </div>
            </div>
          </div>
          {analytics?.longestFlight && (
            <div className="text-sm text-slate-400">
              {aircraftName(analytics.longestFlight.aircraftId)}
            </div>
          )}
        </div>

        <div className="card p-6 bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Highest Altitude</div>
              <div className="text-2xl font-bold text-white">
                {analytics?.highestAltitude || 0} ft
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Gauge className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Fastest Speed</div>
              <div className="text-2xl font-bold text-white">
                {analytics?.fastestSpeed || 0} mph
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Flights */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            Flights This Year
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="flights" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aircraft Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Aircraft Usage</h2>
          <div className="h-64 flex items-center">
            {aircraftDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aircraftDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {aircraftDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center w-full text-slate-500">
                No flight data yet
              </div>
            )}
          </div>
        </div>

        {/* Flight Duration Trend */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Flight Duration Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Sessions</h2>
        <div className="space-y-3">
          {sessions.slice(-5).reverse().map((session: any) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <div className="font-medium text-white">
                    {aircraftName(session.aircraftId)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(session.startTime).toLocaleDateString()} • {' '}
                    {session.track.maxAltitude} ft max altitude
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sky-400">
                  {Math.round((session.endTime - session.startTime) / 60000)} min
                </div>
                <div className="text-xs text-slate-400">
                  {session.track.totalDistance.toFixed(1)} mi
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No flights logged yet. Start flying to see your stats!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'sky' | 'green' | 'amber' | 'purple';
}) {
  const colorClasses = {
    sky: 'bg-sky-500/20 text-sky-400',
    green: 'bg-green-500/20 text-green-400',
    amber: 'bg-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function prepareMonthlyData(sessions: any[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = months.map((month, i) => ({
    month,
    flights: sessions.filter((s: any) => new Date(s.startTime).getMonth() === i).length,
  }));
  return data;
}

function prepareAircraftDistribution(sessions: any[]) {
  const counts: Record<string, number> = {};
  sessions.forEach((s: any) => {
    counts[s.aircraftId] = (counts[s.aircraftId] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function prepareDurationData(sessions: any[]) {
  return sessions.slice(-10).map((s: any) => ({
    date: new Date(s.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    duration: Math.round((s.endTime - s.startTime) / 60000),
  }));
}
