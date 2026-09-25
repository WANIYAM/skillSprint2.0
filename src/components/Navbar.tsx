import React from 'react';
import { UserRole, UserProfile } from '../types';
import {
  ShieldAlert,
  Bot,
  UserCheck,
  BarChart3,
  Settings,
  User,
  Search,
  PlusCircle,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  manualReviewCount: number;
  totalComplaints: number;
  onNewComplaintClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  manualReviewCount,
  totalComplaints,
  onNewComplaintClick,
  searchQuery,
  onSearchChange,
}) => {
  const roles: { role: UserRole; icon: React.ReactNode; label: string; badge?: number }[] = [
    { role: 'Customer', icon: <User className="w-4 h-4" />, label: 'Customer' },
    { role: 'Agent', icon: <Bot className="w-4 h-4" />, label: 'Agent' },
    {
      role: 'Reviewer',
      icon: <UserCheck className="w-4 h-4" />,
      label: 'Reviewer Queue',
      badge: manualReviewCount > 0 ? manualReviewCount : undefined,
    },
    { role: 'Manager', icon: <BarChart3 className="w-4 h-4" />, label: 'Manager' },
    { role: 'Administrator', icon: <Settings className="w-4 h-4" />, label: 'Admin & Matrix' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  SupportNova
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  Dual-Pipeline + Python
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI Intelligence + Python Ground-Truth Validation
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search complaints, orders, tags..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onNewComplaintClick}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-md shadow-blue-600/20 transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Complaint</span>
            </button>
          </div>
        </div>

        {/* Role Navigation Bar */}
        <div className="flex items-center space-x-1 border-t border-slate-800/60 py-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mr-2 hidden sm:inline">
            Active Persona:
          </span>
          {roles.map((item) => {
            const isActive = currentRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => onRoleChange(item.role)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer relative ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
