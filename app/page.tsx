"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Ajian Family</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">{user.email}</span>
          <button 
            onClick={handleLogout}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Keluar
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 mt-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Halo, selamat datang! 👋</h2>
          <p className="text-slate-500 mt-2">Ringkasan keuangan Anda hari ini.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Kas Bersih</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">Rp 0</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Hutang</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">Rp 0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Investasi</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-2">Rp 0</p>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Belum ada akun keuangan</h3>
          <p className="text-slate-500 mt-2 mb-6 max-w-md mx-auto">
            Untuk mulai mencatat transaksi harian atau operasional Loaf Age, Anda perlu membuat akun keuangan terlebih dahulu (misal: BCA, Kas Tunai, dll).
          </p>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm">
            + Tambah Akun Keuangan
          </button>
        </div>
      </main>
    </div>
  );
}