import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Plane, CloudSun, Calculator, History, FolderOpen, Settings, Shield, CloudRain, BarChart3, GitCompare } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CalculatorPage from './pages/Calculator';
import SimulatorPage from './pages/Simulator';
import WeatherPage from './pages/Weather';
import FlightsPage from './pages/Flights';
import ModelsPage from './pages/Models';
import SettingsPage from './pages/Settings';
import AnalyticsPage from './pages/Analytics';
import ComparePage from './pages/Compare';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 z-50">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">AeroCheck</h1>
                <p className="text-xs text-slate-500">Flight Calculator</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              <NavLink 
                to="/" 
                end 
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <CloudSun className="w-5 h-5" />
                Dashboard
              </NavLink>
              <NavLink 
                to="/calculator" 
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <Calculator className="w-5 h-5" />
                Calculator
              </NavLink>
              <NavLink 
                to="/simulator" 
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <CloudSun className="w-5 h-5" />
                Weather Simulator
              </NavLink>
              <NavLink 
                to="/weather" 
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <CloudRain className="w-5 h-5" />
                Live Weather
              </NavLink>
              <NavLink 
                to="/flights" 
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <History className="w-5 h-5" />
                Flight Log
              </NavLink>
              <NavLink 
                to="/models" 
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <FolderOpen className="w-5 h-5" />
                Model Library
              </NavLink>
              <NavLink 
                to="/analytics" 
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <BarChart3 className="w-5 h-5" />
                Analytics
              </NavLink>
              <NavLink 
                to="/compare" 
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <GitCompare className="w-5 h-5" />
                Compare
              </NavLink>
              <NavLink 
                to="/settings" 
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <Settings className="w-5 h-5" />
                Settings
              </NavLink>
            </nav>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4" />
              <span>Security audited</span>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
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

export default App;
