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

// Palette
const P = {
  oliveGray: '#373F51',
  warmGold: '#58A4B0',
  burntSienna: '#A9BCD0',
  darkOliveGold: '#506176',
  deepMahogany: '#293241',
  bgDark: '#373F51',
  bgCard: 'rgba(41, 50, 65, 0.94)',
  bgCardLight: 'rgba(80, 97, 118, 0.35)',
  bgInput: 'rgba(41, 50, 65, 0.95)',
  borderSubtle: 'rgba(169, 188, 208, 0.2)',
  borderMedium: 'rgba(169, 188, 208, 0.36)',
  borderStrong: 'rgba(88, 164, 176, 0.5)',
  textPrimary: '#F4F6FA',
  textSecondary: '#D8DBE2',
  textMuted: '#A9BCD0',
  accentGold: '#58A4B0',
  accentGoldLight: '#8CC9D0',
  accentGoldDark: '#3E8390',
  danger: '#506176',
  dangerLight: '#A9BCD0',
  success: '#58A4B0',
  successLight: '#8CC9D0',
};

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
        return { background: 'rgba(88, 164, 176, 0.15)', color: '#8CC9D0', border: '1px solid rgba(88, 164, 176, 0.3)' };
      case 'Agent':
        return { background: 'rgba(88, 164, 176, 0.12)', color: '#8CC9D0', border: '1px solid rgba(88, 164, 176, 0.3)' };
      case 'Reviewer':
        return { background: 'rgba(169, 188, 208, 0.12)', color: '#A9BCD0', border: '1px solid rgba(169, 188, 208, 0.3)' };
      case 'Manager':
        return { background: 'rgba(80, 97, 118, 0.4)', color: '#D8DBE2', border: '1px solid rgba(169, 188, 208, 0.3)' };
      case 'Administrator':
        return { background: 'rgba(41, 50, 65, 0.7)', color: '#A9BCD0', border: '1px solid rgba(169, 188, 208, 0.3)' };
    }
  };

  const getRolePortalName = (role: UserRole) => {
    switch (role) {
      case 'Customer':
        return 'Customer Portal';
      case 'Agent':
        return 'Agent Workspace';
      case 'Reviewer':
        return 'Review requests';
      case 'Manager':
        return 'Team overview';
      case 'Administrator':
        return 'Admin tools';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Customer':
        return <User className="w-4 h-4" style={{ color: '#8CC9D0' }} />;
      case 'Agent':
        return <Bot className="w-4 h-4" style={{ color: '#58A4B0' }} />;
      case 'Reviewer':
        return <UserCheck className="w-4 h-4" style={{ color: '#A9BCD0' }} />;
      case 'Manager':
        return <BarChart3 className="w-4 h-4" style={{ color: '#D8DBE2' }} />;
      case 'Administrator':
        return <Settings className="w-4 h-4" style={{ color: '#A9BCD0' }} />;
    }
  };

  return (
    <header
      className="support-navbar backdrop-blur sticky top-0 z-40"
      style={{
        background: 'rgba(13, 15, 10, 0.92)',
        borderBottom: `1px solid ${P.borderSubtle}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="support-navbar-brand flex items-center space-x-3">
            <div
              className="support-navbar-mark w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${P.accentGold} 0%, ${P.burntSienna} 55%, ${P.deepMahogany} 100%)`,
                boxShadow: `0 8px 24px rgba(122, 68, 25, 0.45)`,
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: '#21170b' }} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className="font-bold text-lg tracking-tight"
                  style={{
                    background: `linear-gradient(to right, ${P.textPrimary}, ${P.warmGold}, ${P.textSecondary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  SupportNova
                </span>
                <span
                  className="support-navbar-role px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded"
                  style={getRoleBadgeStyle(currentUser.role)}
                >
                  {getRolePortalName(currentUser.role)}
                </span>
              </div>
              <p className="text-[11px] hidden sm:block" style={{ color: P.textMuted }}>
                Tools for handling and reviewing support requests
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5" style={{ color: P.textMuted }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={
                  currentUser.role === 'Customer'
                    ? 'Search my requests or orders...'
                    : 'Search requests, people, or topics...'
                }
                className="w-full rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none transition"
                style={{
                  background: P.bgInput,
                  border: `1px solid ${P.borderMedium}`,
                  color: P.textPrimary,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = P.accentGold;
                  e.currentTarget.style.boxShadow = `0 0 0 1px rgba(229, 183, 93, 0.32)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = P.borderMedium;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2.5">
            {/* Customer New Ticket Button */}
            {currentUser.role === 'Customer' && onNewComplaintClick && (
              <button
                onClick={onNewComplaintClick}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 cursor-pointer"
                style={{
                  background: `linear-gradient(180deg, ${P.accentGold} 0%, ${P.accentGoldDark} 100%)`,
                  color: '#21170b',
                  boxShadow: `0 8px 20px rgba(211, 145, 44, 0.35)`,
                  border: 'none',
                }}
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Submit Ticket</span>
              </button>
            )}

            {/* Reviewer Pending Queue Counter */}
            {currentUser.role === 'Reviewer' && manualReviewCount > 0 && (
              <div
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  background: 'rgba(117, 92, 27, 0.18)',
                  border: `1px solid rgba(117, 92, 27, 0.4)`,
                  color: '#b89545',
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{manualReviewCount} Pending Review</span>
              </div>
            )}

            {/* User Profile Button */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="support-navbar-profile flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer"
                style={{
                  background: P.bgCardLight,
                  border: `1px solid ${P.borderSubtle}`,
                  color: P.textPrimary,
                }}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]"
                  style={{
                    background: 'rgba(215, 190, 130, 0.15)',
                    color: P.warmGold,
                    border: `1px solid rgba(215, 190, 130, 0.3)`,
                  }}
                >
                  {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="font-semibold text-xs leading-none">{currentUser.name}</p>
                  <p className="text-[10px] leading-tight mt-0.5" style={{ color: P.textMuted }}>
                    {currentUser.title || currentUser.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: P.textMuted }} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div
                  className="support-navbar-dropdown absolute right-0 mt-2 w-64 rounded-xl py-2 z-50 animate-in fade-in"
                  style={{
                    background: 'rgba(20, 22, 14, 0.98)',
                    border: `1px solid ${P.borderStrong}`,
                    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6)',
                  }}
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2.5" style={{ borderBottom: `1px solid ${P.borderSubtle}` }}>
                    <p className="text-xs font-semibold" style={{ color: P.textPrimary }}>{currentUser.name}</p>
                    <p className="text-[11px] truncate" style={{ color: P.textMuted }}>{currentUser.email}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 text-[10px] font-semibold rounded"
                        style={getRoleBadgeStyle(currentUser.role)}
                      >
                        {currentUser.role}
                      </span>
                      {currentUser.department && (
                        <span className="text-[10px]" style={{ color: P.textMuted }}>{currentUser.department}</span>
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
                        className="w-full text-left px-3.5 py-2 text-xs flex items-center space-x-2 cursor-pointer transition"
                        style={{ color: P.textSecondary }}
                      >
                        <User className="w-3.5 h-3.5" style={{ color: P.accentGold }} />
                        <span>My profile and account</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs flex items-center space-x-2 cursor-pointer border-t mt-1 transition"
                      style={{
                        color: '#e8a0a0',
                        borderTop: `1px solid ${P.borderSubtle}`,
                      }}
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
              className="md:hidden p-2 rounded-lg transition cursor-pointer"
              style={{ color: P.textMuted }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          className="support-navbar-mobile md:hidden px-4 pt-3 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200"
          style={{
            background: 'rgba(13, 15, 10, 0.97)',
            borderTop: `1px solid ${P.borderSubtle}`,
          }}
        >
          {/* Mobile Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5" style={{ color: P.textMuted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
              style={{
                background: P.bgInput,
                border: `1px solid ${P.borderMedium}`,
                color: P.textPrimary,
              }}
            />
          </div>

          {/* User Info Card */}
          <div
            className="support-navbar-mobile-user flex items-center justify-between p-3 rounded-xl"
            style={{
              background: P.bgCardLight,
              border: `1px solid ${P.borderSubtle}`,
            }}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                style={{
                  background: 'rgba(215, 190, 130, 0.15)',
                  color: P.warmGold,
                  border: `1px solid rgba(215, 190, 130, 0.3)`,
                }}
              >
                {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: P.textPrimary }}>{currentUser.name}</p>
                <p className="text-[10px]" style={{ color: P.textMuted }}>{currentUser.email}</p>
              </div>
            </div>
            <span
              className="px-2 py-0.5 text-[10px] font-semibold rounded"
              style={getRoleBadgeStyle(currentUser.role)}
            >
              {currentUser.role}
            </span>
          </div>

          {/* Mobile Actions */}
          <div className="pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${P.borderSubtle}` }}>
            {onOpenProfileModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfileModal();
                }}
                className="text-xs font-medium cursor-pointer flex items-center space-x-1"
                style={{ color: P.textSecondary }}
              >
                <User className="w-3.5 h-3.5" style={{ color: P.accentGold }} />
                <span>Profile</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSignOut();
              }}
              className="flex items-center space-x-1 text-xs font-medium cursor-pointer"
              style={{ color: '#e8a0a0' }}
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