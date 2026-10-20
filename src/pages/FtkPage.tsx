import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Search, FileDown, Filter, RotateCcw } from 'lucide-react';
import { FTKItem } from '../types';
import { exportToExcel } from '../services/sheetService';

interface FtkPageProps {
  ftkData: FTKItem[];
  isDark: boolean;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const FtkPage: React.FC<FtkPageProps> = ({ ftkData, isDark, onShowToast }) => {
  const chartUPRef = useRef<HTMLCanvasElement | null>(null);
  const chartULPRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstances = useRef<{ [key: string]: ChartJS | null }>({});

  const [unitFilter, setUnitFilter] = useState<'all' | 'up' | 'ulp'>('all');
  const [pctFilter, setPctFilter] = useState<'all' | '<75' | '75-90' | '90-100' | '>100'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Segregate UP vs ULP for charts
  const upCombined = useMemo(() => {
    return ftkData
      .filter(d => !d.unit.toUpperCase().includes('ULP'))
      .sort((a, b) => a.pctNum - b.pctNum);
  }, [ftkData]);

  const ulpCombined = useMemo(() => {
    return ftkData
      .filter(d => d.unit.toUpperCase().includes('ULP'))
      .sort((a, b) => a.pctNum - b.pctNum);
  }, [ftkData]);

  // Render Charts
  useEffect(() => {
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

    Object.keys(chartInstances.current).forEach(k => {
      chartInstances.current[k]?.destroy();
      chartInstances.current[k] = null;
    });

    if (chartUPRef.current && upCombined.length > 0) {
      chartInstances.current.up = new ChartJS(chartUPRef.current, {
        type: 'bar',
        data: {
          labels: upCombined.map(i => i.unit),
          datasets: [
            {
              label: 'Prosentase Pemenuhan FTK (%)',
              data: upCombined.map(i => i.pctNum),
              backgroundColor: '#8B5CF6',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            datalabels: {
              color: textColor,
              anchor: 'end',
              align: 'top',
              font: { weight: 'bold', size: 10 },
              formatter: val => `${val}%`,
            },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor }, grace: '20%' },
            x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 45, font: { size: 10 } } },
          },
        },
      });
    }

    if (chartULPRef.current && ulpCombined.length > 0) {
      chartInstances.current.ulp = new ChartJS(chartULPRef.current, {
        type: 'bar',
        data: {
          labels: ulpCombined.map(i => i.unit),
          datasets: [
            {
              label: 'Prosentase Pemenuhan FTK (%)',
              data: ulpCombined.map(i => i.pctNum),
              backgroundColor: '#EF4444',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            datalabels: {
              color: textColor,
              anchor: 'end',
              align: 'top',
              font: { weight: 'bold', size: 9 },
              formatter: val => `${val}%`,
            },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor }, grace: '20%' },
            x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 60, font: { size: 9 } } },
          },
        },
      });
    }

    return () => {
      Object.keys(chartInstances.current).forEach(k => {
        chartInstances.current[k]?.destroy();
        chartInstances.current[k] = null;
      });
    };
  }, [upCombined, ulpCombined, isDark]);

  // Filtered Table Data
  const filteredData = useMemo(() => {
    return ftkData.filter(item => {
      const isULP = item.unit.toUpperCase().includes('ULP');
      let matchUnit = true;
      if (unitFilter === 'up') matchUnit = !isULP;
      else if (unitFilter === 'ulp') matchUnit = isULP;

      let matchPct = true;
      if (pctFilter === '<75') matchPct = item.pctNum < 75;
      else if (pctFilter === '75-90') matchPct = item.pctNum >= 75 && item.pctNum <= 90;
      else if (pctFilter === '90-100') matchPct = item.pctNum >= 90 && item.pctNum <= 100;
      else if (pctFilter === '>100') matchPct = item.pctNum > 100;

      let matchSearch = true;
      if (searchTerm.trim()) {
        matchSearch = item.unit.toLowerCase().includes(searchTerm.toLowerCase());
      }

      return matchUnit && matchPct && matchSearch;
    });
  }, [ftkData, unitFilter, pctFilter, searchTerm]);

  const handleExport = () => {
    if (filteredData.length === 0) {
      onShowToast('Data FTK kosong', 'error');
      return;
    }
    const headers = ['Nama Unit', 'Pagu', 'FTK', 'Prosentase', 'GAP'];
    const rows = filteredData.map(m => [m.unit, m.pagu, m.ftk, m.pct, m.gap]);
    exportToExcel('Data_FTK_UID_Lampung.xlsx', 'FTK_UID_Lampung', headers, rows);
    onShowToast('Berhasil mengunduh Excel Data FTK', 'success');
  };

  const handleReset = () => {
    setUnitFilter('all');
    setPctFilter('all');
    setSearchTerm('');
    onShowToast('Filter FTK direset', 'info');
  };

  return (
    <div className="space-y-6">
      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Prosentase Pemenuhan FTK Unit Pelaksana
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 font-bold">
              UP
            </span>
          </div>
          <div className="h-80 w-full">
            <canvas ref={chartUPRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Prosentase Pemenuhan FTK Unit Layanan (ULP)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-600 font-bold">
              ULP
            </span>
          </div>
          <div className="h-80 w-full">
            <canvas ref={chartULPRef} />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
              Tabel FTK UID Lampung
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih kriteria filter di bawah untuk menyaring data formasi tenaga kerja
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap cursor-pointer self-start sm:self-auto"
          >
            <FileDown className="w-4 h-4" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
        </div>

        {/* Filter Controls Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 mb-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Kategori Unit
            </label>
            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value as any)}
              className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
            >
              <option value="all">Semua Unit</option>
              <option value="up">Unit Pelaksana (UP)</option>
              <option value="ulp">Unit Layanan (ULP)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Prosentase FTK
            </label>
            <select
              value={pctFilter}
              onChange={e => setPctFilter(e.target.value as any)}
              className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
            >
              <option value="all">Semua Prosentase</option>
              <option value="<75">x &lt; 75%</option>
              <option value="75-90">75% &le; x &le; 90%</option>
              <option value="90-100">90% &le; x &le; 100%</option>
              <option value=">100">x &gt; 100%</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Cari Unit
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nama unit..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-700 dark:hover:bg-slate-650 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* FTK Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-[500px] custom-scrollbar shadow-inner">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Nama Unit</th>
                <th className="px-5 py-3.5 text-center">Pagu</th>
                <th className="px-5 py-3.5 text-center">FTK</th>
                <th className="px-5 py-3.5 text-center">Prosentase</th>
                <th className="px-5 py-3.5 text-center">GAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                    Tidak ada data FTK yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                      {item.unit}
                    </td>
                    <td className="px-5 py-3.5 text-center">{item.pagu}</td>
                    <td className="px-5 py-3.5 text-center font-medium">{item.ftk}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-[#005BAC] dark:text-[#00C4CC]">
                      {item.pct}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                      {item.gap}
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
