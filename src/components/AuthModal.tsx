import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Shield,
  KeyRound,
  Bot,
  User,
  Settings,
  BarChart3,
  Check,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  Briefcase,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  CheckCircle2,
  Info,
  Phone,
  Layers,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onLoginWithCredentials?: (email: string, password?: string) => Promise<boolean>;
  onRegisterUser?: (userData: any) => Promise<boolean>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSelectUser,
  onLoginWithCredentials,
  onRegisterUser,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'personas' | 'matrix'>('signin');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form State
  const [selectedSignupRole, setSelectedSignupRole] = useState<UserRole>('Customer');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpDepartment, setSignUpDepartment] = useState('Customer Support');
  const [signUpCompany, setSignUpCompany] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmployeeId, setSignUpEmployeeId] = useState('');
  const [signUpClearanceKey, setSignUpClearanceKey] = useState('');
  const [signUpApprovalLimit, setSignUpApprovalLimit] = useState('$5,000');
  const [signUpAuditScope, setSignUpAuditScope] = useState('Hardware & Billing Compliance');
  const [avatarColor, setAvatarColor] = useState('from-blue-600 to-indigo-600');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const roleDescriptions: Record<UserRole, { title: string; desc: string; icon: React.ReactNode; color: string; badge: string }> = {
    Customer: {
      title: 'Customer / Client',
      desc: 'Submit support tickets, track dual-pipeline processing live, communicate with agents, and rate resolution satisfaction.',
      icon: <User className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    Agent: {
      title: 'Support Specialist (Agent)',
      desc: 'Triage assigned cases, evaluate AI-drafted responses, verify cited policy clauses, and dispatch solutions to customers.',
      icon: <Bot className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    Reviewer: {
      title: 'QA & Compliance Reviewer',
      desc: 'Audit high-risk and flagged cases in the manual review queue, verify policy eligibility, and execute decision overrides.',
      icon: <UserCheck className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    Manager: {
      title: 'Operations Manager',
      desc: 'Monitor real-time SLA adherence, CSAT quality ratings, agent performance leaderboards, and reassign escalations.',
      icon: <BarChart3 className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/40 bg-purple-950/20 text-purple-400',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    Administrator: {
      title: 'System Administrator',
      desc: 'Manage users, configure Decision Rule Matrix entries, update Gemini Prompt Templates, ingest Policy documents, and run security tests.',
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
  };

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 50) return { score, label: 'Moderate', color: 'bg-amber-500' };
    if (score <= 75) return { score, label: 'Strong', color: 'bg-blue-500' };
    return { score: 100, label: 'Enterprise Grade', color: 'bg-emerald-500' };
  };

  const pwdStrength = calculatePasswordStrength(signUpPassword);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!signInEmail.trim()) {
      setAuthError('Please provide your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      if (onLoginWithCredentials) {
        const success = await onLoginWithCredentials(signInEmail.trim(), signInPassword);
        if (success) {
          setAuthSuccess(`Welcome back! Authenticated as ${signInEmail}`);
          setTimeout(() => onClose(), 600);
        } else {
          setAuthError('Sign in failed. Ensure email is registered or use a 1-click persona.');
        }
      } else {
        const matched = users.find((u) => u.email.toLowerCase() === signInEmail.trim().toLowerCase());
        if (matched) {
          onSelectUser(matched);
          onClose();
        } else {
          setAuthError('User not found. Please sign up or select a demo persona.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!signUpName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (signUpPassword && signUpPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: signUpName.trim(),
        email: signUpEmail.trim().toLowerCase(),
        role: selectedSignupRole,
        department: selectedSignupRole === 'Customer' ? undefined : signUpDepartment,
        company: signUpCompany.trim() || undefined,
        phone: signUpPhone.trim() || undefined,
        title:
          selectedSignupRole === 'Customer'
            ? 'Client Representative'
            : selectedSignupRole === 'Agent'
            ? `Support Specialist (${signUpDepartment})`
            : selectedSignupRole === 'Reviewer'
            ? 'Senior QA Compliance Auditor'
            : selectedSignupRole === 'Manager'
            ? 'Operations & SLA Team Lead'
            : 'Lead System Administrator',
        password: signUpPassword,
      };

      if (onRegisterUser) {
        const ok = await onRegisterUser(payload);
        if (ok) {
          setAuthSuccess(`Account created successfully as ${selectedSignupRole}! Launching workspace...`);
          setTimeout(() => onClose(), 700);
          return;
        }
      }

      // Direct API call fallback
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create account.');
      }

      const data = await res.json();
      onSelectUser(data.user);
      setAuthSuccess(`Account created! Welcome to SupportNova, ${data.user.name}.`);
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>SupportNova Identity & Access</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  Multi-Role Auth
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sign in, create a tailored role account, or select enterprise demo personas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-4 sm:px-6 pt-2 space-x-2 sm:space-x-4 bg-slate-900/50 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('signin');
              setAuthError(null);
            }}
            className={`pb-3 pt-1 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'signin'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('signup');
              setAuthError(null);
            }}
            className={`pb-3 pt-1 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'signup'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register by Role</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('personas');
              setAuthError(null);
            }}
            className={`pb-3 pt-1 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'personas'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Personas</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('matrix');
              setAuthError(null);
            }}
            className={`pb-3 pt-1 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'matrix'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>RBAC Matrix</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Notifications */}
          {authError && (
            <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="max-w-md mx-auto py-2 space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-sm font-semibold text-slate-100">Welcome to SupportNova</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign in with your enterprise credentials to access your assigned role workspace
                </p>
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="e.g. marcus.vance@supportnova.internal"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Password</label>
                    <span className="text-[10px] text-slate-400">Demo mode accepts any password</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showSignInPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                    />
                    <span>Remember this session</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('personas')}
                    className="text-blue-400 hover:underline text-[11px] cursor-pointer"
                  >
                    Use 1-click demo persona
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2 mt-2"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In & Open Workspace</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Sample Account Shortcuts */}
              <div className="pt-3 border-t border-slate-800">
                <p className="text-[11px] font-medium text-slate-400 mb-2">Quick Sign-In Sample Accounts:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {users.slice(0, 6).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSignInEmail(u.email);
                        setSignInPassword('password123');
                      }}
                      className="text-left px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white transition truncate cursor-pointer"
                    >
                      <div className="font-semibold truncate">{u.name.split(' ')[0]}</div>
                      <div className="text-[9px] text-slate-400">{u.role}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP / REGISTER BY ROLE */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Step 1: Select Your Operating Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(['Customer', 'Agent', 'Reviewer', 'Manager', 'Administrator'] as UserRole[]).map((r) => {
                    const info = roleDescriptions[r];
                    const isSelected = selectedSignupRole === r;
                    return (
                      <div
                        key={r}
                        onClick={() => setSelectedSignupRole(r)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? `${info.color} ring-1 ring-blue-500 shadow-md`
                            : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                              {info.icon}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white flex items-center space-x-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>Selected</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-100">{info.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {info.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Role Details & Form Fields */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <span>Step 2: Profile & Credentials for</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${roleDescriptions[selectedSignupRole].badge}`}>
                      {selectedSignupRole}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400">Instant RBAC Clearance</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder={selectedSignupRole === 'Customer' ? 'e.g. Jordan Lee' : 'e.g. Dr. Alex Morgan'}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder={
                        selectedSignupRole === 'Customer'
                          ? 'jordan.lee@example.com'
                          : 'alex.morgan@supportnova.internal'
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Role-Specific Custom Fields */}
                {selectedSignupRole === 'Customer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Company or Account Reference
                      </label>
                      <input
                        type="text"
                        value={signUpCompany}
                        onChange={(e) => setSignUpCompany(e.target.value)}
                        placeholder="e.g. Nova Innovations Corp"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {selectedSignupRole === 'Agent' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Assigned Support Department
                      </label>
                      <select
                        value={signUpDepartment}
                        onChange={(e) => setSignUpDepartment(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Customer Support">Customer Support (General)</option>
                        <option value="Hardware Diagnostics">Hardware Diagnostics</option>
                        <option value="Billing & Finance">Billing & Finance</option>
                        <option value="Account & Security">Account & Security</option>
                        <option value="Logistics & Shipping">Logistics & Shipping</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={signUpEmployeeId}
                        onChange={(e) => setSignUpEmployeeId(e.target.value)}
                        placeholder="AGT-8821"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {selectedSignupRole === 'Reviewer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        QA & Compliance Specialization
                      </label>
                      <input
                        type="text"
                        value={signUpAuditScope}
                        onChange={(e) => setSignUpAuditScope(e.target.value)}
                        placeholder="Regulatory, Safety & Financial Risk"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Reviewer Certification ID
                      </label>
                      <input
                        type="text"
                        value={signUpEmployeeId}
                        onChange={(e) => setSignUpEmployeeId(e.target.value)}
                        placeholder="REV-CERT-904"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {selectedSignupRole === 'Manager' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Managed Department
                      </label>
                      <select
                        value={signUpDepartment}
                        onChange={(e) => setSignUpDepartment(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Customer Support">All Operations & Triage</option>
                        <option value="Hardware Diagnostics">Hardware Diagnostics</option>
                        <option value="Billing & Finance">Billing & Finance</option>
                        <option value="Account & Security">Account & Security</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Escalation Refund Approval Limit
                      </label>
                      <input
                        type="text"
                        value={signUpApprovalLimit}
                        onChange={(e) => setSignUpApprovalLimit(e.target.value)}
                        placeholder="$10,000"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {selectedSignupRole === 'Administrator' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Admin Security Clearance Key
                      </label>
                      <input
                        type="text"
                        value={signUpClearanceKey}
                        onChange={(e) => setSignUpClearanceKey(e.target.value)}
                        placeholder="AUTH-ADM-KEY-2026 (Optional in Demo)"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Governance Scope
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="Full Platform, Matrix, Policies & AI Prompts"
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Password & Strength Meter */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-300">
                      Create Password
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Strength: <strong className="text-slate-200">{pwdStrength.label}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-9 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {/* Strength Bar */}
                  <div className="w-full bg-slate-700 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full ${pwdStrength.color} transition-all duration-300`}
                      style={{ width: `${Math.max(pwdStrength.score, 5)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Live RBAC Permission Preview */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
                <div className="flex items-center space-x-1.5 text-blue-400 font-semibold mb-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Assigned RBAC Capabilities for {selectedSignupRole}:</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-400">
                  {selectedSignupRole === 'Customer' && (
                    <>
                      <li className="flex items-center space-x-1 text-emerald-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Submit new complaints & tickets</span>
                      </li>
                      <li className="flex items-center space-x-1 text-emerald-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Isolated view of own submitted tickets</span>
                      </li>
                      <li className="flex items-center space-x-1 text-emerald-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Live Dual-Pipeline progress tracking</span>
                      </li>
                      <li className="flex items-center space-x-1 text-emerald-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Direct 2-way agent chat & CSAT ratings</span>
                      </li>
                    </>
                  )}
                  {selectedSignupRole === 'Agent' && (
                    <>
                      <li className="flex items-center space-x-1 text-blue-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Triage, respond, & resolve customer cases</span>
                      </li>
                      <li className="flex items-center space-x-1 text-blue-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>View Gemini AI Pipeline 1 & Rule Pipeline 2</span>
                      </li>
                      <li className="flex items-center space-x-1 text-blue-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Insert canned policy responses & citations</span>
                      </li>
                      <li className="flex items-center space-x-1 text-blue-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Escalate to QA Reviewer or Manager</span>
                      </li>
                    </>
                  )}
                  {selectedSignupRole === 'Reviewer' && (
                    <>
                      <li className="flex items-center space-x-1 text-amber-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Access Flagged & Manual Review Queue</span>
                      </li>
                      <li className="flex items-center space-x-1 text-amber-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Execute binding resolution overrides</span>
                      </li>
                      <li className="flex items-center space-x-1 text-amber-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Verify policy clauses & compensation bounds</span>
                      </li>
                      <li className="flex items-center space-x-1 text-amber-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Reclassify departments and urgencies</span>
                      </li>
                    </>
                  )}
                  {selectedSignupRole === 'Manager' && (
                    <>
                      <li className="flex items-center space-x-1 text-purple-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Access Operational KPI & SLA Dashboard</span>
                      </li>
                      <li className="flex items-center space-x-1 text-purple-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Monitor agent leaderboards & queue loads</span>
                      </li>
                      <li className="flex items-center space-x-1 text-purple-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Reassign at-risk tickets & manage shifts</span>
                      </li>
                      <li className="flex items-center space-x-1 text-purple-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Approve high-value refund escalations</span>
                      </li>
                    </>
                  )}
                  {selectedSignupRole === 'Administrator' && (
                    <>
                      <li className="flex items-center space-x-1 text-cyan-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Configure Decision Rule Matrix rules</span>
                      </li>
                      <li className="flex items-center space-x-1 text-cyan-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Edit Gemini Prompts & AI Parameters</span>
                      </li>
                      <li className="flex items-center space-x-1 text-cyan-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Ingest & parse policy documents</span>
                      </li>
                      <li className="flex items-center space-x-1 text-cyan-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Execute adversarial security test suites</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <span>Registering Account...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Complete Registration & Launch {selectedSignupRole} Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: 1-CLICK ENTERPRISE PERSONAS */}
          {activeTab === 'personas' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Instantly authenticate as any pre-configured enterprise persona to evaluate role-tailored workspaces and access controls:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const info = roleDescriptions[u.role] || roleDescriptions['Customer'];
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        onClose();
                      }}
                      className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-blue-950/50 border-blue-500 ring-1 ring-blue-500 shadow-md'
                          : 'bg-slate-800/40 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute top-3 right-3 flex items-center space-x-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          <Check className="w-3 h-3" />
                          <span>Active Session</span>
                        </div>
                      )}

                      <div className="flex items-start space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow">
                          {u.avatar || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="pr-12">
                          <h4 className="text-xs font-semibold text-slate-100 flex items-center space-x-1.5">
                            <span>{u.name}</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          {u.title && <p className="text-[10px] text-slate-400 mt-0.5">{u.title}</p>}
                          {u.department && (
                            <p className="text-[10px] text-blue-400/90 font-medium">{u.department}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${info.badge}`}>
                          {info.icon}
                          <span>{u.role}</span>
                        </span>

                        <span className="text-[11px] text-blue-400 font-medium flex items-center space-x-0.5 hover:underline">
                          <span>Sign In</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: RBAC GOVERNANCE MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-100">Enterprise RBAC Permission Matrix</h3>
                  <p className="text-[11px] text-slate-400">
                    Fine-grained operation clearance across all 5 operational roles
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-2.5">System Capability</th>
                      <th className="p-2.5 text-center text-emerald-400">Customer</th>
                      <th className="p-2.5 text-center text-blue-400">Agent</th>
                      <th className="p-2.5 text-center text-amber-400">Reviewer</th>
                      <th className="p-2.5 text-center text-purple-400">Manager</th>
                      <th className="p-2.5 text-center text-cyan-400">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-2.5 font-medium">Submit New Complaint</td>
                      <td className="p-2.5 text-center text-emerald-400">✓ Full</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-cyan-400">✓ Test</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">View All Complaints (Tenant-wide)</td>
                      <td className="p-2.5 text-center text-rose-400 font-mono text-[10px]">Own Only</td>
                      <td className="p-2.5 text-center text-blue-400">✓ Full</td>
                      <td className="p-2.5 text-center text-amber-400">✓ Full</td>
                      <td className="p-2.5 text-center text-purple-400">✓ Full</td>
                      <td className="p-2.5 text-center text-cyan-400">✓ Full</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Triage, Compose & Respond to Customer</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-blue-400">✓ Full</td>
                      <td className="p-2.5 text-center text-amber-400">✓ Override</td>
                      <td className="p-2.5 text-center text-purple-400">✓ Supervise</td>
                      <td className="p-2.5 text-center text-cyan-400">✓ Full</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">QA Manual Review & Overrides</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-amber-400">✓ Full</td>
                      <td className="p-2.5 text-center text-purple-400">✓ Full</td>
                      <td className="p-2.5 text-center text-cyan-400">✓ Full</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Operations, SLA & CSAT Analytics</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-purple-400">✓ Full</td>
                      <td className="p-2.5 text-center text-cyan-400">✓ Full</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Decision Rule Matrix Configuration</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-cyan-400">✓ Full</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">AI Prompt Templates & Temperature</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-cyan-400">✓ Full</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Knowledge Base Policy Upload & Ingestion</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-cyan-400">✓ Full</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">User & Access Management</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-center text-purple-400">✓ Team</td>
                      <td className="p-2.5 text-center text-cyan-400">✓ Full</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Multi-Role Access Control with Bearer Sessions & Customer Scoping</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
