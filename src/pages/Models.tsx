import { useState, useEffect } from 'react';
import { Plus, Plane, Trash2, Edit2, X, Download, Upload, Copy } from 'lucide-react';
import { getAllAircraft, saveAircraft, deleteAircraft, exportData, importData } from '../lib/db';
import { generateAircraftId } from '../lib/calculations';
import type { Aircraft, AircraftType } from '../types';

const AIRCRAFT_TYPES: { value: AircraftType; label: string; icon: string }[] = [
  { value: 'fixed-wing', label: 'Fixed Wing', icon: '🛩️' },
  { value: 'quadcopter', label: 'Quadcopter', icon: '🛸' },
  { value: 'hexacopter', label: 'Hexacopter', icon: '🚀' },
  { value: 'vtol', label: 'VTOL', icon: '✈️' },
  { value: 'helicopter', label: 'Helicopter', icon: '🚁' },
];

export default function ModelsPage() {
  const [models, setModels] = useState<Aircraft[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Aircraft>>({
    name: '',
    type: 'fixed-wing',
    wingspan: 48,
    wingArea: 300,
    weight: 1200,
    motor: { kv: 1000, maxVoltage: 22.2, maxCurrent: 50, weight: 150 },
    prop: { diameter: 10, pitch: 4 },
    battery: { cells: 4, capacity: 5000, dischargeRate: 50, voltage: 14.8 },
  });

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    try {
      const data = await getAllAircraft();
      setModels(data);
    } catch (e) {
      console.error('Failed to load models', e);
    }
  }

  function handleEdit(model: Aircraft) {
    setFormData(model);
    setEditingId(model.id);
    setShowForm(true);
  }

  function handleNew() {
    setFormData({
      name: '',
      type: 'fixed-wing',
      wingspan: 48,
      wingArea: 300,
      weight: 1200,
      motor: { kv: 1000, maxVoltage: 22.2, maxCurrent: 50, weight: 150 },
      prop: { diameter: 10, pitch: 4 },
      battery: { cells: 4, capacity: 5000, dischargeRate: 50, voltage: 14.8 },
    });
    setEditingId(null);
    setShowForm(true);
  }

  async function handleSave() {
    const now = new Date().toISOString();
    const model: Aircraft = {
      ...(formData as Aircraft),
      id: editingId || generateAircraftId(),
      createdAt: editingId ? models.find(m => m.id === editingId)?.createdAt || now : now,
      updatedAt: now,
    };

    try {
      await saveAircraft(model);
      setShowForm(false);
      loadModels();
    } catch (e) {
      console.error('Failed to save', e);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAircraft(id);
      loadModels();
    } catch (e) {
      console.error('Failed to delete', e);
    }
  }

  async function handleExport() {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aerocheck-models-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export', e);
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        await importData(text);
        loadModels();
      } catch (e) {
        console.error('Failed to import', e);
      }
    };
    input.click();
  }

  function copyToClipboard(model: Aircraft) {
    const data = JSON.stringify(model, null, 2);
    navigator.clipboard.writeText(data);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Model Library</h1>
          <p className="text-slate-400 mt-1">Manage your aircraft configurations</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={handleImport}>
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={handleNew}>
            <Plus className="w-5 h-5" />
            Add Model
          </button>
        </div>
      </div>

      {/* Model Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card p-6 w-full max-w-2xl my-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? 'Edit Model' : 'Add New Model'}
              </h2>
              <button 
                className="text-slate-400 hover:text-white"
                onClick={() => setShowForm(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Model Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="My Awesome Plane"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Aircraft Type</label>
                  <select 
                    className="input"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as AircraftType })}
                  >
                    {AIRCRAFT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Weight (g)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.weight}
                    onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Wingspan (in)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.wingspan}
                    onChange={e => setFormData({ ...formData, wingspan: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Wing Area (in²)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.wingArea}
                    onChange={e => setFormData({ ...formData, wingArea: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Motor KV</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.motor?.kv}
                    onChange={e => setFormData({ 
                      ...formData, 
                      motor: { ...formData.motor!, kv: parseFloat(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Prop Diameter</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.prop?.diameter}
                    onChange={e => setFormData({ 
                      ...formData, 
                      prop: { ...formData.prop!, diameter: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="label">Prop Pitch</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.prop?.pitch}
                    onChange={e => setFormData({ 
                      ...formData, 
                      prop: { ...formData.prop!, pitch: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="label">Battery (S)</label>
                  <select 
                    className="input"
                    value={formData.battery?.cells}
                    onChange={e => {
                      const cells = parseInt(e.target.value);
                      setFormData({ 
                        ...formData, 
                        battery: { ...formData.battery!, cells, voltage: cells * 3.7 }
                      });
                    }}
                  >
                    {[2, 3, 4, 5, 6].map(s => (
                      <option key={s} value={s}>{s}S</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Capacity (mAh)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.battery?.capacity}
                    onChange={e => setFormData({ 
                      ...formData, 
                      battery: { ...formData.battery!, capacity: parseFloat(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  className="btn-primary flex-1"
                  onClick={handleSave}
                >
                  {editingId ? 'Update Model' : 'Save Model'}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Models Grid */}
      {models.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map(model => {
            const typeInfo = AIRCRAFT_TYPES.find(t => t.value === model.type);
            return (
              <div key={model.id} className="card-hover p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                      <span className="text-xl">{typeInfo?.icon || '✈️'}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{model.name}</h3>
                      <p className="text-xs text-slate-400">{typeInfo?.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors"
                      onClick={() => copyToClipboard(model)}
                      title="Copy JSON"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                      onClick={() => handleEdit(model)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      onClick={() => handleDelete(model.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="text-xs text-slate-400">Weight</div>
                    <div className="font-mono text-white">{model.weight}g</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="text-xs text-slate-400">Wingspan</div>
                    <div className="font-mono text-white">{model.wingspan}"</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="text-xs text-slate-400">Motor KV</div>
                    <div className="font-mono text-white">{model.motor.kv}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="text-xs text-slate-400">Battery</div>
                    <div className="font-mono text-white">{model.battery.cells}S {model.battery.capacity}mAh</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-500">
                    Updated {new Date(model.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Plane className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-white mb-2">No models yet</h3>
          <p className="text-slate-400 mb-4">Add your first aircraft model to get started</p>
          <button 
            className="btn-primary"
            onClick={handleNew}
          >
            Add Your First Model
          </button>
        </div>
      )}
    </div>
  );
}
