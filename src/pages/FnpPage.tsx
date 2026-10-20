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
import { Info, Search, FileDown, RotateCcw } from 'lucide-react';
import { FnpItem } from '../types';
import { exportToExcel } from '../services/sheetService';

interface FnpPageProps {
  fnpData: FnpItem[];
  rawStatusFnp: any[][];
  rawJenjangFnp: any[][];
  isDark: boolean;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const FnpPage: React.FC<FnpPageProps> = ({
  fnpData,
  rawStatusFnp,
  rawJenjangFnp,
  isDark,
  onShowToast,
}) => {
  const chartStatusRef = useRef<HTMLCanvasElement | null>(null);
  const chartJenjangRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstances = useRef<{ [key: string]: ChartJS | null }>({});
  const tableSectionRef = useRef<HTMLDivElement | null>(null);

  const [filterTitle, setFilterTitle] = useState('Daftar Pegawai FnP');
  const [filterSubtitle, setFilterSubtitle] = useState('Semua data Talent Ready');
  const [activeFilter, setActiveFilter] = useState<{
    status?: string;
    jenjang?: string;
  } | null>(null);
  const [searchNip, setSearchNip] = useState('');

  // 1. Process Status FnP Chart Data
  const statusChartData = useMemo(() => {
    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];

    if (rawStatusFnp && rawStatusFnp.length > 1) {
      for (let i = 1; i < rawStatusFnp.length; i++) {
        const row = rawStatusFnp[i];
        if (!row || !String(row[0] || '').trim()) continue;
        const status = String(row[0]).trim();
        const val = parseFloat(String(row[1] || '0').replace(',', '.')) || 0;

        labels.push(status);
        values.push(val);
        if (status.toUpperCase().includes('DIREKOMENDASIKAN')) {
          colors.push('#10B981'); // Emerald
        } else {
          colors.push('#EF4444'); // Rose
        }
      }
    } else {
      // Fallback compute from fnpData
      const counts: { [status: string]: { total: number; sum: number } } = {};
      fnpData.forEach(item => {
        const s = item.status || 'Lainnya';
        const num = parseFloat(item.nilai.replace(',', '.')) || 0;
        if (!counts[s]) counts[s] = { total: 0, sum: 0 };
        counts[s].total++;
        counts[s].sum += num;
      });
      Object.keys(counts).forEach(s => {
        labels.push(s);
        values.push(counts[s].total ? Math.round((counts[s].sum / counts[s].total) * 10) / 10 : 0);
        colors.push(s.toUpperCase().includes('DIREKOMENDASIKAN') ? '#10B981' : '#EF4444');
      });
    }

    return { labels, values, colors };
  }, [rawStatusFnp, fnpData]);

  // 2. Process Jenjang FnP Chart Data
  const jenjangChartData = useMemo(() => {
    const labelsJenjang: string[] = [];
    const dataDirekomendasikan: number[] = [];
    const dataDipertimbangkan: number[] = [];

    if (rawJenjangFnp && rawJenjangFnp.length > 1) {
      const headers0 = rawJenjangFnp[0] ? rawJenjangFnp[0].map(h => String(h).toUpperCase()) : [];
      const headers1 = rawJenjangFnp[1] ? rawJenjangFnp[1].map(h => String(h).toUpperCase()) : [];

      let idxRek = headers0.findIndex(
        h => h.includes('DIREKOMENDASIKAN') && !h.includes('TIDAK') && !h.includes('BELUM')
      );
      if (idxRek === -1) {
        idxRek = headers1.findIndex(
          h => h.includes('DIREKOMENDASIKAN') && !h.includes('TIDAK') && !h.includes('BELUM')
        );
      }

      let idxPer = headers0.findIndex(h => h.includes('DIPERTIMBANGKAN'));
      if (idxPer === -1) idxPer = headers1.findIndex(h => h.includes('DIPERTIMBANGKAN'));

      if (idxRek === -1) idxRek = 1;
      if (idxPer === -1) idxPer = 2;

      for (let i = 1; i < rawJenjangFnp.length; i++) {
        const row = rawJenjangFnp[i];
        if (!row || !String(row[0] || '').trim()) continue;

        const rawJenjang = String(row[0]).trim();
        if (
          rawJenjang.toUpperCase() === 'GRAND TOTAL' ||
          rawJenjang.toUpperCase() === 'JENJANG' ||
          rawJenjang.toUpperCase().includes('STATUS')
        ) {
          continue;
        }

        let jenjang = rawJenjang;
        if (rawJenjang.toUpperCase().includes('MDNPU')) jenjang = 'MDNPU';
        else if (rawJenjang.toUpperCase().includes('SPV A')) jenjang = 'SPV A';
        else if (rawJenjang.toUpperCase().includes('SPV D')) jenjang = 'SPV D';

        labelsJenjang.push(jenjang);
        dataDirekomendasikan.push(parseInt(row[idxRek]) || 0);
        dataDipertimbangkan.push(parseInt(row[idxPer]) || 0);
      }
    } else {
      // Fallback compute
      const jenjangSet = Array.from(new Set(fnpData.map(f => f.jenjang))).filter(Boolean);
      jenjangSet.forEach(j => {
        labelsJenjang.push(j);
        const rek = fnpData.filter(
          f => f.jenjang === j && f.status.toUpperCase().includes('DIREKOMENDASIKAN')
        ).length;
        const per = fnpData.filter(
          f => f.jenjang === j && !f.status.toUpperCase().includes('DIREKOMENDASIKAN')
        ).length;
        dataDirekomendasikan.push(rek);
        dataDipertimbangkan.push(per);
      });
    }

    return { labelsJenjang, dataDirekomendasikan, dataDipertimbangkan };
  }, [rawJenjangFnp, fnpData]);

