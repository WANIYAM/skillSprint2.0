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
  Lock,
  Mail,
  UserPlus,
  LogIn,
  CheckCircle2,
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

const BrandMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

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

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const roleDescriptions: Record<UserRole, { title: string; desc: string; icon: React.ReactNode; badge: string }> = {
    Customer: {
      title: 'Customer / Client',
      desc: 'Submit support tickets, track dual-pipeline processing live, communicate with agents, and rate resolution satisfaction.',
      icon: <User className="w-5 h-5" style={{ color: '#D21515' }} />,
      badge: 'bg-[rgba(210,21,21,0.08)] text-[#D21515] border-[rgba(210,21,21,0.25)]',
    },
    Agent: {
      title: 'Support Specialist (Agent)',
      desc: 'Triage assigned cases, evaluate AI-drafted responses, verify cited policy clauses, and dispatch solutions to customers.',
      icon: <Bot className="w-5 h-5" style={{ color: '#171717' }} />,
      badge: 'bg-[rgba(23,23,23,0.06)] text-[#171717] border-[rgba(23,23,23,0.2)]',
    },
    Reviewer: {
      title: 'QA & Compliance Reviewer',
      desc: 'Audit high-risk and flagged cases in the manual review queue, verify policy eligibility, and execute decision overrides.',
      icon: <UserCheck className="w-5 h-5" style={{ color: '#3A3A3A' }} />,
      badge: 'bg-[rgba(192,188,177,0.3)] text-[#3A3A3A] border-[rgba(192,188,177,0.6)]',
    },
    Manager: {
      title: 'Operations Manager',
      desc: 'Monitor real-time SLA adherence, CSAT quality ratings, agent performance leaderboards, and reassign escalations.',
      icon: <BarChart3 className="w-5 h-5" style={{ color: '#3A3A3A' }} />,
      badge: 'bg-[rgba(58,58,58,0.08)] text-[#3A3A3A] border-[rgba(58,58,58,0.25)]',
    },
    Administrator: {
      title: 'System Administrator',
      desc: 'Manage users, configure Decision Rule Matrix entries, update Gemini Prompt Templates, ingest Policy documents, and run security tests.',
      icon: <Settings className="w-5 h-5" style={{ color: '#D21515' }} />,
      badge: 'bg-[rgba(210,21,21,0.08)] text-[#D21515] border-[rgba(210,21,21,0.25)]',
    },
  };

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: '#C0BCB1' };
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;
    if (score <= 25) return { score, label: 'Weak', color: '#C0BCB1' };
    if (score <= 50) return { score, label: 'Moderate', color: '#8A8A8A' };
    if (score <= 75) return { score, label: 'Strong', color: '#D21515' };
    return { score: 100, label: 'Enterprise Grade', color: '#D21515' };
  };

  const pwdStrength = calculatePasswordStrength(signUpPassword);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!signInEmail.trim()) { setAuthError('Please provide your registered email address.'); return; }

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
        if (matched) { onSelectUser(matched); onClose(); }
        else { setAuthError('User not found. Please sign up or select a demo persona.'); }
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
    if (!signUpName.trim()) { setAuthError('Please enter your full name.'); return; }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) { setAuthError('Please enter a valid email address.'); return; }
    if (signUpPassword && signUpPassword.length < 6) { setAuthError('Password must be at least 6 characters long.'); return; }

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

  const tabClass = (tab: typeof activeTab) =>
    `pb-3 pt-1 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
      activeTab === tab
        ? 'auth-modal-tab-active'
        : 'border-transparent text-[#6B6B6B] hover:text-[#D21515]'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ background: 'rgba(23, 23, 23, 0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="auth-modal-shell w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b" style={{ borderColor: '#E4E2DC' }}>
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #D21515, #A01010)', color: '#FFFFFF' }}
            >
              <BrandMark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2" style={{ color: '#171717' }}>
                <span>SupportNova Identity & Access</span>
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold"
                  style={{ background: 'rgba(210, 21, 21, 0.08)', color: '#D21515', border: '1px solid rgba(210, 21, 21, 0.25)' }}
                >
                  Multi-Role Auth
                </span>
              </h2>
              <p className="text-xs" style={{ color: '#6B6B6B' }}>
                Sign in, create a tailored role account, or select enterprise demo personas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition cursor-pointer"
            style={{ color: '#6B6B6B' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#120E0C'; e.currentTarget.style.background = '#C0BCB1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6B6B'; e.currentTarget.style.background = 'transparent'; }}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b px-4 sm:px-6 pt-2 space-x-2 sm:space-x-4 overflow-x-auto" style={{ borderColor: '#E4E2DC' }}>
          <button onClick={() => { setActiveTab('signin'); setAuthError(null); }} className={tabClass('signin')}>
            <LogIn className="w-3.5 h-3.5" /><span>Sign In</span>
          </button>
          <button onClick={() => { setActiveTab('signup'); setAuthError(null); }} className={tabClass('signup')}>
            <UserPlus className="w-3.5 h-3.5" /><span>Register by Role</span>
          </button>
          <button onClick={() => { setActiveTab('personas'); setAuthError(null); }} className={tabClass('personas')}>
            <Sparkles className="w-3.5 h-3.5" /><span>1-Click Personas</span>
          </button>
          <button onClick={() => { setActiveTab('matrix'); setAuthError(null); }} className={tabClass('matrix')}>
            <Layers className="w-3.5 h-3.5" /><span>RBAC Matrix</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {authError && (
            <div className="flex items-center space-x-2.5 p-3.5 rounded-xl text-xs" style={{ background: 'rgba(210, 21, 21, 0.08)', border: '1px solid rgba(210, 21, 21, 0.25)', color: '#D21515' }}>
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{authError}</span>
            </div>
          )}
          {authSuccess && (
            <div className="flex items-center space-x-2.5 p-3.5 rounded-xl text-xs" style={{ background: 'rgba(23, 23, 23, 0.06)', border: '1px solid rgba(23, 23, 23, 0.15)', color: '#171717' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{authSuccess}</span>
            </div>
          )}

          {activeTab === 'signin' && (
            <div className="max-w-md mx-auto py-2 space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-sm font-semibold" style={{ color: '#171717' }}>Welcome to SupportNova</h3>
                <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>Sign in with your enterprise credentials to access your assigned role workspace</p>
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#171717' }}>Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5" style={{ color: '#6B6B6B' }} />
                    <input
                      type="email" required value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="e.g. marcus.vance@supportnova.internal"
                      className="w-full rounded-xl pl-9 pr-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold" style={{ color: '#171717' }}>Password</label>
                    <span className="text-[10px]" style={{ color: '#6B6B6B' }}>Demo mode accepts any password</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5" style={{ color: '#6B6B6B' }} />
                    <input
                      type={showSignInPassword ? 'text' : 'password'} value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl pl-9 pr-9 py-2 text-xs"
                    />
                    <button type="button" onClick={() => setShowSignInPassword(!showSignInPassword)} className="absolute right-3 top-2.5 cursor-pointer" style={{ color: '#6B6B6B' }}>
                      {showSignInPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1" style={{ color: '#3A3A3A' }}>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="auth-checkbox rounded" />
                    <span>Remember this session</span>
                  </label>
                  <button type="button" onClick={() => setActiveTab('personas')} className="cursor-pointer text-[11px]" style={{ color: '#D21515' }}>
                    Use 1-click demo persona
                  </button>
                </div>

                <button type="submit" disabled={isLoading} className="auth-modal-submit w-full py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 mt-2 disabled:opacity-50 cursor-pointer">
                  {isLoading ? <span>Authenticating...</span> : (<><LogIn className="w-4 h-4" /><span>Sign In & Open Workspace</span></>)}
                </button>
              </form>

              <div className="pt-3 border-t" style={{ borderColor: '#E4E2DC' }}>
                <p className="text-[11px] font-medium mb-2" style={{ color: '#3A3A3A' }}>Quick Sign-In Sample Accounts:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {users.slice(0, 6).map((u) => (
                    <button
                      key={u.id} type="button"
                      onClick={() => { setSignInEmail(u.email); setSignInPassword('password123'); }}
                      className="text-left px-2 py-1.5 rounded-lg text-[11px] transition truncate cursor-pointer"
                      style={{ background: '#F0EFEA', border: '1px solid #C0BCB1', color: '#3A3A3A' }}
                    >
                      <div className="font-semibold truncate">{u.name.split(' ')[0]}</div>
                      <div className="text-[9px]" style={{ color: '#6B6B6B' }}>{u.role}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#171717' }}>Step 1: Select Your Operating Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(['Customer', 'Agent', 'Reviewer', 'Manager', 'Administrator'] as UserRole[]).map((r) => {
                    const info = roleDescriptions[r];
                    const isSelected = selectedSignupRole === r;
                    return (
                      <div
                        key={r} onClick={() => setSelectedSignupRole(r)}
                        className="p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between"
                        style={{
                          background: isSelected ? 'rgba(210, 21, 21, 0.06)' : '#F0EFEA',
                          borderColor: isSelected ? '#D21515' : '#C0BCB1',
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="p-1.5 rounded-lg" style={{ background: '#FFFFFF', border: '1px solid #C0BCB1' }}>
                              {info.icon}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1" style={{ background: '#D21515', color: '#FFFFFF' }}>
                                <Check className="w-2.5 h-2.5" /><span>Selected</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold" style={{ color: '#171717' }}>{info.title}</h4>
                          <p className="text-[10px] mt-1 line-clamp-2 leading-relaxed" style={{ color: '#6B6B6B' }}>{info.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl border space-y-3" style={{ background: '#F0EFEA', borderColor: '#C0BCB1' }}>
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: '#E4E2DC' }}>
                  <span className="text-xs font-bold flex items-center space-x-1.5" style={{ color: '#171717' }}>
                    <span>Step 2: Profile & Credentials for</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${roleDescriptions[selectedSignupRole].badge}`}>{selectedSignupRole}</span>
                  </span>
                  <span className="text-[10px]" style={{ color: '#6B6B6B' }}>Instant RBAC Clearance</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Full Name *</label>
                    <input type="text" required value={signUpName} onChange={(e) => setSignUpName(e.target.value)} placeholder="e.g. Jordan Lee" className="w-full rounded-lg px-3 py-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Email Address *</label>
                    <input type="email" required value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} placeholder="jordan.lee@example.com" className="w-full rounded-lg px-3 py-1.5 text-xs" />
                  </div>
                </div>

                {selectedSignupRole === 'Customer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Company or Account Reference</label>
                      <input type="text" value={signUpCompany} onChange={(e) => setSignUpCompany(e.target.value)} placeholder="e.g. Nova Innovations Corp" className="w-full rounded-lg px-3 py-1.5 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Phone Number</label>
                      <input type="text" value={signUpPhone} onChange={(e) => setSignUpPhone(e.target.value)} placeholder="+1 (555) 019-2834" className="w-full rounded-lg px-3 py-1.5 text-xs" />
                    </div>
                  </div>
                )}

                {selectedSignupRole === 'Agent' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Assigned Support Department</label>
                      <select value={signUpDepartment} onChange={(e) => setSignUpDepartment(e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-xs">
                        <option>Customer Support</option><option>Hardware Diagnostics</option><option>Billing & Finance</option><option>Account & Security</option><option>Logistics & Shipping</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Employee ID</label>
                      <input type="text" value={signUpEmployeeId} onChange={(e) => setSignUpEmployeeId(e.target.value)} placeholder="AGT-8821" className="w-full rounded-lg px-3 py-1.5 text-xs" />
                    </div>
                  </div>
                )}

                {selectedSignupRole === 'Reviewer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>QA & Compliance Specialization</label>
                      <input type="text" value={signUpAuditScope} onChange={(e) => setSignUpAuditScope(e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Reviewer Certification ID</label>
                      <input type="text" value={signUpEmployeeId} onChange={(e) => setSignUpEmployeeId(e.target.value)} placeholder="REV-CERT-904" className="w-full rounded-lg px-3 py-1.5 text-xs" />
                    </div>
                  </div>
                )}

                {selectedSignupRole === 'Manager' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Managed Department</label>
                      <select value={signUpDepartment} onChange={(e) => setSignUpDepartment(e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-xs">
                        <option>Customer Support</option><option>Hardware Diagnostics</option><option>Billing & Finance</option><option>Account & Security</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Escalation Refund Approval Limit</label>
                      <input type="text" value={signUpApprovalLimit} onChange={(e) => setSignUpApprovalLimit(e.target.value)} placeholder="$10,000" className="w-full rounded-lg px-3 py-1.5 text-xs" />
                    </div>
                  </div>
                )}

                {selectedSignupRole === 'Administrator' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Admin Security Clearance Key</label>
                      <input type="text" value={signUpClearanceKey} onChange={(e) => setSignUpClearanceKey(e.target.value)} placeholder="AUTH-ADM-KEY-2026 (Optional in Demo)" className="w-full rounded-lg px-3 py-1.5 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: '#171717' }}>Governance Scope</label>
                      <input type="text" readOnly value="Full Platform, Matrix, Policies & AI Prompts" className="w-full rounded-lg px-3 py-1.5 text-xs cursor-not-allowed" style={{ color: '#6B6B6B' }} />
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium" style={{ color: '#171717' }}>Create Password</label>
                    <span className="text-[10px]" style={{ color: '#6B6B6B' }}>Strength: <strong style={{ color: '#D21515' }}>{pwdStrength.label}</strong></span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5" style={{ color: '#6B6B6B' }} />
                    <input
                      type={showSignUpPassword ? 'text' : 'password'} value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-lg pl-9 pr-9 py-1.5 text-xs"
                    />
                    <button type="button" onClick={() => setShowSignUpPassword(!showSignUpPassword)} className="absolute right-3 top-2 cursor-pointer" style={{ color: '#6B6B6B' }}>
                      {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: '#E4E2DC' }}>
                    <div className="h-full transition-all duration-300" style={{ width: `${Math.max(pwdStrength.score, 5)}%`, background: pwdStrength.color }} />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border text-[11px]" style={{ background: '#F0EFEA', borderColor: '#C0BCB1', color: '#3A3A3A' }}>
                <div className="flex items-center space-x-1.5 font-semibold mb-1.5" style={{ color: '#171717' }}>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Assigned RBAC Capabilities for {selectedSignupRole}:</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]" style={{ color: '#6B6B6B' }}>
                  <li className="flex items-center space-x-1"><Check className="w-3 h-3 shrink-0" style={{ color: '#D21515' }} /><span>Role-scoped workspace access</span></li>
                  <li className="flex items-center space-x-1"><Check className="w-3 h-3 shrink-0" style={{ color: '#D21515' }} /><span>Enforced RBAC permissions</span></li>
                  <li className="flex items-center space-x-1"><Check className="w-3 h-3 shrink-0" style={{ color: '#D21515' }} /><span>Audited session tracking</span></li>
                  <li className="flex items-center space-x-1"><Check className="w-3 h-3 shrink-0" style={{ color: '#D21515' }} /><span>Secure bearer tokens</span></li>
                </ul>
              </div>

              <button type="submit" disabled={isLoading} className="auth-modal-submit w-full py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer">
                {isLoading ? <span>Registering Account...</span> : (<><UserPlus className="w-4 h-4" /><span>Complete Registration & Launch {selectedSignupRole} Portal</span></>)}
              </button>
            </form>
          )}

          {activeTab === 'personas' && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: '#3A3A3A' }}>Instantly authenticate as any pre-configured enterprise persona:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const info = roleDescriptions[u.role] || roleDescriptions['Customer'];
                  return (
                    <div
                      key={u.id}
                      onClick={() => { onSelectUser(u); onClose(); }}
                      className="relative p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between"
                      style={{
                        background: isCurrent ? 'rgba(210, 21, 21, 0.06)' : '#F0EFEA',
                        borderColor: isCurrent ? '#D21515' : '#C0BCB1',
                      }}
                    >
                      {isCurrent && (
                        <div className="absolute top-3 right-3 flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(210, 21, 21, 0.08)', color: '#D21515', border: '1px solid rgba(210, 21, 21, 0.25)' }}>
                          <Check className="w-3 h-3" /><span>Active Session</span>
                        </div>
                      )}
                      <div className="flex items-start space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0" style={{ background: '#FFFFFF', border: '1px solid #C0BCB1', color: '#D21515' }}>
                          {u.avatar || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="pr-12">
                          <h4 className="text-xs font-semibold" style={{ color: '#171717' }}>{u.name}</h4>
                          <p className="text-[11px] truncate" style={{ color: '#6B6B6B' }}>{u.email}</p>
                          {u.title && <p className="text-[10px] mt-0.5" style={{ color: '#6B6B6B' }}>{u.title}</p>}
                          {u.department && <p className="text-[10px] font-medium" style={{ color: '#D21515' }}>{u.department}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: '#E4E2DC' }}>
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${info.badge}`}>
                          {info.icon}<span>{u.role}</span>
                        </span>
                        <span className="text-[11px] font-medium flex items-center space-x-0.5" style={{ color: '#D21515' }}>
                          <span>Sign In</span><ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-bold" style={{ color: '#171717' }}>Enterprise RBAC Permission Matrix</h3>
                <p className="text-[11px]" style={{ color: '#6B6B6B' }}>Fine-grained operation clearance across all 5 operational roles</p>
              </div>
              <div className="overflow-x-auto border rounded-xl" style={{ borderColor: '#C0BCB1' }}>
                <table className="w-full text-[11px] text-left">
                  <thead className="font-semibold border-b" style={{ background: '#F0EFEA', color: '#D21515', borderColor: '#C0BCB1' }}>
                    <tr>
                      <th className="p-2.5">System Capability</th>
                      <th className="p-2.5 text-center">Customer</th>
                      <th className="p-2.5 text-center">Agent</th>
                      <th className="p-2.5 text-center">Reviewer</th>
                      <th className="p-2.5 text-center">Manager</th>
                      <th className="p-2.5 text-center">Admin</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: '#3A3A3A' }}>
                    {[
                      ['Submit New Complaint', '✓ Full', '-', '-', '-', '✓ Test'],
                      ['View All Complaints (Tenant-wide)', 'Own Only', '✓ Full', '✓ Full', '✓ Full', '✓ Full'],
                      ['Triage, Compose & Respond to Customer', '-', '✓ Full', '✓ Override', '✓ Supervise', '✓ Full'],
                      ['QA Manual Review & Overrides', '-', '-', '✓ Full', '✓ Full', '✓ Full'],
                      ['Operations, SLA & CSAT Analytics', '-', '-', '-', '✓ Full', '✓ Full'],
                      ['Decision Rule Matrix Configuration', '-', '-', '-', '-', '✓ Full'],
                      ['AI Prompt Templates & Temperature', '-', '-', '-', '-', '✓ Full'],
                      ['Knowledge Base Policy Upload & Ingestion', '-', '-', '-', '-', '✓ Full'],
                      ['User & Access Management', '-', '-', '-', '✓ Team', '✓ Full'],
                    ].map((row, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: '#E4E2DC' }}>
                        {row.map((cell, j) => (
                          <td key={j} className={`p-2.5 ${j === 0 ? 'font-medium' : 'text-center'}`} style={j === 0 ? { color: '#171717' } : {}}>
                            {cell === '-' ? <span style={{ color: '#C0BCB1' }}>-</span> : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-3.5 border-t flex items-center justify-between text-[11px]" style={{ borderColor: '#E4E2DC', color: '#6B6B6B' }}>
          <div className="flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: '#D21515' }} />
            <span>Multi-Role Access Control with Bearer Sessions & Customer Scoping</span>
          </div>
          <button onClick={onClose} className="transition cursor-pointer" style={{ color: '#6B6B6B' }}>Close</button>
        </div>
      </div>
    </div>
  );
};