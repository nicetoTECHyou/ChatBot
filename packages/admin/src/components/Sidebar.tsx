'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Radio,
  Cpu,
  MessageSquare,
  Swords,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useDashboardStore, type PanelType } from '@/lib/store';

interface NavItem {
  id: PanelType;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'personas', label: 'Personas', icon: <Users className="w-5 h-5" /> },
  { id: 'channels', label: 'Kanäle', icon: <Radio className="w-5 h-5" /> },
  { id: 'providers', label: 'KI-Anbieter', icon: <Cpu className="w-5 h-5" /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'quests', label: 'Quests', icon: <Swords className="w-5 h-5" /> },
  { id: 'lore', label: 'Lore', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'settings', label: 'Einstellungen', icon: <Settings className="w-5 h-5" /> },
];

export default function Sidebar() {
  const { activePanel, setActivePanel, sidebarCollapsed, toggleSidebar } = useDashboardStore();

  return (
    <aside
      className={`h-full bg-forge-surface/60 backdrop-blur-sm border-r border-forge-border flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-forge-purple/20 text-forge-purple-light border border-forge-purple/30'
                  : 'text-forge-text-dim hover:bg-forge-hover hover:text-forge-text border border-transparent'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className={`flex-shrink-0 transition-colors ${
                isActive ? 'text-forge-purple-light' : 'text-forge-text-muted group-hover:text-forge-text'
              }`}>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <span className="truncate animate-fade-in">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-forge-border">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-forge-text-muted hover:text-forge-text hover:bg-forge-hover transition-all duration-200"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Einklappen</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
