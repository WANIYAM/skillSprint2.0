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
      <div className="max-w-lg w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-amber-950/20 text-center relative overflow-hidden backdrop-blur">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
        
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold mb-3">
          <Lock className="w-3 h-3" />
          <span>RBAC Access Control Violation (HTTP 403)</span>
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-2">
          Restricted Portal Access
        </h2>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Your current authenticated persona <span className="font-semibold text-blue-400">{currentUser?.name || currentRole}</span> with role <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] font-semibold">{currentRole}</span> does not have the required permissions to access the <span className="font-semibold text-white">{requiredRole}</span> section.
        </p>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mb-6 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Current Role:</span>
            <span className="font-semibold text-slate-200">{currentRole}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Required Role:</span>
            <span className="font-semibold text-amber-400">{requiredRole}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Security Policy:</span>
            <span className="text-slate-300">Least-Privilege Role Separation</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => onSwitchRole(suggestedRole)}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition active:scale-95 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Switch to {suggestedRole} Persona</span>
          </button>

          <button
            onClick={onReturnToDashboard}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Permitted View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
