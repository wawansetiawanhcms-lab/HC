import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MobilityPage } from './pages/MobilityPage';
import { FtkPage } from './pages/FtkPage';
import { FnpPage } from './pages/FnpPage';
import { GradePivotPage } from './pages/GradePivotPage';
import { KalijabatPage } from './pages/KalijabatPage';
import { PegPogPage } from './pages/PegPogPage';
import { UnitDashboardPage } from './pages/UnitDashboardPage';
import { SettingPage } from './pages/SettingPage';
import {
  fetchSheetJSON,
  parsePegawai,
  parseFTK,
  parseTalentReady,
  parseKalijabat,
  parseAnomali,
  parseGradeRaw,
  parseBoxTalent,
  parsePaguFjTJ,
} from './services/sheetService';
import {
  Employee,
  FTKItem,
  FnpItem,
  KalijabatItem,
  AnomaliItem,
  GradePivotRaw,
  BoxTalentItem,
  MonitoringFjItem,
  PageId,
  UserRole,
} from './types';
import { Zap, Loader2 } from 'lucide-react';

export default function App() {
  // Authentication & Role
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  });
  const [username, setUsername] = useState<string>(() => {
    return sessionStorage.getItem('username') || 'admin';
  });
  const [role, setRole] = useState<UserRole>(() => {
    return (sessionStorage.getItem('role') as UserRole) || 'admin';
  });

  // Navigation
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    const savedRole = sessionStorage.getItem('role');
    if (savedRole === 'managertjk') return 'dashboard-tjk';
    if (savedRole === 'managermtr') return 'dashboard-mtr';
    if (savedRole === 'managerktb') return 'dashboard-ktb';
    if (savedRole === 'managerpsw') return 'dashboard-psw';
    if (savedRole === 'managerup2k') return 'dashboard-up2k';
    if (savedRole === 'managerup2d') return 'dashboard-up2d';
    return 'dashboard';
  });

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Loading States
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'success' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    []
  );

  // Raw Data State
  const [rawUserData, setRawUserData] = useState<any[][]>([]);
  const [rawRjab, setRawRjab] = useState<any[][]>([]);
  const [rawRjabA, setRawRjabA] = useState<any[][]>([]);
  const [rawRjabMul, setRawRjabMul] = useState<any[][]>([]);
  const [rawRjabMsb, setRawRjabMsb] = useState<any[][]>([]);
  const [rawStatusFnp, setRawStatusFnp] = useState<any[][]>([]);
  const [rawJenjangFnp, setRawJenjangFnp] = useState<any[][]>([]);

  // Parsed Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [ftkData, setFtkData] = useState<FTKItem[]>([]);
  const [fnpData, setFnpData] = useState<FnpItem[]>([]);
  const [anomaliItems, setAnomaliItems] = useState<AnomaliItem[]>([]);
  const [gradeData, setGradeData] = useState<GradePivotRaw[]>([]);
  const [allKalijabat, setAllKalijabat] = useState<{
    spvd: KalijabatItem[];
    spva_npu: KalijabatItem[];
    spva_pu: KalijabatItem[];
    mdnpu: KalijabatItem[];
  }>({
    spvd: [],
    spva_npu: [],
    spva_pu: [],
    mdnpu: [],
  });
  const [boxTalentData, setBoxTalentData] = useState<BoxTalentItem[]>([]);
  const [monitoringFjData, setMonitoringFjData] = useState<MonitoringFjItem[]>([]);

  // Sync Theme with HTML Document Element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Load All Sheets Data
  const loadAllData = useCallback(async () => {
    try {
      const [
        pegawaiData,
        ftkRaw,
        kalijabatData,
        kalijabatAData,
        rjabData,
        rjabAData,
        kalijabatMulData,
        rjabMulData,
        kalijabatMsbData,
        rjabMsbData,
        anomaliDataRaw,
        statusFnpData,
        jenjangFnpData,
        talentReadyData,
        userDataRaw,
        boxDataRaw,
        paguFjRaw,
      ] = await Promise.all([
        fetchSheetJSON('data pegawai'),
        fetchSheetJSON('up'),
        fetchSheetJSON('kalijabat'),
        fetchSheetJSON('kalijabatA'),
        fetchSheetJSON('rjab'),
        fetchSheetJSON('rjabA'),
        fetchSheetJSON('kalijabatmul'),
        fetchSheetJSON('rjabmul'),
        fetchSheetJSON('kalijabatmsb'),
        fetchSheetJSON('rjabmsb'),
        fetchSheetJSON('anomali'),
        fetchSheetJSON('Statusfnp'),
        fetchSheetJSON('Jenjangfnp'),
        fetchSheetJSON('TALENT READY'),
        fetchSheetJSON('user'),
        fetchSheetJSON('Box'),
        fetchSheetJSON('pagufjTJ'),
      ]);

      // Save raw rjab for detail lookups
      setRawRjab(rjabData || []);
      setRawRjabA(rjabAData || []);
      setRawRjabMul(rjabMulData || []);
      setRawRjabMsb(rjabMsbData || []);
      setRawStatusFnp(statusFnpData || []);
      setRawJenjangFnp(jenjangFnpData || []);
      setRawUserData(userDataRaw && userDataRaw.length > 1 ? userDataRaw.slice(1) : []);

      // Parse datasets
      const parsedEmployees = parsePegawai(pegawaiData || []);
      setEmployees(parsedEmployees);

      const parsedFTK = parseFTK(ftkRaw || []);
      setFtkData(parsedFTK);

      const parsedFnp = parseTalentReady(talentReadyData || []);
      setFnpData(parsedFnp);

      const parsedAnomali = parseAnomali(anomaliDataRaw || []);
      setAnomaliItems(parsedAnomali);

      const parsedGrade = parseGradeRaw(anomaliDataRaw || []);
      setGradeData(parsedGrade);

      setAllKalijabat({
        spvd: parseKalijabat(kalijabatData || []),
        spva_npu: parseKalijabat(kalijabatAData || []),
        spva_pu: parseKalijabat(kalijabatMulData || []),
        mdnpu: parseKalijabat(kalijabatMsbData || []),
      });

      const parsedBox = parseBoxTalent(boxDataRaw || []);
      setBoxTalentData(parsedBox);

      const parsedMonitoringFj = parsePaguFjTJ(paguFjRaw || []);
      setMonitoringFjData(parsedMonitoringFj);
    } catch (err) {
      console.error('Error loading Google Sheet data:', err);
      showToast('Gagal memuat beberapa data dari Google Sheet', 'error');
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    showToast('Menyinkronkan data dengan Google Sheet...', 'info');
    await loadAllData();
    showToast('Data berhasil diperbarui!', 'success');
  };

  // Auth Handlers
  const handleLoginSuccess = (user: string, userRole: UserRole) => {
    setIsLoggedIn(true);
    setUsername(user);
    setRole(userRole);

    if (userRole === 'managertjk') setCurrentPage('dashboard-tjk');
    else if (userRole === 'managermtr') setCurrentPage('dashboard-mtr');
    else if (userRole === 'managerktb') setCurrentPage('dashboard-ktb');
    else if (userRole === 'managerpsw') setCurrentPage('dashboard-psw');
    else if (userRole === 'managerup2k') setCurrentPage('dashboard-up2k');
    else if (userRole === 'managerup2d') setCurrentPage('dashboard-up2d');
    else setCurrentPage('dashboard');

    showToast(`Selamat datang, ${user}!`, 'success');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('role');
    setIsLoggedIn(false);
    showToast('Anda telah keluar dari sistem', 'info');
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setRole(newRole);
    sessionStorage.setItem('role', newRole);

    if (newRole === 'managertjk') setCurrentPage('dashboard-tjk');
    else if (newRole === 'managermtr') setCurrentPage('dashboard-mtr');
    else if (newRole === 'managerktb') setCurrentPage('dashboard-ktb');
    else if (newRole === 'managerpsw') setCurrentPage('dashboard-psw');
    else if (newRole === 'managerup2k') setCurrentPage('dashboard-up2k');
    else if (newRole === 'managerup2d') setCurrentPage('dashboard-up2d');
    else setCurrentPage('dashboard');

    showToast(`Peran dialihkan ke: ${newRole.toUpperCase()}`, 'info');
  };

  // Page Title mapping
  const pageTitles: Record<PageId, { title: string; subtitle?: string }> = {
    dashboard: {
      title: 'Dashboard Utama Human Capital',
      subtitle: 'Monitoring statistik menyeluruh pegawai PLN UID Lampung',
    },
    mobility: {
      title: 'Monev Mobility Manajerial',
      subtitle: 'Monitoring rotasi & masa jabatan pimpinan unit',
    },
    ftk: {
      title: 'Monev Formasi Tenaga Kerja (FTK)',
      subtitle: 'Evaluasi pemenuhan target pagu tenaga kerja unit',
    },
    fnp: {
      title: 'Monev Fit & Proper (FnP)',
      subtitle: 'Evaluasi talent ready pegawai berdasarkan jenjang proyeksi',
    },
    grade: {
      title: 'Pivot Table Monev Grade Pegawai',
      subtitle: 'Matriks sebaran Grade Level, Posisi Grade, dan Anomali PeG > PoG',
    },
    kalijabat: {
      title: 'Monev Kali Jabat SPVD',
      subtitle: 'Analisa frekuensi masa jabatan jenjang Supervisor Dasar',
    },
    kalijabata: {
      title: 'Monev Kali Jabat SPVA NPU',
      subtitle: 'Analisa frekuensi masa jabatan jenjang Supervisor Atas NPU',
    },
    kalijabatpu: {
      title: 'Monev Kali Jabat SPVA PU',
      subtitle: 'Analisa frekuensi masa jabatan jenjang Supervisor Atas PU',
    },
    kalijabatmdnpu: {
      title: 'Monev Kali Jabat MDNPU',
      subtitle: 'Analisa frekuensi masa jabatan jenjang Middle Management NPU',
    },
    pegpog: {
      title: 'Daftar Anomali PeG > PoG',
      subtitle: 'Identifikasi ketidaksesuaian Grade Pegawai melebihi Posisi Grade',
    },
    setting: {
      title: 'Pengaturan Sistem & Keamanan',
      subtitle: 'Konfigurasi akun pengguna, enkripsi kata sandi, dan status integrasi',
    },

    // UP3 TJK
    'dashboard-tjk': {
      title: 'Dashboard UP3 Tanjung Karang',
      subtitle: 'Ringkasan eksekutif dan demografi SDM UP3 Tanjung Karang & ULP',
    },
    'ftk-tjk': {
      title: 'Pemenuhan FTK UP3 Tanjung Karang',
      subtitle: 'Monitoring pencapaian pagu formasi tenaga kerja wilayah TJK',
    },
    'monitoringfj-tjk': {
      title: 'Monitoring FJ UP3 Tanjung Karang',
      subtitle: 'Monitoring Formasi Jabatan (FJ) dan Realisasi UP3 TJK dari sheet pagufjTJ',
    },
    'assesment-tjk': {
      title: 'Hasil FNP UP3 Tanjung Karang',
      subtitle: 'Daftar hasil evaluasi fit and proper talent ready UP3 TJK',
    },
    'lamajabat-tjk': {
      title: 'Lama Jabatan Manajerial UP3 Tanjung Karang',
      subtitle: 'Masa jabatan pejabat struktural & manajerial UP3 TJK',
    },
    'kalijabat-tjk': {
      title: 'Kali Jabat UP3 Tanjung Karang',
      subtitle: 'Frekuensi mutasi dan pengulangan jabatan pejabat di UP3 TJK',
    },
    'box-tjk': {
      title: 'Box Talent UP3 Tanjung Karang',
      subtitle: 'Data Box Talent (9-Box Grid) UP3 Tanjung Karang dari sheet Box',
    },

    // UP3 Metro
    'dashboard-mtr': {
      title: 'Dashboard UP3 Metro',
      subtitle: 'Ringkasan eksekutif dan demografi SDM UP3 Metro',
    },
    'ftk-mtr': {
      title: 'Pemenuhan FTK UP3 Metro',
      subtitle: 'Monitoring formasi tenaga kerja unit pelaksana Metro',
    },
    'monitoringfj-mtr': {
      title: 'Monitoring FJ UP3 Metro',
      subtitle: 'Monitoring Formasi Jabatan dan Realisasi Tenaga Kerja UP3 Metro',
    },
    'assesment-mtr': {
      title: 'Hasil FNP UP3 Metro',
      subtitle: 'Daftar hasil evaluasi fit and proper (FnP) UP3 Metro',
    },
    'lamajabat-mtr': {
      title: 'Lama Jabatan UP3 Metro',
      subtitle: 'Masa jabatan pejabat manajerial UP3 Metro',
    },
    'kalijabat-mtr': {
      title: 'Kali Jabat UP3 Metro',
      subtitle: 'Analisa pengulangan jabatan pegawai UP3 Metro',
    },
    'box-mtr': {
      title: 'Box Talent UP3 Metro',
      subtitle: 'Data Box Talent (9-Box Grid) UP3 Metro dari sheet Box',
    },

    // UP3 Kotabumi
    'dashboard-ktb': {
      title: 'Dashboard UP3 Kotabumi',
      subtitle: 'Ringkasan eksekutif dan demografi SDM UP3 Kotabumi',
    },
    'ftk-ktb': {
      title: 'Pemenuhan FTK UP3 Kotabumi',
      subtitle: 'Monitoring formasi tenaga kerja unit pelaksana Kotabumi',
    },
    'monitoringfj-ktb': {
      title: 'Monitoring FJ UP3 Kotabumi',
      subtitle: 'Monitoring Formasi Jabatan dan Realisasi Tenaga Kerja UP3 Kotabumi',
    },
    'assesment-ktb': {
      title: 'Hasil FNP UP3 Kotabumi',
      subtitle: 'Daftar hasil evaluasi fit and proper (FnP) UP3 Kotabumi',
    },
    'lamajabat-ktb': {
      title: 'Lama Jabatan UP3 Kotabumi',
      subtitle: 'Masa jabatan pejabat manajerial UP3 Kotabumi',
    },
    'kalijabat-ktb': {
      title: 'Kali Jabat UP3 Kotabumi',
      subtitle: 'Analisa pengulangan jabatan pegawai UP3 Kotabumi',
    },
    'box-ktb': {
      title: 'Box Talent UP3 Kotabumi',
      subtitle: 'Data Box Talent (9-Box Grid) UP3 Kotabumi dari sheet Box',
    },

    // UP3 Pringsewu
    'dashboard-psw': {
      title: 'Dashboard UP3 Pringsewu',
      subtitle: 'Ringkasan eksekutif dan demografi SDM UP3 Pringsewu & ULP',
    },
    'ftk-psw': {
      title: 'Pemenuhan FTK UP3 Pringsewu',
      subtitle: 'Monitoring pencapaian pagu formasi tenaga kerja wilayah PSW',
    },
    'monitoringfj-psw': {
      title: 'Monitoring FJ UP3 Pringsewu',
      subtitle: 'Monitoring Formasi Jabatan (FJ) dan Realisasi UP3 Pringsewu',
    },
    'assesment-psw': {
      title: 'Hasil FNP UP3 Pringsewu',
      subtitle: 'Daftar hasil evaluasi fit and proper talent ready UP3 Pringsewu',
    },
    'lamajabat-psw': {
      title: 'Lama Jabatan UP3 Pringsewu',
      subtitle: 'Masa jabatan pejabat manajerial UP3 Pringsewu',
    },
    'kalijabat-psw': {
      title: 'Kali Jabat UP3 Pringsewu',
      subtitle: 'Analisa pengulangan jabatan pegawai UP3 Pringsewu',
    },
    'box-psw': {
      title: 'Box Talent UP3 Pringsewu',
      subtitle: 'Data Box Talent (9-Box Grid) UP3 Pringsewu dari sheet Box',
    },

    // UP2K
    'dashboard-up2k': {
      title: 'Dashboard UP2K Lampung',
      subtitle: 'Ringkasan eksekutif dan demografi SDM UP2K Lampung',
    },
    'ftk-up2k': {
      title: 'Pemenuhan FTK UP2K Lampung',
      subtitle: 'Monitoring formasi tenaga kerja UP2K Lampung',
    },
    'assesment-up2k': {
      title: 'Hasil Assesment (FnP) UP2K Lampung',
      subtitle: 'Daftar hasil evaluasi talent ready UP2K Lampung',
    },
    'lamajabat-up2k': {
      title: 'Lama Jabatan UP2K Lampung',
      subtitle: 'Masa jabatan pejabat manajerial UP2K Lampung',
    },
    'kalijabat-up2k': {
      title: 'Kali Jabat UP2K Lampung',
      subtitle: 'Analisa pengulangan jabatan pegawai UP2K Lampung',
    },
    'box-up2k': {
      title: 'Box Talent UP2K Lampung',
      subtitle: 'Data Box Talent (9-Box Grid) UP2K Lampung dari sheet Box',
    },

    // UP2D
    'dashboard-up2d': {
      title: 'Dashboard UP2D Lampung',
      subtitle: 'Ringkasan eksekutif dan demografi SDM UP2D Lampung',
    },
    'ftk-up2d': {
      title: 'Pemenuhan FTK UP2D Lampung',
      subtitle: 'Monitoring formasi tenaga kerja UP2D Lampung',
    },
    'assesment-up2d': {
      title: 'Hasil FNP UP2D Lampung',
      subtitle: 'Daftar hasil evaluasi fit and proper talent ready UP2D Lampung',
    },
    'lamajabat-up2d': {
      title: 'Lama Jabatan UP2D Lampung',
      subtitle: 'Masa jabatan pejabat manajerial UP2D Lampung',
    },
    'kalijabat-up2d': {
      title: 'Kali Jabat UP2D Lampung',
      subtitle: 'Analisa pengulangan jabatan pegawai UP2D Lampung',
    },
    'box-up2d': {
      title: 'Box Talent UP2D Lampung',
      subtitle: 'Data Box Talent (9-Box Grid) UP2D Lampung dari sheet Box',
    },
  };

  const currentInfo = pageTitles[currentPage] || {
    title: 'Dashboard MHC PLN',
    subtitle: 'Manajemen Human Capital',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      <Toast message={toast?.message || null} type={toast?.type} />

      {/* Initial Loader */}
      {initialLoading && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
          <img
            src="/assets/aistudio/image_25428b87.png"
            alt="Logo PLN"
            className="w-16 h-16 rounded-2xl object-contain shadow-xl shadow-amber-500/20 mb-6 animate-pulse"
          />
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-[#005BAC] dark:border-t-[#00C4CC] rounded-full animate-spin mb-4" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Sinkronisasi Data Human Capital PLN...
          </h3>
          <p className="text-xs text-slate-400 mt-1">Mengambil data dari Google Spreadsheet</p>
        </div>
      )}

      {/* Login Screen (if not logged in) */}
      {!isLoggedIn && (
        <LoginPage onLoginSuccess={handleLoginSuccess} rawUserData={rawUserData} />
      )}

      {/* Main Application Layout */}
      {isLoggedIn && (
        <div className="flex h-screen overflow-hidden w-full relative">
          {/* Sidebar */}
          <Sidebar
            currentPage={currentPage}
            onNavigate={page => setCurrentPage(page)}
            role={role}
            username={username}
            isOpenMobile={isSidebarOpenMobile}
            onCloseMobile={() => setIsSidebarOpenMobile(false)}
            onLogout={handleLogout}
            onSwitchRole={handleSwitchRole}
          />

          {/* Main Content Viewport */}
          <div className="flex-1 flex flex-col h-screen min-w-0 relative overflow-hidden">
            {/* Header */}
            <Header
              pageTitle={currentInfo.title}
              pageSubtitle={currentInfo.subtitle}
              isDark={isDark}
              toggleTheme={toggleTheme}
              toggleSidebar={() => setIsSidebarOpenMobile(prev => !prev)}
              username={username}
              role={role}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />

            {/* Scrollable Body */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 bg-slate-50/70 dark:bg-slate-950/70">
              {/* Monitoring Utama */}
              {currentPage === 'dashboard' && (
                <DashboardPage
                  employees={employees}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {currentPage === 'mobility' && (
                <MobilityPage
                  employees={employees}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {currentPage === 'ftk' && (
                <FtkPage
                  ftkData={ftkData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {currentPage === 'fnp' && (
                <FnpPage
                  fnpData={fnpData}
                  rawStatusFnp={rawStatusFnp}
                  rawJenjangFnp={rawJenjangFnp}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {currentPage === 'grade' && (
                <GradePivotPage gradeData={gradeData} onShowToast={showToast} />
              )}

              {/* Analisa Jabatan */}
              {currentPage === 'kalijabat' && (
                <KalijabatPage
                  title="Monev Kali Jabat SPVD (Supervisor Dasar)"
                  shortTitle="SPVD"
                  kalijabatItems={allKalijabat.spvd}
                  rawRjabData={rawRjab}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {currentPage === 'kalijabata' && (
                <KalijabatPage
                  title="Monev Kali Jabat SPVA NPU (Supervisor Atas NPU)"
                  shortTitle="SPVA NPU"
                  kalijabatItems={allKalijabat.spva_npu}
                  rawRjabData={rawRjabA}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {currentPage === 'kalijabatpu' && (
                <KalijabatPage
                  title="Monev Kali Jabat SPVA PU (Supervisor Atas PU)"
                  shortTitle="SPVA PU"
                  kalijabatItems={allKalijabat.spva_pu}
                  rawRjabData={rawRjabMul}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {currentPage === 'kalijabatmdnpu' && (
                <KalijabatPage
                  title="Monev Kali Jabat MDNPU (Middle Management NPU)"
                  shortTitle="MDNPU"
                  kalijabatItems={allKalijabat.mdnpu}
                  rawRjabData={rawRjabMsb}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {currentPage === 'pegpog' && (
                <PegPogPage anomaliItems={anomaliItems} onShowToast={showToast} />
              )}

              {/* Sistem Setting */}
              {currentPage === 'setting' && (
                <SettingPage
                  rawUserData={rawUserData}
                  onUserAdded={newUser => setRawUserData(prev => [newUser, ...prev])}
                  onRefreshData={handleRefresh}
                  isRefreshing={isRefreshing}
                  onShowToast={showToast}
                />
              )}

              {/* Unit Specific Pages - UP3 Tanjung Karang */}
              {currentPage.startsWith('dashboard-tjk') && (
                <UnitDashboardPage
                  unitCode="tjk"
                  unitName="UP3 Tanjung Karang"
                  subView="dashboard"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'ftk-tjk' && (
                <UnitDashboardPage
                  unitCode="tjk"
                  unitName="UP3 Tanjung Karang"
                  subView="ftk"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'monitoringfj-tjk' && (
                <UnitDashboardPage
                  unitCode="tjk"
                  unitName="UP3 Tanjung Karang"
                  subView="monitoringfj"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'assesment-tjk' && (
                <UnitDashboardPage
                  unitCode="tjk"
                  unitName="UP3 Tanjung Karang"
                  subView="assesment"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'lamajabat-tjk' && (
                <UnitDashboardPage
                  unitCode="tjk"
                  unitName="UP3 Tanjung Karang"
                  subView="lamajabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'kalijabat-tjk' && (
                <UnitDashboardPage
                  unitCode="tjk"
                  unitName="UP3 Tanjung Karang"
                  subView="kalijabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'box-tjk' && (
                <UnitDashboardPage
                  unitCode="tjk"
                  unitName="UP3 Tanjung Karang"
                  subView="box"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {/* Unit Specific Pages - UP3 Metro */}
              {currentPage === 'dashboard-mtr' && (
                <UnitDashboardPage
                  unitCode="mtr"
                  unitName="UP3 Metro"
                  subView="dashboard"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'ftk-mtr' && (
                <UnitDashboardPage
                  unitCode="mtr"
                  unitName="UP3 Metro"
                  subView="ftk"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'monitoringfj-mtr' && (
                <UnitDashboardPage
                  unitCode="mtr"
                  unitName="UP3 Metro"
                  subView="monitoringfj"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'assesment-mtr' && (
                <UnitDashboardPage
                  unitCode="mtr"
                  unitName="UP3 Metro"
                  subView="assesment"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'lamajabat-mtr' && (
                <UnitDashboardPage
                  unitCode="mtr"
                  unitName="UP3 Metro"
                  subView="lamajabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'kalijabat-mtr' && (
                <UnitDashboardPage
                  unitCode="mtr"
                  unitName="UP3 Metro"
                  subView="kalijabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'box-mtr' && (
                <UnitDashboardPage
                  unitCode="mtr"
                  unitName="UP3 Metro"
                  subView="box"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {/* Unit Specific Pages - UP3 Kotabumi */}
              {currentPage === 'dashboard-ktb' && (
                <UnitDashboardPage
                  unitCode="ktb"
                  unitName="UP3 Kotabumi"
                  subView="dashboard"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'ftk-ktb' && (
                <UnitDashboardPage
                  unitCode="ktb"
                  unitName="UP3 Kotabumi"
                  subView="ftk"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'monitoringfj-ktb' && (
                <UnitDashboardPage
                  unitCode="ktb"
                  unitName="UP3 Kotabumi"
                  subView="monitoringfj"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'assesment-ktb' && (
                <UnitDashboardPage
                  unitCode="ktb"
                  unitName="UP3 Kotabumi"
                  subView="assesment"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'lamajabat-ktb' && (
                <UnitDashboardPage
                  unitCode="ktb"
                  unitName="UP3 Kotabumi"
                  subView="lamajabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'kalijabat-ktb' && (
                <UnitDashboardPage
                  unitCode="ktb"
                  unitName="UP3 Kotabumi"
                  subView="kalijabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'box-ktb' && (
                <UnitDashboardPage
                  unitCode="ktb"
                  unitName="UP3 Kotabumi"
                  subView="box"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {/* Unit Specific Pages - UP3 Pringsewu */}
              {currentPage === 'dashboard-psw' && (
                <UnitDashboardPage
                  unitCode="psw"
                  unitName="UP3 Pringsewu"
                  subView="dashboard"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'ftk-psw' && (
                <UnitDashboardPage
                  unitCode="psw"
                  unitName="UP3 Pringsewu"
                  subView="ftk"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'monitoringfj-psw' && (
                <UnitDashboardPage
                  unitCode="psw"
                  unitName="UP3 Pringsewu"
                  subView="monitoringfj"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'assesment-psw' && (
                <UnitDashboardPage
                  unitCode="psw"
                  unitName="UP3 Pringsewu"
                  subView="assesment"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'lamajabat-psw' && (
                <UnitDashboardPage
                  unitCode="psw"
                  unitName="UP3 Pringsewu"
                  subView="lamajabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'kalijabat-psw' && (
                <UnitDashboardPage
                  unitCode="psw"
                  unitName="UP3 Pringsewu"
                  subView="kalijabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'box-psw' && (
                <UnitDashboardPage
                  unitCode="psw"
                  unitName="UP3 Pringsewu"
                  subView="box"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {/* Unit Specific Pages - UP2K Lampung */}
              {currentPage === 'dashboard-up2k' && (
                <UnitDashboardPage
                  unitCode="up2k"
                  unitName="UP2K Lampung"
                  subView="dashboard"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'ftk-up2k' && (
                <UnitDashboardPage
                  unitCode="up2k"
                  unitName="UP2K Lampung"
                  subView="ftk"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'assesment-up2k' && (
                <UnitDashboardPage
                  unitCode="up2k"
                  unitName="UP2K Lampung"
                  subView="assesment"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'lamajabat-up2k' && (
                <UnitDashboardPage
                  unitCode="up2k"
                  unitName="UP2K Lampung"
                  subView="lamajabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'kalijabat-up2k' && (
                <UnitDashboardPage
                  unitCode="up2k"
                  unitName="UP2K Lampung"
                  subView="kalijabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'box-up2k' && (
                <UnitDashboardPage
                  unitCode="up2k"
                  unitName="UP2K Lampung"
                  subView="box"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}

              {/* Unit Specific Pages - UP2D Lampung */}
              {currentPage === 'dashboard-up2d' && (
                <UnitDashboardPage
                  unitCode="up2d"
                  unitName="UP2D Lampung"
                  subView="dashboard"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'ftk-up2d' && (
                <UnitDashboardPage
                  unitCode="up2d"
                  unitName="UP2D Lampung"
                  subView="ftk"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'assesment-up2d' && (
                <UnitDashboardPage
                  unitCode="up2d"
                  unitName="UP2D Lampung"
                  subView="assesment"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'lamajabat-up2d' && (
                <UnitDashboardPage
                  unitCode="up2d"
                  unitName="UP2D Lampung"
                  subView="lamajabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'kalijabat-up2d' && (
                <UnitDashboardPage
                  unitCode="up2d"
                  unitName="UP2D Lampung"
                  subView="kalijabat"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
              {currentPage === 'box-up2d' && (
                <UnitDashboardPage
                  unitCode="up2d"
                  unitName="UP2D Lampung"
                  subView="box"
                  employees={employees}
                  ftkData={ftkData}
                  fnpData={fnpData}
                  allKalijabatItems={allKalijabat}
                  boxTalentData={boxTalentData}
                  monitoringFjData={monitoringFjData}
                  isDark={isDark}
                  onShowToast={showToast}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
