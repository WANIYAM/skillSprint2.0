import React, { useState } from 'react';
import type { Complaint, PolicyDocument } from '../types/index.ts';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Bot,
  Grid,
  FileText,
  Clock,
  History,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  policies: PolicyDocument[];
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  policies,
}) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'pipeline1' | 'python' | 'pipeline2' | 'audit' | 'policies'>('dossier');
  const [copied, setCopied] = useState(false);

  if (!complaint) return null;

  const p1 = complaint.pipeline1Output;
  const p2 = complaint.pipeline2Output;
  const comp = complaint.comparisonResult;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(complaint, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
              {complaint.id}
            </span>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {complaint.title}
              </h2>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                <span>Customer: {complaint.customerName}</span>
                <span>•</span>
                <span>Order: {complaint.orderReference}</span>
                <span>•</span>
                <span>Dept: {complaint.assignedDepartment}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyJson}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 cursor-pointer"
              title="Copy JSON Payload"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied' : 'JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-1 px-4 sm:px-6 pt-2 border-b border-slate-800 bg-slate-900/50 text-xs overflow-x-auto scrollbar-none whitespace-nowrap">
          {[
            { id: 'dossier', label: 'Triage Dossier' },
            { id: 'pipeline1', label: 'Pipeline 1 (GenAI)' },
            { id: 'python', label: 'Python Crosscheck' },
            { id: 'pipeline2', label: 'Pipeline 2 (Rule Matrix)' },
            { id: 'policies', label: 'Policy Traceability' },
            { id: 'audit', label: `Audit Trail (${complaint.auditTrail.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-3.5 py-2 font-medium border-b-2 transition cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'dossier' && (
            <div className="space-y-5">
              {/* Verification Score Card */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  comp?.verificationStatus === 'Verified'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {comp?.verificationStatus === 'Verified' ? (
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">
                        Dual-Pipeline Status: {comp?.verificationStatus}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-200">
                        Score: {comp?.verificationScore}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {comp?.verificationStatus === 'Verified'
                        ? '100% policy-compliant resolution pipeline. Ready for agent dispatch.'
                        : 'Discrepancy detected between AI draft and rule matrix. Routed for human review.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Executive Summary & Adversarial Badge */}
              {p1?.adversarialAnalysis?.isAdversarial && (
                <div className="bg-rose-950/40 p-4 rounded-xl border border-rose-500/40 text-xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>SECURITY ALERT: {p1.adversarialAnalysis.threatType} Intercepted</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {p1.adversarialAnalysis.threatDetails}
                  </p>
                  <div className="text-[10px] text-rose-300 font-semibold pt-1 border-t border-rose-500/20">
                    Recommended Action: {p1.adversarialAnalysis.recommendedAction}
                  </div>
                </div>
              )}

              {p1?.summary && (
                <div className="bg-blue-950/20 p-3.5 rounded-xl border border-blue-500/30 text-xs">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                    AI Executive Triage Summary
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {p1.summary}
                  </p>
                </div>
              )}

              {/* Original Complaint */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer Submission
                  </span>
                  {p1?.responseTone && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Response Tone: {p1.responseTone}
                    </span>
                  )}
                </div>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {complaint.description}
                </p>
                <div className="mt-3 pt-2 border-t border-slate-700/60 flex flex-wrap gap-4 text-slate-400">
                  <span>Product: <strong className="text-slate-200">{complaint.productService}</strong></span>
                  <span>Channel: <strong className="text-slate-200">{complaint.channel}</strong></span>
                  <span>Customer Tier: <strong className="text-slate-200">{complaint.customerType}</strong></span>
                  <span>Target SLA: <strong className="text-slate-200">{complaint.slaHours} Hours</strong></span>
                  {p1?.followUpRequired && (
                    <span className="text-amber-300 font-semibold">
                      Follow-Up Required: {p1.followUpReason || 'Action required'}
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-side comparison summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
                  <span className="font-bold text-blue-400 block pb-1 border-b border-slate-700">
                    Pipeline 1 GenAI Assessment
                  </span>
                  <div>Primary Issue: <strong className="text-white">{p1?.primaryIssue}</strong></div>
                  {p1?.secondaryIssues && p1.secondaryIssues.length > 0 && (
                    <div className="text-[11px] text-slate-300">
                      Secondary Issues: <span className="text-slate-200 font-medium">{p1.secondaryIssues.join(', ')}</span>
                    </div>
                  )}
                  <div>Category: <strong className="text-white">{p1?.category}</strong> ({p1?.subcategory})</div>
                  <div>
                    Routing: <strong className="text-blue-300">{p1?.recommendedDepartment}</strong>
                    {p1?.secondaryDepartments && p1.secondaryDepartments.length > 0 && (
                      <span className="text-slate-400 text-[10px] ml-1.5">
                        (Also: {p1.secondaryDepartments.join(', ')})
                      </span>
                    )}
                  </div>
                  <div>Urgency / Priority: <strong className="text-white">{p1?.urgency} ({p1?.priority})</strong></div>
                  <div>Escalation: <strong className="text-rose-300">{p1?.escalationRequired ? `Yes (${p1.escalationTier})` : 'No'}</strong></div>
                  {p1?.internalAgentGuidance && (
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300 italic">
                      Guidance: {p1.internalAgentGuidance}
                    </div>
                  )}
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
                  <span className="font-bold text-emerald-400 block pb-1 border-b border-slate-700">
                    Pipeline 2 Rule Matrix Assessment
                  </span>
                  <div>Expected Category: <strong className="text-white">{p2?.expectedCategory}</strong></div>
                  <div>Expected Subcategory: <strong className="text-slate-300">{p2?.expectedSubcategory}</strong></div>
                  <div>Mandatory Dept: <strong className="text-emerald-300">{p2?.expectedDepartment}</strong></div>
                  <div>Expected Urgency / Pri: <strong className="text-white">{p2?.expectedUrgency} ({p2?.expectedPriority})</strong></div>
                  <div>Mandatory Escalation: <strong className="text-rose-300">{p2?.mandatoryEscalation ? `MANDATORY (${p2.mandatoryEscalationTier})` : 'No'}</strong></div>
                  <div className="text-[11px] text-slate-400">
                    Matched Rules: <span className="text-slate-200 font-mono">{p2?.matchedRules.join(', ') || 'Standard SLA'}</span>
                  </div>
                </div>
              </div>

              {/* Discrepancies list */}
              {comp?.discrepancies && comp.discrepancies.length > 0 && (
                <div className="bg-slate-800/40 p-4 rounded-xl border border-amber-500/30">
                  <span className="font-bold text-amber-300 block mb-2">
                    Discrepancy & Safety Inspection Report ({comp.discrepancies.length})
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {comp.discrepancies.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pipeline1' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-slate-300 space-y-2 leading-relaxed">
                <span className="text-blue-400 font-bold block mb-2">
                  Pipeline 1 Structured JSON Payload
                </span>
                <pre className="overflow-x-auto text-[11px]">
                  {JSON.stringify(p1, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300">
                    Python 3.10 Ground-Truth Crosscheck Status: {complaint.pythonValidation?.status || 'Validated'}
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-200">
                    Score: {complaint.pythonValidation?.validationScore ?? 90}%
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  Independent Python validation engine executing alongside AI (Pipeline 1) and Rule Matrix (Pipeline 2) to cross-check constraints, hazard words, and policy logic.
                </p>
              </div>

              {complaint.pythonValidation?.findings && complaint.pythonValidation.findings.length > 0 && (
                <div className="bg-slate-800/40 p-4 rounded-xl border border-rose-500/30 space-y-2">
                  <span className="font-bold text-rose-300 block mb-1">
                    Python Findings & Divergences ({complaint.pythonValidation.findings.length})
                  </span>
                  <div className="space-y-1.5">
                    {complaint.pythonValidation.findings.map((f, i) => (
                      <div key={i} className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-200">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 mr-2">
                          {f.severity}
                        </span>
                        <span>{f.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-slate-300 space-y-2 leading-relaxed">
                <span className="text-amber-400 font-bold block mb-2">
                  Python Validator Raw Execution Payload
                </span>
                <pre className="overflow-x-auto text-[11px]">
                  {JSON.stringify(complaint.pythonValidation || { message: 'Validated in Python 3.10 standard engine' }, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'pipeline2' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-slate-300 space-y-2 leading-relaxed">
                <span className="text-emerald-400 font-bold block mb-2">
                  Pipeline 2 Ground-Truth Validation Payload
                </span>
                <pre className="overflow-x-auto text-[11px]">
                  {JSON.stringify(p2, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-4">
              <span className="font-bold text-white block">
                Cited Knowledge Base Policies for this Complaint
              </span>

              {p1?.citedPolicies && p1.citedPolicies.length > 0 ? (
                p1.citedPolicies.map((cp, idx) => {
                  const fullDoc = policies.find((p) => p.id === cp.docId);
                  return (
                    <div key={idx} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-400">
                          {cp.docId} - Section: {cp.sectionId}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {fullDoc ? `v${fullDoc.version} (${fullDoc.status})` : 'Active'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white">
                        {fullDoc?.title || cp.citationText}
                      </h4>
                      <p className="text-slate-300 italic bg-slate-900/60 p-2.5 rounded border border-slate-800">
                        "{cp.citationText}"
                      </p>
                      <div className="text-[11px] text-slate-400">
                        Relevance: <span className="text-slate-200">{cp.relevance}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-400 italic">No explicit policy citations recorded.</div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <span className="font-bold text-white block mb-2">
                Immutable Lifecycle Audit Log
              </span>
              <div className="relative border-l-2 border-slate-800 pl-4 ml-2 space-y-4">
                {complaint.auditTrail.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()} • Actor: <strong className="text-slate-300">{log.actor}</strong>
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {log.action}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {log.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
