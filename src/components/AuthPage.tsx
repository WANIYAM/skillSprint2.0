import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Bot,
  UserCheck,
  BarChart3,
  Settings,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/index.ts';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  users: UserProfile[];
}

const BrandMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path fill="currentColor" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="currentColor" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="currentColor" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="currentColor" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, users }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!loginEmail.trim()) { setErrorMessage('Please enter your email address.'); return; }
    if (!loginPassword) { setErrorMessage('Please enter your password.'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed.');
      setSuccessMessage(`Welcome back, ${data.user.name}! Accessing ${data.user.role} workspace...`);
      setTimeout(() => onLoginSuccess(data.user, data.token), 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!signUpName.trim()) { setErrorMessage('Please enter your full name.'); return; }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) { setErrorMessage('Please enter a valid email address.'); return; }
    if (!signUpPassword || signUpPassword.length < 6) { setErrorMessage('Password must be at least 6 characters long.'); return; }
    if (signUpPassword !== signUpConfirmPassword) { setErrorMessage('Passwords do not match. Please verify.'); return; }

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
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      setSuccessMessage(`Account created! Welcome to SupportNova, ${data.user.name}.`);
      setTimeout(() => onLoginSuccess(data.user, data.token), 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Please enter your registered email address.'); return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request.');
      if (data.resetToken) setResetToken(data.resetToken);
      setSuccessMessage(data.message || 'Password reset code dispatched.');
      setView('reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not process password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!resetToken.trim()) { setErrorMessage('Please provide the verification code.'); return; }
    if (!newPassword || newPassword.length < 6) { setErrorMessage('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmNewPassword) { setErrorMessage('New passwords do not match.'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken: resetToken.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed.');
      setSuccessMessage('Password reset successfully! Accessing your account...');
      setTimeout(() => onLoginSuccess(data.user, data.token), 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

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
      if (!res.ok) throw new Error(data.error || 'Failed to login demo account.');
      setSuccessMessage(`Authenticated as ${user.name} (${user.role}). Redirecting...`);
      setTimeout(() => onLoginSuccess(data.user, data.token), 300);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleContinue = () => {
    setView('login');
    setErrorMessage(null);
    setSuccessMessage('Google sign-in is available in production. Use email or a demo persona below.');
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Customer': return <User className="w-3.5 h-3.5" style={{ color: '#D21515' }} />;
      case 'Agent': return <Bot className="w-3.5 h-3.5" style={{ color: '#171717' }} />;
      case 'Reviewer': return <UserCheck className="w-3.5 h-3.5" style={{ color: '#3A3A3A' }} />;
      case 'Manager': return <BarChart3 className="w-3.5 h-3.5" style={{ color: '#3A3A3A' }} />;
      case 'Administrator': return <Settings className="w-3.5 h-3.5" style={{ color: '#D21515' }} />;
    }
  };

  const getRoleBadgeStyle = () => 'bg-[rgba(210,21,21,0.08)] text-[#D21515] border-[rgba(210,21,21,0.25)]';

  const demoPersonas: { role: UserRole; user: UserProfile }[] = [
    { role: 'Customer', user: users.find((u) => u.role === 'Customer') || { id: 'usr-cust-1', name: 'Sophia Chen', email: 'sophia.chen@example.com', role: 'Customer', title: 'Enterprise Client Representative' } },
    { role: 'Agent', user: users.find((u) => u.role === 'Agent') || { id: 'usr-agent-1', name: 'Marcus Vance', email: 'm.vance@supportnova.internal', role: 'Agent', title: 'Senior Resolution Specialist', department: 'Customer Support' } },
    { role: 'Reviewer', user: users.find((u) => u.role === 'Reviewer') || { id: 'usr-rev-1', name: 'Dr. Tariq Al-Mansoor', email: 't.mansoor@supportnova.internal', role: 'Reviewer', title: 'Lead AI & Compliance Auditor', department: 'Quality & Governance' } },
    { role: 'Manager', user: users.find((u) => u.role === 'Manager') || { id: 'usr-mgr-1', name: 'Samantha Sterling', email: 's.sterling@supportnova.internal', role: 'Manager', title: 'Director of Operations & SLA', department: 'Customer Operations' } },
    { role: 'Administrator', user: users.find((u) => u.role === 'Administrator') || { id: 'usr-adm-1', name: 'Waniya Mustafa', email: 'admin@supportnova.internal', role: 'Administrator', title: 'Lead System Administrator', department: 'System Architecture' } },
  ];

  return (
    <div className="auth-page min-h-screen flex flex-col justify-center relative" style={{ color: '#3A3A3A' }}>
      <div className="auth-frame-right" />

      <div className="auth-layout">
        <section className="auth-hero">
          <div className="auth-brand">
            <span className="auth-brand-mark"><BrandMark className="w-5 h-5" /></span>
            <span>SupportNova</span>
          </div>

          <div className="auth-eyebrow">Generative AI Solutions</div>

          <div className="auth-hero-copy">
            <h1>
              We Turn<br />
              Customer Complaints<br />
              <span>Into Verified Resolutions</span>
            </h1>
            <p>AI-powered insights. Rule-based validation.<br />Better outcomes for your customers.</p>
          </div>

          <div className="auth-process">
            <span>Classify</span>
            <span>Analyze</span>
            <span>Validate</span>
            <span>Resolve</span>
          </div>

        </section>

        <div className="auth-form-column">
          <div className="auth-card p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-6">
              <span style={{ color: '#D21515' }}><BrandMark className="w-5 h-5" /></span>
              <span className="text-[11px] font-semibold tracking-[0.28em] uppercase" style={{ color: '#171717' }}>SupportNova</span>
            </div>

            {errorMessage && (
              <div className="mb-4 flex items-center space-x-2.5 p-3 rounded-xl text-xs" style={{ background: 'rgba(210, 21, 21, 0.08)', border: '1px solid rgba(210, 21, 21, 0.25)', color: '#D21515' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 flex items-center space-x-2.5 p-3 rounded-xl text-xs" style={{ background: 'rgba(23, 23, 23, 0.06)', border: '1px solid rgba(23, 23, 23, 0.15)', color: '#171717' }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {view === 'login' && (
              <div className="space-y-4">
                <div>
                  <h2 className="auth-welcome-title">Welcome Back</h2>
                  <p className="auth-welcome-subtitle">Sign in to your account to continue.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="auth-password-toggle absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: '#6B6B6B' }}
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1" style={{ color: '#3A3A3A' }}>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="auth-checkbox rounded"
                        style={{ borderColor: '#C0BCB1' }}
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setView('forgot');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="auth-forgot-password cursor-pointer"
                      style={{ color: '#D21515' }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="auth-login-submit w-full py-3 text-sm flex items-center justify-center space-x-2 mt-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <span>Authenticating...</span>
                    ) : (
                      <>
                        <span>Log In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-divider">or</div>

                <button type="button" onClick={handleGoogleContinue} className="auth-google-btn">
                  <GoogleIcon className="w-4 h-4" />
                  <span>Continue with Google</span>
                </button>

                <p className="auth-signup-prompt">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('signup');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                  >
                    Sign Up →
                  </button>
                </p>
              </div>
            )}

            {view === 'signup' && (
              <div className="space-y-4">
                <div>
                  <h2 className="auth-welcome-title">Create Account</h2>
                  <p className="auth-welcome-subtitle">Register to submit disputes & track dual-pipeline verification.</p>
                </div>

                <form onSubmit={handleSignUpSubmit} className="space-y-3">
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type="text" required value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="Full name"
                      className="w-full pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type="email" required value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type={showSignUpPassword ? 'text' : 'password'} required value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Password (min 6 characters)"
                      className="w-full pl-10 pr-10 py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="auth-password-toggle absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: '#6B6B6B' }}
                    >
                      {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#E4E2DC' }}>
                    <div className="h-full transition-all duration-300" style={{ width: `${Math.max(pwdStrength.score, 5)}%`, background: pwdStrength.color }} />
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type="password" required value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>

                  <div className="p-3 rounded-xl text-[10px] leading-relaxed" style={{ background: '#F0EFEA', border: '1px solid #C0BCB1', color: '#3A3A3A' }}>
                    <span className="font-semibold block mb-0.5" style={{ color: '#D21515' }}>🛡️ Role Authorization Policy:</span>
                    Public registrations are automatically provisioned with the <strong style={{ color: '#171717' }}>Customer</strong> role.
                  </div>

                  <button type="submit" disabled={isLoading} className="auth-signup-submit w-full py-3 text-sm flex items-center justify-center space-x-2 mt-2 disabled:opacity-50 cursor-pointer">
                    {isLoading ? <span>Creating Customer Account...</span> : (<><span>Complete Signup</span><ArrowRight className="w-4 h-4" /></>)}
                  </button>
                </form>

                <p className="auth-signup-prompt">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setView('login'); setErrorMessage(null); setSuccessMessage(null); }}>
                    Sign In
                  </button>
                </p>
              </div>
            )}

            {view === 'forgot' && (
              <div className="space-y-4">
                <div>
                  <h2 className="auth-welcome-title">Reset Password</h2>
                  <p className="auth-welcome-subtitle">Enter your registered email to receive reset instructions.</p>
                </div>
                <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type="email" required value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 text-sm cursor-pointer disabled:opacity-50">
                    {isLoading ? <span>Processing...</span> : <span>Send Reset Instructions</span>}
                  </button>
                </form>
                <p className="auth-signup-prompt">
                  <button type="button" onClick={() => { setView('login'); setErrorMessage(null); setSuccessMessage(null); }}>
                    Back to Sign In
                  </button>
                </p>
              </div>
            )}

            {view === 'reset' && (
              <div className="space-y-4">
                <div>
                  <h2 className="auth-welcome-title">New Password</h2>
                  <p className="auth-welcome-subtitle">Enter the verification code and your new password.</p>
                </div>
                <form onSubmit={handleResetSubmit} className="space-y-3">
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type="text" required value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Verification code"
                      className="w-full pl-10 pr-3 py-2.5 text-sm font-mono"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type={showNewPassword ? 'text' : 'password'} required value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 characters)"
                      className="w-full pl-10 pr-10 py-2.5 text-sm"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="auth-password-toggle absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: '#6B6B6B' }}>
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
                    <input
                      type="password" required value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 text-sm flex items-center justify-center space-x-2 mt-2 disabled:opacity-50 cursor-pointer">
                    {isLoading ? <span>Updating Password...</span> : <span>Reset Password & Sign In</span>}
                  </button>
                </form>
                <p className="auth-signup-prompt">
                  <button type="button" onClick={() => { setView('login'); setErrorMessage(null); setSuccessMessage(null); }}>
                    Back to Sign In
                  </button>
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 border rounded-2xl p-4" style={{ background: '#FFFFFF', borderColor: '#C0BCB1' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold flex items-center space-x-1.5" style={{ color: '#171717' }}>
                <KeyRound className="w-3 h-3" style={{ color: '#D21515' }} />
                <span>Enterprise Demo Logins</span>
              </span>
              <span className="text-[9px] font-mono tracking-wider" style={{ color: '#6B6B6B' }}>5 DISTINCT ROLES</span>
            </div>
            <p className="text-[10px] mb-3 leading-relaxed" style={{ color: '#6B6B6B' }}>
              Click any pre-authorized role account below to evaluate its dedicated workspace and strict permission boundaries.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {demoPersonas.map(({ role, user }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleDemoLogin(user)}
                  disabled={isLoading}
                  className="auth-demo-login text-left p-2 rounded-lg transition flex items-center justify-between cursor-pointer"
                  style={{ background: '#F0EFEA', border: '1px solid #C0BCB1' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C0BCB1';
                    e.currentTarget.style.background = '#C0BCB1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#C0BCB1';
                    e.currentTarget.style.background = '#F0EFEA';
                  }}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: '#FFFFFF', border: '1px solid #C0BCB1' }}>
                      {getRoleIcon(role)}
                    </div>
                    <div className="truncate">
                      <div className="text-[11px] font-semibold truncate" style={{ color: '#171717' }}>{user.name}</div>
                      <div className="text-[9px] truncate" style={{ color: '#6B6B6B' }}>{user.email}</div>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border shrink-0 ${getRoleBadgeStyle()}`}>
                    {role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};