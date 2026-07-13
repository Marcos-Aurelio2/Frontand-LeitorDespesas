/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  FolderTree, 
  Settings, 
  Download, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onExport: () => void;
  isOpenOnMobile: boolean;
  setIsOpenOnMobile: (open: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  onExport,
  isOpenOnMobile,
  setIsOpenOnMobile
}: SidebarProps) {

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpenOnMobile(false); // Auto-close on mobile selection
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#0a0e14] border-r border-[#1a2a3a] shadow-[4px_0_20px_rgba(0,0,0,0.55)] w-64 text-slate-300">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1a2a3a]">
        <div className="flex justify-between items-center">
          <h1 className="font-display text-lg font-bold text-[#95ccff] tracking-tight uppercase">
            FINANCE_CORE
          </h1>
          {/* Close button for mobile views */}
          <button 
            type="button"
            onClick={() => setIsOpenOnMobile(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded hover:bg-slate-850"
          >
            <X size={20} />
          </button>
        </div>
        <p className="font-mono text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
          Terminal Session: 0x92a2b6
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 mt-6 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full px-5 py-3.5 flex items-center gap-4 transition-all duration-300 text-left cursor-pointer group ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border-l-4 border-sky-400 shadow-[inset_4px_0_12px_rgba(14,165,233,0.05)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <IconComponent 
                size={20} 
                className={`transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400'
                }`} 
              />
              <span className="font-mono text-xs uppercase tracking-widest font-semibold">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer Sidebar Actions */}
      <div className="p-4 border-t border-[#1a2a3a] space-y-3 bg-[#0d121c]/45">
        <button
          type="button"
          onClick={onExport}
          className="w-full bg-[#00a8ff]/10 hover:bg-[#00a8ff]/25 border border-[#00a8ff]/40 text-sky-400 font-display text-xs font-bold uppercase py-2.5 rounded shadow-[0_0_15px_rgba(0,168,255,0.08)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download size={14} />
          <span>Export Data</span>
        </button>
        
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-2.5 text-slate-400 hover:text-red-400 transition-colors uppercase cursor-pointer"
        >
          <LogOut size={16} />
          <span className="font-mono text-xs uppercase tracking-widest font-semibold">
            Logout
          </span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Mobile Drawer button header */}
      <div className="md:hidden fixed top-4 left-4 z-40 bg-[#10141a] border border-slate-800 p-2 rounded-lg shadow-lg">
        <button
          type="button"
          onClick={() => setIsOpenOnMobile(true)}
          className="text-slate-300 hover:text-sky-400 focus:outline-none"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpenOnMobile && (
        <div 
          onClick={() => setIsOpenOnMobile(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Sidebar Desktop (Fixed left) */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile (Sliding Drawer) */}
      <aside 
        className={`md:hidden fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300 ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
