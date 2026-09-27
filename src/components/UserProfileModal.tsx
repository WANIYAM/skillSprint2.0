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

  const getRoleBadgeStyle = (role: UserRole): React.CSSProperties => {
    switch (role) {
      case 'Customer':
        return { background: 'rgba(210, 21, 21, 0.08)', color: '#D21515', border: '1px solid rgba(210, 21, 21, 0.25)' };
      case 'Agent':
        return { background: 'rgba(23, 23, 23, 0.06)', color: '#171717', border: '1px solid rgba(23, 23, 23, 0.2)' };
      case 'Reviewer':
        return { background: 'rgba(192, 188, 177, 0.3)', color: '#3A3A3A', border: '1px solid rgba(192, 188, 177, 0.6)' };
      case 'Manager':
        return { background: 'rgba(58, 58, 58, 0.08)', color: '#3A3A3A', border: '1px solid rgba(58, 58, 58, 0.25)' };
      case 'Administrator':
        return { background: 'rgba(210, 21, 21, 0.08)', color: '#D21515', border: '1px solid rgba(210, 21, 21, 0.25)' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ background: 'rgba(23, 23, 23, 0.6)', backdropFilter: 'blur(4px)' }}>
      <div
        className="rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        style={{ background: '#FFFFFF', border: '1px solid #C0BCB1' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #E4E2DC', background: '#F0EFEA' }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow"
              style={{ background: 'linear-gradient(135deg, #D21515, #A01010)', color: '#FFFFFF' }}
            >
              {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#171717' }}>{currentUser.name}</h3>
              <p className="text-xs truncate" style={{ color: '#6B6B6B' }}>{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition cursor-pointer"
            style={{ color: '#6B6B6B' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#D21515'; e.currentTarget.style.background = '#F0EFEA'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6B6B'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: '#F0EFEA', border: '1px solid #C0BCB1' }}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#6B6B6B' }}>
                Assigned Operating Role
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold" style={getRoleBadgeStyle(currentUser.role)}>
                  {currentUser.role}
                </span>
                <span className="text-xs" style={{ color: '#3A3A3A' }}>{currentUser.title || `${currentUser.role} Specialist`}</span>
              </div>
            </div>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(23, 23, 23, 0.06)', color: '#171717', border: '1px solid rgba(23, 23, 23, 0.15)' }}
            >
              Active Session
            </span>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl" style={{ background: '#F0EFEA', border: '1px solid #C0BCB1' }}>
                  <span className="text-[10px] font-medium flex items-center space-x-1 mb-1" style={{ color: '#6B6B6B' }}>
                    <Mail className="w-3 h-3" />
                    <span>Email Address</span>
                  </span>
                  <p className="font-semibold truncate" style={{ color: '#171717' }}>{currentUser.email}</p>
                </div>

                <div className="p-3 rounded-xl" style={{ background: '#F0EFEA', border: '1px solid #C0BCB1' }}>
                  <span className="text-[10px] font-medium flex items-center space-x-1 mb-1" style={{ color: '#6B6B6B' }}>
                    <Building className="w-3 h-3" />
                    <span>Department / Unit</span>
                  </span>
                  <p className="font-semibold" style={{ color: '#171717' }}>
                    {currentUser.department || (currentUser.role === 'Customer' ? 'Consumer Client' : 'General Support')}
                  </p>
                </div>

                {currentUser.company && (
                  <div className="p-3 rounded-xl" style={{ background: '#F0EFEA', border: '1px solid #C0BCB1' }}>
                    <span className="text-[10px] font-medium flex items-center space-x-1 mb-1" style={{ color: '#6B6B6B' }}>
                      <Briefcase className="w-3 h-3" />
                      <span>Company / Org</span>
                    </span>
                    <p className="font-semibold" style={{ color: '#171717' }}>{currentUser.company}</p>
                  </div>
                )}

                {currentUser.phone && (
                  <div className="p-3 rounded-xl" style={{ background: '#F0EFEA', border: '1px solid #C0BCB1' }}>
                    <span className="text-[10px] font-medium flex items-center space-x-1 mb-1" style={{ color: '#6B6B6B' }}>
                      <Phone className="w-3 h-3" />
                      <span>Phone</span>
                    </span>
                    <p className="font-semibold" style={{ color: '#171717' }}>{currentUser.phone}</p>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl" style={{ background: '#F0EFEA', border: '1px solid #C0BCB1' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold flex items-center space-x-1.5" style={{ color: '#3A3A3A' }}>
                    <KeyRound className="w-3.5 h-3.5" style={{ color: '#D21515' }} />
                    <span>Active Bearer Token</span>
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="flex items-center space-x-1 text-[10px] font-medium cursor-pointer"
                    style={{ color: '#D21515' }}
                  >
                    {copiedToken ? (
                      <>
                        <Check className="w-3 h-3" style={{ color: '#171717' }} />
                        <span style={{ color: '#171717' }}>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>
                <div
                  className="p-2 rounded font-mono text-[10px] truncate select-all"
                  style={{ background: '#FFFFFF', color: '#6B6B6B', border: '1px solid #C0BCB1' }}
                >
                  {authToken || 'tok_session_active'}
                </div>
                <p className="text-[9px] mt-1" style={{ color: '#6B6B6B' }}>
                  Enforces 24-hour RBAC session validity across all API endpoints
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer"
                  style={{ background: '#F0EFEA', color: '#171717', border: '1px solid #C0BCB1' }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onSwitchPersona();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer"
                  style={{ background: 'rgba(210, 21, 21, 0.08)', color: '#D21515', border: '1px solid rgba(210, 21, 21, 0.25)' }}
                >
                  Switch Role / Persona
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: '#3A3A3A' }}>Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ background: '#FFFFFF', border: '1px solid #C0BCB1', color: '#171717' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: '#3A3A3A' }}>Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ background: '#FFFFFF', border: '1px solid #C0BCB1', color: '#171717' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: '#3A3A3A' }}>Company / Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ background: '#FFFFFF', border: '1px solid #C0BCB1', color: '#171717' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: '#3A3A3A' }}>Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ background: '#FFFFFF', border: '1px solid #C0BCB1', color: '#171717' }}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-xl font-semibold transition cursor-pointer"
                  style={{ background: '#F0EFEA', color: '#3A3A3A', border: '1px solid #C0BCB1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl font-semibold transition cursor-pointer disabled:opacity-50"
                  style={{ background: '#171717', color: '#FFFFFF' }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div
          className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid #E4E2DC', background: '#F0EFEA' }}
        >
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="flex items-center space-x-1.5 text-xs transition cursor-pointer font-medium"
            style={{ color: '#D21515' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Current Session</span>
          </button>
          <button
            onClick={onClose}
            className="text-xs transition cursor-pointer"
            style={{ color: '#6B6B6B' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};