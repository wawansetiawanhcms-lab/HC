import React, { useState } from 'react';
import { UserPlus, Shield, Database, CheckCircle2, Lock, Sparkles, RefreshCw } from 'lucide-react';
import { hashPassword } from '../services/sheetService';

interface SettingPageProps {
  rawUserData: any[][];
  onUserAdded: (newUser: [string, string, string]) => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const SettingPage: React.FC<SettingPageProps> = ({
  rawUserData,
  onUserAdded,
  onRefreshData,
  isRefreshing,
  onShowToast,
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUnit, setNewUnit] = useState('Semua');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) {
      onShowToast('Username dan Password wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const hashedPassword = await hashPassword(newPassword);

      // Attempt Google Apps Script POST if configured
      const APP_SCRIPT_URL =
        'https://script.google.com/macros/s/AKfycbyGrTu74105mJxJ0_IfOdRBcuLVnUK4NBE05XBuG2khw5RI5JGWL-m8gJqGhc67UHJ5xg/exec';

      const formData = new FormData();
      formData.append('username', newUsername.trim());
      formData.append('password', hashedPassword);
      formData.append('unit', newUnit);

      try {
        await fetch(APP_SCRIPT_URL, { method: 'POST', body: formData, mode: 'no-cors' });
      } catch (postErr) {
        console.warn('Apps script direct post warning:', postErr);
      }

      onUserAdded([newUsername.trim().toLowerCase(), hashedPassword, newUnit]);
      onShowToast(`Pengguna '${newUsername}' berhasil ditambahkan ke sistem!`, 'success');

      setNewUsername('');
      setNewPassword('');
    } catch (err) {
      console.error('Error adding user:', err);
      onShowToast('Terjadi kesalahan saat menambahkan pengguna', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Box 1: Add User Form */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#005BAC] dark:text-[#00C4CC]" />
            <span>Manajemen Akses &amp; Keamanan</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola pengguna sistem, buat akun baru dengan enkripsi SHA-256, dan atur hak akses peran.
          </p>
        </div>

        <div className="p-6">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#00A651]" />
            <span>Tambah Pengguna Baru</span>
          </h4>

          <form onSubmit={handleAddUser} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Username Baru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: staff.sdm"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Unit Akses
                </label>
                <select
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
                >
                  <option value="Semua">Semua Unit (Pusat)</option>
                  <option value="UP3 Tanjung Karang">UP3 Tanjung Karang</option>
                  <option value="UP3 Metro">UP3 Metro</option>
                  <option value="UP3 Kotabumi">UP3 Kotabumi</option>
                  <option value="UP3 Pringsewu">UP3 Pringsewu</option>
                  <option value="UP2K Lampung">UP2K Lampung</option>
                  <option value="UP2D Lampung">UP2D Lampung</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-[#005BAC] to-[#00A651] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Simpan Pengguna</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Box 2: Registered Accounts Preview */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#0072CE]" />
          <span>Daftar Akun Terdaftar ({rawUserData.length} Pengguna)</span>
        </h4>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-64 custom-scrollbar">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3 w-12 text-center">No</th>
                <th className="px-5 py-3">Username</th>
                <th className="px-5 py-3">Unit / Akses</th>
                <th className="px-5 py-3 font-mono">Password Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rawUserData.map((u, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="px-5 py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-5 py-2.5 font-bold text-slate-800 dark:text-white">{u[0]}</td>
                  <td className="px-5 py-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                      {u[2] || 'Semua Unit'}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                    {String(u[1] || '').substring(0, 20)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Box 3: Data Source Info */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                Koneksi Google Spreadsheet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ID: 1YIp30Qn6lugeDEDUvf3ZwPQTtVcYk7LJisUBfHtaFI8
              </p>
            </div>
          </div>

          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0072CE]' : ''}`} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkronisasi Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
