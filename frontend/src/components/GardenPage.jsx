import { useEffect, useState } from 'react';
import { Edit3, Leaf, MapPin, Plus, Trash2, X } from 'lucide-react';
import { addGardenPlant, deleteGardenPlant, getGarden, getPlantCatalogue, updateGardenPlant } from '../services/api';

const emptyForm = { plant_species_id: '', nickname: '', growth_stage: '', soil_type: '', pot_size: '', location: '', notes: '' };

const GardenPage = () => {
  const [garden, setGarden] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [plants, species] = await Promise.all([getGarden(), getPlantCatalogue()]);
      setGarden(plants);
      setCatalogue(species);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateForm = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const openAdd = () => { setError(''); setNotice(''); setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (plant) => {
    setError(''); setNotice(''); setEditingId(plant.id);
    setForm({ plant_species_id: plant.plant_species_id, nickname: plant.nickname || '', growth_stage: plant.growth_stage || '', soil_type: plant.soil_type || '', pot_size: plant.pot_size || '', location: plant.location || '', notes: plant.notes || '' });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };
  const submit = async (event) => {
    event.preventDefault(); setError(''); setNotice('');
    if (!form.plant_species_id) return setError('Choose a plant species.');
    setSubmitting(true);
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
    try {
      if (editingId) {
        const updated = await updateGardenPlant(editingId, payload);
        setGarden(garden.map((plant) => plant.id === updated.id ? updated : plant));
        setNotice('Plant profile updated.');
      } else {
        const created = await addGardenPlant(payload);
        setGarden([created, ...garden]);
        setNotice('Plant added to your garden.');
      }
      closeForm();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };
  const remove = async (plant) => {
    if (!window.confirm(`Remove ${plant.nickname} from your garden?`)) return;
    setError(''); setNotice('');
    try { await deleteGardenPlant(plant.id); setGarden(garden.filter((item) => item.id !== plant.id)); setNotice('Plant removed from your garden.'); }
    catch (err) { setError(err.message); }
  };

  if (loading) return <div className="py-24 text-center text-gray-500">Loading your garden…</div>;

  return <section className="max-w-6xl mx-auto space-y-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-green-700">My Garden</p><h1 className="mt-1 text-4xl font-bold">Your plants, in one place.</h1><p className="mt-2 text-gray-600 dark:text-gray-400">Build plant profiles now; assessments come later.</p></div>
      <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"><Plus className="w-5 h-5" />Add plant</button>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {notice && <p className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{notice}</p>}
    {showForm && <form onSubmit={submit} className="rounded-3xl border border-green-200 bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-green-900/50">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{editingId ? 'Edit plant profile' : 'Add a plant'}</h2><button type="button" onClick={closeForm} aria-label="Close"><X /></button></div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Plant species<select required value={form.plant_species_id} onChange={updateForm('plant_species_id')} className="mt-1.5 w-full rounded-xl border p-3 text-gray-900"><option value="">Choose from the catalogue</option>{catalogue.map((species) => <option key={species.id} value={species.id}>{species.common_name} — {species.scientific_name}</option>)}</select></label>
        <label className="text-sm font-semibold">Nickname<input value={form.nickname} onChange={updateForm('nickname')} maxLength="255" placeholder="Optional; defaults to species name" className="mt-1.5 w-full rounded-xl border p-3 text-gray-900" /></label>
        <label className="text-sm font-semibold">Growth stage<input value={form.growth_stage} onChange={updateForm('growth_stage')} maxLength="50" placeholder="e.g. mature" className="mt-1.5 w-full rounded-xl border p-3 text-gray-900" /></label>
        <label className="text-sm font-semibold">Location<input value={form.location} onChange={updateForm('location')} maxLength="255" placeholder="e.g. Living room" className="mt-1.5 w-full rounded-xl border p-3 text-gray-900" /></label>
        <label className="text-sm font-semibold">Soil type<input value={form.soil_type} onChange={updateForm('soil_type')} maxLength="50" placeholder="Optional" className="mt-1.5 w-full rounded-xl border p-3 text-gray-900" /></label>
        <label className="text-sm font-semibold">Pot size<input value={form.pot_size} onChange={updateForm('pot_size')} maxLength="50" placeholder="Optional" className="mt-1.5 w-full rounded-xl border p-3 text-gray-900" /></label>
      </div>
      <label className="mt-4 block text-sm font-semibold">Notes<textarea value={form.notes} onChange={updateForm('notes')} maxLength="5000" rows="3" className="mt-1.5 w-full rounded-xl border p-3 text-gray-900" /></label>
      <button disabled={submitting} className="mt-5 rounded-xl bg-green-600 px-5 py-3 font-bold text-white disabled:opacity-60">{submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add plant'}</button>
    </form>}
    {garden.length === 0 ? <div className="rounded-3xl border border-dashed border-green-300 bg-green-50/60 px-6 py-16 text-center"><Leaf className="mx-auto mb-4 w-10 h-10 text-green-600" /><h2 className="text-2xl font-bold">Your garden is ready to grow.</h2><p className="mt-2 text-gray-600">Add your first plant from the Plantiq catalogue.</p><button onClick={openAdd} className="mt-6 rounded-xl bg-green-600 px-5 py-3 font-bold text-white">Add your first plant</button></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{garden.map((plant) => <article key={plant.id} className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700"><div className="flex justify-between gap-3"><div><h2 className="text-xl font-bold">{plant.nickname}</h2><p className="mt-1 text-sm font-medium text-green-700">{plant.plant_species.common_name}</p><p className="text-sm italic text-gray-500">{plant.plant_species.scientific_name}</p></div><Leaf className="w-6 h-6 text-green-500" /></div><div className="mt-5 space-y-2 text-sm text-gray-600 dark:text-gray-300">{plant.growth_stage && <p>Stage: {plant.growth_stage}</p>}{plant.location && <p className="flex gap-1"><MapPin className="w-4 h-4" />{plant.location}</p>}<p>Added {new Date(plant.date_added).toLocaleDateString()}</p></div><div className="mt-6 flex gap-2"><button onClick={() => openEdit(plant)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold"><Edit3 className="w-4 h-4" />Edit</button><button onClick={() => remove(plant)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"><Trash2 className="w-4 h-4" />Remove</button></div></article>)}</div>}
  </section>;
};

export default GardenPage;
