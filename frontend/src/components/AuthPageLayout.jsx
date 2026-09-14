import { Leaf } from 'lucide-react';

const AuthPageLayout = ({ title, subtitle, children }) => (
  <main className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-emerald-50 via-stone-50 to-green-100 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
    <section className="w-full max-w-md rounded-3xl border border-white/70 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 p-8 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-8"><Leaf className="w-7 h-7" /><span className="text-xl font-bold">Plantiq</span></div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>
      {children}
    </section>
  </main>
);

export default AuthPageLayout;