  // Render Charts with Interactive Click
  useEffect(() => {
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

    Object.keys(chartInstances.current).forEach(k => {
      chartInstances.current[k]?.destroy();
      chartInstances.current[k] = null;
    });

    // 1. Chart Status
    if (chartStatusRef.current && statusChartData.labels.length > 0) {
      chartInstances.current.status = new ChartJS(chartStatusRef.current, {
        type: 'bar',
        data: {
          labels: statusChartData.labels,
          datasets: [
            {
              label: 'Rata-rata Nilai',
              data: statusChartData.values,
              backgroundColor: statusChartData.colors,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (_evt, elements) => {
            if (elements.length > 0) {
              const idx = elements[0].index;
              const statusLabel = statusChartData.labels[idx];
              setActiveFilter({ status: statusLabel });
              setFilterTitle(`Filter Status: ${statusLabel}`);
              setFilterSubtitle(`Menampilkan pegawai dengan status ${statusLabel}`);
              tableSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          },
          scales: {
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor }, grace: '20%' },
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
          },
        },
      });
    }

    // 2. Chart Jenjang (Stacked)
    if (chartJenjangRef.current && jenjangChartData.labelsJenjang.length > 0) {
      chartInstances.current.jenjang = new ChartJS(chartJenjangRef.current, {
        type: 'bar',
        data: {
          labels: jenjangChartData.labelsJenjang,
          datasets: [
            {
              label: 'DIREKOMENDASIKAN',
              data: jenjangChartData.dataDirekomendasikan,
              backgroundColor: '#10B981',
              borderRadius: 4,
            },
            {
              label: 'DIPERTIMBANGKAN',
              data: jenjangChartData.dataDipertimbangkan,
              backgroundColor: '#EF4444',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (_evt, elements) => {
            if (elements.length > 0) {
              const datasetIndex = elements[0].datasetIndex;
              const idx = elements[0].index;
              const statusClicked = datasetIndex === 0 ? 'DIREKOMENDASIKAN' : 'DIPERTIMBANGKAN';
              const jenjangClicked = jenjangChartData.labelsJenjang[idx];

              setActiveFilter({
                status: statusClicked,
                jenjang: jenjangClicked,
              });
              setFilterTitle(`Filter: Jenjang ${jenjangClicked}`);
              setFilterSubtitle(`Status: ${statusClicked}`);
              tableSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { color: textColor, font: { size: 11 } },
            },
            datalabels: {
              color: '#ffffff',
              font: { weight: 'bold', size: 10 },
              formatter: val => (val > 0 ? val : ''),
            },
          },
          scales: {
            y: { stacked: true, beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
            x: { stacked: true, grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
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
  }, [statusChartData, jenjangChartData, isDark]);

  // Filter Table Data
  const filteredData = useMemo(() => {
    return fnpData.filter(item => {
      let matchStatus = true;
      if (activeFilter?.status) {
        matchStatus = item.status.toUpperCase().includes(activeFilter.status.toUpperCase());
      }

      let matchJenjang = true;
      if (activeFilter?.jenjang) {
        const j = item.jenjang.toUpperCase();
        const clickJ = activeFilter.jenjang.toUpperCase();
        if (clickJ.includes('MDNPU') && j.includes('MDNPU')) matchJenjang = true;
        else if (clickJ.includes('SPV A') && j.includes('SPV A')) matchJenjang = true;
        else if (clickJ.includes('SPV D') && (j.includes('SPV D') || j.includes('SPVD'))) {
          matchJenjang = true;
        } else {
          matchJenjang = j.includes(clickJ) || clickJ.includes(j);
        }
      }

      let matchSearch = true;
      if (searchNip.trim()) {
        const q = searchNip.toLowerCase();
        matchSearch =
          item.nip.toLowerCase().includes(q) ||
          item.nama.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q);
      }

      return matchStatus && matchJenjang && matchSearch;
    });
  }, [fnpData, activeFilter, searchNip]);

  const handleResetFilter = () => {
    setActiveFilter(null);
    setSearchNip('');
    setFilterTitle('Daftar Pegawai FnP');
    setFilterSubtitle('Semua data Talent Ready');
    onShowToast('Filter FnP berhasil direset', 'info');
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      onShowToast('Data FnP kosong', 'error');
      return;
    }
    const headers = [
      'No',
      'NIP',
      'Nama',
      'Jabatan Saat Ini',
      'Unit',
      'Jenjang Proyeksi',
      'Jabatan Proyeksi',
      'Nilai',
      'Status',
      'Tanggal',
    ];
    const rows = filteredData.map((m, idx) => [
      idx + 1,
      m.nip,
      m.nama,
      m.jabatan,
      m.unit,
      m.jenjang,
      m.jabatanProyeksi,
      m.nilai,
      m.status,
      m.tanggal,
    ]);
    exportToExcel('Data_Pegawai_FnP.xlsx', 'Talent_Ready_FnP', headers, rows);
    onShowToast('Berhasil mengunduh Excel Data FnP', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 flex items-center gap-3">
        <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-teal-800 dark:text-teal-300 font-medium leading-relaxed">
          Monitoring evaluasi Fit and Proper (FnP) berdasarkan Status dan Jenjang Proyeksi. Klik batang
          grafik untuk memfilter data pada tabel di bawah.
        </p>
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
            Perbandingan Rata-rata Nilai Evaluasi Berdasarkan Status
          </h3>
          <div className="h-72 w-full">
            <canvas ref={chartStatusRef} className="cursor-pointer" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
            Distribusi Talent Ready Berdasarkan Jenjang Proyeksi & Status
          </h3>
          <div className="h-72 w-full">
            <canvas ref={chartJenjangRef} className="cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div
        ref={tableSectionRef}
        className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">{filterTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {filterSubtitle} ({filteredData.length} pegawai)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search by NIP / Nama */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari NIP, nama, atau unit..."
                value={searchNip}
                onChange={e => setSearchNip(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
              />
            </div>

            {/* Reset */}
            {(activeFilter || searchNip) && (
              <button
                onClick={handleResetFilter}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-[500px] custom-scrollbar shadow-inner">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5 font-mono">NIP</th>
                <th className="px-4 py-3.5">Nama</th>
                <th className="px-4 py-3.5">Jabatan Saat Ini</th>
                <th className="px-4 py-3.5">Unit</th>
                <th className="px-4 py-3.5">Jenjang Proyeksi</th>
                <th className="px-4 py-3.5">Jabatan Proyeksi</th>
                <th className="px-4 py-3.5 text-center">Nilai</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400 font-medium">
                    Tidak ada data pegawai FnP yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredData.map((m, idx) => {
                  const isRek = m.status.toUpperCase().includes('DIREKOMENDASIKAN');
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {m.nip}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-white">{m.nama}</td>
                      <td className="px-4 py-3.5 whitespace-normal min-w-[200px]">{m.jabatan}</td>
                      <td className="px-4 py-3.5">{m.unit}</td>
                      <td className="px-4 py-3.5 font-medium">{m.jenjang}</td>
                      <td className="px-4 py-3.5 whitespace-normal min-w-[200px]">
                        {m.jabatanProyeksi}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-900 dark:text-white">
                        {m.nilai}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs ${
                            isRek
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{m.tanggal}</td>
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
