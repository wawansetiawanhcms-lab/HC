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
import { Info, RotateCcw, FileDown, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Employee } from '../types';
import { exportToExcel } from '../services/sheetService';

interface MobilityPageProps {
  employees: Employee[];
  isDark: boolean;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

interface MobilityRecord {
  nama: string;
  jabatan: string;
  unit: string;
  lama: string;
  lamaNum: number;
  unitId: string;
  unitTitle: string;
}

const targetUnits = [
  { id: 'tanjung karang', title: 'UP3 TANJUNG KARANG', keywords: ['tanjung karang', 'tanjungkarang'] },
  { id: 'pringsewu', title: 'UP3 PRINGSEWU', keywords: ['pringsewu'] },
  { id: 'metro', title: 'UP3 METRO', keywords: ['metro'] },
  { id: 'kotabumi', title: 'UP3 KOTABUMI', keywords: ['kotabumi', 'kota bumi'] },
  { id: 'up2k', title: 'UP2K LAMPUNG', keywords: ['up2k'] },
  { id: 'up2d', title: 'UP2D LAMPUNG', keywords: ['up2d'] },
  { id: 'uid lampung', title: 'UID LAMPUNG', keywords: ['uid lampung', 'induk', 'wilayah'] },
];

const targetJabatans = [
  'general manager',
  'senior manager',
  'manager',
  'manajer',
  'assistant manager',
  'asisten manajer',
  'unit pelaksana',
  'unit layanan',
  'team leader',
];

export const MobilityPage: React.FC<MobilityPageProps> = ({ employees, isDark, onShowToast }) => {
  const chartRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const chartInstances = useRef<{ [key: string]: ChartJS | null }>({});
  const detailTableRef = useRef<HTMLDivElement | null>(null);

  const [activeFilter, setActiveFilter] = useState<{
    unitId?: string;
    unitTitle?: string;
    tenure?: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Extract Mobility Managerial Data
  const allMobilityData = useMemo(() => {
    const list: MobilityRecord[] = [];

    employees.forEach(emp => {
      const jabatanLower = emp.jabatan.toLowerCase();
      const unitLower = (emp.unit + ' ' + (emp.unitKolomN || '')).toLowerCase();

      const isTarget = targetJabatans.some(tj => jabatanLower.includes(tj));
      if (!isTarget) return;

      if (!emp.masaJabatan || emp.masaJabatan === 'Unknown') return;

      const matchedUnit = targetUnits.find(u => u.keywords.some(kw => unitLower.includes(kw)));
      if (matchedUnit) {
        list.push({
          nama: emp.nama,
          jabatan: emp.jabatan,
          unit: emp.unit,
          lama: emp.masaJabatan,
          lamaNum: emp.masaJabatanNum,
          unitId: matchedUnit.id,
          unitTitle: matchedUnit.title,
        });
      }
    });

    return list.sort((a, b) => b.lamaNum - a.lamaNum);
  }, [employees]);

  // Aggregate per unit for 7 charts
  const unitDataGroup = useMemo(() => {
    const groups: { [unitId: string]: { [tenure: string]: number } } = {};
    targetUnits.forEach(u => {
      groups[u.id] = {};
    });

    allMobilityData.forEach(item => {
      if (groups[item.unitId]) {
        groups[item.unitId][item.lama] = (groups[item.unitId][item.lama] || 0) + 1;
      }
    });

    return groups;
  }, [allMobilityData]);

  // Render 7 unit charts
  useEffect(() => {
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

    // Cleanup existing charts
    Object.keys(chartInstances.current).forEach(key => {
      chartInstances.current[key]?.destroy();
      chartInstances.current[key] = null;
    });

    targetUnits.forEach(u => {
      const canvas = chartRefs.current[u.id];
      const dataObj = unitDataGroup[u.id] || {};
      const labels = Object.keys(dataObj).sort(
        (a, b) => parseFloat(a.replace(',', '.')) - parseFloat(b.replace(',', '.'))
      );
      const values = labels.map(l => dataObj[l]);

      if (canvas && labels.length > 0) {
        chartInstances.current[u.id] = new ChartJS(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Pegawai',
                data: values,
                backgroundColor: '#F59E0B',
                hoverBackgroundColor: '#D97706',
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (_evt, elements) => {
              if (elements.length > 0) {
                const elementIndex = elements[0].index;
                const clickedTenure = labels[elementIndex];
                setActiveFilter({
                  unitId: u.id,
                  unitTitle: u.title,
                  tenure: clickedTenure,
                });
                detailTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                color: textColor,
                anchor: 'end',
                align: 'top',
                font: { weight: 'bold', size: 10 },
              },
              tooltip: {
                callbacks: {
                  title: items => `${items[0].label} Tahun`,
                  label: item => ` ${item.parsed.y} Pegawai Manajerial`,
                },
              },
            },
            scales: {
              y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor }, grace: '20%' },
              x: {
                grid: { display: false },
                ticks: { color: textColor, font: { size: 10 } },
                title: { display: true, text: 'Tahun', color: textColor, font: { size: 9 } },
              },
            },
          },
        });
      }
    });

