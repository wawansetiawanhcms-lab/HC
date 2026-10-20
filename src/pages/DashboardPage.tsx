import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarController,
  PieController,
  DoughnutController,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Users, AlertTriangle, Building, GraduationCap, Search, FileDown } from 'lucide-react';
import { Employee } from '../types';
import { exportToExcel } from '../services/sheetService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  BarController,
  PieController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface DashboardPageProps {
  employees: Employee[];
  isDark: boolean;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ employees, isDark, onShowToast }) => {
  const chartUnitRef = useRef<HTMLCanvasElement | null>(null);
  const chartMasaRef = useRef<HTMLCanvasElement | null>(null);
  const chartPendRef = useRef<HTMLCanvasElement | null>(null);
  const chartUsiaRef = useRef<HTMLCanvasElement | null>(null);
  const chartGenderRef = useRef<HTMLCanvasElement | null>(null);

  const chartInstances = useRef<{ [key: string]: ChartJS | null }>({});

  const [pensiunSearch, setPensiunSearch] = useState('');

  // Computations
  const stats = useMemo(() => {
    let pensiun55Count = 0;
    const unitCount: { [key: string]: number } = {};
    const pendCount: { [key: string]: number } = {};
    const kelUsiaCount: { [key: string]: number } = {};
    const masaCount: { [key: string]: number } = {};
    const genderCount: { [key: string]: number } = {};
    const pensiunList: Employee[] = [];

    employees.forEach(emp => {
      if (emp.usia === 55) {
        pensiun55Count++;
        pensiunList.push(emp);
      }

      if (emp.unit) unitCount[emp.unit] = (unitCount[emp.unit] || 0) + 1;
      if (emp.pendidikan && emp.pendidikan !== 'Unknown') {
        pendCount[emp.pendidikan] = (pendCount[emp.pendidikan] || 0) + 1;
      }
      if (emp.kelompokUsia && emp.kelompokUsia !== 'Unknown') {
        kelUsiaCount[emp.kelompokUsia] = (kelUsiaCount[emp.kelompokUsia] || 0) + 1;
      }
      if (emp.gender) {
        genderCount[emp.gender] = (genderCount[emp.gender] || 0) + 1;
      }
      if (emp.masaJabatan && emp.masaJabatan !== 'Unknown') {
        masaCount[emp.masaJabatan] = (masaCount[emp.masaJabatan] || 0) + 1;
      }
    });

    const topPend =
      Object.keys(pendCount).reduce((a, b) => (pendCount[a] > pendCount[b] ? a : b), '-') || '-';

    return {
      total: employees.length,
      pensiun55Count,
      totalUnit: Object.keys(unitCount).length,
      topPend,
      unitCount,
      pendCount,
      kelUsiaCount,
      masaCount,
      genderCount,
      pensiunList,
    };
  }, [employees]);

  // Render Charts
  useEffect(() => {
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

    // Cleanup existing charts
    Object.keys(chartInstances.current).forEach(key => {
      chartInstances.current[key]?.destroy();
      chartInstances.current[key] = null;
    });

    // 1. Chart Unit
    if (chartUnitRef.current && Object.keys(stats.unitCount).length > 0) {
      const sortedUnits = Object.keys(stats.unitCount).sort(
        (a, b) => stats.unitCount[b] - stats.unitCount[a]
      );
      chartInstances.current.unit = new ChartJS(chartUnitRef.current, {
        type: 'bar',
        data: {
          labels: sortedUnits,
          datasets: [
            {
              label: 'Jumlah Pegawai',
              data: sortedUnits.map(u => stats.unitCount[u]),
              backgroundColor: '#005BAC',
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
            },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor }, grace: '15%' },
            x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 45, font: { size: 10 } } },
          },
        },
      });
    }

    // 2. Chart Masa Jabatan
    if (chartMasaRef.current && Object.keys(stats.masaCount).length > 0) {
      const sortedMasaKeys = Object.keys(stats.masaCount).sort(
        (a, b) => parseFloat(a.replace(',', '.')) - parseFloat(b.replace(',', '.'))
      );
      chartInstances.current.masa = new ChartJS(chartMasaRef.current, {
        type: 'bar',
        data: {
          labels: sortedMasaKeys,
          datasets: [
            {
              label: 'Pegawai',
              data: sortedMasaKeys.map(k => stats.masaCount[k]),
              backgroundColor: '#00A8A8',
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
            },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor }, grace: '15%' },
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 10 } },
              title: { display: true, text: 'Tahun', color: textColor, font: { size: 10 } },
            },
          },
        },
      });
    }

    // 3. Chart Pendidikan
    if (chartPendRef.current && Object.keys(stats.pendCount).length > 0) {
      chartInstances.current.pend = new ChartJS(chartPendRef.current, {
        type: 'pie',
        data: {
          labels: Object.keys(stats.pendCount),
          datasets: [
            {
              data: Object.values(stats.pendCount),
              backgroundColor: [
                '#005BAC',
                '#0072CE',
                '#00A651',
                '#00A8A8',
                '#00C4CC',
                '#F59E0B',
                '#EF4444',
                '#8B5CF6',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: textColor, boxWidth: 12, font: { size: 10 } } },
            datalabels: {
              color: '#ffffff',
              font: { weight: 'bold', size: 10 },
              formatter: (val, ctx) => {
                const sum = (ctx.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                const pct = (val * 100) / sum;
                return pct > 5 ? `${pct.toFixed(0)}%` : '';
              },
            },
          },
        },
      });
    }

    // 4. Chart Kelompok Usia
    if (chartUsiaRef.current && Object.keys(stats.kelUsiaCount).length > 0) {
      chartInstances.current.usia = new ChartJS(chartUsiaRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(stats.kelUsiaCount),
          datasets: [
            {
              data: Object.values(stats.kelUsiaCount),
              backgroundColor: ['#0072CE', '#00A651', '#F59E0B', '#EF4444', '#8B5CF6'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: textColor, boxWidth: 12, font: { size: 10 } } },
            datalabels: {
              color: '#ffffff',
              font: { weight: 'bold', size: 10 },
              formatter: (val, ctx) => {
                const sum = (ctx.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                const pct = (val * 100) / sum;
                return pct > 5 ? `${pct.toFixed(0)}%` : '';
              },
            },
          },
        },
      });
    }

    // 5. Chart Gender
    if (chartGenderRef.current && Object.keys(stats.genderCount).length > 0) {
      chartInstances.current.gender = new ChartJS(chartGenderRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(stats.genderCount),
          datasets: [
            {
              data: Object.values(stats.genderCount),
              backgroundColor: ['#005BAC', '#EC4899', '#94A3B8'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, font: { size: 10 } } },
            datalabels: {
              color: '#ffffff',
              font: { weight: 'bold', size: 10 },
              formatter: (val, ctx) => {
                const sum = (ctx.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                const pct = (val * 100) / sum;
                return `${pct.toFixed(0)}%`;
              },
            },
          },
        },
      });
    }

    return () => {
      Object.keys(chartInstances.current).forEach(key => {
        chartInstances.current[key]?.destroy();
        chartInstances.current[key] = null;
      });
    };
  }, [stats, isDark]);

  const filteredPensiun = useMemo(() => {
    if (!pensiunSearch.trim()) return stats.pensiunList;
    const q = pensiunSearch.toLowerCase();
    return stats.pensiunList.filter(
      p => p.nama.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q)
    );
  }, [stats.pensiunList, pensiunSearch]);

  const handleExportPensiun = () => {
    if (filteredPensiun.length === 0) {
      onShowToast('Data pensiun kosong', 'error');
      return;
    }
    const headers = ['No', 'Nama Pegawai', 'Unit', 'Jabatan', 'Usia Saat Ini'];
    const rows = filteredPensiun.map((p, idx) => [idx + 1, p.nama, p.unit, p.jabatan, p.usia]);
    exportToExcel('Daftar_Pegawai_Pensiun_55_Thn.xlsx', 'Pensiun_55', headers, rows);
    onShowToast('Berhasil mengunduh Excel Pegawai Pensiun', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pegawai */}
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-13 h-13 rounded-2xl bg-[#005BAC]/10 dark:bg-[#005BAC]/20 flex items-center justify-center text-[#005BAC] dark:text-[#00C4CC]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Total Pegawai
            </p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.total.toLocaleString('id-ID')}
            </h4>
            <span className="text-[11px] text-slate-400">UID Lampung</span>
          </div>
        </div>

        {/* Pensiun Umur 55 */}
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-13 h-13 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Pensiun Umur 55 Thn
            </p>
            <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats.pensiun55Count}
            </h4>
            <span className="text-[11px] text-slate-400">Persiapan Pensiun 56 Thn</span>
          </div>
        </div>

        {/* Total Unit */}
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-13 h-13 rounded-2xl bg-[#00A651]/10 dark:bg-[#00A651]/20 flex items-center justify-center text-[#00A651] dark:text-emerald-400">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Total Unit
            </p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalUnit}
            </h4>
            <span className="text-[11px] text-slate-400">Unit Pelaksana & Layanan</span>
          </div>
        </div>

        {/* Mayoritas Pendidikan */}
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-13 h-13 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Mayoritas Pend.
            </p>
            <h4 className="text-xl font-black text-purple-600 dark:text-purple-400 truncate max-w-[150px]">
              {stats.topPend}
            </h4>
            <span className="text-[11px] text-slate-400">Tingkat Pendidikan Terbanyak</span>
          </div>
        </div>
      </div>

      {/* Row 1: Charts Unit & Masa Jabatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Jumlah Pegawai Per Unit (Kolom Kode BA)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-bold">
              Distribusi Unit
            </span>
          </div>
          <div className="h-72 w-full">
            <canvas ref={chartUnitRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Jumlah Pegawai Per Masa Jabatan (Kolom AQ)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-900/30 text-teal-600 font-bold">
              Masa Jabatan
            </span>
          </div>
          <div className="h-72 w-full">
            <canvas ref={chartMasaRef} />
          </div>
        </div>
      </div>

      {/* Row 2: Charts Pendidikan, Usia, Gender */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
            Pendidikan (Kolom Pendidikan)
          </h3>
          <div className="h-60 w-full">
            <canvas ref={chartPendRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
            Kelompok Usia
          </h3>
          <div className="h-60 w-full">
            <canvas ref={chartUsiaRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
            Komposisi Gender (Kolom P)
          </h3>
          <div className="h-60 w-full">
            <canvas ref={chartGenderRef} />
          </div>
        </div>
      </div>

      {/* Pensiun List Table */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Daftar Pegawai Usia 55 Tahun (Persiapan Pensiun 56 Thn)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Total {stats.pensiun55Count} pegawai terdata usia 55 tahun
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau unit..."
                value={pensiunSearch}
                onChange={e => setPensiunSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
              />
            </div>
            <button
              onClick={handleExportPensiun}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-80 custom-scrollbar">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">No</th>
                <th className="px-5 py-3.5">Nama Pegawai</th>
                <th className="px-5 py-3.5">Unit Kerja</th>
                <th className="px-5 py-3.5">Jabatan</th>
                <th className="px-5 py-3.5 text-center">Usia Saat Ini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPensiun.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">
                    Tidak ada pegawai usia 55 tahun yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPensiun.map((p, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="px-5 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-white">{p.nama}</td>
                    <td className="px-5 py-3">{p.unit}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.jabatan}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                        {p.usia} Tahun
                      </span>
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
