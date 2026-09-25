import React, { useState } from 'react';
import {
  PolicyDocument,
  RuleMatrixEntry,
  PromptTemplate,
  SecurityTestCase,
  UrgencyLevel,
  PriorityLevel,
  EscalationTier,
} from '../types';
import {
  Settings,
  BookOpen,
  Grid,
  FileCode,
  ShieldAlert,
  Plus,
  Trash2,
  Edit,
  Save,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  UploadCloud,
  FileUp,
  FileText,
  CheckCircle,
} from 'lucide-react';

interface AdminPortalProps {
  policies: PolicyDocument[];
  ruleMatrix: RuleMatrixEntry[];
  promptTemplates: PromptTemplate[];
  testCases: SecurityTestCase[];
  onAddPolicy: (policy: any) => Promise<void>;
  onUpdatePolicy: (id: string, policy: any) => Promise<void>;
  onDeletePolicy: (id: string) => Promise<void>;
  onAddRule: (rule: any) => Promise<void>;
  onUpdateRule: (id: string, rule: any) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onUpdatePromptTemplate: (id: string, template: any) => Promise<void>;
  onRunTestCase: (testCaseId: string) => Promise<any>;
  onUploadDocument?: (payload: any) => Promise<any>;
  onTogglePolicyStatus?: (id: string, newStatus: string) => Promise<void>;
  departments: string[];
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  policies,
  ruleMatrix,
  promptTemplates,
  testCases,
  onAddPolicy,
  onUpdatePolicy,
  onDeletePolicy,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onUpdatePromptTemplate,
  onRunTestCase,
  onUploadDocument,
  onTogglePolicyStatus,
  departments,
}) => {
  const [activeTab, setActiveTab] = useState<'policies' | 'ruleMatrix' | 'prompts' | 'security'>('policies');

  // Policy form modal / state
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [newPolicyTitle, setNewPolicyTitle] = useState('');
  const [newPolicyCategory, setNewPolicyCategory] = useState('Customer Support');
  const [newPolicySummary, setNewPolicySummary] = useState('');
  const [newPolicyVersion, setNewPolicyVersion] = useState('1.0');

  // Rule Matrix modal / state
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [ruleCat, setRuleCat] = useState('Billing & Payments');
  const [ruleSubcat, setRuleSubcat] = useState('General');
  const [ruleDept, setRuleDept] = useState('Billing & Finance');
  const [ruleUrgency, setRuleUrgency] = useState<UrgencyLevel>('Medium');
  const [rulePriority, setRulePriority] = useState<PriorityLevel>('P2');
  const [ruleTriggers, setRuleTriggers] = useState('');
  const [ruleMandatoryEscalation, setRuleMandatoryEscalation] = useState(false);
  const [ruleEscalationTier, setRuleEscalationTier] = useState<EscalationTier>('None');
  const [ruleSla, setRuleSla] = useState(24);

  // Document File Upload State (Requirements vi, vii, viii, ix, x)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Customer Support & SLA');
  const [uploadVersion, setUploadVersion] = useState('1.0');
  const [uploadParsing, setUploadParsing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessInfo, setUploadSuccessInfo] = useState<any | null>(null);

  const handleDocumentUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a valid PDF, DOCX, or TXT file to upload.');
      return;
    }

    setUploadParsing(true);
    setUploadError(null);
    setUploadSuccessInfo(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1] || '';
          if (onUploadDocument) {
            const res = await onUploadDocument({
              filename: uploadFile.name,
              fileBase64: base64Data,
              title: uploadTitle || uploadFile.name.replace(/\.[^/.]+$/, ''),
              category: uploadCategory,
              version: uploadVersion,
            });
            setUploadSuccessInfo(res);
            setUploadFile(null);
            setUploadTitle('');
            setTimeout(() => {
              setIsUploadingDoc(false);
              setUploadSuccessInfo(null);
            }, 3000);
          }
        } catch (err: any) {
          setUploadError(err.message || 'Failed to parse and upload document.');
        } finally {
          setUploadParsing(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Error reading file from disk.');
        setUploadParsing(false);
      };
      reader.readAsDataURL(uploadFile);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
      setUploadParsing(false);
    }
  };


  // Security test results state
  const [testResult, setTestResult] = useState<any>(null);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);

  // Active Prompt Template state
  const [activePrompt, setActivePrompt] = useState<PromptTemplate | null>(
    promptTemplates.length > 0 ? promptTemplates[0] : null
  );
  const [promptText, setPromptText] = useState(activePrompt?.systemPrompt || '');
  const [promptSaved, setPromptSaved] = useState(false);

  const handleSavePrompt = async () => {
    if (!activePrompt) return;
    await onUpdatePromptTemplate(activePrompt.id, {
      ...activePrompt,
      systemPrompt: promptText,
    });
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyTitle || !newPolicySummary) return;

    await onAddPolicy({
      title: newPolicyTitle,
      category: newPolicyCategory,
      summary: newPolicySummary,
      version: newPolicyVersion,
    });

    setIsAddingPolicy(false);
    setNewPolicyTitle('');
    setNewPolicySummary('');
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddRule({
      category: ruleCat,
      subcategory: ruleSubcat,
      department: ruleDept,
      urgency: ruleUrgency,
      priority: rulePriority,
      triggerConditions: ruleTriggers,
      mandatoryEscalation: ruleMandatoryEscalation,
      escalationTier: ruleEscalationTier,
      slaHours: Number(ruleSla),
      requiredActions: ['Inspect complaint records and verify eligibility'],
      prohibitedActions: ['Do not issue compensation exceeding rule bounds'],
    });

    setIsAddingRule(false);
    setRuleTriggers('');
  };

  const handleRunSecurityBenchmark = async (testId: string) => {
    setRunningTestId(testId);
    setTestResult(null);
    try {
      const res = await onRunTestCase(testId);
      setTestResult(res);
    } finally {
      setRunningTestId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                System Administration
              </span>
              <span className="text-xs text-slate-400">
                Knowledge Base & Ground-Truth Rule Governance
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Administrator Control Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage organizational policy documents, author the Complaint Resolution Rule Matrix, and configure LLM prompt templates.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'policies'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Policies ({policies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ruleMatrix')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'ruleMatrix'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Rule Matrix ({ruleMatrix.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'prompts'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Prompt Templates</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'security'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Security Suite</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Approved Knowledge Base Documents</span>
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsUploadingDoc(true);
                  setIsAddingPolicy(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload PDF / DOCX</span>
              </button>
              <button
                onClick={() => {
                  setIsAddingPolicy(true);
                  setIsUploadingDoc(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manual Policy Form</span>
              </button>
            </div>
          </div>

          {/* Upload Document Modal / Python Parsing Form (Requirements vi, vii, viii, ix, x) */}
          {isUploadingDoc && (
            <form
              onSubmit={handleDocumentUploadSubmit}
              className="bg-slate-800/90 border border-indigo-500/40 rounded-xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">
                    Upload & Parse Policy Document (PDF, DOCX, TXT)
                  </span>
                  <span className="px-2 py-0.5 text-[10px] rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    Python 3.10 Engine
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadingDoc(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {uploadError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccessInfo && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{uploadSuccessInfo.message || 'Document parsed into traceable chunks and indexed!'}</span>
                </div>
              )}

              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-6 text-center transition bg-slate-900/40">
                <input
                  type="file"
                  id="policy-file-upload"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      if (!uploadTitle) {
                        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="policy-file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <FileUp className="w-8 h-8 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    {uploadFile ? (
                      <span className="text-indigo-300 font-mono">{uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                    ) : (
                      'Click to select or drag & drop PDF, DOCX, TXT policy files'
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Automated Python content extraction, validation, and traceable section chunking
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Document Title (Auto-inferred if blank)</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Return and Refund Guidelines v2.0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Version (Requirement x)</label>
                  <input
                    type="text"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    placeholder="2.0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Uploading a newer version of an existing policy will automatically mark the prior version as <strong className="text-amber-400">Superseded</strong>.
                </span>
                <button
                  type="submit"
                  disabled={uploadParsing || !uploadFile}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  {uploadParsing ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Python Extracting & Chunking...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Parse & Ingest with Python</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Add Policy Modal / Inline Form */}
          {isAddingPolicy && (
            <form onSubmit={handleCreatePolicy} className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs font-bold text-white">Add New Policy Document (Manual)</span>
                <button
                  type="button"
                  onClick={() => setIsAddingPolicy(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Document Title</label>
                  <input
                    type="text"
                    value={newPolicyTitle}
                    onChange={(e) => setNewPolicyTitle(e.target.value)}
                    required
                    placeholder="e.g. VIP Concierge Support SOP"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={newPolicyCategory}
                    onChange={(e) => setNewPolicyCategory(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Version</label>
                  <input
                    type="text"
                    value={newPolicyVersion}
                    onChange={(e) => setNewPolicyVersion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">Document Summary & Rules</label>
                <textarea
                  value={newPolicySummary}
                  onChange={(e) => setNewPolicySummary(e.target.value)}
                  rows={3}
                  required
                  placeholder="Detail the policy conditions, deadlines, and constraints..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save Policy to Knowledge Base
                </button>
              </div>
            </form>
          )}

          {/* Policy Document Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className={`bg-slate-800/60 border rounded-xl p-5 space-y-3 transition ${
                  pol.status === 'Superseded'
                    ? 'border-amber-500/30 opacity-75'
                    : 'border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {pol.id}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      v{pol.version}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        pol.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : pol.status === 'Superseded'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {pol.status}
                    </span>

                    {/* Version Control Toggle (Requirement x) */}
                    {onTogglePolicyStatus && (
                      <button
                        onClick={() =>
                          onTogglePolicyStatus(
                            pol.id,
                            pol.status === 'Active' ? 'Superseded' : 'Active'
                          )
                        }
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                        title="Toggle Active vs Superseded version status"
                      >
                        {pol.status === 'Active' ? 'Mark Outdated' : 'Set Active'}
                      </button>
                    )}

                    <button
                      onClick={() => onDeletePolicy(pol.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                      title="Delete Policy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white">
                  {pol.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {pol.summary}
                </p>

                {/* Sections */}
                <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sections ({pol.sections.length})
                  </span>
                  {pol.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                        <span>[{sec.id}] {sec.heading}</span>
                        {sec.maxRefundDays && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            Max {sec.maxRefundDays} Days
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {sec.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ruleMatrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Grid className="w-4 h-4 text-emerald-400" />
                <span>Complaint Resolution Rule Matrix (Pipeline 2 Ground-Truth)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Human-authored decision matrix governing classification, routing, and escalation.
              </p>
            </div>
            <button
              onClick={() => setIsAddingRule(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Matrix Rule</span>
            </button>
          </div>

          {/* Add Rule Form */}
          {isAddingRule && (
            <form onSubmit={handleCreateRule} className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs font-bold text-white">Add New Rule Matrix Entry</span>
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={ruleCat}
                    onChange={(e) => setRuleCat(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={ruleSubcat}
                    onChange={(e) => setRuleSubcat(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Responsible Dept</label>
                  <select
                    value={ruleDept}
                    onChange={(e) => setRuleDept(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">SLA Target (Hours)</label>
                  <input
                    type="number"
                    value={ruleSla}
                    onChange={(e) => setRuleSla(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Rule Urgency</label>
                  <select
                    value={ruleUrgency}
                    onChange={(e: any) => setRuleUrgency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Mandatory Escalation</label>
                  <select
                    value={ruleMandatoryEscalation ? 'true' : 'false'}
                    onChange={(e) => setRuleMandatoryEscalation(e.target.value === 'true')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    <option value="false">No (Frontline resolution)</option>
                    <option value="true">Yes (Mandatory)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Escalation Tier</label>
                  <select
                    value={ruleEscalationTier}
                    onChange={(e: any) => setRuleEscalationTier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  >
                    <option value="None">None</option>
                    <option value="Supervisor Review">Supervisor Review</option>
                    <option value="Department Manager">Department Manager</option>
                    <option value="Specialist Team">Specialist Team</option>
                    <option value="Compliance Review">Compliance Review</option>
                    <option value="Critical Management Escalation">Critical Management Escalation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">Trigger Conditions / Regex / Keywords</label>
                <input
                  type="text"
                  value={ruleTriggers}
                  onChange={(e) => setRuleTriggers(e.target.value)}
                  required
                  placeholder="e.g. Keywords: smoke, sparks, swelling, thermal runaway"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save Rule to Matrix
                </button>
              </div>
            </form>
          )}

          {/* Rule Matrix Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Rule ID</th>
                    <th className="py-3 px-3">Category & Subcategory</th>
                    <th className="py-3 px-3">Routing Dept</th>
                    <th className="py-3 px-3">Urgency / Pri</th>
                    <th className="py-3 px-3">Mandatory Escalation</th>
                    <th className="py-3 px-3">Trigger Conditions</th>
                    <th className="py-3 px-3">SLA</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ruleMatrix.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">
                        {rule.id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        <span className="font-semibold text-white block">{rule.category}</span>
                        <span className="text-[11px] text-slate-400">{rule.subcategory}</span>
                      </td>
                      <td className="py-2.5 px-3 text-blue-300 font-medium">
                        {rule.department}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-slate-300">
                          {rule.urgency} / {rule.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {rule.mandatoryEscalation ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                            {rule.escalationTier}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px] max-w-xs truncate">
                        {rule.triggerConditions}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {rule.slaHours}h
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onDeleteRule(rule.id)}
                          className="text-slate-400 hover:text-rose-400 p-1 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Pipeline 1 GenAI Prompt Engineering & Versioning</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure the LLM instruction template, anti-injection directives, and output formatting.
              </p>
            </div>

            {promptSaved && (
              <span className="text-xs text-emerald-400 flex items-center space-x-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Prompt Updated Successfully</span>
              </span>
            )}
          </div>

          {activePrompt && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Template ID</span>
                  <span className="font-mono text-blue-400">{activePrompt.id}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Model Engine</span>
                  <span className="font-mono text-white">{activePrompt.model}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Version & Status</span>
                  <span className="text-emerald-400 font-semibold">v{activePrompt.version} ({activePrompt.status})</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  System Prompt Directive (Version Controlled)
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={14}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSavePrompt}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Template Changes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Adversarial Defense & Integrity Test Suite</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              PRD & SRS Section 8 Mandate: Execute live adversarial tests to verify that prompt injection attacks,
              sentiment-urgency deception, and ungrounded refund promises are trapped by Pipeline 2 and routed to
              human adjudication.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {testCases.map((tc) => {
                const isRunning = runningTestId === tc.id;
                return (
                  <div
                    key={tc.id}
                    className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-5 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-purple-400">
                        {tc.id}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-500/20 text-purple-300">
                        {tc.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">
                      {tc.name}
                    </h3>

                    <p className="text-xs text-slate-300">
                      {tc.description}
                    </p>

                    <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <span className="text-slate-500 uppercase font-semibold block text-[10px]">
                        Attack Payload / Trap:
                      </span>
                      <p className="text-slate-300 font-mono italic">
                        "{tc.sampleComplaint.description.slice(0, 140)}..."
                      </p>
                    </div>

                    <div className="text-[11px] text-emerald-400 bg-emerald-950/20 p-2.5 rounded border border-emerald-500/20">
                      <strong className="block text-emerald-300 mb-0.5">Expected Defense:</strong>
                      {tc.expectedDefense}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleRunSecurityBenchmark(tc.id)}
                        disabled={isRunning}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                        <span>{isRunning ? 'Simulating Attack...' : 'Execute Test Run'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Execution Result Modal / Box */}
          {testResult && (
            <div className="bg-slate-900 border-2 border-purple-500/50 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Defense Verification Result: {testResult.testCase.name}
                    </h3>
                    <span className="text-xs text-emerald-400 font-semibold">
                      System Defense Status: {testResult.passedDefense ? 'PASSED (Threat Intercepted)' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setTestResult(null)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Pipeline 1 (GenAI) Outcome
                  </span>
                  <div className="space-y-1">
                    <div>Urgency: <strong className="text-white">{testResult.pipeline1Output.urgency}</strong></div>
                    <div>Department: <strong className="text-white">{testResult.pipeline1Output.recommendedDepartment}</strong></div>
                    <div>Escalation: <strong className="text-white">{testResult.pipeline1Output.escalationRequired ? 'Yes' : 'No'}</strong></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Python Ground-Truth Crosscheck
                  </span>
                  <div className="space-y-1">
                    <div>Status: <strong className={testResult.pythonValidation?.passed ? 'text-emerald-400' : 'text-amber-400'}>{testResult.pythonValidation?.status || 'Validated'}</strong></div>
                    <div>Score: <strong className="text-white font-mono">{testResult.pythonValidation?.validationScore ?? 90}%</strong></div>
                    <div>Findings: <strong className="text-rose-400">{testResult.pythonValidation?.findings?.length || 0}</strong></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Pipeline 2 (Rule Matrix) Defense
                  </span>
                  <div className="space-y-1">
                    <div>Adversarial Flags: <strong className="text-purple-400">{testResult.pipeline2Output.adversarialPromptFlags.length}</strong></div>
                    <div>Bad Promises Flagged: <strong className="text-rose-400">{testResult.pipeline2Output.unsupportedPromiseFlags.length}</strong></div>
                    <div>Mandatory Escalation: <strong className="text-white">{testResult.pipeline2Output.mandatoryEscalation ? 'YES' : 'No'}</strong></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Final Adjudication
                  </span>
                  <div className="space-y-1">
                    <div>Status: <strong className={testResult.comparisonResult.verificationStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400'}>{testResult.comparisonResult.verificationStatus}</strong></div>
                    <div>Score: <strong className="text-white">{testResult.comparisonResult.verificationScore}%</strong></div>
                    <div className="text-[11px] text-slate-400">Triangulated by AI + Python + Rules.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
