import { useEffect, useState } from 'react';
import { 
  Plane, Plus, Trash2, Edit, Star, ChevronRight, Search, Filter,
  Clock, Droplets, Thermometer, Wind, Package, Scissors, Cpu,
  Zap, Battery, Gauge, Ruler, Weight, Settings, Check, X
} from 'lucide-react';
import { getAllAircraft, saveAircraft, deleteAircraft } from '../lib/db';
import type { Aircraft, AircraftType } from '../types';
import { AIRCRAFT_DEFAULTS } from '../types';

const AIRCRAFT_CATEGORIES = {
  'Fixed Wing': [
    { type: 'parkflyer', name: 'Park Flyer', desc: 'Beginner-friendly, slow flight' },
    { type: 'sport', name: 'Sport Plane', desc: '3D capable aerobatics' },
    { type: 'scale', name: 'Scale Model', desc: 'Realistic replicas' },
    { type: 'warbird', name: 'Warbird', desc: 'WWII style aircraft' },
    { type: 'jet', name: 'Jet/EDF', desc: 'High-speed jets' },
    { type: 'glider', name: 'Glider/Sailplane', desc: 'Thermal soaring' },
    { type: 'pylon', name: 'Pylon Racer', desc: 'Speed racing' },
    { type: 'biplane', name: 'Biplane', desc: 'Double wing design' },
    { type: 'flyingwing', name: 'Flying Wing', desc: 'Stealth style' },
    { type: 'deltawing', name: 'Delta Wing', desc: 'Swept wing design' },
  ],
  'Multirotor': [
    { type: 'quadcopter', name: 'Quadcopter', desc: '4-motor drone' },
    { type: 'tricopter', name: 'Tricopter', desc: '3-motor Y-config' },
    { type: 'hexacopter', name: 'Hexacopter', desc: '6-motor heavy lift' },
    { type: 'octocopter', name: 'Octocopter', desc: '8-motor cinema drone' },
  ],
  'Rotary': [
    { type: 'helicopter', name: 'Helicopter', desc: 'CP or FP heli' },
  ],
  'Specialty': [
    { type: 'rocket', name: 'Rocket Plane', desc: 'Rocket powered' },
    { type: 'blimp', name: 'Blimp/Airship', desc: 'Indoor/outdoor' },
    { type: 'ornithopter', name: 'Ornithopter', desc: 'Flapping wing' },
  ],
  '3D Printed': [
    { type: '3d-printed', name: '3D Printed Micro', desc: 'Small indoor models' },
    { type: '3d-printed', name: '3D Printed Park Flyer', desc: 'Medium indoor/outdoor' },
    { type: '3d-printed', name: '3D Printed Warbird', desc: 'Scale replicas' },
    { type: '3d-printed', name: '3D Printed Quad', desc: 'Micro drones' },
  ],
};

