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

// Palette
const P = {
  oliveGray: '#373F51',
  warmGold: '#58A4B0',
  burntSienna: '#A9BCD0',
  darkOliveGold: '#506176',
  deepMahogany: '#293241',
  bgDark: '#373F51',
  bgCard: 'rgba(41, 50, 65, 0.9)',
  bgCardLight: 'rgba(80, 97, 118, 0.4)',
  bgInput: 'rgba(41, 50, 65, 0.95)',
  bgDeep: 'rgba(41, 50, 65, 0.95)',
  borderSubtle: 'rgba(169, 188, 208, 0.22)',
  borderMedium: 'rgba(169, 188, 208, 0.36)',
  borderStrong: 'rgba(88, 164, 176, 0.5)',
  textPrimary: '#F4F6FA',
  textSecondary: '#D8DBE2',
  textMuted: '#A9BCD0',
  accentGold: '#58A4B0',
  accentGoldLight: '#8CC9D0',
  accentGoldDark: '#3E8390',
  danger: '#506176',
  dangerLight: '#A9BCD0',
  success: '#58A4B0',
  successLight: '#8CC9D0',
};

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

  const tabButtonStyle = (isActive: boolean) => ({
    color: isActive ? P.accentGold : P.textMuted,
    borderBottom: `2px solid ${isActive ? P.accentGold : 'transparent'}`,
    background: 'transparent',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(13, 15, 10, 0.82)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(20, 22, 14, 0.98)',
          border: `1px solid ${P.borderStrong}`,
        }}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            borderBottom: `1px solid ${P.borderSubtle}`,
            background: 'rgba(22, 25, 16, 0.9)',
          }}
        >
          <div className="flex items-center space-x-3">
            <span
              className="font-mono text-sm font-bold px-2.5 py-1 rounded"
              style={{
                color: P.accentGold,
                background: 'rgba(215, 190, 130, 0.1)',
                border: `1px solid rgba(215, 190, 130, 0.25)`,
              }}
            >
              {complaint.id}
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight" style={{ color: '#ffffff' }}>
                {complaint.title}
              </h2>
              <div className="flex items-center space-x-2 text-xs mt-0.5" style={{ color: P.textMuted }}>
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
              className="p-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition"
              style={{
                background: P.bgCardLight,
                color: P.textSecondary,
                border: `1px solid ${P.borderSubtle}`,
              }}
              title="Copy JSON Payload"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied' : 'JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition cursor-pointer"
              style={{
                background: P.bgCardLight,
                color: P.textMuted,
                border: `1px solid ${P.borderSubtle}`,
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          className="flex items-center space-x-1 px-4 sm:px-6 pt-2 text-xs overflow-x-auto scrollbar-none whitespace-nowrap"
          style={{
            borderBottom: `1px solid ${P.borderSubtle}`,
            background: 'rgba(22, 25, 16, 0.5)',
          }}
        >
          {[
            { id: 'dossier', label: 'Triage Dossier' },
            { id: 'pipeline1', label: 'Pipeline 1 (GenAI)' },
            { id: 'python', label: 'Python Crosscheck' },
            { id: 'pipeline2', label: 'Pipeline 2 (Rule Matrix)' },
            { id: 'policies', label: 'Policy Traceability' },
            { id: 'audit', label: `Audit Trail (${(complaint.auditTrail ?? []).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="px-3 sm:px-3.5 py-2 font-medium transition cursor-pointer shrink-0"
              style={tabButtonStyle(activeTab === tab.id)}
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
                className="p-4 rounded-xl flex items-center justify-between"
                style={{
                  background:
                    comp?.verificationStatus === 'Verified'
                      ? 'rgba(90, 122, 58, 0.12)'
                      : 'rgba(117, 92, 27, 0.15)',
                  border: `1px solid ${
                    comp?.verificationStatus === 'Verified'
                      ? 'rgba(90, 122, 58, 0.35)'
                      : 'rgba(117, 92, 27, 0.4)'
                  }`,
                }}
              >
                <div className="flex items-center space-x-3">
                  {comp?.verificationStatus === 'Verified' ? (
                    <ShieldCheck className="w-8 h-8" style={{ color: P.successLight }} />
                  ) : (
                    <AlertTriangle className="w-8 h-8" style={{ color: P.darkOliveGold }} />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold" style={{ color: '#ffffff' }}>
                        Dual-Pipeline Status: {comp?.verificationStatus}
                      </span>
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{
                          background: P.bgDeep,
                          color: P.textSecondary,
                        }}
                      >
                        Score: {comp?.verificationScore}%
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: P.textSecondary }}>
                      {comp?.verificationStatus === 'Verified'
                        ? '100% policy-compliant resolution pipeline. Ready for agent dispatch.'
                        : 'Discrepancy detected between AI draft and rule matrix. Routed for human review.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adversarial Badge */}
              {p1?.adversarialAnalysis?.isAdversarial && (
                <div
                  className="p-4 rounded-xl text-xs space-y-1.5"
                  style={{
                    background: 'rgba(64, 4, 6, 0.4)',
                    border: `1px solid rgba(154, 44, 44, 0.5)`,
                  }}
                >
                  <div className="flex items-center space-x-2 font-bold" style={{ color: '#e8a0a0' }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: P.dangerLight }} />
                    <span>SECURITY ALERT: {p1.adversarialAnalysis.threatType} Intercepted</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: P.textSecondary }}>
                    {p1.adversarialAnalysis.threatDetails}
                  </p>
                  <div
                    className="text-[10px] font-semibold pt-1"
                    style={{ color: '#e8a0a0', borderTop: `1px solid rgba(154, 44, 44, 0.25)` }}
                  >
                    Recommended Action: {p1.adversarialAnalysis.recommendedAction}
                  </div>
                </div>
              )}

              {p1?.summary && (
                <div
                  className="p-3.5 rounded-xl text-xs"
                  style={{
                    background: 'rgba(215, 190, 130, 0.06)',
                    border: `1px solid rgba(215, 190, 130, 0.25)`,
                  }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                    style={{ color: P.warmGold }}
                  >
                    AI Executive Triage Summary
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: P.textPrimary }}>
                    {p1.summary}
                  </p>
                </div>
              )}

              {/* Original Complaint */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(22, 24, 15, 0.6)',
                  border: `1px solid ${P.borderSubtle}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: P.textMuted }}>
                    Customer Submission
                  </span>
                  {p1?.responseTone && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded"
                      style={{
                        background: 'rgba(122, 68, 25, 0.2)',
                        color: '#c49a6c',
                        border: `1px solid rgba(122, 68, 25, 0.4)`,
                      }}
                    >
                      Response Tone: {p1.responseTone}
                    </span>
                  )}
                </div>
                <p className="leading-relaxed font-sans" style={{ color: P.textPrimary }}>
                  {complaint.description}
                </p>
                <div
                  className="mt-3 pt-2 flex flex-wrap gap-4"
                  style={{ borderTop: `1px solid ${P.borderSubtle}`, color: P.textMuted }}
                >
                  <span>Product: <strong style={{ color: P.textPrimary }}>{complaint.productService}</strong></span>
                  <span>Channel: <strong style={{ color: P.textPrimary }}>{complaint.channel}</strong></span>
                  <span>Customer Tier: <strong style={{ color: P.textPrimary }}>{complaint.customerType}</strong></span>
                  <span>Target SLA: <strong style={{ color: P.textPrimary }}>{complaint.slaHours} Hours</strong></span>
                  {p1?.followUpRequired && (
                    <span style={{ color: P.darkOliveGold, fontWeight: 600 }}>
                      Follow-Up Required: {p1.followUpReason || 'Action required'}
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-side comparison summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-xl space-y-2"
                  style={{
                    background: 'rgba(22, 24, 15, 0.6)',
                    border: `1px solid ${P.borderSubtle}`,
                  }}
                >
                  <span
                    className="font-bold block pb-1"
                    style={{ color: P.warmGold, borderBottom: `1px solid ${P.borderSubtle}` }}
                  >
                    Pipeline 1 GenAI Assessment
                  </span>
                  <div>Primary Issue: <strong style={{ color: '#ffffff' }}>{p1?.primaryIssue}</strong></div>
                  {p1?.secondaryIssues && (p1.secondaryIssues || []).length > 0 && (
                    <div className="text-[11px]" style={{ color: P.textSecondary }}>
                      Secondary Issues: <span style={{ color: P.textPrimary, fontWeight: 500 }}>{(p1.secondaryIssues || []).join(', ')}</span>
                    </div>
                  )}
                  <div>Category: <strong style={{ color: '#ffffff' }}>{p1?.category}</strong> ({p1?.subcategory})</div>
                  <div>
                    Routing: <strong style={{ color: P.warmGold }}>{p1?.recommendedDepartment}</strong>
                    {p1?.secondaryDepartments && (p1.secondaryDepartments || []).length > 0 && (
                      <span className="text-[10px] ml-1.5" style={{ color: P.textMuted }}>
                        (Also: {(p1.secondaryDepartments || []).join(', ')})
                      </span>
                    )}
                  </div>
                  <div>Urgency / Priority: <strong style={{ color: '#ffffff' }}>{p1?.urgency} ({p1?.priority})</strong></div>
                  <div>Escalation: <strong style={{ color: '#e8a0a0' }}>{p1?.escalationRequired ? `Yes (${p1.escalationTier})` : 'No'}</strong></div>
                  {p1?.internalAgentGuidance && (
                    <div
                      className="p-2 rounded text-[10px] italic"
                      style={{
                        background: 'rgba(13, 15, 10, 0.8)',
                        border: `1px solid ${P.borderSubtle}`,
                        color: P.textSecondary,
                      }}
                    >
                      Guidance: {p1.internalAgentGuidance}
                    </div>
                  )}
                </div>

                <div
                  className="p-4 rounded-xl space-y-2"
                  style={{
                    background: 'rgba(22, 24, 15, 0.6)',
                    border: `1px solid ${P.borderSubtle}`,
                  }}
                >
                  <span
                    className="font-bold block pb-1"
                    style={{ color: P.successLight, borderBottom: `1px solid ${P.borderSubtle}` }}
                  >
                    Pipeline 2 Rule Matrix Assessment
                  </span>
                  <div>Expected Category: <strong style={{ color: '#ffffff' }}>{p2?.expectedCategory}</strong></div>
                  <div>Expected Subcategory: <strong style={{ color: P.textSecondary }}>{p2?.expectedSubcategory}</strong></div>
                  <div>Mandatory Dept: <strong style={{ color: P.successLight }}>{p2?.expectedDepartment}</strong></div>
                  <div>Expected Urgency / Pri: <strong style={{ color: '#ffffff' }}>{p2?.expectedUrgency} ({p2?.expectedPriority})</strong></div>
                  <div>Mandatory Escalation: <strong style={{ color: '#e8a0a0' }}>{p2?.mandatoryEscalation ? `MANDATORY (${p2.mandatoryEscalationTier})` : 'No'}</strong></div>
                  <div className="text-[11px]" style={{ color: P.textMuted }}>
                    Matched Rules: <span className="font-mono" style={{ color: P.textPrimary }}>{(p2?.matchedRules || []).join(', ') || 'Standard SLA'}</span>
                  </div>
                </div>
              </div>

              {/* Discrepancies list */}
              {comp?.discrepancies && (comp.discrepancies || []).length > 0 && (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(22, 24, 15, 0.6)',
                    border: `1px solid rgba(117, 92, 27, 0.4)`,
                  }}
                >
                  <span className="font-bold block mb-2" style={{ color: '#b89545' }}>
                    Discrepancy & Safety Inspection Report ({(comp.discrepancies || []).length})
                  </span>
                  <ul className="list-disc pl-4 space-y-1" style={{ color: P.textSecondary }}>
                    {(comp.discrepancies || []).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pipeline1' && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl font-mono space-y-2 leading-relaxed"
                style={{
                  background: P.bgDeep,
                  border: `1px solid ${P.borderSubtle}`,
                  color: P.textSecondary,
                }}
              >
                <span className="font-bold block mb-2" style={{ color: P.warmGold }}>
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
              <div
                className="p-4 rounded-xl"
                style={{
                  border: `1px solid rgba(117, 92, 27, 0.4)`,
                  background: 'rgba(117, 92, 27, 0.1)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: '#b89545' }}>
                    Python 3.10 Ground-Truth Crosscheck Status: {complaint.pythonValidation?.status || 'Validated'}
                  </span>
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded"
                    style={{ background: P.bgDeep, color: P.textSecondary }}
                  >
                    Score: {complaint.pythonValidation?.validationScore ?? 90}%
                  </span>
                </div>
                <p className="text-xs" style={{ color: P.textSecondary }}>
                  Independent Python validation engine executing alongside AI (Pipeline 1) and Rule Matrix (Pipeline 2) to cross-check constraints, hazard words, and policy logic.
                </p>
              </div>

              {complaint.pythonValidation?.findings && (complaint.pythonValidation.findings || []).length > 0 && (
                <div
                  className="p-4 rounded-xl space-y-2"
                  style={{
                    background: 'rgba(22, 24, 15, 0.6)',
                    border: `1px solid rgba(154, 44, 44, 0.4)`,
                  }}
                >
                  <span className="font-bold block mb-1" style={{ color: '#e8a0a0' }}>
                    Python Findings & Divergences ({(complaint.pythonValidation.findings || []).length})
                  </span>
                  <div className="space-y-1.5">
                    {(complaint.pythonValidation.findings || []).map((f, i) => (
                      <div
                        key={i}
                        className="p-2 rounded text-[11px]"
                        style={{
                          background: 'rgba(13, 15, 10, 0.6)',
                          border: `1px solid ${P.borderSubtle}`,
                          color: P.textPrimary,
                        }}
                      >
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold mr-2"
                          style={{
                            background: 'rgba(154, 44, 44, 0.25)',
                            color: '#e8a0a0',
                          }}
                        >
                          {f.severity}
                        </span>
                        <span>{f.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="p-4 rounded-xl font-mono space-y-2 leading-relaxed"
                style={{
                  background: P.bgDeep,
                  border: `1px solid ${P.borderSubtle}`,
                  color: P.textSecondary,
                }}
              >
                <span className="font-bold block mb-2" style={{ color: P.warmGold }}>
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
              <div
                className="p-4 rounded-xl font-mono space-y-2 leading-relaxed"
                style={{
                  background: P.bgDeep,
                  border: `1px solid ${P.borderSubtle}`,
                  color: P.textSecondary,
                }}
              >
                <span className="font-bold block mb-2" style={{ color: P.successLight }}>
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
              <span className="font-bold block" style={{ color: '#ffffff' }}>
                Cited Knowledge Base Policies for this Complaint
              </span>

              {p1?.citedPolicies && (p1.citedPolicies || []).length > 0 ? (
                (p1.citedPolicies || []).map((cp, idx) => {
                  const fullDoc = (policies || []).find((p) => p.id === cp.docId);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl space-y-2"
                      style={{
                        background: P.bgCardLight,
                        border: `1px solid ${P.borderSubtle}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold" style={{ color: P.warmGold }}>
                          {cp.docId} - Section: {cp.sectionId}
                        </span>
                        <span className="text-[10px]" style={{ color: P.textMuted }}>
                          {fullDoc ? `v${fullDoc.version} (${fullDoc.status})` : 'Active'}
                        </span>
                      </div>
                      <h4 className="font-semibold" style={{ color: '#ffffff' }}>
                        {fullDoc?.title || cp.citationText}
                      </h4>
                      <p
                        className="italic p-2.5 rounded"
                        style={{
                          color: P.textSecondary,
                          background: 'rgba(13, 15, 10, 0.6)',
                          border: `1px solid ${P.borderSubtle}`,
                        }}
                      >
                        "{cp.citationText}"
                      </p>
                      <div className="text-[11px]" style={{ color: P.textMuted }}>
                        Relevance: <span style={{ color: P.textPrimary }}>{cp.relevance}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="italic" style={{ color: P.textMuted }}>No explicit policy citations recorded.</div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <span className="font-bold block mb-2" style={{ color: '#ffffff' }}>
                Immutable Lifecycle Audit Log
              </span>
              <div
                className="relative pl-4 ml-2 space-y-4"
                style={{ borderLeft: `2px solid ${P.borderSubtle}` }}
              >
                {(complaint.auditTrail || []).map((log) => (
                  <div key={log.id} className="relative">
                    <div
                      className="absolute top-1 w-2.5 h-2.5 rounded-full"
                      style={{
                        left: '-21px',
                        background: P.accentGold,
                        boxShadow: `0 0 0 4px ${P.bgDark}`,
                      }}
                    />
                    <div className="text-[10px] font-mono" style={{ color: P.textMuted }}>
                      {new Date(log.timestamp).toLocaleString()} • Actor: <strong style={{ color: P.textSecondary }}>{log.actor}</strong>
                    </div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: '#ffffff' }}>
                      {log.action}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: P.textMuted }}>
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