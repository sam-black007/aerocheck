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
  { to: '/', label: 'Dashboard', icon: CloudSun, end: true },
  { to: '/calculator', label: 'Calculator', icon: Calculator },
  { to: '/simulator', label: 'Weather Simulator', icon: CloudSun },
  { to: '/weather', label: 'Live Weather', icon: CloudRain },
  { to: '/flights', label: 'Flight Log', icon: History },
  { to: '/models', label: 'Model Library', icon: FolderOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

function AppLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/20">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">AeroCheck</h1>
              <p className="text-xs text-slate-500">Model flight planner</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-200 transition-colors hover:bg-slate-800"
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
          className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl transition-transform duration-200 lg:w-64 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-6">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/20">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AeroCheck</h1>
                <p className="text-xs text-slate-500">Flight Calculator</p>
              </div>
            </div>

            <nav className="space-y-1">
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
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-4 w-4" />
              <span>Security audited</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 pb-8 pt-24 sm:px-6 lg:ml-64 lg:p-8">
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
