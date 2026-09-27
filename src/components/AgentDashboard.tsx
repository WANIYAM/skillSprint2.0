import React, { useState } from 'react';
import type { Complaint, EscalationTier } from '../types/index.ts';
import { Pagination } from './Pagination';
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
    (complaints ?? []).length > 0 ? complaints[0].id : null
  );
  const [responseDraft, setResponseDraft] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationTier, setEscalationTier] = useState<EscalationTier>('Supervisor Review');
  const [escalationReason, setEscalationReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [listPage, setListPage] = useState(1);
  const [showInternalGuidance, setShowInternalGuidance] = useState(true);

  const selected = (complaints ?? []).find((c) => c.id === selectedId);

  // Synchronize draft response when switching tickets
  React.useEffect(() => {
    if (selected) {
      setResponseDraft(selected.pipeline1Output?.draftedResponse || '');
      setIsEscalating(false);
    }
  }, [selectedId, selected]);

  const filtered = (complaints ?? []).filter((c) => {
    if (currentDepartment !== 'All' && c.assignedDepartment !== currentDepartment) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    return true;
  });
  const pageSize = 6;
  const currentPage = Math.min(listPage, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visibleRequests = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const agentOpenCount = filtered.filter((item) => item.status !== 'Resolved' && item.status !== 'Closed').length;
  const agentResolvedCount = filtered.filter((item) => item.status === 'Resolved' || item.status === 'Closed').length;
  const agentUrgentCount = filtered.filter((item) => item.slaRiskStatus !== 'Safe').length;
  const agentVerifiedCount = filtered.filter((item) => item.comparisonResult?.verificationStatus === 'Verified').length;
  const agentStatusCounts = [
    { label: 'Assigned', count: filtered.filter((item) => item.status === 'Assigned').length, color: 'gold' },
    { label: 'In progress', count: filtered.filter((item) => item.status === 'In Progress').length, color: 'sienna' },
    { label: 'Escalated', count: filtered.filter((item) => item.status === 'Escalated').length, color: 'mahogany' },
    { label: 'Resolved', count: agentResolvedCount, color: 'olive' },
  ];
  const agentStatusMax = Math.max(...agentStatusCounts.map((item) => item.count), 1);

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
  <div className="agent-dashboard role-dashboard space-y-6">
    {/* Header */}
    <div className="rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-widest bg-[#D7BE82]/15 text-[#D7BE82] border border-[#D7BE82]/30 font-mono">
              Support team workspace
            </span>
            <span className="text-xs text-[#bcb8a9]">
              Suggested replies are checked against support rules
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-2 tracking-tight">
            Requests assigned to you
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-[#8f8a78] font-mono uppercase tracking-widest">Dept:</span>
          <select
            value={currentDepartment}
            onChange={(e) => {
              onDepartmentChange(e.target.value);
              setListPage(1);
            }}
            className="rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-[#D7BE82]/15 overflow-x-auto text-xs relative z-10">
        <span className="text-[#8f8a78] font-medium mr-1 font-mono uppercase tracking-widest text-[10px]">Status:</span>
        {['All', 'Assigned', 'In Progress', 'Escalated', 'Resolved'].map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setListPage(1);
            }}
            className={`px-3 py-1 rounded-lg transition cursor-pointer font-mono text-[11px] tracking-wider ${
              statusFilter === st
                ? 'bg-[#D7BE82] text-[#21170b] font-semibold'
                : 'bg-[#0d0f0a]/60 text-[#8f8a78] border border-[#D7BE82]/18 hover:text-[#D7BE82]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>

    {/* KPIs */}
    <section className="role-analytics" aria-label="Agent workload overview">
      <div className="role-kpi-grid">
        {[
          { label: 'Open requests', value: agentOpenCount, note: 'Still need attention', tone: 'gold' },
          { label: 'Resolved', value: agentResolvedCount, note: 'Completed requests', tone: 'olive' },
          { label: 'Urgent', value: agentUrgentCount, note: 'Close to / past deadline', tone: 'mahogany' },
          { label: 'Checked', value: agentVerifiedCount, note: 'Passed support checks', tone: 'sienna' },
        ].map((item) => (
          <div className={`role-kpi role-kpi-${item.tone}`} key={item.label}>
            <span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small>
          </div>
        ))}
      </div>

      <div className="role-chart-card">
        <div className="role-chart-title">
          <div>
            <strong>Your workload</strong>
            <small>Requests by current status</small>
          </div>
          <Inbox className="w-4 h-4 text-[#D7BE82]" />
        </div>
        <div className="role-bar-chart mt-4">
          {agentStatusCounts.map((item) => (
            <div className="role-bar-row" key={item.label}>
              <span>{item.label}</span>
              <div><i className={`role-bar-${item.color}`} style={{ width: `${agentOpenCount + agentResolvedCount ? Math.max(item.count / agentStatusMax * 100, item.count ? 8 : 0) : 0}%` }} /></div>
              <b>{item.count}</b>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Worklist */}
      <div className="lg:col-span-5 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-[#8f8a78] px-1 font-mono uppercase tracking-widest">
          <span>Worklist ({filtered.length})</span>
          <span>Urgent first</span>
        </div>

        {filtered.length === 0 ? (
          <div className="role-chart-card p-8 text-center text-[#8f8a78] text-xs">
            No tickets matching current filters.
          </div>
        ) : (
          visibleRequests.map((item) => {
            const isSelected = item.id === selectedId;
            const isVerified = item.comparisonResult?.verificationStatus === 'Verified';
            const p1 = item.pipeline1Output;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`dashboard-request-card p-4 rounded-xl border transition cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#1a1c11] border-[#D7BE82] shadow-lg ring-1 ring-[#D7BE82]/40'
                    : 'bg-[#14160e]/60 border-[#D7BE82]/18 hover:bg-[#1a1c11]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-semibold text-[#D7BE82]">
                    {item.id}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {isVerified ? (
                      <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold rounded font-mono bg-[#515A47]/50 text-[#a7bc8d] border border-[#748365]/60">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold rounded font-mono bg-[#755C1B]/40 text-[#e4c77f] border border-[#755C1B]/60">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Review</span>
                      </span>
                    )}

                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-semibold rounded font-mono ${
                        item.slaRiskStatus === 'Breached'
                          ? 'bg-[#400406]/60 text-[#e0a1a0] border border-[#8e3736]/60'
                          : item.slaRiskStatus === 'Approaching'
                          ? 'bg-[#755C1B]/40 text-[#e4c77f] border border-[#755C1B]/60'
                          : 'bg-[#515A47]/50 text-[#a7bc8d] border border-[#748365]/60'
                      }`}
                    >
                      {item.slaRiskStatus}
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-medium text-[#f5edda] line-clamp-1 mb-1">
                  {item.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-[#8f8a78] mt-2">
                  <span className="flex items-center space-x-1 truncate max-w-[150px]">
                    <Tag className="w-3 h-3" />
                    <span>{p1?.category || item.assignedDepartment}</span>
                  </span>
                  <span className="font-mono text-[10px]">
                    {p1?.priority || 'P3'} ({p1?.urgency || 'Med'})
                  </span>
                </div>
              </div>
            );
          })
        )}
        <Pagination page={currentPage} pageSize={pageSize} totalItems={filtered.length} onPageChange={setListPage} />
      </div>

      {/* Workspace */}
      <div className="lg:col-span-7">
        {selected ? (
          <div className="role-chart-card space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D7BE82]/20">
              <div>
                <div className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="font-bold text-[#D7BE82]">{selected.id}</span>
                  <span className="text-[#8f8a78]">•</span>
                  <span className="text-[#bcb8a9]">
                    From: {selected.customerName} ({selected.customerType})
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-1 tracking-tight">
                  {selected.title}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSelectComplaint(selected)}
                  className="p-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer bg-[#515A47]/40 text-[#bcb8a9] border border-[#D7BE82]/25 hover:bg-[#515A47]/60"
                  title="View all request details"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
                <button
                  onClick={handleResolve}
                  className="px-3 py-1.5 rounded-lg font-medium transition text-xs flex items-center space-x-1 cursor-pointer bg-[#515A47]/60 text-[#a7bc8d] border border-[#748365]/60 hover:bg-[#515A47]/80"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark resolved</span>
                </button>
              </div>
            </div>

            {/* Customer message */}
            <div className="bg-[#0d0f0a]/70 border border-[#D7BE82]/18 rounded-xl p-4">
              <span className="text-[10px] font-mono font-semibold text-[#D7BE82] uppercase tracking-widest block mb-1.5">
                Customer's message
              </span>
              <p className="text-xs text-[#f5edda] leading-relaxed">
                {selected.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-[#D7BE82]/15 text-[11px] text-[#8f8a78] font-mono">
                <span>Product: <strong className="text-[#f5edda]">{selected.productService}</strong></span>
                <span>Order: <strong className="text-[#f5edda]">{selected.orderReference}</strong></span>
                <span>Sentiment: <strong className="text-[#D7BE82]">{selected.pipeline1Output?.sentiment || 'Neutral'}</strong></span>
              </div>
            </div>

            {/* Verification callout */}
            <div
              className={`p-4 rounded-xl border ${
                selected.comparisonResult?.verificationStatus === 'Verified'
                  ? 'bg-[#515A47]/25 border-[#748365]/50'
                  : 'bg-[#755C1B]/20 border-[#755C1B]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#a7bc8d]" />
                  <span className="text-xs font-bold text-[#f5edda] uppercase tracking-widest font-mono">
                    Support rules check
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-[#a7bc8d]">
                  Match: {selected.comparisonResult?.verificationScore}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#bcb8a9] mt-2">
                <div className="bg-[#0d0f0a]/70 p-2 rounded border border-[#D7BE82]/15">
                  <span className="text-[10px] text-[#8f8a78] block font-mono uppercase">Rules</span>
                  <span className="font-mono text-[#D7BE82] text-[11px]">
                    {(selected.pipeline2Output?.matchedRules || []).join(', ') || 'Standard'}
                  </span>
                </div>
                <div className="bg-[#0d0f0a]/70 p-2 rounded border border-[#D7BE82]/15">
                  <span className="text-[10px] text-[#8f8a78] block font-mono uppercase">Status</span>
                  <span className={`font-mono text-[11px] font-semibold ${selected.pythonValidation?.passed ? 'text-[#a7bc8d]' : 'text-[#e4c77f]'}`}>
                    {selected.pythonValidation?.status || 'Active'}
                  </span>
                </div>
                <div className="bg-[#0d0f0a]/70 p-2 rounded border border-[#D7BE82]/15">
                  <span className="text-[10px] text-[#8f8a78] block font-mono uppercase">Eligibility</span>
                  <span className={selected.pipeline2Output?.policyEligibilityApproved ? 'text-[#a7bc8d] font-semibold' : 'text-[#e0a1a0] font-semibold'}>
                    {selected.pipeline2Output?.policyEligibilityApproved ? 'Eligible' : 'Restricted'}
                  </span>
                </div>
                <div className="bg-[#0d0f0a]/70 p-2 rounded border border-[#D7BE82]/15">
                  <span className="text-[10px] text-[#8f8a78] block font-mono uppercase">SLA</span>
                  <span className="text-[#f5edda]">
                    {selected.pipeline2Output?.expectedUrgency} ({selected.slaHours}h)
                  </span>
                </div>
              </div>

              {selected.comparisonResult && (selected.comparisonResult.discrepancies || []).length > 0 && (
                <div className="mt-3 p-2.5 bg-[#755C1B]/25 border border-[#755C1B]/50 rounded-lg text-xs text-[#e4c77f] space-y-1">
                  <span className="font-semibold flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Differences that need a review:
                  </span>
                  <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                    {(selected.comparisonResult.discrepancies || []).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Internal guidance */}
            {selected.pipeline1Output?.internalAgentGuidance && (
              <div className="bg-[#0d0f0a]/70 border border-[#D7BE82]/18 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowInternalGuidance(!showInternalGuidance)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#bcb8a9] hover:bg-[#D7BE82]/5 cursor-pointer"
                >
                  <span className="flex items-center space-x-1.5 font-mono uppercase tracking-widest text-[10px]">
                    <HelpCircle className="w-4 h-4 text-[#D7BE82]" />
                    <span>Suggested next steps</span>
                  </span>
                  {showInternalGuidance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showInternalGuidance && (
                  <div className="p-4 text-xs text-[#bcb8a9] space-y-2 border-t border-[#D7BE82]/15">
                    <p className="italic text-[#e4c77f] bg-[#755C1B]/15 p-2.5 rounded border border-[#755C1B]/30">
                      {selected.pipeline1Output.internalAgentGuidance}
                    </p>
                    {(selected.pipeline1Output.resolutionSteps || []).length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono font-semibold text-[#8f8a78] uppercase tracking-widest block mb-1">
                          Suggested actions:
                        </span>
                        <ul className="space-y-1 pl-4 list-decimal text-[#bcb8a9] text-xs">
                          {(selected.pipeline1Output.resolutionSteps || []).map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reply editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-mono font-semibold text-[#D7BE82] uppercase tracking-widest flex items-center space-x-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Reply to the customer</span>
                </label>
                <span className="text-[10px] text-[#8f8a78] font-mono">
                  Review and edit before sending
                </span>
              </div>
              <textarea
                value={responseDraft}
                onChange={(e) => setResponseDraft(e.target.value)}
                rows={6}
                className="w-full rounded-xl p-3 text-xs leading-relaxed"
              />

              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => setIsEscalating(!isEscalating)}
                  className="px-3 py-1.5 rounded-lg border border-[#8e3736]/60 text-[#e0a1a0] hover:bg-[#400406]/30 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Escalate Ticket</span>
                </button>

                <button
                  onClick={handleSendResponse}
                  disabled={selected.comparisonResult?.verificationStatus === 'Manual Review'}
                  className="px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded-lg shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                  style={{
                    background: 'linear-gradient(180deg, #e8b85e 0%, #d59837 100%)',
                    color: '#21170b',
                  }}
                  title={selected.comparisonResult?.verificationStatus === 'Manual Review' ? 'Requires human reviewer clearance first' : 'Send response to customer'}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {selected.comparisonResult?.verificationStatus === 'Manual Review'
                      ? 'Requires Reviewer Clearance'
                      : 'Send reply'}
                  </span>
                </button>
              </div>

              {/* Inline escalation */}
              {isEscalating && (
                <div className="mt-4 p-4 bg-[#0d0f0a]/80 border border-[#8e3736]/50 rounded-xl space-y-3">
                  <h4 className="text-[11px] font-mono font-bold text-[#e0a1a0] uppercase tracking-widest">
                    Send this request to a supervisor
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-[#8f8a78] mb-1 font-mono uppercase">Send to</label>
                      <select
                        value={escalationTier}
                        onChange={(e: any) => setEscalationTier(e.target.value)}
                        className="w-full rounded-lg p-2 text-xs"
                      >
                        <option value="Supervisor Review">Supervisor Review</option>
                        <option value="Department Manager">Department Manager</option>
                        <option value="Specialist Team">Specialist Team</option>
                        <option value="Compliance Review">Compliance Review</option>
                        <option value="Critical Management Escalation">Critical Management Escalation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8f8a78] mb-1 font-mono uppercase">Why?</label>
                      <input
                        type="text"
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                        placeholder="Safety concern / needs supervisor"
                        className="w-full rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsEscalating(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-[#8f8a78] hover:text-[#bcb8a9] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteEscalation}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{
                        background: 'linear-gradient(180deg, #8e3736 0%, #400406 100%)',
                        color: '#f5edda',
                      }}
                    >
                      Send to supervisor
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="role-chart-card p-12 text-center text-[#8f8a78] text-xs">
            Choose a request from the list to view it and reply.
          </div>
        )}
      </div>
    </div>
  </div>
);
};
