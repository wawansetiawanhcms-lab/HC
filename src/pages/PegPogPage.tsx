import React, { useState, useMemo } from 'react';
import { AlertTriangle, FileDown, Search } from 'lucide-react';
import { AnomaliItem } from '../types';
import { exportToExcel } from '../services/sheetService';

interface PegPogPageProps {
  anomaliItems: AnomaliItem[];
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const PegPogPage: React.FC<PegPogPageProps> = ({ anomaliItems, onShowToast }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return anomaliItems;
    const q = search.toLowerCase();
    return anomaliItems.filter(
      item =>
        item.nama.toLowerCase().includes(q) ||
        item.nip.toLowerCase().includes(q) ||
        item.jabatan.toLowerCase().includes(q)
    );
  }, [anomaliItems, search]);

  const handleExport = () => {
    if (filtered.length === 0) {
      onShowToast('Data anomali kosong', 'error');
      return;
    }
    const headers = ['No', 'NIP', 'Nama Pegawai', 'PeG', 'PoG', 'Jabatan'];
    const rows = filtered.map((m, idx) => [idx + 1, m.nip, m.nama, m.peg, m.pog, m.jabatan]);
    exportToExcel('Data_Anomali_PeG_PoG.xlsx', 'Anomali', headers, rows);
    onShowToast('Berhasil mengunduh Excel Data Anomali PeG > PoG', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Banner Warning */}
      <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-rose-900 dark:text-rose-200">
              Daftar Anomali PeG &gt; PoG
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              Menampilkan pegawai dengan Grade Pegawai (PeG) lebih tinggi dari Posisi Grade jabatan yang diduduki saat ini (Kolom Filter = True). Total terdeteksi: {anomaliItems.length} pegawai.
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap cursor-pointer self-start sm:self-auto"
        >
          <FileDown className="w-4 h-4" />
          <span>Unduh Excel</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Tabel Rincian Pegawai Anomali
          </h4>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NIP, nama, atau jabatan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-[500px] custom-scrollbar shadow-inner">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">No</th>
                <th className="px-5 py-3.5 font-mono">NIP</th>
                <th className="px-5 py-3.5">Nama Pegawai</th>
                <th className="px-5 py-3.5 text-center">PeG (Pegawai)</th>
                <th className="px-5 py-3.5 text-center">PoG (Posisi)</th>
                <th className="px-5 py-3.5">Jabatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                    Tidak ada anomali yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {item.nip}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#005BAC] dark:text-[#00C4CC]">
                      {item.nama}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                        {item.peg}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                        {item.pog}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-normal min-w-[260px] text-slate-600 dark:text-slate-300">
                      {item.jabatan}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
