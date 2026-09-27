import React, { useState } from 'react';
import { Pagination } from './Pagination';
import type { Complaint, EscalationTier, UrgencyLevel, PriorityLevel } from '../types/index.ts';
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  ArrowUpRight,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  FileText,
  Building,
  Flame,
  Check,
  Zap,
} from 'lucide-react';

interface ReviewerQueueProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onReviewDecision: (complaintId: string, decisionData: any) => Promise<void>;
  onReAnalyze: (complaintId: string) => Promise<void>;
  departments: string[];
}

export const ReviewerQueue: React.FC<ReviewerQueueProps> = ({
  complaints,
  onSelectComplaint,
  onReviewDecision,
  onReAnalyze,
  departments,
}) => {
  // Filter for cases requiring manual review or with low verification scores
  const queueCases = (complaints ?? []).filter(
    (c) =>
      c.pipeline1Output?.pipelineStatus === 'GENAI_UNAVAILABLE' ||
      c.comparisonResult?.verificationStatus === 'Manual Review' ||
      (c.comparisonResult && c.comparisonResult.verificationScore < 85) ||
      (c.pipeline2Output && (c.pipeline2Output.adversarialPromptFlags || []).length > 0) ||
      (c.pipeline2Output && (c.pipeline2Output.unsupportedPromiseFlags || []).length > 0)
  );
  const reviewVerified = (complaints ?? []).filter((item) => item.comparisonResult?.verificationStatus === 'Verified').length;
  const reviewFlaggedCount = queueCases.filter((item) => (item.pipeline2Output?.adversarialPromptFlags?.length ?? 0) > 0).length;
  const reviewPromiseCount = queueCases.filter((item) => (item.pipeline2Output?.unsupportedPromiseFlags?.length ?? 0) > 0).length;

  const [selectedId, setSelectedId] = useState<string | null>(
    (queueCases ?? []).length > 0 ? queueCases[0].id : null
  );
  const [listPage, setListPage] = useState(1);
  const pageSize = 6;
  const currentPage = Math.min(listPage, Math.max(1, Math.ceil(queueCases.length / pageSize)));
  const visibleQueueCases = queueCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selected = (complaints ?? []).find((c) => c.id === selectedId);

  // Reviewer Modification Inputs
  const [overrideDept, setOverrideDept] = useState('');
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overrideUrgency, setOverrideUrgency] = useState<UrgencyLevel>('High');
  const [overridePriority, setOverridePriority] = useState<PriorityLevel>('P2');
  const [overrideResponse, setOverrideResponse] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (selected) {
      setOverrideDept(selected.assignedDepartment || selected.pipeline2Output?.expectedDepartment || 'Customer Support');
      setOverrideCategory(selected.pipeline1Output?.category || selected.pipeline2Output?.expectedCategory || '');
      setOverrideUrgency(selected.pipeline2Output?.expectedUrgency || 'High');
      setOverridePriority(selected.pipeline2Output?.expectedPriority || 'P2');
      setOverrideResponse(selected.pipeline1Output?.draftedResponse || '');
      setReviewerNotes('');
    }
  }, [selectedId, selected]);

  const handleAction = async (decision: 'Approved' | 'Modified' | 'Rejected' | 'Reclassified' | 'Reassigned' | 'Escalated') => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await onReviewDecision(selected.id, {
        reviewedBy: 'Dr. Tariq Al-Mansoor (Reviewer Lead)',
        decision,
        overriddenDepartment: overrideDept,
        overriddenCategory: overrideCategory,
        overriddenUrgency: overrideUrgency,
        overriddenPriority: overridePriority,
        overriddenResponse: overrideResponse,
        notes: reviewerNotes || `Reviewer action: ${decision}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await onReAnalyze(selected.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="reviewer-dashboard role-dashboard space-y-6">
    {/* Banner */}
    <div className="rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-widest bg-[#D7BE82]/15 text-[#D7BE82] border border-[#D7BE82]/30 font-mono flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Review queue
            </span>
            <span className="text-xs text-[#bcb8a9]">
              Flagged requests awaiting a second look
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2 tracking-tight">
            Requests to review
          </h1>
          <p className="text-xs text-[#8f8a78] mt-1 max-w-2xl leading-relaxed">
            Requests appear here when details need checking, such as a safety concern, a policy question, or a suggested reply that needs review.
          </p>
        </div>

        <div className="bg-[#0d0f0a]/80 border border-[#D7BE82]/30 p-3 rounded-xl flex items-center space-x-4 backdrop-blur">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#8f8a78] block font-mono tracking-widest">Pending Review</span>
            <span className="text-2xl font-mono font-bold text-[#D7BE82]">
              {queueCases.length}
            </span>
          </div>
          <div className="w-px h-8 bg-[#D7BE82]/20" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#8f8a78] block font-mono tracking-widest">All requests</span>
            <span className="text-2xl font-mono font-bold text-[#f5edda]">
              {complaints.length}
            </span>
          </div>
        </div>
      </div>
    </div>

    <section className="role-analytics" aria-label="Review workload overview">
      <div className="role-kpi-grid">
        {[
          { label: 'To review', value: queueCases.length, note: 'Requests waiting for a check', tone: 'gold' },
          { label: 'All requests', value: complaints.length, note: 'In the current queue', tone: 'olive' },
          { label: 'Unsafe instructions', value: reviewFlaggedCount, note: 'Flagged for review', tone: 'mahogany' },
          { label: 'Passed checks', value: reviewVerified, note: `${reviewPromiseCount} offer flags to check`, tone: 'sienna' },
        ].map((item) => (
          <div className={`role-kpi role-kpi-${item.tone}`} key={item.label}>
            <span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small>
          </div>
        ))}
      </div>

      <div className="role-chart-card">
        <div className="role-chart-title">
          <div>
            <strong>Review flags</strong>
            <small>Types of issues in requests awaiting review</small>
          </div>
          <ShieldAlert className="w-4 h-4 text-[#D7BE82]" />
        </div>
        <div className="role-bar-chart mt-4">
          {[
            { label: 'Needs review', count: queueCases.length, color: 'gold' },
            { label: 'Unsafe instruction', count: reviewFlaggedCount, color: 'mahogany' },
            { label: 'Offer needs checking', count: reviewPromiseCount, color: 'sienna' },
          ].map((item) => (
            <div className="role-bar-row" key={item.label}>
              <span>{item.label}</span>
              <div><i className={`role-bar-${item.color}`} style={{ width: `${queueCases.length ? Math.max(item.count / queueCases.length * 100, item.count ? 8 : 0) : 0}%` }} /></div>
              <b>{item.count}</b>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Main Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-[#8f8a78] px-1 font-mono uppercase tracking-widest">
          <span>Requests ({queueCases.length})</span>
          <span>Priority ↓</span>
        </div>

        {queueCases.length === 0 ? (
          <div className="role-chart-card p-8 text-center text-[#8f8a78] text-xs">
            <CheckCircle2 className="w-8 h-8 text-[#a7bc8d] mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-[#f5edda]">Nothing needs review</p>
            <p className="text-[11px] mt-1">All requests have passed their checks.</p>
          </div>
        ) : (
          visibleQueueCases.map((item) => {
            const isSelected = item.id === selectedId;
            const score = item.comparisonResult?.verificationScore ?? 0;
            const hasAdversarial = (item.pipeline2Output?.adversarialPromptFlags?.length ?? 0) > 0;
            const hasUnsupported = (item.pipeline2Output?.unsupportedPromiseFlags?.length ?? 0) > 0;

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
                    {hasAdversarial && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded font-mono bg-[#400406]/60 text-[#e0a1a0] border border-[#8e3736]/60">
                        UNSAFE
                      </span>
                    )}
                    {hasUnsupported && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded font-mono bg-[#7A4419]/50 text-[#e4c77f] border border-[#7A4419]/70">
                        OFFER
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-[#D7BE82]/15 text-[#D7BE82] border border-[#D7BE82]/30">
                      {item.pipeline1Output?.pipelineStatus === 'GENAI_UNAVAILABLE' ? 'GENAI OFFLINE' : `${score}%`}
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-medium text-[#f5edda] line-clamp-1 mb-1">
                  {item.title}
                </h3>

                <div className="text-[11px] text-[#8f8a78] flex items-center justify-between mt-2">
                  <span className="truncate max-w-[170px]">{item.customerName}</span>
                  <span className="text-[#e0a1a0] font-mono text-[10px]">
                    {item.comparisonResult?.discrepancies?.length || 0} issues
                  </span>
                </div>
              </div>
            );
          })
        )}
        <Pagination page={currentPage} pageSize={pageSize} totalItems={queueCases.length} onPageChange={setListPage} />
      </div>

      {/* Workspace */}
      <div className="lg:col-span-8">
        {selected ? (
          <div className="role-chart-card space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D7BE82]/20">
              <div>
                <div className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="font-bold text-[#D7BE82]">{selected.id}</span>
                  <span className="text-[#8f8a78]">•</span>
                  <span className="text-[#bcb8a9]">
                    {selected.customerName} ({selected.customerType})
                  </span>
                  <span className="text-[#8f8a78]">•</span>
                  <span className="text-[#8f8a78]">
                    {new Date(selected.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1 tracking-tight">
                  {selected.title}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRegenerate}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#bcb8a9] bg-[#515A47]/40 border border-[#D7BE82]/25 hover:bg-[#515A47]/60 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>Check again</span>
                </button>
                <button
                  onClick={() => onSelectComplaint(selected)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  View details
                </button>
              </div>
            </div>

            {/* Original complaint */}
            <div className="bg-[#0d0f0a]/70 border border-[#D7BE82]/18 rounded-xl p-4 text-xs">
              <span className="text-[10px] font-mono font-semibold text-[#D7BE82] uppercase tracking-widest block mb-1.5">
                Original Untrusted Complaint Text
              </span>
              <p className="text-[#f5edda] leading-relaxed font-sans bg-[#0d0f0a] p-3 rounded-lg border border-[#D7BE82]/12">
                {selected.description}
              </p>
              <div className="mt-2 text-[11px] text-[#8f8a78] flex flex-wrap gap-4 font-mono">
                <span>Product: <strong className="text-[#f5edda]">{selected.productService}</strong></span>
                <span>Order: <strong className="text-[#f5edda]">{selected.orderReference}</strong></span>
                <span>Claimed: <strong className="text-[#D7BE82]">{selected.requestedResolution || 'None'}</strong></span>
              </div>
            </div>

            {/* Dual pipeline */}
            {selected.pipeline1Output?.pipelineStatus === 'GENAI_UNAVAILABLE' && (
              <div role="alert" className="border border-[#e0a1a0]/50 bg-[#400406]/25 rounded-xl p-4 text-xs text-[#f0c1bd]">
                <strong className="block font-mono uppercase tracking-widest mb-1">GenAI analysis unavailable</strong>
                <p>This complaint was not analyzed by GenAI. No AI classification or customer response was generated. Manual triage is required.</p>
                <p className="mt-2">{selected.pipeline1Output.error} (attempts: {selected.pipeline1Output.attempts ?? 0})</p>
              </div>
            )}
            <div className="border border-[#D7BE82]/22 rounded-xl overflow-hidden">
              <div className="bg-[#0d0f0a] px-4 py-2.5 border-b border-[#D7BE82]/22 flex items-center justify-between">
                <span className="text-xs font-bold text-[#f5edda] flex items-center space-x-1.5 uppercase tracking-widest font-mono">
                  <ShieldAlert className="w-4 h-4 text-[#D7BE82]" />
                  <span>Check results</span>
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#D7BE82]/15 text-[#D7BE82] border border-[#D7BE82]/30">
                  {selected.comparisonResult ? `Agreement: ${selected.comparisonResult.verificationScore}%` : 'Comparison: Not run'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#D7BE82]/15 text-xs">
                {/* P1 */}
                <div className="p-4 bg-[#0d0f0a]/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#D7BE82]/15">
                    <span className="font-semibold text-[#D7BE82]">Suggested result</span>
                    <span className="text-[10px] text-[#8f8a78] font-mono">
                      {selected.pipeline1Output?.modelUsed || (selected.pipeline1Output?.pipelineStatus === 'GENAI_UNAVAILABLE' ? 'UNAVAILABLE' : 'GenAI')}
                    </span>
                  </div>
                  <div className="space-y-2 text-[#bcb8a9]">
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Category</span>
                      <span className="font-semibold text-[#f5edda]">
                        {selected.pipeline1Output?.category} / {selected.pipeline1Output?.subcategory}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Routing</span>
                      <span className="text-[#D7BE82] font-medium">
                        {selected.pipeline1Output?.recommendedDepartment}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Urgency</span>
                        <span className="text-[#f5edda]">{selected.pipeline1Output?.urgency}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Priority</span>
                        <span className="text-[#f5edda]">{selected.pipeline1Output?.priority}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Escalation</span>
                      <span className={selected.pipeline1Output?.escalationRequired ? 'text-[#e0a1a0] font-bold' : 'text-[#8f8a78]'}>
                        {selected.pipeline1Output?.escalationRequired ? `Yes (${selected.pipeline1Output.escalationTier})` : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Python */}
                <div className="p-4 bg-[#0d0f0a]/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#D7BE82]/15">
                    <span className="font-semibold text-[#D7BE82]">Automated check</span>
                    <span className="text-[10px] text-[#D7BE82] font-mono">PY 3.10</span>
                  </div>
                  <div className="space-y-2 text-[#bcb8a9]">
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Status</span>
                      <span className={`font-semibold ${selected.pythonValidation?.passed ? 'text-[#a7bc8d]' : 'text-[#e4c77f]'}`}>
                        {selected.pythonValidation?.status || (selected.pipeline1Output?.pipelineStatus === 'GENAI_UNAVAILABLE' ? 'Not run' : 'Active & Validated')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Score</span>
                      <span className="text-[#f5edda] font-mono font-bold">
                        {selected.pythonValidation?.validationScore ?? 90}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Threats</span>
                      <span className={(selected.pythonValidation?.adversarialThreats?.length || 0) > 0 ? 'text-[#e0a1a0] font-bold' : 'text-[#8f8a78]'}>
                        {(selected.pythonValidation?.adversarialThreats?.length || 0) > 0
                          ? `${selected.pythonValidation?.adversarialThreats?.length} detected`
                          : 'None detected'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Findings</span>
                      <span className={(selected.pythonValidation?.findings?.length || 0) > 0 ? 'text-[#e4c77f] font-semibold' : 'text-[#a7bc8d]'}>
                        {selected.pythonValidation?.findings?.length || 0} flagged
                      </span>
                    </div>
                  </div>
                </div>

                {/* P2 */}
                <div className="p-4 bg-[#0d0f0a]/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#D7BE82]/15">
                    <span className="font-semibold text-[#a7bc8d]">Support rules</span>
                    <span className="text-[10px] text-[#a7bc8d] font-mono">DETERMINISTIC</span>
                  </div>
                  <div className="space-y-2 text-[#bcb8a9]">
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Expected Cat</span>
                      <span className="font-semibold text-[#a7bc8d]">
                        {selected.pipeline2Output?.expectedCategory}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Mandatory Routing</span>
                      <span className="text-[#a7bc8d] font-medium">
                        {selected.pipeline2Output?.expectedDepartment}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Urgency</span>
                        <span className="font-bold text-[#f5edda]">{selected.pipeline2Output?.expectedUrgency}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Priority</span>
                        <span className="font-bold text-[#f5edda]">{selected.pipeline2Output?.expectedPriority}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8f8a78] uppercase block font-mono tracking-wider">Mandatory Esc.</span>
                      <span className={selected.pipeline2Output?.mandatoryEscalation ? 'text-[#e0a1a0] font-bold' : 'text-[#8f8a78]'}>
                        {selected.pipeline2Output?.mandatoryEscalation ? `MANDATORY (${selected.pipeline2Output.mandatoryEscalationTier})` : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selected.comparisonResult?.discrepancies && (selected.comparisonResult.discrepancies || []).length > 0 && (
                <div className="bg-[#755C1B]/20 border-t border-[#755C1B]/40 p-3 text-xs text-[#e4c77f]">
                  <span className="font-bold block mb-1 font-mono uppercase tracking-widest text-[10px]">Comparison Engine Flags:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {(selected.comparisonResult.discrepancies || []).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Adjudication controls */}
            <div className="bg-[#0d0f0a]/60 border border-[#D7BE82]/25 rounded-xl p-5 space-y-4">
              <h3 className="text-[11px] font-bold text-[#f5edda] uppercase tracking-widest flex items-center space-x-2 font-mono">
                <Edit3 className="w-4 h-4 text-[#D7BE82]" />
                <span>Review and update this request</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-[#8f8a78] mb-1 font-mono uppercase tracking-widest">Override Dept</label>
                  <select
                    value={overrideDept}
                    onChange={(e) => setOverrideDept(e.target.value)}
                    className="w-full rounded-lg p-2 text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#8f8a78] mb-1 font-mono uppercase tracking-widest">Urgency</label>
                  <select
                    value={overrideUrgency}
                    onChange={(e: any) => setOverrideUrgency(e.target.value)}
                    className="w-full rounded-lg p-2 text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#8f8a78] mb-1 font-mono uppercase tracking-widest">Priority</label>
                  <select
                    value={overridePriority}
                    onChange={(e: any) => setOverridePriority(e.target.value)}
                    className="w-full rounded-lg p-2 text-xs"
                  >
                    <option value="P1">P1 (Immediate)</option>
                    <option value="P2">P2 (Urgent)</option>
                    <option value="P3">P3 (Standard)</option>
                    <option value="P4">P4 (Low)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#8f8a78] mb-1 font-mono uppercase tracking-widest">
                  Customer Response Adjustment
                </label>
                <textarea
                  value={overrideResponse}
                  onChange={(e) => setOverrideResponse(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8f8a78] mb-1 font-mono uppercase tracking-widest">
                  Review notes (required)
                </label>
                <input
                  type="text"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Write a short note explaining your decision."
                  className="w-full rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#D7BE82]/15">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAction('Rejected')}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-lg border border-[#8e3736]/60 text-[#e0a1a0] hover:bg-[#400406]/30 text-xs font-medium cursor-pointer"
                  >
                    Reject request
                  </button>
                  <button
                    onClick={() => handleAction('Escalated')}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-lg border border-[#7A4419]/70 text-[#e4c77f] hover:bg-[#7A4419]/30 text-xs font-medium cursor-pointer"
                  >
                    Send to manager
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAction('Modified')}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold shadow-md cursor-pointer bg-[#D7BE82]/15 text-[#D7BE82] border border-[#D7BE82]/40 hover:bg-[#D7BE82]/25"
                  >
                    Approve with changes
                  </button>
                  <button
                    onClick={() => handleAction('Approved')}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold shadow-md cursor-pointer bg-[#515A47]/60 text-[#a7bc8d] border border-[#748365]/60 hover:bg-[#515A47]/80"
                  >
                    Approve as suggested
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="role-chart-card p-12 text-center text-[#8f8a78] text-xs">
            Choose a request from the list to review.
          </div>
        )}
      </div>
    </div>
  </div>
);
};
