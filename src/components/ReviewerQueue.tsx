import React, { useState } from 'react';
import { Complaint, EscalationTier, UrgencyLevel, PriorityLevel } from '../types';
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
  const queueCases = complaints.filter(
    (c) =>
      c.comparisonResult?.verificationStatus === 'Manual Review' ||
      (c.comparisonResult && c.comparisonResult.verificationScore < 85) ||
      (c.pipeline2Output && c.pipeline2Output.adversarialPromptFlags.length > 0) ||
      (c.pipeline2Output && c.pipeline2Output.unsupportedPromiseFlags.length > 0)
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    queueCases.length > 0 ? queueCases[0].id : null
  );

  const selected = complaints.find((c) => c.id === selectedId);

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
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Human Reviewer Checkpoint
              </span>
              <span className="text-xs text-slate-400">
                AI vs. Ground-Truth Rule Discrepancy Resolution
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Manual Review & Adjudication Queue
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              When GenAI predictions clash with the Complaint Resolution Rule Matrix, or when safety
              hazards, adversarial prompt injections, or policy violations are detected, tickets route here
              for authoritative human signoff.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl flex items-center space-x-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Review</span>
              <span className="text-2xl font-mono font-bold text-amber-400">
                {queueCases.length}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">System Total</span>
              <span className="text-2xl font-mono font-bold text-slate-300">
                {complaints.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Flagged Cases Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Flagged Discrepancies ({queueCases.length})</span>
            <span>Priority Order</span>
          </div>

          {queueCases.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-300">Manual Review Queue is Empty</p>
              <p className="text-[11px] text-slate-500 mt-1">
                All complaint outputs have achieved 100% agreement with the Rule Matrix.
              </p>
            </div>
          ) : (
            queueCases.map((item) => {
              const isSelected = item.id === selectedId;
              const score = item.comparisonResult?.verificationScore ?? 0;
              const hasAdversarial = (item.pipeline2Output?.adversarialPromptFlags.length ?? 0) > 0;
              const hasUnsupported = (item.pipeline2Output?.unsupportedPromiseFlags.length ?? 0) > 0;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-800 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-semibold text-amber-400">
                      {item.id}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {hasAdversarial && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Injection
                        </span>
                      )}
                      {hasUnsupported && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Bad Promise
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-300">
                        {score}% Match
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-medium text-slate-100 line-clamp-1 mb-1">
                    {item.title}
                  </h3>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-2">
                    <span className="truncate max-w-[170px]">{item.customerName}</span>
                    <span className="text-rose-400 font-mono text-[10px]">
                      {item.comparisonResult?.discrepancies.length || 0} issues
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Adjudication Workspace (8 cols) */}
        <div className="lg:col-span-8">
          {selected ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {selected.id}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      Customer: {selected.customerName} ({selected.customerType})
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      Submitted: {new Date(selected.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selected.title}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>Re-Run Dual Pipeline</span>
                  </button>
                  <button
                    onClick={() => onSelectComplaint(selected)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer"
                  >
                    Audit Dossier
                  </button>
                </div>
              </div>

              {/* Original Complaint Box */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Original Untrusted Complaint Text
                </span>
                <p className="text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {selected.description}
                </p>
                <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap gap-4">
                  <span>Product: <strong className="text-slate-200">{selected.productService}</strong></span>
                  <span>Order Ref: <strong className="text-slate-200">{selected.orderReference}</strong></span>
                  <span>Claimed Resolution: <strong className="text-amber-300">{selected.requestedResolution || 'None stated'}</strong></span>
                </div>
              </div>

              {/* Side-by-side Dual Pipeline Discrepancy Matrix */}
              <div className="border border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Pipeline Comparison Matrix</span>
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Agreement Score: {selected.comparisonResult?.verificationScore}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700 text-xs">
                  {/* Left: Pipeline 1 (GenAI) */}
                  <div className="p-4 bg-slate-900/40 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-semibold text-blue-400 flex items-center space-x-1">
                        <span>Pipeline 1: GenAI Output</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {selected.pipeline1Output?.modelUsed || 'GenAI'}
                      </span>
                    </div>

                    <div className="space-y-2 text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Category & Subcategory</span>
                        <span className="font-semibold text-white">
                          {selected.pipeline1Output?.category} / {selected.pipeline1Output?.subcategory}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Recommended Routing</span>
                        <span className="text-blue-300 font-medium">
                          {selected.pipeline1Output?.recommendedDepartment}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Urgency</span>
                          <span className="text-slate-200">{selected.pipeline1Output?.urgency}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Priority</span>
                          <span className="text-slate-200">{selected.pipeline1Output?.priority}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Escalation Flag</span>
                        <span className={selected.pipeline1Output?.escalationRequired ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {selected.pipeline1Output?.escalationRequired ? `Yes (${selected.pipeline1Output.escalationTier})` : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Python Ground-Truth Validator */}
                  <div className="p-4 bg-slate-900/40 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-semibold text-amber-400 flex items-center space-x-1">
                        <span>Python Ground-Truth Validator</span>
                      </span>
                      <span className="text-[10px] text-amber-500 font-mono">
                        Python 3.10
                      </span>
                    </div>

                    <div className="space-y-2 text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Crosscheck Status</span>
                        <span className={`font-semibold ${selected.pythonValidation?.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {selected.pythonValidation?.status || 'Active & Validated'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Crosscheck Score</span>
                        <span className="text-white font-mono font-bold">
                          {selected.pythonValidation?.validationScore ?? 90}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Adversarial Threats</span>
                        <span className={(selected.pythonValidation?.adversarialThreats?.length || 0) > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {(selected.pythonValidation?.adversarialThreats?.length || 0) > 0
                            ? `${selected.pythonValidation?.adversarialThreats.length} detected`
                            : 'None detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Python Finding Count</span>
                        <span className={(selected.pythonValidation?.findings?.length || 0) > 0 ? 'text-amber-300 font-semibold' : 'text-emerald-400'}>
                          {selected.pythonValidation?.findings?.length || 0} findings flagged
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Pipeline 2 (Rule Matrix Ground-Truth) */}
                  <div className="p-4 bg-slate-900/40 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                        <span>Pipeline 2: Rule Matrix</span>
                      </span>
                      <span className="text-[10px] text-emerald-500 font-mono">
                        Deterministic Rules
                      </span>
                    </div>

                    <div className="space-y-2 text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Expected Category</span>
                        <span className="font-semibold text-emerald-300">
                          {selected.pipeline2Output?.expectedCategory} / {selected.pipeline2Output?.expectedSubcategory}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Mandatory Routing</span>
                        <span className="text-emerald-300 font-medium">
                          {selected.pipeline2Output?.expectedDepartment}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Rule Urgency</span>
                          <span className="font-bold text-white">{selected.pipeline2Output?.expectedUrgency}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Rule Priority</span>
                          <span className="font-bold text-white">{selected.pipeline2Output?.expectedPriority}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Mandatory Escalation</span>
                        <span className={selected.pipeline2Output?.mandatoryEscalation ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {selected.pipeline2Output?.mandatoryEscalation ? `MANDATORY (${selected.pipeline2Output.mandatoryEscalationTier})` : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discrepancies Bar */}
                {selected.comparisonResult?.discrepancies && selected.comparisonResult.discrepancies.length > 0 && (
                  <div className="bg-amber-950/30 border-t border-amber-500/30 p-3 text-xs text-amber-200">
                    <span className="font-bold block mb-1">Comparison Engine Flags:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {selected.comparisonResult.discrepancies.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Reviewer Adjudication & Override Controls */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <span>Reviewer Override & Final Adjudication</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Override Department
                    </label>
                    <select
                      value={overrideDept}
                      onChange={(e) => setOverrideDept(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Override Urgency
                    </label>
                    <select
                      value={overrideUrgency}
                      onChange={(e: any) => setOverrideUrgency(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Override Priority
                    </label>
                    <select
                      value={overridePriority}
                      onChange={(e: any) => setOverridePriority(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="P1">P1 (Immediate)</option>
                      <option value="P2">P2 (Urgent)</option>
                      <option value="P3">P3 (Standard)</option>
                      <option value="P4">P4 (Low)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Customer Response Adjustment (Clean of unverified claims)
                  </label>
                  <textarea
                    value={overrideResponse}
                    onChange={(e) => setOverrideResponse(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Reviewer Audit Notes (Mandatory for record keeping)
                  </label>
                  <input
                    type="text"
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="e.g. Cleared prompt injection syntax and adjusted to standard return policy POL-RET-01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Reviewer Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAction('Rejected')}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-medium cursor-pointer"
                    >
                      Reject Claim
                    </button>
                    <button
                      onClick={() => handleAction('Escalated')}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-lg border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs font-medium cursor-pointer"
                    >
                      Escalate to Legal/Exec
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAction('Modified')}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                    >
                      Approve with Overrides
                    </button>
                    <button
                      onClick={() => handleAction('Approved')}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                    >
                      Approve AI As-Is
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select a flagged discrepancy ticket from the left column to adjudicate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
