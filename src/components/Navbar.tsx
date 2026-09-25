import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types/index.ts';
import {
  Sparkles,
  Search,
  PlusCircle,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User,
  Bot,
  UserCheck,
  BarChart3,
  Settings,
  Shield,
  FileText,
  HelpCircle,
  Layers,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Users,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  manualReviewCount: number;
  totalComplaints: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenProfileModal?: () => void;
  onSignOut: () => void;
  activeNavTab?: string;
  onNavTabChange?: (tab: string) => void;
  onNewComplaintClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  manualReviewCount,
  totalComplaints,
  searchQuery,
  onSearchChange,
  onOpenProfileModal,
  onSignOut,
  activeNavTab,
  onNavTabChange,
  onNewComplaintClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Customer':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Agent':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Reviewer':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Manager':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Administrator':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
  };

  const getRolePortalName = (role: UserRole) => {
    switch (role) {
      case 'Customer':
        return 'Customer Portal';
      case 'Agent':
        return 'Agent Workspace';
      case 'Reviewer':
        return 'QA Reviewer Queue';
      case 'Manager':
        return 'Manager Operations';
      case 'Administrator':
        return 'Admin Governance';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Customer':
        return <User className="w-4 h-4 text-emerald-400" />;
      case 'Agent':
        return <Bot className="w-4 h-4 text-blue-400" />;
      case 'Reviewer':
        return <UserCheck className="w-4 h-4 text-amber-400" />;
      case 'Manager':
        return <BarChart3 className="w-4 h-4 text-purple-400" />;
      case 'Administrator':
        return <Settings className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  SupportNova
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
                  {getRolePortalName(currentUser.role)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Dual-Pipeline AI Intelligence & Ground-Truth Verification
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
                placeholder={
                  currentUser.role === 'Customer'
                    ? 'Search my complaints, orders...'
                    : 'Search complaints, tags, categories...'
                }
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2.5">
            {/* Customer New Ticket Button */}
            {currentUser.role === 'Customer' && onNewComplaintClick && (
              <button
                onClick={onNewComplaintClick}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-md shadow-blue-600/20 transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Submit Ticket</span>
              </button>
            )}

            {/* Reviewer Pending Queue Counter */}
            {currentUser.role === 'Reviewer' && manualReviewCount > 0 && (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{manualReviewCount} Pending Review</span>
              </div>
            )}

            {/* User Profile Button */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-200 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="font-semibold text-xs leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{currentUser.title || currentUser.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-800">
                    <p className="text-xs font-semibold text-slate-100">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
                        {currentUser.role}
                      </span>
                      {currentUser.department && (
                        <span className="text-[10px] text-slate-400">{currentUser.department}</span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    {onOpenProfileModal && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenProfileModal();
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center space-x-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span>My Profile & Session Details</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800/70 flex items-center space-x-2 cursor-pointer border-t border-slate-800/60 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur px-4 pt-3 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Mobile Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* User Info Card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-100">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400">{currentUser.email}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>

          {/* Mobile Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            {onOpenProfileModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfileModal();
                }}
                className="text-xs text-slate-300 font-medium cursor-pointer flex items-center space-x-1"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Profile</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSignOut();
              }}
              className="flex items-center space-x-1 text-xs text-rose-400 font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
