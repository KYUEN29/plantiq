import { useState } from 'react';
import AuthPageLayout from './AuthPageLayout';
import { useAuth } from '../context/AuthContext';

const RegisterPage = ({ onNavigate }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setSubmitting(true);
    try { await register({ name: form.name, email: form.email, password: form.password }); onNavigate('/'); } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  return <AuthPageLayout title="Create your account" subtitle="Start caring for your plants with Plantiq.">
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-sm font-semibold">Name<input required minLength="2" autoComplete="name" value={form.name} onChange={update('name')} className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-green-500 dark:bg-gray-800 dark:border-gray-700" /></label>
      <label className="block text-sm font-semibold">Email<input required type="email" autoComplete="email" value={form.email} onChange={update('email')} className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-green-500 dark:bg-gray-800 dark:border-gray-700" /></label>
      <label className="block text-sm font-semibold">Password<input required type="password" minLength="6" autoComplete="new-password" value={form.password} onChange={update('password')} className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-green-500 dark:bg-gray-800 dark:border-gray-700" /></label>
      <label className="block text-sm font-semibold">Confirm password<input required type="password" minLength="6" autoComplete="new-password" value={form.confirmPassword} onChange={update('confirmPassword')} className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-green-500 dark:bg-gray-800 dark:border-gray-700" /></label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="w-full rounded-xl bg-green-600 p-3 font-bold text-white disabled:opacity-60">{submitting ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">Already have an account? <button onClick={() => onNavigate('/login')} className="font-semibold text-green-700 dark:text-green-400">Sign in</button></p>
  </AuthPageLayout>;
};

export default RegisterPage;
