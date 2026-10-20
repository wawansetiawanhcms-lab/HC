import React, { useState } from 'react';
import {
  PieChart,
  Users2,
  BarChart3,
  Scale,
  Table as TableIcon,
  Layers,
  GitBranch,
  Network,
  Share2,
  AlertTriangle,
  Settings,
  LogOut,
  Building2,
  Zap,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  LayoutGrid,
} from 'lucide-react';
import { PageId, UserRole } from '../types';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  role: UserRole;
  username?: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
  onSwitchRole: (newRole: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  role,
  username,
  isOpenMobile,
  onCloseMobile,
  onLogout,
  onSwitchRole,
}) => {
  const [showUnitMenu, setShowUnitMenu] = useState<boolean>(true);

  const handleNav = (page: PageId) => {
    onNavigate(page);
    onCloseMobile();
  };

  const isRoleUnitManager = [
    'managertjk',
    'managermtr',
    'managerktb',
    'managerpsw',
    'managerup2k',
    'managerup2d',
  ].includes(role);

  const getNavButtonClass = (page: PageId) => {
    const isActive = currentPage === page;
    if (isActive) {
      return 'bg-gradient-to-r from-[#005BAC]/12 to-[#00A651]/10 text-[#005BAC] dark:text-[#00C4CC] border-l-4 border-[#005BAC] dark:border-[#00C4CC] font-bold shadow-xs';
    }
    return 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 font-medium border-l-4 border-transparent';
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`w-72 flex-shrink-0 bg-white/95 dark:bg-slate-900/95 shadow-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-transform duration-300 transform fixed lg:static z-40 h-full ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex flex-shrink-0 items-center px-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_25428b87.png"
              alt="Logo PLN"
              className="w-10 h-10 rounded-xl object-contain shadow-md shadow-amber-500/20"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-[#005BAC] dark:text-[#00C4CC] tracking-tight">
                  MHC
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-extrabold bg-[#00A651]/15 text-[#00A651] dark:text-emerald-400">
                  PLN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                HUMAN CAPITAL
              </p>
            </div>
          </div>
        </div>

        {/* Quick Role Switcher for Admin only */}
        {(role === 'admin' || username === 'admin') && (
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Akses Peran (Role)
              </span>
            </div>
            <select
              value={role}
              onChange={e => onSwitchRole(e.target.value as UserRole)}
              className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0072CE]"
            >
              <option value="admin">Admin (Akses Lengkap)</option>
              <option value="managertjk">Manager UP3 Tanjung Karang</option>
              <option value="managermtr">Manager UP3 Metro</option>
              <option value="managerktb">Manager UP3 Kotabumi</option>
              <option value="managerpsw">Manager UP3 Pringsewu</option>
              <option value="managerup2k">Manager UP2K</option>
              <option value="managerup2d">Manager UP2D</option>
              <option value="user">Staff Human Capital</option>
            </select>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {/* UNIT SPECIFIC MENUS */}
          {role === 'managertjk' && (
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Menu UP3 Tanjung Karang
              </p>
              <button
                onClick={() => handleNav('dashboard-tjk')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'dashboard-tjk'
                )}`}
              >
                <PieChart className="w-4 h-4" />
                <span>Dashboard UP3 TJK</span>
              </button>
              <button
                onClick={() => handleNav('ftk-tjk')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'ftk-tjk'
                )}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Pemenuhan FTK TJK</span>
              </button>
              <button
                onClick={() => handleNav('monitoringfj-tjk')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'monitoringfj-tjk'
                )}`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Monitoring FJ TJK</span>
              </button>
              <button
                onClick={() => handleNav('assesment-tjk')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'assesment-tjk'
                )}`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Hasil FNP</span>
              </button>
              <button
                onClick={() => handleNav('lamajabat-tjk')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'lamajabat-tjk'
                )}`}
              >
                <Clock className="w-4 h-4" />
                <span>Lama Jabatan TJK</span>
              </button>
              <button
                onClick={() => handleNav('kalijabat-tjk')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'kalijabat-tjk'
                )}`}
              >
                <Layers className="w-4 h-4" />
                <span>Kali Jabat TJK</span>
              </button>
              <button
                onClick={() => handleNav('box-tjk')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'box-tjk'
                )}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Box Talent TJK</span>
              </button>
            </div>
          )}

          {role === 'managermtr' && (
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Menu UP3 Metro
              </p>
              <button
                onClick={() => handleNav('dashboard-mtr')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'dashboard-mtr'
                )}`}
              >
                <PieChart className="w-4 h-4" />
                <span>Dashboard UP3 Metro</span>
              </button>
              <button
                onClick={() => handleNav('ftk-mtr')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'ftk-mtr'
                )}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Pemenuhan FTK MTR</span>
              </button>
              <button
                onClick={() => handleNav('monitoringfj-mtr')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'monitoringfj-mtr'
                )}`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Monitoring FJ MTR</span>
              </button>
              <button
                onClick={() => handleNav('assesment-mtr')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'assesment-mtr'
                )}`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Hasil FNP MTR</span>
              </button>
              <button
                onClick={() => handleNav('lamajabat-mtr')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'lamajabat-mtr'
                )}`}
              >
                <Clock className="w-4 h-4" />
                <span>Lama Jabatan MTR</span>
              </button>
              <button
                onClick={() => handleNav('kalijabat-mtr')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'kalijabat-mtr'
                )}`}
              >
                <Layers className="w-4 h-4" />
                <span>Kali Jabat MTR</span>
              </button>
              <button
                onClick={() => handleNav('box-mtr')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'box-mtr'
                )}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Box Talent MTR</span>
              </button>
            </div>
          )}

          {role === 'managerktb' && (
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Menu UP3 Kotabumi
              </p>
              <button
                onClick={() => handleNav('dashboard-ktb')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'dashboard-ktb'
                )}`}
              >
                <PieChart className="w-4 h-4" />
                <span>Dashboard UP3 Kotabumi</span>
              </button>
              <button
                onClick={() => handleNav('ftk-ktb')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'ftk-ktb'
                )}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Pemenuhan FTK KTB</span>
              </button>
              <button
                onClick={() => handleNav('monitoringfj-ktb')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'monitoringfj-ktb'
                )}`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Monitoring FJ KTB</span>
              </button>
              <button
                onClick={() => handleNav('assesment-ktb')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'assesment-ktb'
                )}`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Hasil FNP KTB</span>
              </button>
              <button
                onClick={() => handleNav('lamajabat-ktb')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'lamajabat-ktb'
                )}`}
              >
                <Clock className="w-4 h-4" />
                <span>Lama Jabatan KTB</span>
              </button>
              <button
                onClick={() => handleNav('kalijabat-ktb')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'kalijabat-ktb'
                )}`}
              >
                <Layers className="w-4 h-4" />
                <span>Kali Jabat KTB</span>
              </button>
              <button
                onClick={() => handleNav('box-ktb')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'box-ktb'
                )}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Box Talent KTB</span>
              </button>
            </div>
          )}

          {role === 'managerpsw' && (
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Menu UP3 Pringsewu
              </p>
              <button
                onClick={() => handleNav('dashboard-psw')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'dashboard-psw'
                )}`}
              >
                <PieChart className="w-4 h-4" />
                <span>Dashboard UP3 Pringsewu</span>
              </button>
              <button
                onClick={() => handleNav('ftk-psw')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'ftk-psw'
                )}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Pemenuhan FTK PSW</span>
              </button>
              <button
                onClick={() => handleNav('monitoringfj-psw')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'monitoringfj-psw'
                )}`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Monitoring FJ PSW</span>
              </button>
              <button
                onClick={() => handleNav('assesment-psw')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'assesment-psw'
                )}`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Hasil FNP PSW</span>
              </button>
              <button
                onClick={() => handleNav('lamajabat-psw')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'lamajabat-psw'
                )}`}
              >
                <Clock className="w-4 h-4" />
                <span>Lama Jabatan PSW</span>
              </button>
              <button
                onClick={() => handleNav('kalijabat-psw')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'kalijabat-psw'
                )}`}
              >
                <Layers className="w-4 h-4" />
                <span>Kali Jabat PSW</span>
              </button>
              <button
                onClick={() => handleNav('box-psw')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'box-psw'
                )}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Box Talent PSW</span>
              </button>
            </div>
          )}

          {role === 'managerup2k' && (
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Menu UP2K Lampung
              </p>
              <button
                onClick={() => handleNav('dashboard-up2k')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'dashboard-up2k'
                )}`}
              >
                <PieChart className="w-4 h-4" />
                <span>Dashboard UP2K</span>
              </button>
              <button
                onClick={() => handleNav('ftk-up2k')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'ftk-up2k'
                )}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Pemenuhan FTK UP2K</span>
              </button>
              <button
                onClick={() => handleNav('assesment-up2k')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'assesment-up2k'
                )}`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Hasil FNP UP2K</span>
              </button>
              <button
                onClick={() => handleNav('lamajabat-up2k')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'lamajabat-up2k'
                )}`}
              >
                <Clock className="w-4 h-4" />
                <span>Lama Jabatan UP2K</span>
              </button>
              <button
                onClick={() => handleNav('kalijabat-up2k')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'kalijabat-up2k'
                )}`}
              >
                <Layers className="w-4 h-4" />
                <span>Kali Jabat UP2K</span>
              </button>
              <button
                onClick={() => handleNav('box-up2k')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'box-up2k'
                )}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Box Talent UP2K</span>
              </button>
            </div>
          )}

          {role === 'managerup2d' && (
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Menu UP2D Lampung
              </p>
              <button
                onClick={() => handleNav('dashboard-up2d')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'dashboard-up2d'
                )}`}
              >
                <PieChart className="w-4 h-4" />
                <span>Dashboard UP2D</span>
              </button>
              <button
                onClick={() => handleNav('ftk-up2d')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'ftk-up2d'
                )}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Pemenuhan FTK UP2D</span>
              </button>
              <button
                onClick={() => handleNav('assesment-up2d')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'assesment-up2d'
                )}`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Hasil FNP UP2D</span>
              </button>
              <button
                onClick={() => handleNav('lamajabat-up2d')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'lamajabat-up2d'
                )}`}
              >
                <Clock className="w-4 h-4" />
                <span>Lama Jabatan UP2D</span>
              </button>
              <button
                onClick={() => handleNav('kalijabat-up2d')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'kalijabat-up2d'
                )}`}
              >
                <Layers className="w-4 h-4" />
                <span>Kali Jabat UP2D</span>
              </button>
              <button
                onClick={() => handleNav('box-up2d')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                  'box-up2d'
                )}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Box Talent UP2D</span>
              </button>
            </div>
          )}

          {/* MAIN MONITORING FOR ADMIN & STAFF */}
          {!isRoleUnitManager && (
            <>
              <div>
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Monitoring Utama
                </p>
                <button
                  onClick={() => handleNav('dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'dashboard'
                  )}`}
                >
                  <PieChart className="w-4 h-4" />
                  <span>Dashboard Utama</span>
                </button>
                <button
                  onClick={() => handleNav('mobility')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'mobility'
                  )}`}
                >
                  <Users2 className="w-4 h-4" />
                  <span>Monev Mobility</span>
                </button>
                <button
                  onClick={() => handleNav('ftk')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'ftk'
                  )}`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Monev FTK</span>
                </button>
                <button
                  onClick={() => handleNav('fnp')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'fnp'
                  )}`}
                >
                  <Scale className="w-4 h-4" />
                  <span>Monev FnP</span>
                </button>
                <button
                  onClick={() => handleNav('grade')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'grade'
                  )}`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>Monev Grade</span>
                </button>
              </div>

              <div className="pt-3">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Analisa Jabatan
                </p>
                <button
                  onClick={() => handleNav('kalijabat')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'kalijabat'
                  )}`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Kali Jabat SPVD</span>
                </button>
                <button
                  onClick={() => handleNav('kalijabata')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'kalijabata'
                  )}`}
                >
                  <GitBranch className="w-4 h-4" />
                  <span>Kali Jabat SPVA NPU</span>
                </button>
                <button
                  onClick={() => handleNav('kalijabatpu')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'kalijabatpu'
                  )}`}
                >
                  <Network className="w-4 h-4" />
                  <span>Kali Jabat SPVA PU</span>
                </button>
                <button
                  onClick={() => handleNav('kalijabatmdnpu')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'kalijabatmdnpu'
                  )}`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kali Jabat MDNPU</span>
                </button>
                <button
                  onClick={() => handleNav('pegpog')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                    'pegpog'
                  )}`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 font-bold">PeG &gt; PoG (Anomali)</span>
                </button>
              </div>

              {/* Admin Unit Shortcuts */}
              {role === 'admin' && (
                <div className="pt-3">
                  <button
                    onClick={() => setShowUnitMenu(!showUnitMenu)}
                    className="w-full flex items-center justify-between px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2"
                  >
                    <span>Monitoring Per Unit</span>
                    {showUnitMenu ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {showUnitMenu && (
                    <div className="space-y-1 pl-1">
                      <button
                        onClick={() => handleNav('dashboard-tjk')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${getNavButtonClass(
                          'dashboard-tjk'
                        )}`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>UP3 Tanjung Karang</span>
                      </button>
                      <button
                        onClick={() => handleNav('dashboard-mtr')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${getNavButtonClass(
                          'dashboard-mtr'
                        )}`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-cyan-500" />
                        <span>UP3 Metro</span>
                      </button>
                      <button
                        onClick={() => handleNav('dashboard-ktb')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${getNavButtonClass(
                          'dashboard-ktb'
                        )}`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-teal-500" />
                        <span>UP3 Kotabumi</span>
                      </button>
                      <button
                        onClick={() => handleNav('dashboard-psw')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${getNavButtonClass(
                          'dashboard-psw'
                        )}`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>UP3 Pringsewu</span>
                      </button>
                      <button
                        onClick={() => handleNav('dashboard-up2k')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${getNavButtonClass(
                          'dashboard-up2k'
                        )}`}
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-500" />
                        <span>UP2K Lampung</span>
                      </button>
                      <button
                        onClick={() => handleNav('dashboard-up2d')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${getNavButtonClass(
                          'dashboard-up2d'
                        )}`}
                      >
                        <Network className="w-3.5 h-3.5 text-indigo-500" />
                        <span>UP2D Lampung</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* System Settings for Admin */}
              {role === 'admin' && (
                <div className="pt-3">
                  <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Sistem
                  </p>
                  <button
                    onClick={() => handleNav('setting')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${getNavButtonClass(
                      'setting'
                    )}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Pengaturan</span>
                  </button>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Logout Section */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-850/60 flex-shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 transition-colors shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
