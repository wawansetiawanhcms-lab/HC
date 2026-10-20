import React, { useState, useMemo, useRef } from 'react';
import { Layers, FileDown, Search, X, Calendar, Building, Briefcase } from 'lucide-react';
import { KalijabatItem, HistoryItem } from '../types';
import { parseHistoryFromRjab, exportToExcel } from '../services/sheetService';

interface KalijabatPageProps {
  title: string;
  shortTitle: string;
  kalijabatItems: KalijabatItem[];
  rawRjabData: any[][];
  isDark?: boolean;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const KalijabatPage: React.FC<KalijabatPageProps> = ({
  title,
  shortTitle,
  kalijabatItems,
  rawRjabData,
  onShowToast,
}) => {
  const [filterKali, setFilterKali] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<{
    nama: string;
    history: HistoryItem[];
  } | null>(null);

  const detailSectionRef = useRef<HTMLDivElement | null>(null);

  // Unique values for filter dropdown
  const uniqueKali = useMemo(() => {
    const set = new Set<number>();
    kalijabatItems.forEach(item => {
      if (item.kali) set.add(item.kali);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [kalijabatItems]);

  // Filtered Items - SORTED DESCENDING BY KALI JABAT
  const filteredItems = useMemo(() => {
    let result = [...kalijabatItems];

    if (filterKali !== 'all') {
      const kNum = parseInt(filterKali);
      result = result.filter(item => item.kali === kNum);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.nama.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q) ||
          item.jabatan.toLowerCase().includes(q)
      );
    }

    // Sort descending by kali jabat (Jumlah kali jabat di-sort descending)
    return result.sort((a, b) => (b.kali || 0) - (a.kali || 0));
  }, [kalijabatItems, filterKali, searchQuery]);

  const handleSelectEmployee = (item: KalijabatItem) => {
    const history = parseHistoryFromRjab(rawRjabData, item.nama, item.history);
    setSelectedEmployee({
      nama: item.nama,
      history,
    });
    setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleExportTable = () => {
    if (filteredItems.length === 0) {
      onShowToast('Data kosong', 'error');
      return;
    }
    const headers = ['No', 'Nama Pegawai', 'Nama Unit', 'Jabatan Saat Ini', 'Kali Jabat'];
    const rows = filteredItems.map((m, idx) => [idx + 1, m.nama, m.unit, m.jabatan, `${m.kali} Kali`]);
    exportToExcel(`Data_Kali_Jabat_${shortTitle}.xlsx`, shortTitle, headers, rows);
    onShowToast(`Berhasil mengunduh Excel Data Kali Jabat ${shortTitle}`, 'success');
  };

  const handleExportHistory = () => {
    if (!selectedEmployee || selectedEmployee.history.length === 0) {
      onShowToast('Riwayat kosong', 'error');
      return;
    }
    const headers = ['Urutan', 'Nama Jabatan', 'Nama Unit', 'Start Date', 'End Date'];
    const rows = selectedEmployee.history.map((h, idx) => [
      idx + 1,
      h.jabatan,
      h.unit,
      h.startDate,
      h.endDate,
    ]);
    const safeName = selectedEmployee.nama.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    exportToExcel(`Riwayat_${shortTitle}_${safeName}.xlsx`, 'Riwayat', headers, rows);
    onShowToast(`Berhasil mengunduh riwayat jabatan ${selectedEmployee.nama}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#005BAC] dark:text-[#00C4CC]" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik nama pegawai pada tabel untuk membuka riwayat jabatan dan riwayat mutasi di bagian bawah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Kali Jabat */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Filter Frekuensi:
              </span>
              <select
                value={filterKali}
                onChange={e => setFilterKali(e.target.value)}
                className="bg-transparent border-0 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Data</option>
                {uniqueKali.map(k => (
                  <option key={k} value={k}>
                    {k} Kali Menjabat
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, unit..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
              />
            </div>

            {/* Export */}
            <button
              onClick={handleExportTable}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>

        {/* Main Table (Sorted Descending) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-[500px] custom-scrollbar shadow-inner">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">No</th>
                <th className="px-5 py-3.5 min-w-[220px]">Nama Pegawai {shortTitle}</th>
                <th className="px-5 py-3.5 min-w-[180px]">Nama Unit</th>
                <th className="px-5 py-3.5 min-w-[260px]">Jabatan Saat Ini</th>
                <th className="px-5 py-3.5 text-center">Kali Jabat (E) ↓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                    Tidak ada data pegawai yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleSelectEmployee(item)}
                        className="text-left font-bold text-[#005BAC] dark:text-[#00C4CC] hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{item.nama}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5">{item.unit}</td>
                    <td className="px-5 py-3.5 whitespace-normal min-w-[260px] text-slate-600 dark:text-slate-300">
                      {item.jabatan}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                        {item.kali} Kali
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Detail Drawer / Section */}
      {selectedEmployee && (
        <div
          ref={detailSectionRef}
          className="bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-[#005BAC]/30 dark:border-[#00C4CC]/30 overflow-hidden transition-all animate-in fade-in"
        >
          <div className="px-6 py-4.5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A651]">
                  Detail Riwayat Jabatan
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold">
                  {shortTitle}
                </span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {selectedEmployee.nama}
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportHistory}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Riwayat (.xlsx)</span>
              </button>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <thead className="text-[11px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5 w-16 text-center">Urutan</th>
                    <th className="px-5 py-3.5 min-w-[260px]">Nama Jabatan</th>
                    <th className="px-5 py-3.5 min-w-[200px]">Nama Unit</th>
                    <th className="px-5 py-3.5 text-center">Start Date</th>
                    <th className="px-5 py-3.5 text-center">End Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedEmployee.history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">
                        Tidak ada catatan riwayat terperinci pada database rjab.
                      </td>
                    </tr>
                  ) : (
                    selectedEmployee.history.map((h, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white whitespace-normal min-w-[260px]">
                          {h.jabatan}
                        </td>
                        <td className="px-5 py-3.5">{h.unit}</td>
                        <td className="px-5 py-3.5 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {h.startDate}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {h.endDate}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