function AircraftForm({ 
  aircraft, 
  onSave, 
  onCancel 
}: { 
  aircraft?: Aircraft; 
  onSave: (ac: Aircraft) => void; 
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Aircraft>(aircraft || {
    id: crypto.randomUUID(),
    name: '',
    type: 'fixed-wing',
    manufacturer: '',
    wingspan: 48,
    wingArea: 300,
    weight: 1200,
    motor: { kv: 1000, maxVoltage: 14.8, maxCurrent: 50, weight: 150 },
    prop: { diameter: 10, pitch: 4 },
    battery: { cells: 4, capacity: 5000, dischargeRate: 50, voltage: 14.8 },
    is3DPrinted: false,
    printTime: 0,
    filamentUsed: 0,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSave = () => {
    onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="card p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">
        {aircraft ? 'Edit Aircraft' : 'Add New Aircraft'}
      </h2>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Aircraft Name *</label>
            <input
              type="text"
              className="input"
              placeholder="My Awesome Plane"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Manufacturer</label>
            <input
              type="text"
              className="input"
              placeholder="Brand or self-built"
              value={form.manufacturer || ''}
              onChange={e => setForm(prev => ({ ...prev, manufacturer: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={form.type}
            onChange={e => {
              const defaults = AIRCRAFT_DEFAULTS[e.target.value as AircraftType];
              setForm(prev => ({
                ...prev,
                type: e.target.value as AircraftType,
                wingspan: defaults?.wingspan || prev.wingspan,
                wingArea: defaults?.wingArea || prev.wingArea,
                weight: defaults?.weight || prev.weight,
              }));
            }}
          >
            {Object.entries(AIRCRAFT_CATEGORIES).map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map(item => (
                  <option key={`${category}-${item.type}`} value={item.type}>
                    {item.name} - {item.desc}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label">Wingspan (inches)</label>
            <input
              type="number"
              className="input"
              value={form.wingspan}
              onChange={e => setForm(prev => ({ ...prev, wingspan: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <label className="label">Wing Area (sq in)</label>
            <input
              type="number"
              className="input"
              value={form.wingArea}
              onChange={e => setForm(prev => ({ ...prev, wingArea: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <label className="label">Weight (grams)</label>
            <input
              type="number"
              className="input"
              value={form.weight}
              onChange={e => setForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className="card p-5 bg-slate-800/50">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Power System
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Motor KV</label>
              <input
                type="number"
                className="input"
                value={form.motor.kv}
                onChange={e => setForm(prev => ({ 
                  ...prev, 
                  motor: { ...prev.motor, kv: parseInt(e.target.value) || 0 }
                }))}
              />
            </div>
            <div>
              <label className="label">Battery Cells</label>
              <select
                className="input"
                value={form.battery.cells}
                onChange={e => {
                  const cells = parseInt(e.target.value);
                  setForm(prev => ({ 
                    ...prev, 
                    battery: { ...prev.battery, cells, voltage: cells * 3.7 }
                  }));
                }}
              >
                {[1, 2, 3, 4, 5, 6, 8, 12, 16].map(c => (
                  <option key={c} value={c}>{c}S ({c * 3.7}V)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Capacity (mAh)</label>
              <select
                className="input"
                value={form.battery.capacity}
                onChange={e => setForm(prev => ({ 
                  ...prev, 
                  battery: { ...prev.battery, capacity: parseInt(e.target.value) }
                }))}
              >
                {[500, 1000, 1300, 2200, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 16000].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div>
              <label className="label">Prop Diameter (in)</label>
              <input
                type="number"
                className="input"
                value={form.prop.diameter}
                onChange={e => setForm(prev => ({ 
                  ...prev, 
                  prop: { ...prev.prop, diameter: parseInt(e.target.value) || 0 }
                }))}
              />
            </div>
            <div>
              <label className="label">Prop Pitch (in)</label>
              <input
                type="number"
                className="input"
                value={form.prop.pitch}
                onChange={e => setForm(prev => ({ 
                  ...prev, 
                  prop: { ...prev.prop, pitch: parseInt(e.target.value) || 0 }
                }))}
              />
            </div>
          </div>
        </div>

        <div className="card p-5 bg-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-400" />
              3D Printed Details
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is3DPrinted}
                onChange={e => setForm(prev => ({ ...prev, is3DPrinted: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-sm text-slate-300">This is a 3D printed model</span>
            </label>
          </div>
          
          {form.is3DPrinted && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Print Time (hours)</label>
                <input
                  type="number"
                  className="input"
                  value={form.printTime || 0}
                  onChange={e => setForm(prev => ({ ...prev, printTime: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="label">Filament Used (grams)</label>
                <input
                  type="number"
                  className="input"
                  value={form.filamentUsed || 0}
                  onChange={e => setForm(prev => ({ ...prev, filamentUsed: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[80px]"
            placeholder="Modifications, maintenance notes, special features..."
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            onClick={handleSave} 
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={!form.name.trim()}
          >
            <Check className="h-5 w-5" />
            {aircraft ? 'Update Aircraft' : 'Add to Hangar'}
          </button>
          <button onClick={onCancel} className="btn-secondary px-6">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AircraftCard({ aircraft, onEdit, onDelete }: { 
  aircraft: Aircraft; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  return (
    <div className="model-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            aircraft.is3DPrinted 
              ? 'bg-purple-500/20 text-purple-400' 
              : aircraft.type.includes('copter') || aircraft.type === 'helicopter'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-sky-500/20 text-sky-400'
          }`}>
            <Plane className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{aircraft.name}</h3>
            <p className="text-sm text-slate-400 capitalize">
              {aircraft.type.replace('-', ' ')}
              {aircraft.is3DPrinted && ' • 3D Printed'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 text-slate-400 hover:text-sky-400 transition-colors">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-slate-800/50">
          <Ruler className="h-4 w-4 mx-auto text-slate-500 mb-1" />
          <div className="text-white font-semibold">{aircraft.wingspan}"</div>
          <div className="text-xs text-slate-500">Wingspan</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-800/50">
          <Weight className="h-4 w-4 mx-auto text-slate-500 mb-1" />
          <div className="text-white font-semibold">{aircraft.weight}g</div>
          <div className="text-xs text-slate-500">Weight</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-800/50">
          <Battery className="h-4 w-4 mx-auto text-slate-500 mb-1" />
          <div className="text-white font-semibold">{aircraft.battery.cells}S</div>
          <div className="text-xs text-slate-500">Battery</div>
        </div>
      </div>

      {aircraft.is3DPrinted && aircraft.printTime && (
        <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-400 text-sm">
            <Scissors className="h-4 w-4" />
            <span>Print time: {aircraft.printTime}h • {aircraft.filamentUsed}g filament</span>
          </div>
        </div>
      )}

      {aircraft.notes && (
        <p className="text-sm text-slate-400 line-clamp-2">{aircraft.notes}</p>
      )}
    </div>
  );
}

export default function ModelsPage() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadAircraft();
  }, []);

  async function loadAircraft() {
    const ac = await getAllAircraft();
    setAircraft(ac);
  }

  async function handleSave(ac: Aircraft) {
    await saveAircraft(ac);
    await loadAircraft();
    setShowForm(false);
    setEditingAircraft(null);
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this aircraft from your hangar?')) {
      await deleteAircraft(id);
      await loadAircraft();
    }
  }

  const filteredAircraft = aircraft.filter(ac => {
    if (filterType !== 'all' && !ac.type.includes(filterType) && !(ac.is3DPrinted && filterType === '3d')) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ac.name.toLowerCase().includes(q) || 
             ac.type.toLowerCase().includes(q) ||
             (ac.manufacturer?.toLowerCase().includes(q));
    }
    return true;
  });

  if (showForm || editingAircraft) {
    return (
      <div className="animate-fade-in">
        <AircraftForm
          aircraft={editingAircraft || undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingAircraft(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Model Hangar</h1>
          <p className="text-slate-400 mt-1">Manage your aircraft collection</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Aircraft
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <div className="text-3xl font-bold text-white">{aircraft.length}</div>
          <div className="text-sm text-slate-400">Total Models</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold text-sky-400">{aircraft.filter(a => a.type.includes('wing')).length}</div>
          <div className="text-sm text-slate-400">Fixed Wing</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold text-amber-400">{aircraft.filter(a => a.type.includes('copter') || a.type === 'helicopter').length}</div>
          <div className="text-sm text-slate-400">Rotary/Multi</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold text-purple-400">{aircraft.filter(a => a.is3DPrinted).length}</div>
          <div className="text-sm text-slate-400">3D Printed</div>
        </div>
      </div>

      <div className="card">
        <div className="p-5 border-b border-slate-700">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  className="input pl-11"
                  placeholder="Search aircraft..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'wing', label: 'Fixed Wing' },
                { value: 'copter', label: 'Multirotor' },
                { value: 'helicopter', label: 'Helicopter' },
                { value: '3d', label: '3D Printed' },
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterType === filter.value
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5">
          {filteredAircraft.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAircraft.map(ac => (
                <AircraftCard
                  key={ac.id}
                  aircraft={ac}
                  onEdit={() => setEditingAircraft(ac)}
                  onDelete={() => handleDelete(ac.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Plane className="h-20 w-20 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                {searchQuery || filterType !== 'all' ? 'No aircraft found' : 'Your hangar is empty'}
              </h3>
              <p className="text-slate-500 mb-6">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Add your first RC aircraft to get started'}
              </p>
              <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Aircraft
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
