import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Bot,
  UserCheck,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/index.ts';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  users: UserProfile[];
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, users }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      setSuccessMessage(`Welcome back, ${data.user.name}! Accessing ${data.user.role} workspace...`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up Submit (Requirement 3: Automatic Customer Role Assignment)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signUpName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpName.trim(),
          email: signUpEmail.trim().toLowerCase(),
          password: signUpPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccessMessage(`Account created! Welcome to SupportNova, ${data.user.name}.`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process request.');
      }

      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
      setSuccessMessage(data.message || 'Password reset code dispatched.');
      setView('reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not process password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetToken.trim()) {
      setErrorMessage('Please provide the verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken: resetToken.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reset failed.');
      }

      setSuccessMessage('Password reset successfully! Accessing your account...');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Demo Account Quick-Login
  const handleDemoLogin = async (user: UserProfile) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login demo account.');
      }

      setSuccessMessage(`Authenticated as ${user.name} (${user.role}). Redirecting...`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 300);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
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

  // Group sample users by distinct roles for demo selection
  const demoPersonas: { role: UserRole; user: UserProfile }[] = [
    {
      role: 'Customer',
      user: users.find((u) => u.role === 'Customer') || {
        id: 'usr-cust-1',
        name: 'Sophia Chen',
        email: 'sophia.chen@example.com',
        role: 'Customer',
        title: 'Enterprise Client Representative',
      },
    },
    {
      role: 'Agent',
      user: users.find((u) => u.role === 'Agent') || {
        id: 'usr-agent-1',
        name: 'Marcus Vance',
        email: 'm.vance@supportnova.internal',
        role: 'Agent',
        title: 'Senior Resolution Specialist',
        department: 'Customer Support',
      },
    },
    {
      role: 'Reviewer',
      user: users.find((u) => u.role === 'Reviewer') || {
        id: 'usr-rev-1',
        name: 'Dr. Tariq Al-Mansoor',
        email: 't.mansoor@supportnova.internal',
        role: 'Reviewer',
        title: 'Lead AI & Compliance Auditor',
        department: 'Quality & Governance',
      },
    },
    {
      role: 'Manager',
      user: users.find((u) => u.role === 'Manager') || {
        id: 'usr-mgr-1',
        name: 'Samantha Sterling',
        email: 's.sterling@supportnova.internal',
        role: 'Manager',
        title: 'Director of Operations & SLA',
        department: 'Customer Operations',
      },
    },
    {
      role: 'Administrator',
      user: users.find((u) => u.role === 'Administrator') || {
        id: 'usr-adm-1',
        name: 'Waniya Mustafa',
        email: 'admin@supportnova.internal',
        role: 'Administrator',
        title: 'Lead System Administrator',
        department: 'System Architecture',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        {/* Logo */}
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 items-center justify-center shadow-xl shadow-blue-500/20 mb-3 text-white">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center space-x-2">
          <span>SupportNova</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Enterprise RBAC
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          AI-Powered Complaint Intelligence with Dual-Pipeline Ground-Truth Validation
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Notifications */}
          {errorMessage && (
            <div className="mb-4 flex items-center space-x-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center space-x-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* VIEW 1: SIGN IN */}
          {view === 'login' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-white">Sign In to Your Workspace</h2>
                <span className="text-[11px] text-slate-400">Strict Role Authorization</span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setView('forgot');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                    <span>Remember this device</span>
                  </label>
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
                      <span>Sign In & Open Role Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  New client or customer?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('signup');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    Create a Customer Account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VIEW 2: SIGN UP (Automatic Customer Role) */}
          {view === 'signup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white">Customer Account Registration</h2>
                  <p className="text-[11px] text-slate-400">
                    Register to submit disputes & track dual-pipeline verification
                  </p>
                </div>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="e.g. Jordan Rivera"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="jordan.rivera@example.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Strength: <strong className="text-slate-200">{pwdStrength.label}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300 block mb-0.5">
                    🛡️ Role Authorization Policy:
                  </span>
                  Public registrations are automatically provisioned with the <strong>Customer</strong> role.
                  Staff roles (Agent, Reviewer, Manager, Admin) are authorized directly by enterprise administrators.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2 mt-2"
                >
                  {isLoading ? (
                    <span>Creating Customer Account...</span>
                  ) : (
                    <>
                      <span>Complete Signup & Enter Customer Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-white">Reset Account Password</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enter your registered email address to receive password reset instructions
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isLoading ? <span>Processing...</span> : <span>Send Reset Instructions</span>}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* VIEW 4: RESET PASSWORD */}
          {view === 'reset' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-white">Enter Verification Code & New Password</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Check your inbox for the 15-minute verification code
                </p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reset Verification Code *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="e.g. rst-104921"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2 mt-2"
                >
                  {isLoading ? <span>Updating Password...</span> : <span>Reset Password & Sign In</span>}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DEMO ACCOUNTS / TEST LOGINS PANEL */}
        <div className="mt-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              <span>Enterprise Demo Logins (1-Click Test Access)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">5 Distinct Roles</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Click any pre-authorized role account below to evaluate its dedicated workspace and strict permission boundaries:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoPersonas.map(({ role, user }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleDemoLogin(user)}
                disabled={isLoading}
                className="text-left p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    {getRoleIcon(role)}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${getRoleBadgeStyle(role)}`}>
                  {role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
