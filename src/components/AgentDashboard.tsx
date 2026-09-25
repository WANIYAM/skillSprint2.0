import React, { useState } from 'react';
import { Complaint, EscalationTier } from '../types';
import {
  Inbox,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Send,
  ArrowUpRight,
  CheckCircle,
  FileText,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  HelpCircle,
} from 'lucide-react';

interface AgentDashboardProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onSendMessage: (complaintId: string, text: string, nextStatus?: any) => Promise<void>;
  onUpdateStatus: (complaintId: string, status: any, dept?: string, agent?: string) => Promise<void>;
  currentDepartment: string;
  onDepartmentChange: (dept: string) => void;
  departments: string[];
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  complaints,
  onSelectComplaint,
  onSendMessage,
  onUpdateStatus,
  currentDepartment,
  onDepartmentChange,
  departments,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    complaints.length > 0 ? complaints[0].id : null
  );
  const [responseDraft, setResponseDraft] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationTier, setEscalationTier] = useState<EscalationTier>('Supervisor Review');
  const [escalationReason, setEscalationReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showInternalGuidance, setShowInternalGuidance] = useState(true);

  const selected = complaints.find((c) => c.id === selectedId);

  // Synchronize draft response when switching tickets
  React.useEffect(() => {
    if (selected) {
      setResponseDraft(selected.pipeline1Output?.draftedResponse || '');
      setIsEscalating(false);
    }
  }, [selectedId, selected]);

  const filtered = complaints.filter((c) => {
    if (currentDepartment !== 'All' && c.assignedDepartment !== currentDepartment) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    return true;
  });

  const handleSendResponse = async () => {
    if (!selected || !responseDraft.trim()) return;
    await onSendMessage(selected.id, responseDraft.trim(), 'In Progress');
  };

  const handleResolve = async () => {
    if (!selected) return;
    await onUpdateStatus(selected.id, 'Resolved');
  };

  const handleExecuteEscalation = async () => {
    if (!selected) return;
    await onSendMessage(
      selected.id,
      `[ESCALATED TO ${escalationTier}]: ${escalationReason || 'Forwarded for higher-level specialist resolution.'}`,
      'Escalated'
    );
    setIsEscalating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Department Filters */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Frontline Agent Workstation
              </span>
              <span className="text-xs text-slate-400">
                AI-Assisted & Ground-Truth Verified
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Assigned Complaint Queue
            </h1>
          </div>

          {/* Department Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Department:</span>
            <select
              value={currentDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-700/60 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium mr-1">Status:</span>
          {['All', 'Assigned', 'In Progress', 'Escalated', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Ticket List + Active Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Worklist ({filtered.length})</span>
            <span>Sorted by SLA urgency</span>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-xs">
              No tickets matching current filters.
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = item.id === selectedId;
              const isVerified = item.comparisonResult?.verificationStatus === 'Verified';
              const p1 = item.pipeline1Output;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-semibold text-blue-400">
                      {item.id}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {/* Verification Status Badge */}
                      {isVerified ? (
                        <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Review Pending</span>
                        </span>
                      )}

                      {/* SLA status badge */}
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          item.slaRiskStatus === 'Breached'
                            ? 'bg-rose-500/20 text-rose-400'
                            : item.slaRiskStatus === 'Approaching'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        SLA: {item.slaRiskStatus}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-medium text-slate-100 line-clamp-1 mb-1">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center space-x-1 text-slate-400 truncate max-w-[150px]">
                      <Tag className="w-3 h-3" />
                      <span>{p1?.category || item.assignedDepartment}</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Pri: {p1?.priority || 'P3'} ({p1?.urgency || 'Med'})
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Active Ticket Resolution Workspace (7 cols) */}
        <div className="lg:col-span-7">
          {selected ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      {selected.id}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      Customer: {selected.customerName} ({selected.customerType})
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">
                    {selected.title}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelectComplaint(selected)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition text-xs flex items-center space-x-1 cursor-pointer"
                    title="Open Full Intelligence Dossier"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Dossier</span>
                  </button>
                  <button
                    onClick={handleResolve}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolve Ticket</span>
                  </button>
                </div>
              </div>

              {/* Customer original statement */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Customer Statement & Context
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selected.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span>Product: <strong className="text-slate-300">{selected.productService}</strong></span>
                  <span>Order Ref: <strong className="text-slate-300">{selected.orderReference}</strong></span>
                  <span>Sentiment: <strong className="text-blue-300">{selected.pipeline1Output?.sentiment || 'Neutral'}</strong></span>
                </div>
              </div>

              {/* Pipeline 2 Ground-Truth Verification Callout */}
              <div
                className={`p-4 rounded-xl border ${
                  selected.comparisonResult?.verificationStatus === 'Verified'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      Rule Matrix Ground-Truth Check
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-300">
                    Verification Score: {selected.comparisonResult?.verificationScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 mt-2">
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Matched Rules</span>
                    <span className="font-mono text-blue-300 text-[11px]">
                      {selected.pipeline2Output?.matchedRules.join(', ') || 'Standard Triage'}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Python Validator</span>
                    <span className={`font-mono text-[11px] font-semibold ${selected.pythonValidation?.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {selected.pythonValidation?.status || 'Active & Validated'}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Promises Approved</span>
                    <span className={selected.pipeline2Output?.policyEligibilityApproved ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {selected.pipeline2Output?.policyEligibilityApproved ? 'Eligible' : 'Restricted'}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Urgency / SLA</span>
                    <span className="text-slate-200">
                      {selected.pipeline2Output?.expectedUrgency} ({selected.slaHours}h SLA)
                    </span>
                  </div>
                </div>

                {/* Warnings or discrepancies */}
                {selected.comparisonResult && selected.comparisonResult.discrepancies.length > 0 && (
                  <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 space-y-1">
                    <span className="font-semibold flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Discrepancies flagged for reviewer review:
                    </span>
                    <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                      {selected.comparisonResult.discrepancies.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Internal Agent Guidance Accordion */}
              {selected.pipeline1Output?.internalAgentGuidance && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowInternalGuidance(!showInternalGuidance)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-850 cursor-pointer"
                  >
                    <span className="flex items-center space-x-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      <span>Internal Agent Operational Guidance & SOP Steps</span>
                    </span>
                    {showInternalGuidance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showInternalGuidance && (
                    <div className="p-4 text-xs text-slate-300 space-y-2 border-t border-slate-800/80">
                      <p className="italic text-indigo-200 bg-indigo-950/20 p-2.5 rounded border border-indigo-500/20">
                        {selected.pipeline1Output.internalAgentGuidance}
                      </p>
                      {selected.pipeline1Output.resolutionSteps.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Recommended Action Checklist:
                          </span>
                          <ul className="space-y-1 pl-4 list-decimal text-slate-300 text-xs">
                            {selected.pipeline1Output.resolutionSteps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Draft Response Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Customer-Facing Response (Policy Grounded)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Review and edit before sending
                  </span>
                </div>
                <textarea
                  value={responseDraft}
                  onChange={(e) => setResponseDraft(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                />

                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => setIsEscalating(!isEscalating)}
                    className="px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Escalate Ticket</span>
                  </button>

                  <button
                    onClick={handleSendResponse}
                    disabled={selected.comparisonResult?.verificationStatus === 'Manual Review'}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/30 flex items-center space-x-1.5 transition cursor-pointer"
                    title={selected.comparisonResult?.verificationStatus === 'Manual Review' ? 'Requires human reviewer clearance first' : 'Send response to customer'}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {selected.comparisonResult?.verificationStatus === 'Manual Review'
                        ? 'Requires Reviewer Clearance'
                        : 'Send Response to Customer'}
                    </span>
                  </button>
                </div>

                {/* Inline Escalation Panel */}
                {isEscalating && (
                  <div className="mt-4 p-4 bg-slate-900 border border-rose-500/30 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-rose-300">
                      Escalate Complaint to Higher Authority
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Escalation Target Tier
                        </label>
                        <select
                          value={escalationTier}
                          onChange={(e: any) => setEscalationTier(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                        >
                          <option value="Supervisor Review">Supervisor Review</option>
                          <option value="Department Manager">Department Manager</option>
                          <option value="Specialist Team">Specialist Team</option>
                          <option value="Compliance Review">Compliance Review</option>
                          <option value="Critical Management Escalation">Critical Management Escalation</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Reason for Escalation
                        </label>
                        <input
                          type="text"
                          value={escalationReason}
                          onChange={(e) => setEscalationReason(e.target.value)}
                          placeholder="e.g. Safety hazard or exception approval required"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsEscalating(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExecuteEscalation}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Confirm Escalation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select a complaint ticket from the list to begin triage and response.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
