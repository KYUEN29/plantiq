import { useState } from 'react';
import AuthPageLayout from './AuthPageLayout';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({ onNavigate }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) return setError('Enter your email and password.');
    setSubmitting(true);
    try { await login(form); onNavigate('/'); } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  return <AuthPageLayout title="Welcome back" subtitle="Sign in to your Plantiq account.">
    <form onSubmit={submit} className="mt-7 space-y-5">
      <label className="block text-sm font-semibold">Email<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-green-500 dark:bg-gray-800 dark:border-gray-700" /></label>
      <label className="block text-sm font-semibold">Password<input required type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-green-500 dark:bg-gray-800 dark:border-gray-700" /></label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="w-full rounded-xl bg-green-600 p-3 font-bold text-white disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">New to Plantiq? <button onClick={() => onNavigate('/register')} className="font-semibold text-green-700 dark:text-green-400">Create an account</button></p>
  </AuthPageLayout>;
};

export default LoginPage;
