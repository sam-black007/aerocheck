import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Plane, CloudSun, Calculator, History, FolderOpen, Settings, Shield, CloudRain, BarChart3, GitCompare, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CalculatorPage from './pages/Calculator';
import SimulatorPage from './pages/Simulator';
import WeatherPage from './pages/Weather';
import FlightsPage from './pages/Flights';
import ModelsPage from './pages/Models';
import SettingsPage from './pages/Settings';
import AnalyticsPage from './pages/Analytics';
import ComparePage from './pages/Compare';

const navItems = [
  { to: '/', label: 'Mission Control', icon: CloudSun, end: true },
  { to: '/calculator', label: 'Calculator', icon: Calculator },
  { to: '/simulator', label: 'Weather Lab', icon: CloudSun },
  { to: '/weather', label: 'Weather Brief', icon: CloudRain },
  { to: '/flights', label: 'Airspace', icon: History },
  { to: '/models', label: 'Hangar', icon: FolderOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

function AppLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeItem =
    navItems.find((item) => item.to === location.pathname || (item.end && location.pathname === '/')) ??
    navItems[0];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 aviation-shell" />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-cyan-500 shadow-lg shadow-sky-500/20">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-white">AeroCheck</h1>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Aviation Ops</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            className="rounded-2xl border border-white/10 bg-slate-900/80 p-2 text-slate-200 transition-colors hover:bg-slate-800"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/10 bg-slate-950/92 backdrop-blur-xl transition-transform duration-200 lg:w-72 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex h-full flex-col p-6">
            <div className="hero-panel mb-8 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-cyan-500 shadow-lg shadow-sky-500/20">
                  <Plane className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.14em] text-white">AeroCheck</h1>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">RC flight systems</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                Aviation-style planning for model pilots with live weather, operational scoring, and real traffic context.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="data-chip">NOAA weather</span>
                <span className="data-chip">Open-Meteo</span>
                <span className="data-chip">ADS-B traffic</span>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => (isActive ? 'nav-link-active' : 'nav-link')}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="mt-auto rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">Operations Status</div>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                Browser-safe aviation feeds online
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Shield className="h-4 w-4" />
                <span>No end-user API entry required</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Shield className="h-4 w-4" />
                <span>Security reviewed for shared-device use</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 pb-10 pt-24 sm:px-6 lg:ml-72 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="section-kicker">Operations board</div>
                <p className="mt-2 font-display text-2xl font-semibold uppercase tracking-[0.14em] text-white">
                  {activeItem.label}
                </p>
              </div>
              <div className="status-pill">Live aviation data mode</div>
            </div>

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/flights" element={<FlightsPage />} />
              <Route path="/models" element={<ModelsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppLayout />
    </HashRouter>
  );
}

export default App;
