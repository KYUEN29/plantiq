import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Search, Edit3, Trash2, MapPin, 
  Leaf, Activity, History as HistoryIcon,
  AlertCircle, CheckCircle2, ChevronRight, X, Image as ImageIcon, Check
} from 'lucide-react';
import { 
  getGarden, getPlantCatalogue, getPlantAssessments,
  addGardenPlant, updateGardenPlant, deleteGardenPlant 
} from '../services/api';

const emptyForm = { plant_species_id: '', nickname: '', growth_stage: '', soil_type: '', pot_size: '', location: '', notes: '' };

const navigate = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const statusStyle = (status) => {
  if (status === 'Healthy') return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30';
  if (status === 'Needs attention') return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30';
  if (status === 'Critical') return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30';
  return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
};

const statusIcon = (status) => {
  if (status === 'Healthy') return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
  if (status === 'Needs attention') return <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
  if (status === 'Critical') return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
  return <Leaf className="w-4 h-4 text-gray-400" />;
};

export default function GardenPage() {
  const [garden, setGarden] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [plantDataMap, setPlantDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Added'); // 'Added', 'Needs attention', 'Name'

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [plantsData, catData] = await Promise.all([
        getGarden(),
        getPlantCatalogue()
      ]);
      const plants = plantsData || [];
      setGarden(plants);
      setCatalogue(catData || []);

      // Fetch assessments for plants
      const pMap = {};
      if (plants.length > 0) {
        await Promise.all(plants.map(async (p) => {
          try {
            const page = await getPlantAssessments(p.id, 1, 0);
            pMap[p.id] = { latestAssessment: page.items?.[0] || null };
          } catch (e) {
            pMap[p.id] = { latestAssessment: null };
          }
        }));
      }
      setPlantDataMap(pMap);
    } catch (err) {
      setError(err.message || 'Unable to load your garden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Handlers
  const updateForm = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const openAdd = () => { setError(''); setNotice(''); setEditingId(null); setForm(emptyForm); setShowForm(true); window.scrollTo(0, 0); };
  const openEdit = (plant) => {
    setError(''); setNotice(''); setEditingId(plant.id);
    setForm({ 
      plant_species_id: plant.plant_species_id, 
      nickname: plant.nickname || '', 
      growth_stage: plant.growth_stage || '', 
      soil_type: plant.soil_type || '', 
      pot_size: plant.pot_size || '', 
      location: plant.location || '', 
      notes: plant.notes || '' 
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };

  const submit = async (event) => {
    event.preventDefault(); 
    setError(''); setNotice('');
    if (!form.plant_species_id) return setError('Please choose a plant species.');
    setSubmitting(true);
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
    try {
      if (editingId) {
        const updated = await updateGardenPlant(editingId, payload);
        setGarden(garden.map((p) => p.id === updated.id ? updated : p));
        setNotice(`${updated.nickname} updated successfully.`);
      } else {
        const created = await addGardenPlant(payload);
        setGarden([created, ...garden]);
        
        // Fetch assessment state for new plant to be safe
        try {
          const page = await getPlantAssessments(created.id, 1, 0);
          setPlantDataMap(prev => ({ ...prev, [created.id]: { latestAssessment: page.items?.[0] || null } }));
        } catch (e) {
          setPlantDataMap(prev => ({ ...prev, [created.id]: { latestAssessment: null } }));
        }
        setNotice(`${created.nickname || created.plant_species.common_name} added to your garden.`);
      }
      closeForm();
    } catch (err) { 
      setError(err.message || 'Failed to save plant.'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const remove = async (plant) => {
    if (!window.confirm(`Are you sure you want to remove ${plant.nickname} from your garden?`)) return;
    setError(''); setNotice('');
    try { 
      await deleteGardenPlant(plant.id); 
      setGarden(garden.filter((item) => item.id !== plant.id)); 
      setSelectedIds((prev) => prev.filter((id) => id !== plant.id)); 
      setNotice(`${plant.nickname} removed from your garden.`); 
    } catch (err) { 
      setError(err.message || 'Failed to remove plant.'); 
    }
  };

  const toggleSelect = (plantId) => {
    setSelectedIds((prev) => {
      if (prev.includes(plantId)) {
        return prev.filter((id) => id !== plantId);
      } else {
        if (prev.length >= 4) {
          alert('You can select up to 4 plants for a multi-plant assessment.');
          return prev;
        }
        return [...prev, plantId];
      }
    });
  };

  const assessSelected = () => {
    if (selectedIds.length < 2 || selectedIds.length > 4) return;
    navigate(`/assess/queue/${selectedIds.join(',')}`);
  };

  // Filter, Search, Sort logic
  const processedGarden = useMemo(() => {
    let result = [...garden];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.nickname && p.nickname.toLowerCase().includes(query)) ||
        (p.plant_species.common_name && p.plant_species.common_name.toLowerCase().includes(query)) ||
        (p.plant_species.scientific_name && p.plant_species.scientific_name.toLowerCase().includes(query))
      );
    }

    // Filter
    if (filterStatus !== 'All') {
      result = result.filter(p => {
        const latest = plantDataMap[p.id]?.latestAssessment;
        if (filterStatus === 'Not assessed') return !latest;
        if (filterStatus === 'Needs attention') return latest && (latest.health_status === 'Needs attention' || latest.health_status === 'Critical');
        if (filterStatus === 'Healthy') return latest && latest.health_status === 'Healthy';
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'Name') {
        const nameA = a.nickname || a.plant_species.common_name;
        const nameB = b.nickname || b.plant_species.common_name;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'Needs attention') {
        const statA = plantDataMap[a.id]?.latestAssessment?.health_status;
        const statB = plantDataMap[b.id]?.latestAssessment?.health_status;
        const score = (s) => (s === 'Critical' ? 3 : s === 'Needs attention' ? 2 : s === 'Healthy' ? 1 : 0);
        return score(statB) - score(statA);
      }
      // Added (newest first)
      return new Date(b.date_added || 0) - new Date(a.date_added || 0);
    });

    return result;
  }, [garden, searchQuery, filterStatus, sortBy, plantDataMap]);

  // Derived metrics
  const stats = useMemo(() => {
    let attention = 0;
    let notAssessed = 0;
    garden.forEach(p => {
      const latest = plantDataMap[p.id]?.latestAssessment;
      if (!latest) notAssessed++;
      else if (latest.health_status === 'Needs attention' || latest.health_status === 'Critical') attention++;
    });
    return { attention, notAssessed };
  }, [garden, plantDataMap]);

  if (loading && garden.length === 0) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
        <p>Loading My Garden...</p>
      </div>
    );
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold mb-4">
            <Leaf className="w-4 h-4" />
            <span>My Garden</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            Your plants, their stories.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Track everything Plantiq learns from caring for them over time.
          </p>
        </div>
        
        <div className="flex shrink-0">
          <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 shadow-md transition-transform hover:-translate-y-0.5 w-full md:w-auto">
            <Plus className="w-5 h-5" /> Add Plant
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30 p-4 flex items-center justify-between">
          <p className="text-red-700 dark:text-red-400 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</p>
          <button onClick={loadData} className="text-sm font-bold text-red-700 dark:text-red-400 hover:underline">Retry</button>
        </div>
      )}
      
      {notice && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800/30 p-4 flex justify-between">
          <p className="text-green-800 dark:text-green-400 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {notice}</p>
          <button onClick={() => setNotice('')} className="text-green-800 dark:text-green-400"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Plant Profile' : 'Add a New Plant'}</h2>
            <button onClick={closeForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"><X className="w-5 h-5" /></button>
          </div>
          
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Plant Species <span className="text-red-500">*</span></label>
                <select 
                  required 
                  value={form.plant_species_id} 
                  onChange={updateForm('plant_species_id')} 
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select from Plantiq catalogue</option>
                  {catalogue.map((species) => (
                    <option key={species.id} value={species.id}>{species.common_name} — {species.scientific_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nickname</label>
                <input 
                  value={form.nickname} 
                  onChange={updateForm('nickname')} 
                  maxLength="255" 
                  placeholder="e.g. Living Room Monstera" 
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</label>
                <input 
                  value={form.location} 
                  onChange={updateForm('location')} 
                  maxLength="255" 
                  placeholder="e.g. Bedroom window" 
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Growth Stage</label>
                <input 
                  value={form.growth_stage} 
                  onChange={updateForm('growth_stage')} 
                  maxLength="50" 
                  placeholder="e.g. Seedling, Mature" 
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Soil Type</label>
                <input 
                  value={form.soil_type} 
                  onChange={updateForm('soil_type')} 
                  maxLength="50" 
                  placeholder="e.g. Well-draining" 
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pot Size</label>
                <input 
                  value={form.pot_size} 
                  onChange={updateForm('pot_size')} 
                  maxLength="50" 
                  placeholder="e.g. 6 inch" 
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notes & Context</label>
              <textarea 
                value={form.notes} 
                onChange={updateForm('notes')} 
                maxLength="5000" 
                rows="3" 
                placeholder="Any special care instructions or history?"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500" 
              />
            </div>
            
            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button disabled={submitting} type="submit" className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add to Garden'}
              </button>
              <button type="button" onClick={closeForm} className="rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-3 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GARDEN VIEW */}
      {garden.length === 0 && !loading && !error ? (
        <div className="rounded-3xl border border-dashed border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 px-6 py-24 text-center max-w-3xl mx-auto">
          <Leaf className="mx-auto mb-6 w-16 h-16 text-green-500 opacity-80" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Your garden is waiting.</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Add your first plant and start building its story with Plantiq.
          </p>
          <button onClick={openAdd} className="rounded-xl bg-green-600 px-8 py-4 font-bold text-lg text-white hover:bg-green-700 shadow-md transition-transform hover:-translate-y-1">
            Add Your First Plant
          </button>
        </div>
      ) : (
        garden.length > 0 && (
          <div className="space-y-6">
            
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex flex-wrap items-center gap-4 text-sm w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-xl">
                  <span className="font-bold text-gray-900 dark:text-white">{garden.length}</span>
                  <span className="text-gray-500 dark:text-gray-400">Total</span>
                </div>
                {stats.attention > 0 && (
                  <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-xl">
                    <span className="font-bold text-yellow-700 dark:text-yellow-400">{stats.attention}</span>
                    <span className="text-yellow-600 dark:text-yellow-500">Need attention</span>
                  </div>
                )}
                {stats.notAssessed > 0 && (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-xl">
                    <span className="font-bold text-gray-700 dark:text-gray-300">{stats.notAssessed}</span>
                    <span className="text-gray-500 dark:text-gray-400">Not assessed</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search garden..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Needs attention">Needs attention / Critical</option>
                  <option value="Not assessed">Not assessed</option>
                </select>
                
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="Added">Sort by Added</option>
                  <option value="Needs attention">Sort by Attention</option>
                  <option value="Name">Sort by Name</option>
                </select>
              </div>
            </div>

            {/* Selection Banner */}
            {selectedIds.length > 0 && (
              <div className="bg-emerald-600 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg sticky top-20 z-40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    {selectedIds.length}
                  </div>
                  <span className="font-semibold">
                    {selectedIds.length === 1 
                      ? '1 plant selected. Select 2-4 plants for multi-plant assessment.' 
                      : `${selectedIds.length} plants selected for assessment.`}
                  </span>
                </div>
                <div className="flex gap-3">
                  {selectedIds.length >= 2 && selectedIds.length <= 4 && (
                    <button onClick={assessSelected} className="px-6 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold transition-colors">
                      Assess Selected
                    </button>
                  )}
                  <button onClick={() => setSelectedIds([])} className="px-4 py-2 border border-white/30 hover:bg-white/10 rounded-xl font-semibold transition-colors">
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Grid */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {processedGarden.map((plant) => {
                const latest = plantDataMap[plant.id]?.latestAssessment;
                const isSelected = selectedIds.includes(plant.id);
                
                return (
                  <article 
                    key={plant.id} 
                    className={`flex flex-col bg-white dark:bg-gray-800 rounded-3xl border-2 transition-all ${
                      isSelected ? 'border-emerald-500 shadow-md ring-4 ring-emerald-500/10' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                    }`}
                  >
                    {/* Card Header & Visual */}
                    <div className="p-5 flex gap-4 items-start border-b border-gray-50 dark:border-gray-700/50">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelect(plant.id)} 
                          aria-label={`Select ${plant.nickname || plant.plant_species.common_name} for assessment`} 
                          className="absolute -top-2 -left-2 w-5 h-5 accent-emerald-600 z-10 cursor-pointer" 
                        />
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/40 dark:to-emerald-800/20 border border-green-200/50 dark:border-green-800/50 flex items-center justify-center text-green-600 dark:text-green-400">
                          {plant.image_url ? (
                            <img src={plant.image_url} alt={plant.nickname} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            <Leaf className="w-8 h-8 opacity-80" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {plant.nickname || plant.plant_species.common_name}
                        </h2>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400 truncate">
                          {plant.plant_species.common_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate">
                          {plant.plant_species.scientific_name}
                        </p>
                      </div>
                    </div>

                    {/* Meta & Status */}
                    <div className="p-5 flex-1 flex flex-col space-y-4">
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {plant.location && (
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-lg">
                            <MapPin className="w-3 h-3" /> {plant.location}
                          </div>
                        )}
                        {plant.growth_stage && (
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-lg">
                            <Activity className="w-3 h-3" /> {plant.growth_stage}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        {latest ? (
                          <div className={`p-3 rounded-xl border flex flex-col gap-1 ${statusStyle(latest.health_status)}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm flex items-center gap-1.5">
                                {statusIcon(latest.health_status)} {latest.health_status}
                              </span>
                              <span className="font-black text-sm">{latest.health_score}/100</span>
                            </div>
                            <span className="text-xs opacity-80">
                              Assessed {new Date(latest.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Not assessed yet</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0 border-t border-gray-50 dark:border-gray-700/50 mt-auto flex flex-wrap gap-2">
                      <button onClick={() => navigate(`/garden/${plant.id}`)} className="flex-1 py-2 text-sm font-bold bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-center">
                        View
                      </button>
                      <button onClick={() => navigate(`/assess/${plant.id}`)} className="flex-1 py-2 text-sm font-bold bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-800/40 text-green-700 dark:text-green-400 rounded-lg transition-colors text-center">
                        Assess
                      </button>
                      <button onClick={() => navigate(`/garden/${plant.id}/history`)} className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 bg-gray-50 hover:bg-green-50 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-lg transition-colors" aria-label="Progress">
                        <HistoryIcon className="w-4 h-4" />
                      </button>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 self-center"></div>
                      <button onClick={() => openEdit(plant)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors" aria-label="Edit profile">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(plant)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors" aria-label="Remove plant">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            
            {processedGarden.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No plants match your current filters.
              </div>
            )}
          </div>
        )
      )}
    </section>
  );
}
