import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Edit3, History as HistoryIcon, Leaf, MapPin, MessageSquare, Sprout, TrendingDown, TrendingUp, X, ClipboardList } from 'lucide-react';
import { getGardenPlant, getPlantSpecies, getPlantAssessments, getAssessment, getPlantAnalytics, getPersonalization, updateGardenPlant } from '../services/api';

const navigate = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

const STATUS_STYLES = {
  'Healthy':         'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/30',
  'Needs attention': 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/30',
  'Critical':        'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/30',
};
const statusStyle = (s) => STATUS_STYLES[s] ?? 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700';

const StatusIcon = ({ status, className = 'w-5 h-5' }) => {
  if (status === 'Healthy')         return <CheckCircle2  className={`${className} text-green-600 dark:text-green-400`}  />;
  if (status === 'Needs attention') return <AlertCircle   className={`${className} text-yellow-600 dark:text-yellow-400`} />;
  if (status === 'Critical')        return <AlertTriangle className={`${className} text-red-600 dark:text-red-400`}      />;
  return <Leaf className={`${className} text-gray-400`} />;
};

function KnowledgeFact({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  let display = value;
  if (Array.isArray(value)) { if (value.length === 0) return null; display = value.join(', '); }
  else if (typeof value === 'boolean') display = value ? 'Yes' : 'No';
  return (
    <div className="flex justify-between items-baseline gap-4 py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">{String(display)}</span>
    </div>
  );
}

function ScoreChange({ change }) {
  if (change === null || change === undefined) return null;
  const up = change > 0; const neutral = change === 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${neutral ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : up ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
      {!neutral && (up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
      {up ? '+' : ''}{change}
    </span>
  );
}

function EditForm({ plant, onSaved, onCancel }) {
  const [form, setForm] = useState({
    plant_species_id: plant.plant_species_id,
    nickname: plant.nickname ?? '', growth_stage: plant.growth_stage ?? '',
    soil_type: plant.soil_type ?? '', pot_size: plant.pot_size ?? '',
    location: plant.location ?? '', notes: plant.notes ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    try { const updated = await updateGardenPlant(plant.id, payload); onSaved(updated); }
    catch (err) { setError(err.message || 'Failed to save changes.'); }
    finally { setSubmitting(false); }
  };
  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Plant Profile</h2>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[['nickname','Nickname','e.g. Living Room Monstera'],['location','Location','e.g. Bedroom window'],['growth_stage','Growth Stage','e.g. Mature'],['soil_type','Soil Type','e.g. Well-draining mix'],['pot_size','Pot Size','e.g. 6 inch']].map(([field, label, ph]) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
              <input value={form[field]} onChange={update(field)} maxLength="255" placeholder={ph} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</label>
          <textarea value={form.notes} onChange={update('notes')} maxLength="5000" rows="3" placeholder="Care notes, history, anything useful" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button disabled={submitting} type="submit" className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60 transition-colors">{submitting ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={onCancel} className="rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-3 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function PlantProfilePage({ plantId }) {
  const [plant, setPlant]              = useState(null);
  const [species, setSpecies]          = useState(null);
  const [latestAssessment, setLatest]  = useState(null);
  const [analytics, setAnalytics]      = useState(null);
  const [personalization, setPersonal] = useState(null);
  const [loading, setLoading]          = useState(true);
  const [notFound, setNotFound]        = useState(false);
  const [error, setError]              = useState('');
  const [showEdit, setShowEdit]        = useState(false);

  const loadProfile = async () => {
    setLoading(true); setError(''); setNotFound(false);
    try {
      const gardenPlant = await getGardenPlant(plantId);
      setPlant(gardenPlant);
      const [speciesData, assessmentsPage, analyticsData, personalData] = await Promise.allSettled([
        getPlantSpecies(gardenPlant.plant_species_id),
        getPlantAssessments(plantId, 1, 0),
        getPlantAnalytics(plantId),
        getPersonalization(plantId),
      ]);
      if (speciesData.status === 'fulfilled')   setSpecies(speciesData.value);
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
      if (personalData.status === 'fulfilled')  setPersonal(personalData.value);
      if (assessmentsPage.status === 'fulfilled') {
        const items = assessmentsPage.value?.items ?? [];
        if (items.length > 0) {
          try { setLatest(await getAssessment(items[0].id)); }
          catch { setLatest(items[0]); }
        }
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes('not found') || err.message?.includes('404')) { setNotFound(true); }
      else { setError(err.message || 'Unable to load plant profile.'); }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadProfile(); }, [plantId]);

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4" />
      <p>Loading plant profile...</p>
    </div>
  );

  if (notFound) return (
    <div className="py-24 max-w-2xl mx-auto px-4 text-center">
      <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plant not found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">This plant does not exist or is not part of your garden.</p>
      <button onClick={() => navigate('/garden')} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 transition-colors"><ArrowLeft className="w-5 h-5" /> Back to My Garden</button>
    </div>
  );

  if (error && !plant) return (
    <div className="py-24 max-w-2xl mx-auto px-4 text-center">
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30 p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Unable to load plant profile</h2>
        <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={loadProfile} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">Try Again</button>
          <button onClick={() => navigate('/garden')} className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">My Garden</button>
        </div>
      </div>
    </div>
  );

  const plantName       = plant.nickname || plant.plant_species.common_name;
  const hasAssessment   = !!latestAssessment;
  const result          = latestAssessment?.result ?? null;
  const guidance        = latestAssessment?.guidance ?? null;
  const personNotes     = [...(personalization?.plant?.notes ?? [])].filter(Boolean);
  const recurringIssues = personalization?.plant?.recurring_issues ?? [];
  const summary         = analytics?.summary ?? null;
  const hasHistory      = (summary?.assessment_count ?? 0) > 0;
  const topRec          = guidance?.recommendations?.[0] ?? null;

  const knowledgeFacts = species ? [
    ['Difficulty',           species.difficulty],
    ['Light',                species.light_requirement],
    ['Sunlight (ideal)',     (species.sunlight_hours_ideal_min != null && species.sunlight_hours_ideal_max != null) ? `${species.sunlight_hours_ideal_min}-${species.sunlight_hours_ideal_max} hrs/day` : null],
    ['Watering',             (species.watering_frequency_min_days != null && species.watering_frequency_max_days != null) ? `Every ${species.watering_frequency_min_days}-${species.watering_frequency_max_days} days` : null],
    ['Soil',                 species.preferred_soil_types?.length ? species.preferred_soil_types.join(', ') : null],
    ['Drainage',             species.drainage_requirement],
    ['Drought tolerance',    species.drought_tolerance],
    ['Overwatering risk',    species.overwatering_sensitivity],
    ['Humidity (ideal)',     (species.humidity_ideal_min != null && species.humidity_ideal_max != null) ? `${species.humidity_ideal_min}-${species.humidity_ideal_max}%` : null],
    ['Temperature (ideal)',  (species.temperature_ideal_min != null && species.temperature_ideal_max != null) ? `${species.temperature_ideal_min}-${species.temperature_ideal_max}C` : null],
    ['Pot size',             species.preferred_pot_size],
    ['Growth rate',          species.growth_rate],
    ['Mature size',          species.mature_size],
    ['Fertilizer',           species.fertilizer_type],
    ['Fertilizer schedule',  species.fertilizer_frequency],
    ['Repotting',            species.repotting_interval],
    ['Indoor',               species.is_indoor_suitable === true ? 'Suitable' : species.is_indoor_suitable === false ? 'Not suitable' : null],
    ['Outdoor',              species.is_outdoor_suitable === true ? 'Suitable' : species.is_outdoor_suitable === false ? 'Not suitable' : null],
  ].filter(([, v]) => v !== null && v !== undefined) : [];

  return (
    <article className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">

      <nav aria-label="Breadcrumb">
        <button onClick={() => navigate('/garden')} className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> My Garden
        </button>
      </nav>

      {showEdit && (
        <EditForm plant={plant} onSaved={(updated) => { setPlant(updated); setShowEdit(false); }} onCancel={() => setShowEdit(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Plant Hero */}
          <header className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-green-900/20 dark:via-emerald-900/10 dark:to-gray-800 p-8 flex gap-6 items-start">
              <div className="w-24 h-24 flex-shrink-0 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-800/20 border border-green-200/60 dark:border-green-800/50 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm">
                {plant.image_url ? <img src={plant.image_url} alt={plantName} className="w-full h-full object-cover rounded-2xl" /> : <Leaf className="w-12 h-12 opacity-75" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100/70 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold mb-3">
                  <Leaf className="w-3 h-3" /> My Garden
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{plantName}</h1>
                <p className="text-base font-semibold text-green-700 dark:text-green-400 mt-1">{plant.plant_species.common_name}</p>
                <p className="text-sm italic text-gray-500 dark:text-gray-400">{plant.plant_species.scientific_name}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  {plant.location && <span className="flex items-center gap-1 bg-white/60 dark:bg-gray-900/40 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-gray-700/50"><MapPin className="w-3 h-3" /> {plant.location}</span>}
                  {plant.growth_stage && <span className="flex items-center gap-1 bg-white/60 dark:bg-gray-900/40 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-gray-700/50"><Sprout className="w-3 h-3" /> {plant.growth_stage}</span>}
                  {plant.soil_type && <span className="bg-white/60 dark:bg-gray-900/40 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-gray-700/50">Soil: {plant.soil_type}</span>}
                  {plant.pot_size && <span className="bg-white/60 dark:bg-gray-900/40 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-gray-700/50">Pot: {plant.pot_size}</span>}
                </div>
              </div>
              <button onClick={() => setShowEdit(true)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-xl transition-colors flex-shrink-0" aria-label="Edit plant profile">
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
            {plant.notes && (
              <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-700/50">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{plant.notes}</p>
              </div>
            )}
          </header>

          {/* Current State */}
          <section aria-labelledby="current-state-heading">
            <h2 id="current-state-heading" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Current Condition</h2>
            {hasAssessment ? (() => {
              const status = result?.health_status ?? latestAssessment.health_status;
              const score  = result?.health_score  ?? latestAssessment.health_score;
              const conf   = result?.confidence    ?? latestAssessment.confidence;
              const date   = latestAssessment.created_at;
              return (
                <div className={`rounded-2xl border p-6 ${statusStyle(status)}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={status} className="w-8 h-8" />
                      <div>
                        <p className="text-xl font-bold">{status}</p>
                        {conf && <p className="text-sm opacity-75">{conf} confidence</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold opacity-75">Plantiq health score</p>
                      <p className="text-3xl font-black">{score}<span className="text-lg font-bold opacity-60">/100</span></p>
                    </div>
                  </div>
                  {date && <p className="mt-3 text-xs opacity-60">Assessed {new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                  <div className="mt-4 pt-4 border-t border-current/10 flex flex-wrap gap-3">
                    <button onClick={() => navigate(`/assess/${plant.id}`)} className="px-5 py-2 bg-white/30 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-black/30 rounded-xl font-bold text-sm border border-current/20 transition-colors">Check in on your plant</button>
                    <button onClick={() => navigate(`/garden/${plant.id}/history`)} className="px-5 py-2 bg-white/20 dark:bg-black/10 hover:bg-white/40 dark:hover:bg-black/20 rounded-xl font-semibold text-sm border border-current/10 transition-colors flex items-center gap-2"><HistoryIcon className="w-4 h-4" /> View Progress</button>
                  </div>
                </div>
              );
            })() : (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ClipboardList className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Not assessed yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Complete an assessment so Plantiq can understand your plant's current condition.</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/assess/${plant.id}`)} className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-sm">Assess Plant</button>
              </div>
            )}
          </section>

          {/* What Plantiq Noticed */}
          {result?.dimensions?.length > 0 && (
            <section aria-labelledby="noticed-heading">
              <h2 id="noticed-heading" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">What Plantiq Noticed</h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700/50 overflow-hidden">
                {result.dimensions.map((d) => (
                  <div key={d.feature} className="flex items-start justify-between gap-4 px-5 py-4">
                    <span className="text-sm font-semibold capitalize text-gray-700 dark:text-gray-300">{d.feature.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 text-right max-w-xs">{d.detail}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Next Best Action */}
          {topRec && (
            <section aria-labelledby="next-action-heading">
              <h2 id="next-action-heading" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Next Best Action</h2>
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{topRec.title}</p>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 flex-shrink-0">{topRec.priority}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{topRec.description}</p>
                {topRec.reason && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{topRec.reason}</p>}
                {topRec.source === 'personalized' && <span className="mt-3 inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-600 text-white">Personalized</span>}
              </div>
            </section>
          )}

          {guidance?.recommendations?.length > 1 && (
            <div className="space-y-3">
              {guidance.recommendations.slice(1).map((rec) => (
                <div key={rec.code} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{rec.title}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{rec.priority}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{rec.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Personalized Context */}
          {(personNotes.length > 0 || recurringIssues.length > 0) && (
            <section aria-labelledby="personalized-heading">
              <h2 id="personalized-heading" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Plantiq Knows This Plant</h2>
              <div className="bg-green-50/60 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-2xl p-6">
                {personNotes.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {personNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>{note}
                      </li>
                    ))}
                  </ul>
                )}
                {recurringIssues.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Recurring Issues</p>
                    <div className="flex flex-wrap gap-2">
                      {recurringIssues.map((issue) => (
                        <span key={issue.code} className="text-xs font-semibold px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30 rounded-full">
                          {issue.title} x{issue.occurrences}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Detected Issues */}
          {result?.issues?.length > 0 && (
            <section aria-labelledby="issues-heading">
              <h2 id="issues-heading" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Detected Issues</h2>
              <div className="space-y-3">
                {result.issues.map((issue) => (
                  <div key={issue.code} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-2xl px-5 py-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{issue.title}</p>
                    {issue.evidence.map((e, i) => <p key={i} className="mt-1 text-sm text-gray-600 dark:text-gray-300">{e}</p>)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {result?.limitations?.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Limitations</p>
              <ul className="space-y-1">
                {result.limitations.map((lim, i) => <li key={i} className="text-xs text-gray-500 dark:text-gray-400">- {lim}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Progress Snapshot */}
          <section aria-labelledby="progress-heading" className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h2 id="progress-heading" className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
              <HistoryIcon className="w-4 h-4 text-gray-400" /> Progress Snapshot
            </h2>
            {hasHistory ? (
              <>
                <div className="space-y-3 mb-5">
                  {[
                    ['Assessments', summary.assessment_count, null],
                    ['Latest score', summary.latest_score, summary.score_change],
                    ['Average',      summary.average_score, null],
                    ['Best',         summary.highest_score, null],
                    ['Lowest',       summary.lowest_score, null],
                  ].filter(([, v]) => v !== null && v !== undefined).map(([label, value, change]) => (
                    <div key={label} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                      <span className="text-gray-500 dark:text-gray-400">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{value}</span>
                        {change !== undefined && change !== null && <ScoreChange change={change} />}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate(`/garden/${plant.id}/history`)} className="w-full py-2.5 text-sm font-bold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/30 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors">
                  View Full Progress
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your plant's progress will appear here after more assessments.</p>
                <button onClick={() => navigate(`/assess/${plant.id}`)} className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline">Start First Assessment</button>
              </div>
            )}
          </section>

          {/* Assess CTA */}
          <section className="bg-gray-900 dark:bg-black rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />
            <Sprout className="w-7 h-7 text-green-400 mb-3" />
            <h2 className="text-lg font-bold mb-1">{hasAssessment ? 'Check in on your plant' : 'Ready to assess?'}</h2>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              {hasAssessment ? 'Run a new assessment to track how your plant is progressing.' : "Answer a short questionnaire and Plantiq will evaluate your plant's current condition."}
            </p>
            <button onClick={() => navigate(`/assess/${plant.id}`)} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors">Assess Plant</button>
          </section>

          {/* Plant Knowledge */}
          {knowledgeFacts.length > 0 && (
            <section aria-labelledby="knowledge-heading" className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h2 id="knowledge-heading" className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Leaf className="w-4 h-4 text-green-500" /> Plant Knowledge
              </h2>
              {species?.description && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 border-b border-gray-50 dark:border-gray-700/50 pb-4">{species.description}</p>}
              <div>{knowledgeFacts.map(([label, value]) => <KnowledgeFact key={label} label={label} value={value} />)}</div>
              {species?.common_problems?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Common Problems</p>
                  <div className="space-y-2">
                    {species.common_problems.map((p, i) => (
                      <div key={i} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
                        {typeof p === 'string' ? p : (p.name ?? p.problem ?? JSON.stringify(p))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Ask Plantiq */}
          <section className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-3xl border border-green-100 dark:border-green-900/30 p-6">
            <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400 mb-3" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Have a question?</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">Ask Plantiq about care, symptoms, light, soil, or anything about {plantName}.</p>
            <button onClick={() => navigate('/ask')} className="w-full py-2.5 text-sm font-bold border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-colors">Ask Plantiq</button>
          </section>

        </div>
      </div>
    </article>
  );
}
