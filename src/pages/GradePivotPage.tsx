import React, { useState, useMemo } from 'react';
import { Table as TableIcon, Filter, FileDown, AlertTriangle } from 'lucide-react';
import { GradePivotRaw } from '../types';
import { exportToExcel } from '../services/sheetService';

interface GradePivotPageProps {
  gradeData: GradePivotRaw[];
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const GradePivotPage: React.FC<GradePivotPageProps> = ({ gradeData, onShowToast }) => {
  const [currentTab, setCurrentTab] = useState<'Generalis' | 'Fungsional' | 'Struktural'>('Generalis');
  const [filterH, setFilterH] = useState('all');

  // Extract unique values for Filter Dropdown from Kategori H
  const uniqueOptionsH = useMemo(() => {
    const set = new Set<string>();
    gradeData.forEach(item => {
      if (item.kategoriH && item.kategoriH !== '(Kosong)') {
        set.add(item.kategoriH);
      }
    });
    return Array.from(set).sort();
  }, [gradeData]);

  // Compute Pivot Matrix
  const { cols, sortedM, pivotData, grandTotalCols, absoluteTotal } = useMemo(() => {
    const filtered = gradeData.filter(item => {
      // Tab filter
      const matchTab = item.kategoriTab.toUpperCase().includes(currentTab.toUpperCase());
      if (!matchTab) return false;

      // Dropdown filter H
      if (filterH !== 'all' && item.kategoriH !== filterH) return false;

      return true;
    });

    const colsSet = new Set<string>();
    const data: { [m: string]: { [d: string]: { [e: string]: number } } } = {};

    filtered.forEach(r => {
      const valM = r.gradeLevel || '(Kosong)';
      const valD = r.gradePegawai || '(Kosong)';
      const valE = r.posisiGrade || '(Kosong)';
      const valB = r.countVal;

      colsSet.add(valE);

      if (!data[valM]) data[valM] = {};
      if (!data[valM][valD]) data[valM][valD] = {};
      if (!data[valM][valD][valE]) data[valM][valD][valE] = 0;

      if (valB !== '') {
        data[valM][valD][valE]++;
      }
    });

    const sortedCols = Array.from(colsSet).sort();
    const sortedLevels = Object.keys(data).sort();

    const totalsCols: { [col: string]: number } = {};
    sortedCols.forEach(c => {
      totalsCols[c] = 0;
    });

    let absTotal = 0;

    sortedLevels.forEach(m => {
      Object.keys(data[m]).forEach(d => {
        sortedCols.forEach(c => {
          const count = data[m][d][c] || 0;
          totalsCols[c] += count;
          absTotal += count;
        });
      });
    });

    return {
      cols: sortedCols,
      sortedM: sortedLevels,
      pivotData: data,
      grandTotalCols: totalsCols,
      absoluteTotal: absTotal,
    };
  }, [gradeData, currentTab, filterH]);

  const handleExport = () => {
    if (sortedM.length === 0) {
      onShowToast('Tabel pivot kosong', 'error');
      return;
    }

    const headers = ['Grade Level (Kolom M)', 'Kategori/Profesi (Kolom D)', ...cols, 'Grand Total'];
    const rows: (string | number)[][] = [];

    sortedM.forEach(m => {
      const sortedD = Object.keys(pivotData[m]).sort();
      sortedD.forEach(d => {
        let rowSum = 0;
        const cellVals = cols.map(c => {
          const cnt = pivotData[m][d][c] || 0;
          rowSum += cnt;
          return cnt > 0 ? cnt : 0;
        });
        rows.push([m, d, ...cellVals, rowSum]);
      });
    });

    // Add bottom total
    const bottomTotals = cols.map(c => grandTotalCols[c] || 0);
    rows.push(['TOTAL KESELURUHAN', '', ...bottomTotals, absoluteTotal]);

    exportToExcel(`Monev_Grade_${currentTab}.xlsx`, currentTab, headers, rows);
    onShowToast(`Berhasil mengunduh pivot table Monev Grade ${currentTab}`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        {/* Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-[#005BAC] dark:text-[#00C4CC]" />
              <span>Pivot Table Monev Grade</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Analisa sebaran pegawai (Count) berdasarkan Grade Level, Kategori Profesi, dan Posisi Grade.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <Filter className="w-4 h-4 text-[#00A651]" />
              <label htmlFor="filterGrade" className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Kategori (H):
              </label>
              <select
                id="filterGrade"
                value={filterH}
                onChange={e => setFilterH(e.target.value)}
                className="bg-transparent border-0 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Kategori (Kolom H)</option>
                {uniqueOptionsH.map(val => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>

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

        {/* Tab Selection */}
        <div className="border-b border-slate-200 dark:border-slate-800 mb-6 flex items-center justify-between">
          <ul className="flex flex-wrap -mb-px text-sm font-semibold text-center text-slate-500 dark:text-slate-400">
            {(['Generalis', 'Fungsional', 'Struktural'] as const).map(tab => (
              <li key={tab} className="mr-2">
                <button
                  onClick={() => setCurrentTab(tab)}
                  className={`inline-block py-3 px-5 border-b-2 rounded-t-lg transition-all text-xs sm:text-sm ${
                    currentTab === tab
                      ? 'text-[#005BAC] border-[#005BAC] dark:text-[#00C4CC] dark:border-[#00C4CC] font-bold bg-[#005BAC]/5'
                      : 'border-transparent hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden sm:flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-semibold pb-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-xs" />
            <span>Merah: Anomali Grade (PeG &gt; PoG)</span>
          </div>
        </div>

        {/* Pivot Grid Table */}
        <div className="overflow-x-auto overflow-y-auto border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs max-h-[580px] custom-scrollbar">
          <table className="w-full text-xs text-left text-slate-800 dark:text-slate-200 border-collapse">
            <thead className="text-[11px] uppercase sticky top-0 shadow-sm z-20 bg-slate-200 dark:bg-slate-750 font-bold border-b border-slate-300 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 border border-slate-300 dark:border-slate-700 min-w-[140px] text-center font-bold">
                  Grade Level <br />
                  <span className="text-[10px] text-slate-500 font-normal">(Kolom M)</span>
                </th>
                <th className="px-4 py-3 border border-slate-300 dark:border-slate-700 min-w-[190px] text-center font-bold">
                  Kategori/Profesi <br />
                  <span className="text-[10px] text-slate-500 font-normal">(Kolom D)</span>
                </th>
                {cols.map(c => (
                  <th
                    key={c}
                    className="px-4 py-3 border border-slate-300 dark:border-slate-700 text-center font-bold whitespace-nowrap min-w-[70px]"
                  >
                    {c}
                  </th>
                ))}
                <th className="px-4 py-3 border border-slate-300 dark:border-slate-700 text-center font-black text-[#005BAC] dark:text-[#00C4CC] min-w-[100px] bg-slate-300 dark:bg-slate-700">
                  Grand Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
              {sortedM.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 3} className="text-center py-10 text-slate-400 font-medium">
                    Tidak ada data pegawai untuk kategori {currentTab}.
                  </td>
                </tr>
              ) : (
                sortedM.map(m => {
                  const sortedD = Object.keys(pivotData[m]).sort();
                  return sortedD.map((d, dIdx) => {
                    let rowTotal = 0;
                    const valDNum = parseInt(d);

                    return (
                      <tr
                        key={`${m}-${d}`}
                        className="hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors bg-white dark:bg-slate-850"
                      >
                        {dIdx === 0 && (
                          <td
                            rowSpan={sortedD.length}
                            className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 font-extrabold bg-slate-50 dark:bg-slate-800 align-top text-center text-slate-800 dark:text-white"
                          >
                            {m}
                          </td>
                        )}
                        <td className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {d}
                        </td>
                        {cols.map(c => {
                          const count = pivotData[m][d][c] || 0;
                          rowTotal += count;
                          const valENum = parseInt(c);
                          const isAnomaly =
                            !isNaN(valDNum) && !isNaN(valENum) && valDNum > valENum && count > 0;

                          return (
                            <td
                              key={c}
                              className={`px-3 py-2.5 border border-slate-300 dark:border-slate-700 text-center font-medium ${
                                isAnomaly
                                  ? 'bg-rose-100 text-rose-800 font-black dark:bg-rose-950/70 dark:text-rose-300 shadow-inner'
                                  : count > 0
                                  ? 'font-bold text-slate-900 dark:text-white'
                                  : 'text-slate-400 dark:text-slate-600'
                              }`}
                            >
                              {count > 0 ? count : '-'}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-center font-black bg-slate-50 dark:bg-slate-800 text-[#005BAC] dark:text-[#00C4CC]">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  });
                })
              )}

              {/* Bottom Grand Total Row */}
              {sortedM.length > 0 && (
                <tr className="font-extrabold bg-slate-200 dark:bg-slate-750 uppercase text-[11px] tracking-wider border-t-2 border-slate-400 dark:border-slate-600">
                  <td
                    colSpan={2}
                    className="px-4 py-3.5 border border-slate-300 dark:border-slate-700 text-right text-slate-900 dark:text-white"
                  >
                    Total Keseluruhan
                  </td>
                  {cols.map(c => (
                    <td
                      key={c}
                      className="px-3 py-3.5 border border-slate-300 dark:border-slate-700 text-center text-[#005BAC] dark:text-[#00C4CC] font-black"
                    >
                      {grandTotalCols[c] || 0}
                    </td>
                  ))}
                  <td className="px-4 py-3.5 border border-slate-300 dark:border-slate-700 text-center text-sm font-black text-[#005BAC] dark:text-[#00C4CC] bg-slate-300 dark:bg-slate-700">
                    {absoluteTotal}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
