import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  KeyRound,
  Copy,
  Check,
  Building,
  Phone,
  Mail,
  Briefcase,
  LogOut,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/index.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  authToken: string | null;
  onUpdateProfile?: (updated: Partial<UserProfile>) => Promise<void>;
  onSignOut: () => void;
  onSwitchPersona: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authToken,
  onUpdateProfile,
  onSignOut,
  onSwitchPersona,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [company, setCompany] = useState(currentUser?.company || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleCopyToken = () => {
    if (authToken) {
      navigator.clipboard.writeText(authToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          name: name.trim(),
          phone: phone.trim(),
          department: department.trim(),
          company: company.trim(),
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow">
              {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{currentUser.name}</h3>
              <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Role & Status Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Assigned Operating Role
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getRoleBadgeStyle(currentUser.role)}`}>
                  {currentUser.role}
                </span>
                <span className="text-xs text-slate-300">{currentUser.title || `${currentUser.role} Specialist`}</span>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Session
            </span>
          </div>

          {/* Profile Details */}
          {!isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1 mb-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>Email Address</span>
                  </span>
                  <p className="font-semibold text-slate-200 truncate">{currentUser.email}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1 mb-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>Department / Unit</span>
                  </span>
                  <p className="font-semibold text-slate-200">
                    {currentUser.department || (currentUser.role === 'Customer' ? 'Consumer Client' : 'General Support')}
                  </p>
                </div>

                {currentUser.company && (
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1 mb-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>Company / Org</span>
                    </span>
                    <p className="font-semibold text-slate-200">{currentUser.company}</p>
                  </div>
                )}

                {currentUser.phone && (
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1 mb-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Phone</span>
                    </span>
                    <p className="font-semibold text-slate-200">{currentUser.phone}</p>
                  </div>
                )}
              </div>

              {/* Bearer Token Info */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    <span>Active Bearer Token</span>
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="flex items-center space-x-1 text-[10px] font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-400 truncate border border-slate-800 select-all">
                  {authToken || 'tok_session_active'}
                </div>
                <p className="text-[9px] text-slate-400 mt-1">
                  Enforces 24-hour RBAC session validity across all API endpoints
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onSwitchPersona();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold border border-blue-500/30 transition cursor-pointer"
                >
                  Switch Role / Persona
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Current Session</span>
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
