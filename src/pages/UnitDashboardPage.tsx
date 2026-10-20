import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  BarController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Users,
  AlertTriangle,
  PieChart as PieIcon,
  GraduationCap,
  Building2,
  Clock,
  Layers,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  Filter,
  X,
  History,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';
import { Employee, FTKItem, FnpItem, KalijabatItem, BoxTalentItem, MonitoringFjItem, HistoryItem, PageId } from '../types';
import { exportToExcel, parseHistoryFromRjab, parseHistoryDirectFromRjab } from '../services/sheetService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  BarController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface UnitDashboardPageProps {
  unitCode: 'tjk' | 'mtr' | 'ktb' | 'psw' | 'up2k' | 'up2d';
  unitName: string;
  subView: 'dashboard' | 'ftk' | 'monitoringfj' | 'assesment' | 'lamajabat' | 'kalijabat' | 'box';
  employees: Employee[];
  ftkData: FTKItem[];
  fnpData: FnpItem[];
  allKalijabatItems: { [key: string]: KalijabatItem[] };
  boxTalentData?: BoxTalentItem[];
  monitoringFjData?: MonitoringFjItem[];
  rawRjab?: any[][];
  rawRjabA?: any[][];
  rawRjabMul?: any[][];
  rawRjabMsb?: any[][];
  isDark: boolean;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const UnitDashboardPage: React.FC<UnitDashboardPageProps> = ({
  unitCode,
  unitName,
  subView,
  employees,
  ftkData,
  fnpData,
  allKalijabatItems,
  boxTalentData = [],
  monitoringFjData = [],
  rawRjab = [],
  rawRjabA = [],
  rawRjabMul = [],
  rawRjabMsb = [],
  isDark,
  onShowToast,
}) => {
  const chartUnitRef = useRef<HTMLCanvasElement | null>(null);
  const chartUsiaRef = useRef<HTMLCanvasElement | null>(null);
  const chartPendidikanRef = useRef<HTMLCanvasElement | null>(null);
  const chartKaliJabatRef = useRef<HTMLCanvasElement | null>(null);
  const chartKaliJabatKatRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstances = useRef<{ [key: string]: ChartJS | null }>({});
  const [kalijabatUnitFilter, setKalijabatUnitFilter] = useState<string>('all');
  const detailHistoryRef = useRef<HTMLDivElement | null>(null);
  const [selectedKalijabatHistory, setSelectedKalijabatHistory] = useState<{
    nama: string;
    unit: string;
    jabatan: string;
    kali: number;
    jenis: string;
    history: string[];
    parsedHistory?: HistoryItem[];
  } | null>(null);

  useEffect(() => {
    if (selectedKalijabatHistory && detailHistoryRef.current) {
      detailHistoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedKalijabatHistory]);

  const [boxSearch, setBoxSearch] = useState<string>('');
  const [boxUnitFilter, setBoxUnitFilter] = useState<string>('all');
  const [boxBoxFilter, setBoxBoxFilter] = useState<string>('all');

  const [monitoringFjSearch, setMonitoringFjSearch] = useState<string>('');
  const [monitoringFjUnitFilter, setMonitoringFjUnitFilter] = useState<string>('all');
  const [monitoringFjJenjangFilter, setMonitoringFjJenjangFilter] = useState<string>('all');

  // Helper matcher
  const matchUnit = useMemo(() => {
    return (text: string) => {
      const u = String(text || '').toLowerCase();
      if (unitCode === 'tjk') {
        return (
          u.includes('tanjung karang') ||
          u.includes('tanjungkarang') ||
          u.includes('tjg karang') ||
          u.includes('tj. karang') ||
          u.includes('tjk') ||
          u.includes('kalianda') ||
          (u.includes('karang') && u.includes('ulp')) ||
          u.includes('natar') ||
          u.includes('sidomulyo') ||
          u.includes('sutami') ||
          u.includes('teluk betung') ||
          u.includes('t. betung') ||
          u.includes('telukbetung') ||
          u.includes('way halim') ||
          u.includes('wayhalim')
        );
      }
      if (unitCode === 'mtr') {
        return (
          u.includes('metro') ||
          u.includes('rumbia') ||
          u.includes('bandar jaya') ||
          u.includes('bandarjaya') ||
          u.includes('bd jaya') ||
          u.includes('sukadana') ||
          u.includes('sribhawono') ||
          u.includes('sribawono')
        );
      }
      if (unitCode === 'ktb') {
        return (
          u.includes('kotabumi') ||
          u.includes('kota bumi') ||
          u.includes('ktb') ||
          u.includes('bukit kemuning') ||
          u.includes('kemuning') ||
          u.includes('kmuning') ||
          u.includes('bkt kmuning') ||
          u.includes('blambangan umpu') ||
          u.includes('blambangan') ||
          u.includes('blmbgn') ||
          u.includes('umpu') ||
          u.includes('bumi abung') ||
          u.includes('abung') ||
          u.includes('pulung kencana') ||
          u.includes('pulung') ||
          u.includes('menggala') ||
          u.includes('mesuji')
        );
      }
      if (unitCode === 'psw') {
        const uClean = u.replace(/\s+/g, '');
        return (
          uClean.includes('pringsewu') ||
          uClean.includes('pringsew') ||
          uClean.includes('psw') ||
          uClean.includes('talangpadang') ||
          uClean.includes('kalirejo') ||
          uClean.includes('liwa') ||
          uClean.includes('kotaagung') ||
          u.includes('pring') ||
          u.includes('talang') ||
          u.includes('padang') ||
          u.includes('kalirejo') ||
          u.includes('liwa') ||
          u.includes('agung')
        );
      }
      if (unitCode === 'up2k') return u.includes('up2k');
      if (unitCode === 'up2d') return u.includes('up2d');
      return false;
    };
  }, [unitCode]);

  // Filter Employees for this unit (using Column N if available, or unit)
  const unitEmployees = useMemo(() => {
    return employees.filter(emp => matchUnit(emp.unitKolomN || emp.unit));
  }, [employees, matchUnit]);

  // Statistics
  const stats = useMemo(() => {
    let pensiunCount = 0;
    const unitDist: { [key: string]: number } = {};
    const pendDist: { [key: string]: number } = {};
    const usiaDist: { [key: string]: number } = {};
    const ewsList: { nama: string; unit: string; masa: number; usia: number }[] = [];
    const pensiunList: { nip: string; nama: string; jabatan: string; unit: string; tahunPensiun: number }[] = [];

    const breakdownTJK: { [key: string]: number } = {
      up3: 0,
      kld: 0,
      krg: 0,
      ntr: 0,
      sdm: 0,
      stm: 0,
      tbt: 0,
      whm: 0,
    };

    const breakdownMTR: { [key: string]: number } = {
      up3: 0,
      ktm: 0,
      rmb: 0,
      bdj: 0,
      skd: 0,
      sbw: 0,
    };

    const breakdownKTB: { [key: string]: number } = {
      up3: 0,
      bkm: 0,
      bmu: 0,
      bma: 0,
      pkc: 0,
      mgl: 0,
      msj: 0,
    };

    const breakdownPSW: { [key: string]: number } = {
      up3: 0,
      psw: 0,
      tpd: 0,
      klr: 0,
      lwa: 0,
      kta: 0,
    };

    if (unitCode === 'psw') {
      unitDist['UP3 PRINGSEWU'] = 0;
      unitDist['ULP PRINGSEWU'] = 0;
      unitDist['ULP TALANG PADANG'] = 0;
      unitDist['ULP KALIREJO'] = 0;
      unitDist['ULP LIWA'] = 0;
      unitDist['ULP KOTA AGUNG'] = 0;
    }

    unitEmployees.forEach(emp => {
      const uStr = (emp.unitKolomN || emp.unit).toLowerCase();
      let displayUnit = emp.unitKolomN || emp.unit;

      if (unitCode === 'psw') {
        const uClean = displayUnit.toLowerCase().replace(/\s+/g, '');
        if (uClean.includes('talang') || uClean.includes('padang')) displayUnit = 'ULP TALANG PADANG';
        else if (uClean.includes('kalirejo')) displayUnit = 'ULP KALIREJO';
        else if (uClean.includes('liwa')) displayUnit = 'ULP LIWA';
        else if (uClean.includes('kotaagung') || uClean.includes('agung')) displayUnit = 'ULP KOTA AGUNG';
        else if (uClean.includes('ulp') && (uClean.includes('pring') || uClean.includes('psw'))) displayUnit = 'ULP PRINGSEWU';
        else if (uClean.includes('pring') || uClean.includes('psw')) displayUnit = 'UP3 PRINGSEWU';
      }

      if (emp.usia === 55) {
        pensiunCount++;
        pensiunList.push({
          nip: emp.nip || '-',
          nama: emp.nama,
          jabatan: emp.jabatan || '-',
          unit: displayUnit,
          tahunPensiun: new Date().getFullYear() + 1,
        });
      }

      unitDist[displayUnit] = (unitDist[displayUnit] || 0) + 1;
      if (emp.pendidikan && emp.pendidikan !== 'Unknown') {
        pendDist[emp.pendidikan] = (pendDist[emp.pendidikan] || 0) + 1;
      }
      if (emp.kelompokUsia && emp.kelompokUsia !== 'Unknown') {
        usiaDist[emp.kelompokUsia] = (usiaDist[emp.kelompokUsia] || 0) + 1;
      }

      // EWS Mutasi logic: masa > 4 tahun and usia 25-50
      if (emp.masaJabatanNum > 4 && emp.usia >= 25 && emp.usia <= 50) {
        ewsList.push({
          nama: emp.nama,
          unit: displayUnit,
          masa: emp.masaJabatanNum,
          usia: emp.usia,
        });
      }

      // TJK Specific Breakdown
      if (unitCode === 'tjk') {
        if (uStr.includes('kalianda')) breakdownTJK.kld++;
        else if (uStr.includes('karang') && uStr.includes('ulp')) breakdownTJK.krg++;
        else if (uStr.includes('natar')) breakdownTJK.ntr++;
        else if (uStr.includes('sidomulyo')) breakdownTJK.sdm++;
        else if (uStr.includes('sutami')) breakdownTJK.stm++;
        else if (uStr.includes('teluk') || uStr.includes('t. betung')) breakdownTJK.tbt++;
        else if (uStr.includes('way')) breakdownTJK.whm++;
        else breakdownTJK.up3++;
      }

      // MTR Specific Breakdown (UP3 METRO, ULP KOTA METRO, ULP RUMBIA, ULP BANDAR JAYA, ULP SUKADANA, ULP SRIBHAWONO)
      if (unitCode === 'mtr') {
        if (uStr.includes('rumbia')) breakdownMTR.rmb++;
        else if (uStr.includes('bandar jaya') || uStr.includes('bandarjaya') || uStr.includes('bd jaya')) breakdownMTR.bdj++;
        else if (uStr.includes('sukadana')) breakdownMTR.skd++;
        else if (uStr.includes('sribhawono') || uStr.includes('sribawono')) breakdownMTR.sbw++;
        else if (uStr.includes('kota metro') || (uStr.includes('metro') && uStr.includes('ulp'))) breakdownMTR.ktm++;
        else breakdownMTR.up3++;
      }

      // KTB Specific Breakdown (UP3 KOTABUMI, ULP BUKIT KEMUNING, ULP BLAMBANGAN UMPU, ULP BUMI ABUNG, ULP PULUNG KENCANA, ULP MENGGALA, ULP MESUJI)
      if (unitCode === 'ktb') {
        if (uStr.includes('kemuning')) breakdownKTB.bkm++;
        else if (uStr.includes('blambangan') || uStr.includes('umpu')) breakdownKTB.bmu++;
        else if (uStr.includes('bumi abung') || uStr.includes('abung')) breakdownKTB.bma++;
        else if (uStr.includes('pulung')) breakdownKTB.pkc++;
        else if (uStr.includes('menggala')) breakdownKTB.mgl++;
        else if (uStr.includes('mesuji')) breakdownKTB.msj++;
        else breakdownKTB.up3++;
      }

      // PSW Specific Breakdown (UP3 PRINGSEWU, ULP PRINGSEWU, ULP TALANG PADANG, ULP KALIREJO, ULP LIWA, ULP KOTA AGUNG)
      if (unitCode === 'psw') {
        if (displayUnit === 'ULP TALANG PADANG') breakdownPSW.tpd++;
        else if (displayUnit === 'ULP KALIREJO') breakdownPSW.klr++;
        else if (displayUnit === 'ULP LIWA') breakdownPSW.lwa++;
        else if (displayUnit === 'ULP KOTA AGUNG') breakdownPSW.kta++;
        else if (displayUnit === 'ULP PRINGSEWU') breakdownPSW.psw++;
        else breakdownPSW.up3++;
      }
    });

    const topPend =
      Object.keys(pendDist).reduce((a, b) => (pendDist[a] > pendDist[b] ? a : b), '-') || '-';

    return {
      total: unitEmployees.length,
      pensiunCount,
      topPend,
      unitDist,
      usiaDist,
      pendDist,
      ewsList: ewsList.sort((a, b) => b.masa - a.masa),
      breakdownTJK,
      breakdownMTR,
      breakdownKTB,
      breakdownPSW,
      pensiunList,
    };
  }, [unitEmployees, unitCode]);

  // Unit FTK Data
  const unitFTK = useMemo(() => {
    return ftkData.filter(d => matchUnit(d.unit));
  }, [ftkData, matchUnit]);

  // Main FTK Percentage
  const mainFTK = useMemo(() => {
    return (
      unitFTK.find(
        d =>
          d.unit.toLowerCase().includes('total up3 pringsewu') ||
          d.unit.toLowerCase().includes('total up3 psw') ||
          d.unit.toLowerCase().includes('total pringsewu') ||
          d.unit.toLowerCase().includes('up3 pringsewu') ||
          d.unit.toLowerCase().includes(`total ${unitName.toLowerCase()}`) ||
          d.unit.toLowerCase().includes(`total up3 ${unitCode}`) ||
          d.unit.toLowerCase() === unitName.toLowerCase()
      ) || unitFTK[0]
    );
  }, [unitFTK, unitName, unitCode]);

  // Unit FnP Data
  const unitFnP = useMemo(() => {
    return fnpData
      .filter(d => {
        const emp = employees.find(
          e => (e.nip && e.nip === d.nip) || (e.nama && e.nama.toUpperCase() === d.nama.toUpperCase())
        );
        const empUnit = emp ? (emp.unitKolomN || emp.unit) : '';
        return (
          matchUnit(d.unit) ||
          (empUnit && matchUnit(empUnit)) ||
          matchUnit(d.jabatanSaatIni || '') ||
          matchUnit(d.jabatan || '')
        );
      })
      .map(d => {
        const emp = employees.find(
          e => (e.nip && e.nip === d.nip) || (e.nama && e.nama.toUpperCase() === d.nama.toUpperCase())
        );
        const empUnit = emp ? (emp.unitKolomN || emp.unit) : '';
        let displayUnit = (d.unit && d.unit !== '#ERROR!') ? d.unit : (empUnit || '-');

        const uCheck = (displayUnit + ' ' + empUnit + ' ' + (d.jabatanSaatIni || d.jabatan || '')).toLowerCase().replace(/\s+/g, '');
        if (uCheck.includes('kemuning') || uCheck.includes('kmuning')) displayUnit = 'ULP BUKIT KEMUNING';
        else if (uCheck.includes('blambangan') || uCheck.includes('blmbgn') || uCheck.includes('umpu')) displayUnit = 'ULP BLAMBANGAN UMPU';
        else if (uCheck.includes('bumiabung') || uCheck.includes('abung')) displayUnit = 'ULP BUMI ABUNG';
        else if (uCheck.includes('pulung')) displayUnit = 'ULP PULUNG KENCANA';
        else if (uCheck.includes('menggala')) displayUnit = 'ULP MENGGALA';
        else if (uCheck.includes('mesuji')) displayUnit = 'ULP MESUJI';
        else if (uCheck.includes('kotabumi') || uCheck.includes('ktb')) displayUnit = 'UP3 KOTABUMI';
        else if (uCheck.includes('talang') || uCheck.includes('padang')) displayUnit = 'ULP TALANG PADANG';
        else if (uCheck.includes('kalirejo')) displayUnit = 'ULP KALIREJO';
        else if (uCheck.includes('liwa')) displayUnit = 'ULP LIWA';
        else if (uCheck.includes('kotaagung') || uCheck.includes('agung')) displayUnit = 'ULP KOTA AGUNG';
        else if (uCheck.includes('ulp') && (uCheck.includes('pring') || uCheck.includes('psw'))) displayUnit = 'ULP PRINGSEWU';
        else if (uCheck.includes('pring') || uCheck.includes('psw')) displayUnit = 'UP3 PRINGSEWU';

        return {
          ...d,
          unit: displayUnit,
        };
      });
  }, [fnpData, matchUnit, employees]);

  // Unit Managerial Tenure (Mobility)
  const unitMobility = useMemo(() => {
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
    return unitEmployees
      .filter(emp => {
        const j = emp.jabatan.toLowerCase();
        return targetJabatans.some(tj => j.includes(tj));
      })
      .sort((a, b) => (b.masaJabatanNum || 0) - (a.masaJabatanNum || 0));
  }, [unitEmployees]);

  // Unit Kali Jabat
  const unitKaliJabat = useMemo(() => {
    const combined: {
      nama: string;
      unit: string;
      jabatan: string;
      kali: number;
      jenis: string;
      jenisKey: string;
      history: string[];
    }[] = [];

    // Map nama pegawai ke Nama Unit dari sheet 'data pegawai' Kolom N (unitKolomN)
    const empUnitMap = new Map<string, string>();
    employees.forEach(emp => {
      if (emp.nama) {
        empUnitMap.set(emp.nama.toUpperCase().trim(), emp.unitKolomN || emp.unit);
      }
    });

    const sources = [
      { key: 'spvd', label: 'SPVD' },
      { key: 'spva_npu', label: 'SPVA NPU' },
      { key: 'spva_pu', label: 'SPVA PU' },
      { key: 'mdnpu', label: 'MDNPU' },
    ];

    sources.forEach(src => {
      const items = allKalijabatItems[src.key] || [];
      items.forEach(item => {
        const itemNamaKey = item.nama.toUpperCase().trim();
        const namaUnit = empUnitMap.get(itemNamaKey) || item.unit;
        if (matchUnit(item.unit) || matchUnit(namaUnit)) {
          combined.push({
            nama: item.nama,
            unit: namaUnit,
            jabatan: item.jabatan,
            kali: item.kali,
            jenis: src.label,
            jenisKey: src.key,
            history: item.history || [],
          });
        }
      });
    });

    return combined.sort((a, b) => b.kali - a.kali);
  }, [allKalijabatItems, matchUnit, employees]);

  const handleSelectKalijabatEmployee = (d: {
    nama: string;
    unit: string;
    jabatan: string;
    kali: number;
    jenis: string;
    jenisKey: string;
    history: string[];
  }) => {
    let rData = rawRjab || [];
    if (d.jenisKey === 'spvd') rData = rawRjab || [];
    if (d.jenisKey === 'spva_npu') rData = rawRjabA || [];
    if (d.jenisKey === 'spva_pu') rData = rawRjabMul || [];
    if (d.jenisKey === 'mdnpu') rData = rawRjabMsb || [];

    const fallbacks = [rawRjab, rawRjabA, rawRjabMul, rawRjabMsb].filter(s => s && s !== rData);

    // Prioritize direct 1-to-1 row lookup from Google Sheets RJAB sheet
    let parsedHistory = parseHistoryDirectFromRjab(rData, d.nama, fallbacks);

    // Fall back to title/posId lookup if direct history returned no rows
    if (!parsedHistory || parsedHistory.length === 0) {
      if (d.history && d.history.length > 0) {
        parsedHistory = parseHistoryFromRjab(rData, d.nama, d.history, fallbacks, d.unit);
      }
    }

    // Ensure fallback unit is d.unit if item.unit is empty or '-'
    parsedHistory = parsedHistory.map(item => ({
      ...item,
      unit: item.unit && item.unit !== '-' && item.unit !== 'null' && item.unit !== 'undefined' ? item.unit : (d.unit || '-'),
    }));

    // If direct history has fewer items than d.kali, pad with d.history / defaults to ensure row count equals d.kali
    if (parsedHistory.length < d.kali) {
      const existingTitles = parsedHistory.map(p => p.jabatan.toLowerCase().trim());
      const remainingHistory = (d.history || []).filter(h => !existingTitles.includes(h.toLowerCase().trim()));

      for (const hTitle of remainingHistory) {
        if (parsedHistory.length >= d.kali) break;
        parsedHistory.push({
          urutan: parsedHistory.length + 1,
          namaPegawai: d.nama,
          jabatan: hTitle,
          unit: d.unit || '-',
          startDate: '-',
          endDate: '-',
        });
      }
      while (parsedHistory.length < d.kali) {
        parsedHistory.push({
          urutan: parsedHistory.length + 1,
          namaPegawai: d.nama,
          jabatan: d.jabatan || 'Jabatan',
          unit: d.unit || '-',
          startDate: '-',
          endDate: '-',
        });
      }
    } else if (parsedHistory.length > d.kali && d.kali > 0) {
      parsedHistory = parsedHistory.slice(0, d.kali);
    }

    setSelectedKalijabatHistory({
      nama: d.nama,
      unit: d.unit,
      jabatan: d.jabatan,
      kali: d.kali,
      jenis: d.jenis,
      history: d.history || [],
      parsedHistory,
    });

    setTimeout(() => {
      detailHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const displayHistoryList = useMemo(() => {
    if (!selectedKalijabatHistory) return [];

    const parseDate = (d: string): number => {
      if (!d || d === '-' || d === 'null' || d === 'undefined') return 0;
      const s = String(d).trim();
      if (!s || s === '-') return 0;

      // Numeric Excel serial date
      if (/^\d{5}(\.\d+)?$/.test(s)) {
        const num = parseFloat(s);
        const date = new Date(Math.round((num - 25569) * 86400 * 1000));
        return isNaN(date.getTime()) ? 0 : date.getTime();
      }

      const months: { [key: string]: number } = {
        jan: 1, januari: 1, feb: 2, februari: 2, mar: 3, maret: 3, apr: 4, april: 4,
        mei: 5, jun: 6, juni: 6, jul: 7, juli: 7, agu: 8, agustus: 8, sep: 9, september: 9,
        okt: 10, oktober: 10, nov: 11, november: 11, des: 12, desember: 12
      };

      const clean = s.toLowerCase();
      for (const [mName, mNum] of Object.entries(months)) {
        if (clean.includes(mName)) {
          const yearMatch = clean.match(/\b(19\d\d|20\d\d)\b/);
          if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            const dayMatch = clean.match(/\b([0-2]?\d|3[01])\b/);
            const day = dayMatch ? parseInt(dayMatch[1]) : 1;
            return new Date(year, mNum - 1, day).getTime();
          }
        }
      }

      const p = s.split(/[-/. ]+/);

      if (p.length === 3) {
        if (/^\d{4}$/.test(p[2])) {
          const year = parseInt(p[2]);
          const month = parseInt(p[1]) || 1;
          const day = parseInt(p[0]) || 1;
          return new Date(year, month - 1, day).getTime();
        }
        if (/^\d{4}$/.test(p[0])) {
          const year = parseInt(p[0]);
          const month = parseInt(p[1]) || 1;
          const day = parseInt(p[2]) || 1;
          return new Date(year, month - 1, day).getTime();
        }
      }

      if (p.length === 2) {
        if (/^\d{4}$/.test(p[1])) {
          const year = parseInt(p[1]);
          const month = parseInt(p[0]) || 1;
          return new Date(year, month - 1, 1).getTime();
        }
        if (/^\d{4}$/.test(p[0])) {
          const year = parseInt(p[0]);
          const month = parseInt(p[1]) || 1;
          return new Date(year, month - 1, 1).getTime();
        }
      }

      const yearMatch = s.match(/\b(19\d\d|20\d\d)\b/);
      if (yearMatch) {
        return new Date(parseInt(yearMatch[1]), 0, 1).getTime();
      }

      const parsed = Date.parse(s);
      return isNaN(parsed) ? 0 : parsed;
    };

    let list: HistoryItem[] = [];
    if (selectedKalijabatHistory.parsedHistory && selectedKalijabatHistory.parsedHistory.length > 0) {
      list = [...selectedKalijabatHistory.parsedHistory];
    } else {
      list = (selectedKalijabatHistory.history || []).map((j, idx) => ({
        urutan: idx + 1,
        jabatan: j,
        unit: '-',
        startDate: '-',
        endDate: '-',
      }));
    }

    // Ensure list count strictly matches selectedKalijabatHistory.kali
    const targetKali = selectedKalijabatHistory.kali || 0;
    if (targetKali > 0) {
      if (list.length < targetKali) {
        const missingCount = targetKali - list.length;
        for (let i = 0; i < missingCount; i++) {
          list.push({
            urutan: list.length + 1,
            jabatan: selectedKalijabatHistory.jabatan || 'Jabatan',
            unit: '-',
            startDate: '-',
            endDate: '-',
          });
        }
      } else if (list.length > targetKali) {
        list = list.slice(0, targetKali);
      }
    }

    const sorted = list.sort((a, b) => {
      const timeA = parseDate(a.startDate);
      const timeB = parseDate(b.startDate);
      if (timeA > 0 && timeB > 0) {
        return timeB - timeA; // Descending by start date (newest first)
      }
      if (timeA > 0) return -1;
      if (timeB > 0) return 1;
      return 0;
    });

    return sorted.map((item, idx) => ({
      ...item,
      urutan: idx + 1,
    }));
  }, [selectedKalijabatHistory]);

  const uniqueKalijabatUnits = useMemo(() => {
    return Array.from(new Set(unitKaliJabat.map(d => d.unit).filter(Boolean))).sort();
  }, [unitKaliJabat]);

  const filteredUnitKaliJabat = useMemo(() => {
    if (kalijabatUnitFilter === 'all') return unitKaliJabat;
    return unitKaliJabat.filter(d => d.unit === kalijabatUnitFilter);
  }, [unitKaliJabat, kalijabatUnitFilter]);

  const kaliJabatStats = useMemo(() => {
    const freqMap: { [key: string]: number } = {};
    const catMap: { [key: string]: number } = {};

    filteredUnitKaliJabat.forEach(item => {
      const kLabel = `${item.kali} Kali`;
      freqMap[kLabel] = (freqMap[kLabel] || 0) + 1;

      if (item.jenis) {
        catMap[item.jenis] = (catMap[item.jenis] || 0) + 1;
      }
    });

    return { freqMap, catMap };
  }, [filteredUnitKaliJabat]);

  // Unit Box Talent
  const unitBoxTalent = useMemo(() => {
    return (boxTalentData || []).filter(item => matchUnit(item.unit) || matchUnit(item.jabatan));
  }, [boxTalentData, matchUnit]);

  const uniqueBoxUnits = useMemo(() => {
    return Array.from(new Set(unitBoxTalent.map(d => d.unit).filter(Boolean))).sort();
  }, [unitBoxTalent]);

  const uniqueBoxes = useMemo(() => {
    return Array.from(new Set(unitBoxTalent.map(d => d.boxName || d.boxNo).filter(Boolean))).sort();
  }, [unitBoxTalent]);

  const filteredBoxTalent = useMemo(() => {
    return unitBoxTalent.filter(d => {
      const s = boxSearch.toLowerCase();
      const matchSearch =
        !boxSearch ||
        d.nama.toLowerCase().includes(s) ||
        d.nip.toLowerCase().includes(s) ||
        d.jabatan.toLowerCase().includes(s) ||
        d.unit.toLowerCase().includes(s) ||
        d.profesi.toLowerCase().includes(s) ||
        d.boxName.toLowerCase().includes(s) ||
        d.boxNo.toLowerCase().includes(s);

      const matchUnitVal = boxUnitFilter === 'all' || d.unit === boxUnitFilter;
      const matchBoxVal = boxBoxFilter === 'all' || d.boxName === boxBoxFilter || d.boxNo === boxBoxFilter;

      return matchSearch && matchUnitVal && matchBoxVal;
    });
  }, [unitBoxTalent, boxSearch, boxUnitFilter, boxBoxFilter]);

  // Unit Monitoring FJ
  const unitMonitoringFj = useMemo(() => {
    return (monitoringFjData || []).filter(item => matchUnit(item.unit) || matchUnit(item.jabatan));
  }, [monitoringFjData, matchUnit]);

  const uniqueMonitoringFjUnits = useMemo(() => {
    const list = Array.from(new Set(unitMonitoringFj.map(d => d.unit).filter(Boolean))).sort();
    if (unitCode === 'mtr' && list.length === 0) {
      return [
        'UP3 METRO',
        'ULP KOTA METRO',
        'ULP RUMBIA',
        'ULP BANDAR JAYA',
        'ULP SUKADANA',
        'ULP SRIBHAWONO',
      ];
    }
    if (unitCode === 'ktb' && list.length === 0) {
      return [
        'UP3 KOTABUMI',
        'ULP BUKIT KEMUNING',
        'ULP BLAMBANGAN UMPU',
        'ULP BUMI ABUNG',
        'ULP PULUNG KENCANA',
        'ULP MENGGALA',
        'ULP MESUJI',
      ];
    }
    if (unitCode === 'psw' && list.length === 0) {
      return [
        'UP3 PRINGSEWU',
        'ULP PRINGSEWU',
        'ULP TALANG PADANG',
        'ULP KALIREJO',
        'ULP LIWA',
        'ULP KOTA AGUNG',
      ];
    }
    return list;
  }, [unitMonitoringFj, unitCode]);

  const uniqueMonitoringFjJenjangs = useMemo(() => {
    return Array.from(new Set(unitMonitoringFj.map(d => d.jenjang).filter(Boolean))).sort();
  }, [unitMonitoringFj]);

  const filteredMonitoringFj = useMemo(() => {
    return unitMonitoringFj.filter(d => {
      const s = monitoringFjSearch.toLowerCase();
      const matchSearch =
        !monitoringFjSearch ||
        d.jabatan.toLowerCase().includes(s) ||
        d.jenjang.toLowerCase().includes(s) ||
        d.unit.toLowerCase().includes(s);

      const matchUnitVal = monitoringFjUnitFilter === 'all' || d.unit === monitoringFjUnitFilter;
      const matchJenjangVal = monitoringFjJenjangFilter === 'all' || d.jenjang === monitoringFjJenjangFilter;

      return matchSearch && matchUnitVal && matchJenjangVal;
    });
  }, [unitMonitoringFj, monitoringFjSearch, monitoringFjUnitFilter, monitoringFjJenjangFilter]);

  // Charts
  useEffect(() => {
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

    Object.keys(chartInstances.current).forEach(k => {
      chartInstances.current[k]?.destroy();
      chartInstances.current[k] = null;
    });

    if (subView === 'kalijabat') {
      // 1. Chart Frekuensi Kali Jabat
      if (chartKaliJabatRef.current && Object.keys(kaliJabatStats.freqMap).length > 0) {
        const sortedFreqKeys = Object.keys(kaliJabatStats.freqMap).sort((a, b) => {
          const numA = parseInt(a) || 0;
          const numB = parseInt(b) || 0;
          return numA - numB;
        });
        chartInstances.current.kaliJabat = new ChartJS(chartKaliJabatRef.current, {
          type: 'bar',
          data: {
            labels: sortedFreqKeys,
            datasets: [
              {
                label: 'Jumlah Pegawai',
                data: sortedFreqKeys.map(k => kaliJabatStats.freqMap[k]),
                backgroundColor: [
                  '#005BAC',
                  '#00A651',
                  '#F59E0B',
                  '#EF4444',
                  '#8B5CF6',
                  '#EC4899',
                ],
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
              x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
            },
          },
        });
      }

      // 2. Chart Kategori Kali Jabat
      if (chartKaliJabatKatRef.current && Object.keys(kaliJabatStats.catMap).length > 0) {
        chartInstances.current.kaliJabatKat = new ChartJS(chartKaliJabatKatRef.current, {
          type: 'bar',
          data: {
            labels: Object.keys(kaliJabatStats.catMap),
            datasets: [
              {
                label: 'Pegawai',
                data: Object.values(kaliJabatStats.catMap),
                backgroundColor: '#0072CE',
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
              x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
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
    }

    if (subView !== 'dashboard') return;

    // 1. Chart Unit Distribution
    if (chartUnitRef.current && Object.keys(stats.unitDist).length > 0) {
      const labels = Object.keys(stats.unitDist).sort((a, b) => stats.unitDist[b] - stats.unitDist[a]);
      chartInstances.current.unit = new ChartJS(chartUnitRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Jumlah Pegawai',
              data: labels.map(l => stats.unitDist[l]),
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
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor }, grace: '20%' },
            x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 45, font: { size: 10 } } },
          },
        },
      });
    }

    // 2. Chart Demografi Usia
    if (chartUsiaRef.current && Object.keys(stats.usiaDist).length > 0) {
      chartInstances.current.usia = new ChartJS(chartUsiaRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(stats.usiaDist),
          datasets: [
            {
              data: Object.values(stats.usiaDist),
              backgroundColor: ['#0072CE', '#00A651', '#F59E0B', '#EF4444', '#8B5CF6'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: textColor, font: { size: 10 } } },
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

    // 3. Chart Level Pendidikan
    if (chartPendidikanRef.current && Object.keys(stats.pendDist).length > 0) {
      chartInstances.current.pendidikan = new ChartJS(chartPendidikanRef.current, {
        type: 'pie',
        data: {
          labels: Object.keys(stats.pendDist),
          datasets: [
            {
              data: Object.values(stats.pendDist),
              backgroundColor: ['#005BAC', '#00A651', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: textColor, font: { size: 10 } } },
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

    return () => {
      Object.keys(chartInstances.current).forEach(k => {
        chartInstances.current[k]?.destroy();
        chartInstances.current[k] = null;
      });
    };
  }, [subView, stats, kaliJabatStats, isDark]);

  return (
    <div className="space-y-6">
      {/* 1. VIEW: DASHBOARD */}
      {subView === 'dashboard' && (
        <>
          <div className="bg-gradient-to-r from-[#005BAC]/10 via-[#00A651]/10 to-teal-500/10 border border-[#005BAC]/20 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-[#005BAC] dark:text-[#00C4CC]" />
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Ringkasan Eksekutif Human Capital - <span className="text-[#005BAC] dark:text-[#00C4CC] font-black">{unitName}</span>
              </p>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {/* Total Pegawai & Breakdown */}
            <div className="md:col-span-2 bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-[#005BAC] dark:text-[#00C4CC]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    Total Pegawai {unitCode === 'tjk' || unitCode === 'mtr' || unitCode === 'ktb' || unitCode === 'psw' ? 'UP3 & ULP' : unitName}
                  </p>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white">
                    {stats.total} Orang
                  </h4>
                </div>
              </div>

              {/* TJK Breakdown mini grid */}
              {unitCode === 'tjk' && (
                <div className="grid grid-cols-4 gap-2 pt-3">
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">UP3 TJK</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownTJK.up3}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Kalianda</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownTJK.kld}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Karang</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownTJK.krg}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Natar</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownTJK.ntr}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sidomulyo</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownTJK.sdm}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sutami</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownTJK.stm}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">T. Betung</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownTJK.tbt}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Wayhalim</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownTJK.whm}</p>
                  </div>
                </div>
              )}

              {/* MTR Breakdown mini grid (UP3 METRO, ULP KOTA METRO, ULP RUMBIA, ULP BANDAR JAYA, ULP SUKADANA, ULP SRIBHAWONO) */}
              {unitCode === 'mtr' && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3">
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="UP3 METRO">UP3 METRO</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownMTR.up3}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP KOTA METRO">Kota Metro</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownMTR.ktm}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP RUMBIA">Rumbia</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownMTR.rmb}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP BANDAR JAYA">Bandar Jaya</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownMTR.bdj}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP SUKADANA">Sukadana</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownMTR.skd}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP SRIBHAWONO">Sribhawono</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownMTR.sbw}</p>
                  </div>
                </div>
              )}

              {/* KTB Breakdown mini grid (UP3 KOTABUMI, ULP BUKIT KEMUNING, ULP BLAMBANGAN UMPU, ULP BUMI ABUNG, ULP PULUNG KENCANA, ULP MENGGALA, ULP MESUJI) */}
              {unitCode === 'ktb' && (
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 pt-3">
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="UP3 KOTABUMI">UP3 KTB</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownKTB.up3}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP BUKIT KEMUNING">B. Kemuning</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownKTB.bkm}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP BLAMBANGAN UMPU">Blambangan</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownKTB.bmu}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP BUMI ABUNG">Bumi Abung</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownKTB.bma}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP PULUNG KENCANA">Pulung Kencana</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownKTB.pkc}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP MENGGALA">Menggala</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownKTB.mgl}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP MESUJI">Mesuji</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownKTB.msj}</p>
                  </div>
                </div>
              )}

              {/* PSW Breakdown mini grid (UP3 PRINGSEWU, ULP PRINGSEWU, ULP TALANG PADANG, ULP KALIREJO, ULP LIWA, ULP KOTA AGUNG) */}
              {unitCode === 'psw' && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3">
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="UP3 PRINGSEWU">UP3 PSW</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownPSW.up3}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP PRINGSEWU">ULP PSW</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownPSW.psw}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP TALANG PADANG">Talang Padang</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownPSW.tpd}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP KALIREJO">Kalirejo</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownPSW.klr}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP LIWA">Liwa</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownPSW.lwa}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 border border-slate-100 dark:border-slate-750">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title="ULP KOTA AGUNG">Kota Agung</p>
                    <p className="text-xs font-black text-[#005BAC] dark:text-[#00C4CC]">{stats.breakdownPSW.kta}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pensiun (55 Thn) */}
            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Pensiun (55 Thn)
                </p>
                <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {stats.pensiunCount}
                </h4>
                <span className="text-[11px] text-slate-400">Orang</span>
              </div>
            </div>

            {/* Pemenuhan FTK */}
            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <PieIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Pemenuhan FTK
                </p>
                <h4 className="text-2xl font-black text-[#00A651] dark:text-emerald-400">
                  {mainFTK?.pct || 'N/A'}
                </h4>
                <span className="text-[11px] text-slate-400">Target Pagu</span>
              </div>
            </div>

            {/* Mayoritas Pendidikan */}
            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Mayoritas Pend.
                </p>
                <h4 className="text-xl font-black text-purple-600 dark:text-purple-400 truncate max-w-[130px]">
                  {stats.topPend}
                </h4>
                <span className="text-[11px] text-slate-400">Tingkat Edukasi</span>
              </div>
            </div>
          </div>

          {/* Charts Row - 3 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
                Distribusi Pegawai per Unit ({unitName})
              </h3>
              <div className="h-72 w-full">
                <canvas ref={chartUnitRef} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
                Demografi Kelompok Usia ({unitName})
              </h3>
              <div className="h-72 w-full">
                <canvas ref={chartUsiaRef} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
                Level Pendidikan ({unitName})
              </h3>
              <div className="h-72 w-full">
                <canvas ref={chartPendidikanRef} />
              </div>
            </div>
          </div>

          {/* EWS Potensi Mutasi Tinggi */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>EWS: Potensi Mutasi Tinggi ({unitName})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Klasifikasi pegawai dengan masa jabatan &gt; 4 Tahun pada usia produktif (25-50 tahun).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-72 custom-scrollbar">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5">Nama Pegawai</th>
                    <th className="px-5 py-3.5">Unit / Bagian</th>
                    <th className="px-5 py-3.5 text-center">Masa Jabatan</th>
                    <th className="px-5 py-3.5 text-center">Usia Saat Ini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.ewsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400 font-medium">
                        Kondisi aman. Tidak ada pegawai dalam kategori potensi mutasi tinggi saat ini.
                      </td>
                    </tr>
                  ) : (
                    stats.ewsList.map((p, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                          {p.nama}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{p.unit}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-lg font-bold">
                            {p.masa} Tahun
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                          {p.usia} Tahun
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daftar Pegawai Persiapan Pensiun (55 Tahun) */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Daftar Pegawai Persiapan Pensiun (Usia 55 Tahun) - {unitName}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Rincian data pegawai yang akan segera memasuki masa pensiun.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-72 custom-scrollbar">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5 font-mono">NIP</th>
                    <th className="px-5 py-3.5">Nama Pegawai</th>
                    <th className="px-5 py-3.5 whitespace-normal min-w-[200px]">Jabatan</th>
                    <th className="px-5 py-3.5">Unit / Bagian</th>
                    <th className="px-5 py-3.5 text-center">Tahun Pensiun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.pensiunList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 font-medium">
                        Tidak ada pegawai persiapan pensiun (55 Tahun) saat ini.
                      </td>
                    </tr>
                  ) : (
                    stats.pensiunList.map((p, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-rose-50/60 dark:hover:bg-rose-950/20 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-center font-bold">{idx + 1}</td>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">{p.nip}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{p.nama}</td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{p.jabatan}</td>
                        <td className="px-5 py-3.5 font-medium">{p.unit}</td>
                        <td className="px-5 py-3.5 text-center font-bold text-rose-600 dark:text-rose-400">{p.tahunPensiun}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 2. VIEW: FTK */}
      {subView === 'ftk' && (
        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-[#00A651]" />
              <span>Pemenuhan FTK - {unitName}</span>
            </h3>
            <button
              onClick={() => {
                const headers = ['Nama Unit', 'Pagu', 'FTK', 'Prosentase', 'GAP'];
                const rows = unitFTK.map(d => [d.unit, d.pagu, d.ftk, d.pct, d.gap]);
                exportToExcel(`FTK_${unitCode.toUpperCase()}.xlsx`, 'FTK', headers, rows);
                onShowToast('Berhasil mengunduh Excel FTK', 'success');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750">
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
              <thead className="text-[11px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Nama Unit</th>
                  <th className="px-5 py-3.5 text-center">Pagu</th>
                  <th className="px-5 py-3.5 text-center">FTK</th>
                  <th className="px-5 py-3.5 text-center">Prosentase</th>
                  <th className="px-5 py-3.5 text-center">GAP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {unitFTK.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">
                      Tidak ada data FTK khusus untuk {unitName}.
                    </td>
                  </tr>
                ) : (
                  unitFTK.map((d, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                        {d.unit}
                      </td>
                      <td className="px-5 py-3.5 text-center">{d.pagu}</td>
                      <td className="px-5 py-3.5 text-center">{d.ftk}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-[#005BAC] dark:text-[#00C4CC]">
                        {d.pct}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                        {d.gap}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2.b. VIEW: MONITORING FJ */}
      {subView === 'monitoringfj' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#00A2B9]" />
                  <span>Monitoring Formasi Jabatan (FJ) - {unitName}</span>
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {filteredMonitoringFj.length} Formasi
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <input
                    type="text"
                    value={monitoringFjSearch}
                    onChange={e => setMonitoringFjSearch(e.target.value)}
                    placeholder="Cari Jabatan, Jenjang, Unit..."
                    className="w-full text-xs py-2 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
                  />
                  <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <select
                  value={monitoringFjUnitFilter}
                  onChange={e => setMonitoringFjUnitFilter(e.target.value)}
                  className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
                >
                  <option value="all">Semua Unit ({unitMonitoringFj.length})</option>
                  {uniqueMonitoringFjUnits.map(u => (
                    <option key={u} value={u}>
                      {u} ({unitMonitoringFj.filter(d => d.unit === u).length})
                    </option>
                  ))}
                </select>
                <select
                  value={monitoringFjJenjangFilter}
                  onChange={e => setMonitoringFjJenjangFilter(e.target.value)}
                  className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
                >
                  <option value="all">Semua Jenjang</option>
                  {uniqueMonitoringFjJenjangs.map(j => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const headers = ['No', 'Jabatan', 'Jenjang Jabatan', 'Nama Unit', 'Formasi Tenaga Kerja', 'Realisasi', 'GAP'];
                    const rows = filteredMonitoringFj.map((d, idx) => [
                      idx + 1,
                      d.jabatan,
                      d.jenjang,
                      d.unit,
                      d.ftk,
                      d.realisasi,
                      d.gap,
                    ]);
                    exportToExcel(`Monitoring_FJ_${unitCode.toUpperCase()}`, 'Monitoring FJ', headers, rows);
                    onShowToast('Berhasil mengunduh Excel Monitoring FJ', 'success');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Unduh Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 max-h-[550px] custom-scrollbar">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5 whitespace-normal min-w-[250px]">Jabatan</th>
                    <th className="px-5 py-3.5 text-center">Jenjang Jabatan</th>
                    <th className="px-5 py-3.5">Nama Unit</th>
                    <th className="px-5 py-3.5 text-center">Formasi Tenaga Kerja</th>
                    <th className="px-5 py-3.5 text-center">Realisasi</th>
                    <th className="px-5 py-3.5 text-center">GAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMonitoringFj.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                        {unitMonitoringFj.length === 0
                          ? `Tidak ada data Monitoring FJ untuk ${unitName}.`
                          : 'Tidak ada data Monitoring FJ untuk kriteria filter ini.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMonitoringFj.map((d, idx) => {
                      const gapNum = Number(d.gap);
                      let gapBadge = (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-750 dark:text-slate-300">
                          {d.gap}
                        </span>
                      );
                      if (!isNaN(gapNum)) {
                        if (gapNum < 0) {
                          gapBadge = (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
                              {d.gap}
                            </span>
                          );
                        } else if (gapNum > 0) {
                          gapBadge = (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                              +{d.gap}
                            </span>
                          );
                        } else {
                          gapBadge = (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              0
                            </span>
                          );
                        }
                      }
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-5 py-3.5 text-center font-bold text-slate-500 dark:text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white whitespace-normal min-w-[250px]">
                            {d.jabatan}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {d.jenjang}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {d.unit}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                            {d.ftk}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {d.realisasi}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {gapBadge}
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
      )}

      {/* 3. VIEW: ASSESMENT (FNP) */}
      {subView === 'assesment' && (
        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#00A651]" />
                <span>{unitCode === 'tjk' ? 'Hasil FNP - UP3 Tanjung Karang' : unitCode === 'mtr' ? 'Hasil FNP - UP3 Metro' : unitCode === 'ktb' ? 'Hasil FNP - UP3 Kotabumi' : `Hasil Assesment (FnP) - ${unitName}`}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00A651]/10 text-[#00A651]">
                {unitFnP.length} Pegawai
              </span>
            </div>
            <button
              onClick={() => {
                const headers = ['NIP', 'Nama', 'Nama Unit', 'Jabatan Lama', 'Jabatan Saat Ini', 'Jenjang Proyeksi', 'Jabatan Proyeksi', 'Nilai', 'Status', 'Tanggal'];
                const rows = unitFnP.map(d => [
                  d.nip,
                  d.nama,
                  d.unit,
                  d.jabatanLama || '-',
                  d.jabatanSaatIni || d.jabatan || '-',
                  d.jenjangProyeksi || d.jenjang || '-',
                  d.jabatanProyeksi || '-',
                  d.nilai || '-',
                  d.status || '-',
                  d.tanggal || '-'
                ]);
                exportToExcel(`Hasil_FNP_${unitCode.toUpperCase()}.xlsx`, 'Hasil FNP', headers, rows);
                onShowToast('Berhasil mengunduh Excel Hasil FNP', 'success');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-[550px] custom-scrollbar">
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
              <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5 font-mono">NIP</th>
                  <th className="px-5 py-3.5">Nama</th>
                  <th className="px-5 py-3.5">Nama Unit</th>
                  <th className="px-5 py-3.5 whitespace-normal min-w-[200px]">Jabatan Lama</th>
                  <th className="px-5 py-3.5 whitespace-normal min-w-[200px]">Jabatan Saat Ini</th>
                  <th className="px-5 py-3.5 text-center">Jenjang Proyeksi</th>
                  <th className="px-5 py-3.5 whitespace-normal min-w-[180px]">Jabatan Proyeksi</th>
                  <th className="px-5 py-3.5 text-center">Nilai</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {unitFnP.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-400 font-medium">
                      Tidak ada data FNP khusus untuk {unitName}.
                    </td>
                  </tr>
                ) : (
                  unitFnP.map((d, idx) => {
                    const isRek = d.status.toUpperCase().includes('DIREKOMENDASIKAN');
                    const isDip = d.status.toUpperCase().includes('DIPERTIMBANGKAN');
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {d.nip}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                          {d.nama}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[#00A651]">
                          {d.unit}
                        </td>
                        <td className="px-5 py-3.5 whitespace-normal min-w-[200px] text-slate-600 dark:text-slate-400 text-xs">
                          {d.jabatanLama || '-'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-normal min-w-[200px] text-slate-800 dark:text-slate-200 text-xs font-medium">
                          {d.jabatanSaatIni || d.jabatan}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {d.jenjangProyeksi || d.jenjang || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-normal min-w-[180px] text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {d.jabatanProyeksi || '-'}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-center text-xs text-slate-800 dark:text-slate-200">
                          {d.nilai || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isRek
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : isDip
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                          {d.tanggal || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. VIEW: LAMA JABATAN */}
      {subView === 'lamajabat' && (
        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#00A651]" />
              <span>Lama Jabatan Manajerial - {unitName}</span>
            </h3>
            <button
              onClick={() => {
                const headers = ['Nama Pegawai', 'Jabatan', 'Lama (Tahun)'];
                const rows = unitMobility.map(d => [d.nama, d.jabatan, `${d.masaJabatanNum} Tahun`]);
                exportToExcel(`Lama_Jabatan_${unitCode.toUpperCase()}.xlsx`, 'LamaJabatan', headers, rows);
                onShowToast('Berhasil mengunduh Excel Lama Jabatan', 'success');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-[500px] custom-scrollbar">
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
              <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Nama Pegawai</th>
                  <th className="px-5 py-3.5">Jabatan</th>
                  <th className="px-5 py-3.5 text-center">Lama Menjabat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {unitMobility.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-400 font-medium">
                      Tidak ada data lama jabatan manajerial untuk {unitName}.
                    </td>
                  </tr>
                ) : (
                  unitMobility.map((d, idx) => {
                    const isWarning = d.masaJabatanNum > 3;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                          {d.nama}
                        </td>
                        <td className="px-5 py-3.5 whitespace-normal min-w-[250px]">{d.jabatan}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold border shadow-xs ${
                              isWarning
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                            }`}
                          >
                            {d.masaJabatan && d.masaJabatan.trim() !== '' ? `${d.masaJabatan} Tahun` : '< 1 Tahun'}
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
      )}

      {/* 5. VIEW: KALI JABAT */}
      {subView === 'kalijabat' && (
        <div className="space-y-6">
          {/* Charts Row for Kali Jabat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#005BAC] dark:text-[#00C4CC]" />
                <span>Grafik Frekuensi Kali Jabat - {unitName}</span>
              </h4>
              <div className="h-64 relative">
                {Object.keys(kaliJabatStats.freqMap).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                    Tidak ada data grafik kali jabat.
                  </div>
                ) : (
                  <canvas ref={chartKaliJabatRef} />
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00A651]" />
                <span>Grafik Kategori Jabatan - {unitName}</span>
              </h4>
              <div className="h-64 relative">
                {Object.keys(kaliJabatStats.catMap).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                    Tidak ada data kategori jabatan.
                  </div>
                ) : (
                  <canvas ref={chartKaliJabatKatRef} />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#00A651]" />
                  <span>Kali Jabat - {unitName}</span>
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {filteredUnitKaliJabat.length} Pegawai
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-[#00A651]" />
                    <span>Filter Unit:</span>
                  </label>
                  <select
                    value={kalijabatUnitFilter}
                    onChange={(e) => setKalijabatUnitFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
                  >
                    <option value="all">Semua Unit ({unitKaliJabat.length})</option>
                    {uniqueKalijabatUnits.map(u => (
                      <option key={u} value={u}>
                        {u} ({unitKaliJabat.filter(d => d.unit === u).length})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    const headers = ['Nama Pegawai', 'Kategori', 'Nama Unit', 'Jabatan', 'Total Kali Jabat'];
                    const rows = filteredUnitKaliJabat.map(d => [d.nama, d.jenis, d.unit, d.jabatan, `${d.kali} Kali`]);
                    const unitSuffix = kalijabatUnitFilter !== 'all' ? `_${kalijabatUnitFilter.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
                    exportToExcel(`Kali_Jabat_${unitCode.toUpperCase()}${unitSuffix}.xlsx`, 'KaliJabat', headers, rows);
                    onShowToast('Berhasil mengunduh Excel Kali Jabat', 'success');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Unduh Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 max-h-[500px] custom-scrollbar">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5">Nama Pegawai (Klik untuk Riwayat)</th>
                    <th className="px-5 py-3.5">Nama Unit</th>
                    <th className="px-5 py-3.5">Jabatan Saat Ini</th>
                    <th className="px-5 py-3.5 text-center">Total Kali Jabat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUnitKaliJabat.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400 font-medium">
                        Tidak ada data kali jabat khusus untuk {unitName} {kalijabatUnitFilter !== 'all' ? `(${kalijabatUnitFilter})` : ''}.
                      </td>
                    </tr>
                  ) : (
                    filteredUnitKaliJabat.map((d, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSelectKalijabatEmployee(d)}
                              className="text-left font-bold text-[#005BAC] dark:text-[#00C4CC] hover:underline cursor-pointer group flex items-center gap-1.5 focus:outline-none"
                              title="Klik untuk melihat riwayat jabatan pegawai"
                            >
                              <span>{d.nama}</span>
                              <History className="w-3.5 h-3.5 text-[#00A651] opacity-70 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {d.jenis}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {d.unit}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-normal min-w-[250px]">{d.jabatan}</td>
                        <td className="px-5 py-3.5 text-center font-black text-[#005BAC] dark:text-[#00C4CC]">
                          {d.kali} Kali
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* History Detail Card */}
          {selectedKalijabatHistory && (
            <div ref={detailHistoryRef} className="bg-white dark:bg-slate-850 rounded-2xl shadow-lg border border-emerald-500/30 dark:border-teal-400/30 overflow-hidden transition-all duration-300">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                      {selectedKalijabatHistory.jenis}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                      {selectedKalijabatHistory.unit}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <span>Riwayat Jabatan: {selectedKalijabatHistory.nama}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Jabatan Saat Ini: {selectedKalijabatHistory.jabatan} • Total {selectedKalijabatHistory.kali} Kali Menjabat
                  </p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      if (displayHistoryList.length === 0) {
                        onShowToast('Riwayat kosong', 'error');
                        return;
                      }
                      const headers = ['No', 'Nama', 'Riwayat Jabatan', 'Nama Unit', 'Startdate', 'Enddate'];
                      const rows = displayHistoryList.map((item, idx) => [
                        idx + 1,
                        item.namaPegawai || selectedKalijabatHistory.nama,
                        item.jabatan,
                        item.unit && item.unit !== 'null' ? item.unit : '-',
                        item.startDate || '-',
                        item.endDate || '-',
                      ]);
                      const safeName = selectedKalijabatHistory.nama.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 20);
                      exportToExcel(`Riwayat_Jabatan_${safeName}.xlsx`, 'Riwayat', headers, rows);
                      onShowToast('Berhasil mengunduh Riwayat Jabatan', 'success');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Unduh Riwayat (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => setSelectedKalijabatHistory(null)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-750 cursor-pointer"
                    title="Tutup Riwayat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750">
                  <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-5 py-3.5 w-14 text-center">No</th>
                        <th className="px-5 py-3.5 min-w-[180px]">Nama</th>
                        <th className="px-5 py-3.5 min-w-[260px]">Riwayat Jabatan</th>
                        <th className="px-5 py-3.5 min-w-[180px]">Nama Unit</th>
                        <th className="px-5 py-3.5 text-center">Startdate</th>
                        <th className="px-5 py-3.5 text-center">Enddate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayHistoryList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400 font-medium">
                            Tidak ada riwayat jabatan tercatat untuk {selectedKalijabatHistory.nama}.
                          </td>
                        </tr>
                      ) : (
                        displayHistoryList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="px-5 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white whitespace-normal min-w-[180px]">
                              {item.namaPegawai || selectedKalijabatHistory.nama}
                            </td>
                            <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white whitespace-normal min-w-[260px]">
                              {item.jabatan}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-750 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {item.unit && item.unit !== 'null' ? item.unit : '-'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {item.startDate || '-'}
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {item.endDate || '-'}
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
      )}

      {/* 6. VIEW: BOX TALENT */}
      {subView === 'box' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-[#00A2B9]" />
                  <span>Box Talent {unitName}</span>
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {filteredBoxTalent.length} Pegawai
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <input
                    type="text"
                    value={boxSearch}
                    onChange={e => setBoxSearch(e.target.value)}
                    placeholder="Cari NIP, Nama, Jabatan..."
                    className="w-full text-xs py-2 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
                  />
                  <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <select
                  value={boxUnitFilter}
                  onChange={e => setBoxUnitFilter(e.target.value)}
                  className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
                >
                  <option value="all">Semua Unit ({unitBoxTalent.length})</option>
                  {uniqueBoxUnits.map(u => (
                    <option key={u} value={u}>
                      {u} ({unitBoxTalent.filter(d => d.unit === u).length})
                    </option>
                  ))}
                </select>
                <select
                  value={boxBoxFilter}
                  onChange={e => setBoxBoxFilter(e.target.value)}
                  className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
                >
                  <option value="all">Semua Box</option>
                  {uniqueBoxes.map(b => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const headers = ['NIP', 'Nama', 'Unit', 'Jabatan', 'Box No', 'Box Name', 'Profesi'];
                    const rows = filteredBoxTalent.map(d => [
                      d.nip,
                      d.nama,
                      d.unit,
                      d.jabatan,
                      d.boxNo,
                      d.boxName,
                      d.profesi,
                    ]);
                    exportToExcel(`Box_Talent_${unitCode.toUpperCase()}`, 'Box Talent', headers, rows);
                    onShowToast('Berhasil mengunduh Excel Box Talent', 'success');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Unduh Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 max-h-[550px] custom-scrollbar">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <thead className="text-[11px] uppercase sticky top-0 bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5 font-mono">NIP</th>
                    <th className="px-5 py-3.5">Nama</th>
                    <th className="px-5 py-3.5">Unit</th>
                    <th className="px-5 py-3.5 whitespace-normal min-w-[220px]">Jabatan</th>
                    <th className="px-5 py-3.5 text-center">Box No</th>
                    <th className="px-5 py-3.5 text-center">Box Name</th>
                    <th className="px-5 py-3.5 whitespace-normal min-w-[160px]">Profesi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBoxTalent.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                        Tidak ada data Box Talent untuk kriteria ini.
                      </td>
                    </tr>
                  ) : (
                    filteredBoxTalent.map((d, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {d.nip}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                          {d.nama}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {d.unit}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-normal min-w-[220px] font-medium text-slate-800 dark:text-slate-200">
                          {d.jabatan}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold border ${
                              d.boxNo === '4'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : d.boxNo === '3'
                                ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300'
                                : d.boxNo === '2'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}
                          >
                            {d.boxNo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                            {d.boxName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-normal min-w-[160px] text-slate-600 dark:text-slate-400 font-semibold">
                          {d.profesi}
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