    return () => {
      Object.keys(chartInstances.current).forEach(key => {
        chartInstances.current[key]?.destroy();
        chartInstances.current[key] = null;
      });
    };
  }, [unitDataGroup, isDark]);

  // Filtered table data
  const filteredData = useMemo(() => {
    let result = allMobilityData;

    if (activeFilter) {
      if (activeFilter.unitId) {
        result = result.filter(item => item.unitId === activeFilter.unitId);
      }
      if (activeFilter.tenure) {
        result = result.filter(item => item.lama === activeFilter.tenure);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.nama.toLowerCase().includes(q) ||
          item.jabatan.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allMobilityData, activeFilter, searchQuery]);

  const handleExport = () => {
    if (filteredData.length === 0) {
      onShowToast('Data Mobility kosong', 'error');
      return;
    }
    const headers = ['No', 'Nama Pegawai', 'Jabatan', 'Unit', 'Lama Menjabat (Tahun)'];
    const rows = filteredData.map((m, idx) => [idx + 1, m.nama, m.jabatan, m.unit, m.lama]);
    exportToExcel('Data_Mobility_Masa_Jabatan.xlsx', 'Mobility', headers, rows);
    onShowToast('Berhasil mengunduh Excel Data Mobility', 'success');
  };

  const handleResetFilter = () => {
    setActiveFilter(null);
    setSearchQuery('');
    onShowToast('Filter berhasil direset', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Banner Info */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
          Monitoring Jabatan Manajerial berdasarkan Unit & Masa Jabatan. Klik Bar pada Grafik untuk
          mem-filter rincian pegawai di tabel bawah secara instan!
        </p>
      </div>

      {/* 7 Unit Charts Grid */}
      <div>
        <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">
          7 Grafik Lama Jabatan Berdasarkan Unit
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {targetUnits.map(u => {
            const hasData = Object.keys(unitDataGroup[u.id] || {}).length > 0;
            return (
              <div
                key={u.id}
                className="bg-white dark:bg-slate-850 p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col"
              >
                <h4 className="text-xs font-bold text-center text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider truncate">
                  {u.title}
                </h4>
                <div className="h-52 w-full relative flex items-center justify-center">
                  {hasData ? (
                    <canvas
                      ref={el => {
                        chartRefs.current[u.id] = el;
                      }}
                      className="cursor-pointer"
                    />
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">Data Manajerial Kosong</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Table Section */}
      <div
        ref={detailTableRef}
        className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
              {activeFilter
                ? `Filter: ${activeFilter.unitTitle} (${activeFilter.tenure} Tahun)`
                : 'Rincian Masa Jabatan Manajerial'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Menampilkan {filteredData.length} dari {allMobilityData.length} pegawai manajerial
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, jabatan, unit..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
              />
            </div>

            {/* Reset Button */}
            {activeFilter && (
              <button
                onClick={handleResetFilter}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}

            {/* Export Excel */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-[500px] custom-scrollbar shadow-inner">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">No</th>
                <th className="px-5 py-3.5">Nama Pegawai</th>
                <th className="px-5 py-3.5">Jabatan</th>
                <th className="px-5 py-3.5">Unit</th>
                <th className="px-5 py-3.5 text-center">Lama Menjabat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                    Tidak ada data pegawai yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((m, idx) => {
                  const isWarning = m.lamaNum > 3;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#005BAC] to-[#00A651] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {m.nama.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">{m.nama}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-normal min-w-[220px]">
                        {m.jabatan}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                          {m.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border shadow-xs ${
                            isWarning
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                          }`}
                        >
                          {isWarning ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          {m.lama} Tahun
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
