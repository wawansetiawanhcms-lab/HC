import React from 'react';
import { Menu, Moon, Sun, RefreshCw, UserCheck, Shield } from 'lucide-react';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
  isDark: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  username: string;
  role: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  pageSubtitle,
  isDark,
  toggleTheme,
  toggleSidebar,
  username,
  role,
  onRefresh,
  isRefreshing,
}) => {
  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    managertjk: 'Manager UP3 TJK',
    managermtr: 'Manager UP3 Metro',
    managerktb: 'Manager UP3 Kotabumi',
    managerpsw: 'Manager UP3 Pringsewu',
    managerup2k: 'Manager UP2K',
    managerup2d: 'Manager UP2D',
    user: 'Human Capital Staff',
  };

  return (
    <header className="h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 dark:border-slate-800/80 flex flex-shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8 z-20 transition-colors duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="lg:hidden p-2.5 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[#005BAC] dark:text-[#00C4CC] tracking-tight truncate">
            {pageTitle}
          </h2>
          {pageSubtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:block">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        {/* User Role Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-semibold shadow-xs">
          {role === 'admin' ? (
            <Shield className="w-3.5 h-3.5 text-[#00A651]" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-[#0072CE]" />
          )}
          <span className="capitalize">{username}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-[#005BAC]/10 dark:bg-[#00C4CC]/20 text-[#005BAC] dark:text-[#00C4CC] text-[10px] font-bold">
            {roleLabels[role] || role}
          </span>
        </div>

        {/* Reload Data Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Sinkronisasi Data Google Sheet"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0072CE]' : ''}`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>
    </header>
  );
};
