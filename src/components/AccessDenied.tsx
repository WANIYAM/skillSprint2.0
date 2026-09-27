import React from 'react';
import { ShieldAlert, ArrowLeft, UserCheck, Lock } from 'lucide-react';
import { UserRole, UserProfile } from '../types/index.ts';

interface AccessDeniedProps {
  requiredRole: UserRole | string;
  currentRole: UserRole;
  currentUser?: UserProfile | null;
  onSwitchRole: (role: UserRole) => void;
  onReturnToDashboard: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole,
  currentRole,
  currentUser,
  onSwitchRole,
  onReturnToDashboard,
}) => {
  const getSuggestedRole = (): UserRole => {
    if (requiredRole === 'Administrator') return 'Administrator';
    if (requiredRole === 'Reviewer') return 'Reviewer';
    if (requiredRole === 'Manager') return 'Manager';
    if (requiredRole === 'Agent') return 'Agent';
    return 'Customer';
  };

  const suggestedRole = getSuggestedRole();

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center px-4">
      <div
        className="max-w-lg w-full rounded-2xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden backdrop-blur"
        style={{ background: '#FFFFFF', border: '1px solid rgba(210, 21, 21, 0.25)' }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, #C0BCB1, #D21515, #C0BCB1)' }}
        />

        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(210, 21, 21, 0.08)', border: '1px solid rgba(210, 21, 21, 0.25)', color: '#D21515' }}
        >
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3"
          style={{ background: 'rgba(210, 21, 21, 0.08)', border: '1px solid rgba(210, 21, 21, 0.25)', color: '#D21515' }}
        >
          <Lock className="w-3 h-3" />
          <span>RBAC Access Control Violation (HTTP 403)</span>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: '#171717' }}>
          Restricted Portal Access
        </h2>

        <p className="text-xs mb-6 leading-relaxed" style={{ color: '#3A3A3A' }}>
          Your current authenticated persona <span className="font-semibold" style={{ color: '#D21515' }}>{currentUser?.name || currentRole}</span> with role <span className="px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold" style={{ background: '#F0EFEA', color: '#D21515' }}>{currentRole}</span> does not have the required permissions to access the <span className="font-semibold" style={{ color: '#171717' }}>{requiredRole}</span> section.
        </p>

        <div
          className="rounded-xl p-3.5 mb-6 text-left space-y-2"
          style={{ background: '#F0EFEA', border: '1px solid #C0BCB1' }}
        >
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: '#6B6B6B' }}>Current Role:</span>
            <span className="font-semibold" style={{ color: '#171717' }}>{currentRole}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: '#6B6B6B' }}>Required Role:</span>
            <span className="font-semibold" style={{ color: '#D21515' }}>{requiredRole}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: '#6B6B6B' }}>Security Policy:</span>
            <span style={{ color: '#3A3A3A' }}>Least-Privilege Role Separation</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => onSwitchRole(suggestedRole)}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition active:scale-95 cursor-pointer"
            style={{ background: '#171717', color: '#FFFFFF', boxShadow: '0 10px 25px rgba(23, 23, 23, 0.15)' }}
          >
            <UserCheck className="w-4 h-4" />
            <span>Switch to {suggestedRole} Persona</span>
          </button>

          <button
            onClick={onReturnToDashboard}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition active:scale-95 cursor-pointer"
            style={{ background: '#F0EFEA', color: '#171717', border: '1px solid #C0BCB1' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Permitted View</span>
          </button>
        </div>
      </div>
    </div>
  );
};