import React, { useState } from 'react';
import type {
  PolicyDocument,
  RuleMatrixEntry,
  PromptTemplate,
  SecurityTestCase,
  UrgencyLevel,
  PriorityLevel,
  EscalationTier,
  UserProfile,
  UserRole,
} from '../types/index.ts';
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
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Search,
  User,
  Bot,
  UserCheck,
  BarChart3,
} from 'lucide-react';

interface AdminPortalProps {
  policies: PolicyDocument[];
  ruleMatrix: RuleMatrixEntry[];
  promptTemplates: PromptTemplate[];
  testCases: SecurityTestCase[];
  users?: UserProfile[];
  onAddPolicy: (policy: any) => Promise<void>;
  onUpdatePolicy: (id: string, policy: any) => Promise<void>;
  onDeletePolicy: (id: string) => Promise<void>;
  onAddRule: (rule: any) => Promise<void>;
  onUpdateRule: (id: string, rule: any) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onUpdatePromptTemplate: (id: string, template: any) => Promise<void>;
  onAddPromptTemplate?: (template: any) => Promise<void>;
  onRollbackPrompt?: (id: string, targetVersion: string) => Promise<void>;
  onRollbackPolicy?: (id: string, targetVersion: string) => Promise<void>;
  onRunTestCase: (testCaseId: string) => Promise<any>;
  onUploadDocument?: (payload: any) => Promise<any>;
  onTogglePolicyStatus?: (id: string, newStatus: string) => Promise<void>;
  onAddUser?: (userData: any) => Promise<void>;
  onUpdateUser?: (id: string, userData: any) => Promise<void>;
  onDeleteUser?: (id: string) => Promise<void>;
  departments: string[];
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  policies = [],
  ruleMatrix = [],
  promptTemplates = [],
  testCases = [],
  users = [],
  onAddPolicy,
  onUpdatePolicy,
  onDeletePolicy,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onUpdatePromptTemplate,
  onAddPromptTemplate,
  onRollbackPrompt,
  onRollbackPolicy,
  onRunTestCase,
  onUploadDocument,
  onTogglePolicyStatus,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  departments = [],
}) => {
  const [activeTab, setActiveTab] = useState<'policies' | 'ruleMatrix' | 'prompts' | 'security' | 'users'>('policies');

  // User Management State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Agent');
  const [newUserDepartment, setNewUserDepartment] = useState('Customer Support');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('');
  const [userActionLoading, setUserActionLoading] = useState(false);

  // Policy form modal / state
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [newPolicyTitle, setNewPolicyTitle] = useState('');
  const [newPolicyCategory, setNewPolicyCategory] = useState('Customer Support');
  const [newPolicySummary, setNewPolicySummary] = useState('');
  const [newPolicyVersion, setNewPolicyVersion] = useState('1.0');
  const [inspectPolicyChunks, setInspectPolicyChunks] = useState<PolicyDocument | null>(null);
  const [inspectPolicyHistory, setInspectPolicyHistory] = useState<PolicyDocument | null>(null);

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
  const [uploadDocumentId, setUploadDocumentId] = useState(() => `POL-UPL-${Date.now().toString(36).toUpperCase()}`);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Customer Support & SLA');
  const [uploadVersion, setUploadVersion] = useState('1.0');
  const [uploadEffectiveDate, setUploadEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [uploadParsing, setUploadParsing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessInfo, setUploadSuccessInfo] = useState<any | null>(null);

  // Prompt Template Management State (Requirements lii, liii)
  const [selectedPromptId, setSelectedPromptId] = useState<string>(
    promptTemplates.length > 0 ? promptTemplates[0].id : 'TPL-GEMINI-CORE'
  );
  const activePrompt =
    promptTemplates.find((t) => t.id === selectedPromptId) ||
    (promptTemplates.length > 0 ? promptTemplates[0] : null);
  const [promptText, setPromptText] = useState(activePrompt?.systemPrompt || '');
  const [promptChangelog, setPromptChangelog] = useState('');
  const [promptTemperature, setPromptTemperature] = useState(activePrompt?.temperature ?? 0.1);
  const [promptSaved, setPromptSaved] = useState(false);
  const [isAddingPromptTpl, setIsAddingPromptTpl] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplPurpose, setNewTplPurpose] = useState('');
  const [newTplOperation, setNewTplOperation] = useState<PromptTemplate['operation']>('Response Generation');
  const [newTplSystemPrompt, setNewTplSystemPrompt] = useState('');

  // Update promptText when activePrompt changes
  React.useEffect(() => {
    if (activePrompt) {
      setPromptText(activePrompt.systemPrompt);
      setPromptTemperature(activePrompt.temperature ?? 0.1);
      setPromptChangelog('');
    }
  }, [activePrompt?.id, activePrompt?.version]);

  const handleDocumentUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a valid PDF, DOCX, or TXT file to upload.');
      return;
    }
    if (uploadFile.size === 0) {
      setUploadError('The selected file is empty.');
      return;
    }
    if (uploadFile.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB limit.');
      return;
    }
    if (uploadExpiryDate && uploadExpiryDate <= uploadEffectiveDate) {
      setUploadError('Expiry date must be later than the effective date.');
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
              documentId: uploadDocumentId,
              category: uploadCategory,
              version: uploadVersion,
              effectiveDate: uploadEffectiveDate,
              expiryDate: uploadExpiryDate || null,
            });
            setUploadSuccessInfo(res);
            setUploadFile(null);
            setUploadDocumentId(`POL-UPL-${Date.now().toString(36).toUpperCase()}`);
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

  const handleSavePrompt = async () => {
    if (!activePrompt) return;
    await onUpdatePromptTemplate(activePrompt.id, {
      ...activePrompt,
      systemPrompt: promptText,
      temperature: promptTemperature,
      changelog: promptChangelog || 'Updated prompt directives',
    });
    setPromptSaved(true);
    setPromptChangelog('');
    setTimeout(() => setPromptSaved(false), 2500);
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
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 text-xs overflow-x-auto scrollbar-none whitespace-nowrap">
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'policies'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Policies ({(policies ?? []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ruleMatrix')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'ruleMatrix'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Rule Matrix ({(ruleMatrix ?? []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
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
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'security'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Security Suite</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'users'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users & RBAC ({(users ?? []).length})</span>
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
                      const extension = file.name.split('.').pop()?.toLowerCase();
                      if (!['pdf', 'docx', 'doc', 'txt', 'md'].includes(extension || '')) {
                        setUploadFile(null);
                        setUploadError('Unsupported file type. Select PDF, DOCX, DOC, TXT, or MD.');
                        return;
                      }
                      if (file.size === 0 || file.size > 10 * 1024 * 1024) {
                        setUploadFile(null);
                        setUploadError(file.size === 0 ? 'The selected file is empty.' : 'File size exceeds the 10 MB limit.');
                        return;
                      }
                      setUploadError(null);
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Document ID</label>
                  <input
                    type="text"
                    value={uploadDocumentId}
                    onChange={(e) => setUploadDocumentId(e.target.value)}
                    required
                    pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*"
                    maxLength={80}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
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
                    required
                    pattern="[0-9]+(\.[0-9]+){0,3}(-[A-Za-z0-9.-]+)?"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={uploadEffectiveDate}
                    onChange={(e) => setUploadEffectiveDate(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={uploadExpiryDate}
                    min={uploadEffectiveDate || undefined}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
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
            {(policies ?? []).map((pol) => (
              <div
                key={pol.id}
                className={`bg-slate-800/60 border rounded-xl p-5 space-y-3 transition ${
                  pol.status === 'Superseded'
                    ? 'border-amber-500/30 opacity-75'
                    : pol.processingStatus === 'INVALID'
                    ? 'border-rose-500/40 bg-rose-950/10'
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
                    {pol.processingStatus && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          pol.processingStatus === 'PARSED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : pol.processingStatus === 'INVALID'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {pol.processingStatus}
                      </span>
                    )}
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

                {/* Metadata & Checksum info */}
                <div className="grid grid-cols-3 gap-2 py-1.5 px-2 bg-slate-900/60 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
                  <div>
                    <span className="text-slate-500 block">FILE TYPE</span>
                    <span className="text-slate-200 font-semibold">{pol.fileType || 'SOP DOC'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SIZE</span>
                    <span className="text-slate-200">{pol.fileSize ? `${Math.round(pol.fileSize / 1024)} KB` : '42 KB'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CHECKSUM</span>
                    <span className="text-blue-400 truncate block">{pol.checksum || 'sha256-verified'}</span>
                  </div>
                </div>

                {/* Sections & Traceable Chunks */}
                <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Traceable Chunks ({(pol.sections ?? []).length})
                    </span>
                    <button
                      onClick={() => setInspectPolicyChunks(pol)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                    >
                      Inspect All Chunks
                    </button>
                  </div>
                  {(pol.sections ?? []).slice(0, 2).map((sec) => (
                    <div
                      key={sec.id}
                      className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                        <span>[{sec.id}] {sec.heading}</span>
                        {sec.wordCount && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {sec.wordCount} words • ~{sec.tokenEstimate || Math.round(sec.wordCount * 1.3)} tokens
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                        {sec.content}
                      </p>
                    </div>
                  ))}
                  {(pol.sections ?? []).length > 2 && (
                    <button
                      onClick={() => setInspectPolicyChunks(pol)}
                      className="w-full text-center text-[10px] text-slate-400 hover:text-slate-300 py-1 bg-slate-900/40 rounded border border-slate-800/80 cursor-pointer"
                    >
                      +{(pol.sections ?? []).length - 2} more chunks...
                    </button>
                  )}
                </div>

                {/* Version History Accordion / List (Requirement x) */}
                {(pol.versionHistory ?? []).length > 0 && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Version History ({(pol.versionHistory ?? []).length} previous)
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {(pol.versionHistory ?? []).map((vh, vIdx) => (
                        <div
                          key={vIdx}
                          className="flex items-center justify-between p-1.5 bg-slate-900/40 rounded border border-slate-800/60 text-[10px]"
                        >
                          <div className="space-x-1.5 truncate">
                            <span className="font-mono font-bold text-slate-300">v{vh.version}</span>
                            <span className="text-slate-500">({vh.effectiveDate})</span>
                            <span className="text-slate-400 truncate">{vh.summary}</span>
                          </div>
                          {onRollbackPolicy && (
                            <button
                              onClick={() => onRollbackPolicy(pol.id, vh.version)}
                              className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-[9px] font-semibold cursor-pointer shrink-0 ml-2"
                            >
                              Rollback
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traceable Chunks Inspector Modal */}
      {inspectPolicyChunks && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Traceable Chunks: {inspectPolicyChunks.title} (v{inspectPolicyChunks.version})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {(inspectPolicyChunks.sections ?? []).length} deterministic chunks indexed for retrieval
                </span>
              </div>
              <button
                onClick={() => setInspectPolicyChunks(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {(inspectPolicyChunks.sections ?? []).map((sec, idx) => (
                <div key={sec.id || idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      [{sec.id}] {sec.heading}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Hash: {sec.checksum || 'sha256'} • ~{sec.tokenEstimate || 30} tokens
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sec.content}
                  </p>
                  {sec.mandatoryConditions && sec.mandatoryConditions.length > 0 && (
                    <div className="text-[11px] text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                      <strong>Mandatory Conditions:</strong> {sec.mandatoryConditions.join('; ')}
                    </div>
                  )}
                  {sec.prohibitions && sec.prohibitions.length > 0 && (
                    <div className="text-[11px] text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/30">
                      <strong>Prohibitions:</strong> {sec.prohibitions.join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prompts Tab (Requirements lii, liii) */}
      {activeTab === 'prompts' && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700/60 gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>AI Prompt Template Management & Version History</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage and version AI instruction prompts for classification, response drafting, missing info detection, and validation.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {promptSaved && (
                <span className="text-xs text-emerald-400 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Prompt Saved & Versioned</span>
                </span>
              )}
              <button
                onClick={() => setIsAddingPromptTpl(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Template</span>
              </button>
            </div>
          </div>

          {/* Template Selector Tabs */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-700/40">
            {(promptTemplates ?? []).map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedPromptId(tpl.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
                  (activePrompt?.id === tpl.id)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-900 border border-slate-700/60'
                }`}
              >
                <span>{tpl.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-black/30 text-slate-200 font-mono">
                  v{tpl.version}
                </span>
              </button>
            ))}
          </div>

          {activePrompt && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Template ID & Purpose</span>
                  <span className="font-mono text-blue-400 font-bold block">{activePrompt.id}</span>
                  <span className="text-[11px] text-slate-300 truncate block">{activePrompt.purpose || 'Operation prompt'}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Model Engine & Operation</span>
                  <span className="font-mono text-white block">{activePrompt.model}</span>
                  <span className="text-[10px] text-purple-400 font-semibold">{activePrompt.operation || 'Response Generation'}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Version & Last Updated</span>
                  <span className="text-emerald-400 font-semibold block">v{activePrompt.version} ({activePrompt.status})</span>
                  <span className="text-[10px] text-slate-400">{activePrompt.lastUpdated} by {activePrompt.author || 'AI Admin'}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Temperature ({promptTemperature})</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={promptTemperature}
                    onChange={(e) => setPromptTemperature(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-500"
                  />
                </div>
              </div>

              {/* Variables Placeholders Badge */}
              {(activePrompt.variables ?? []).length > 0 && (
                <div className="flex items-center space-x-2 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Available Variables:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(activePrompt.variables ?? []).map((v) => (
                      <span key={v} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 font-mono text-[10px] text-blue-300">
                        {`{${v}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  System Prompt Directive (Version Controlled)
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Changelog Note (Saved to version history)
                  </label>
                  <input
                    type="text"
                    value={promptChangelog}
                    onChange={(e) => setPromptChangelog(e.target.value)}
                    placeholder="e.g. Added stricter refund check for 30+ days policies"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={async () => {
                      if (!activePrompt) return;
                      await onUpdatePromptTemplate(activePrompt.id, {
                        ...activePrompt,
                        systemPrompt: promptText,
                        temperature: promptTemperature,
                        changelog: promptChangelog || 'Updated prompt parameters',
                      });
                      setPromptSaved(true);
                      setPromptChangelog('');
                      setTimeout(() => setPromptSaved(false), 2500);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Deploy New Version</span>
                  </button>
                </div>
              </div>

              {/* Version History Timeline (Requirement liii) */}
              {(activePrompt.history ?? []).length > 0 && (
                <div className="pt-4 border-t border-slate-700/60 space-y-2">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Version History Timeline ({(activePrompt.history ?? []).length} versions)</span>
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {(activePrompt.history ?? []).map((h, hIdx) => (
                      <div
                        key={hIdx}
                        className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 max-w-lg">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-blue-400">v{h.version}</span>
                            <span className="text-slate-500 text-[10px]">({h.updatedAt})</span>
                            {h.author && <span className="text-slate-400 text-[10px]">by {h.author}</span>}
                            <span className="text-[10px] font-mono text-slate-400">Temp: {h.temperature}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 italic">
                            "{h.changelog}"
                          </p>
                        </div>
                        {onRollbackPrompt && (
                          <button
                            onClick={() => onRollbackPrompt(activePrompt.id, h.version)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
                          >
                            Rollback to v{h.version}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add New Prompt Template Modal */}
      {isAddingPromptTpl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create AI Prompt Template</h3>
              <button
                onClick={() => setIsAddingPromptTpl(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onAddPromptTemplate && newTplName && newTplSystemPrompt) {
                  await onAddPromptTemplate({
                    name: newTplName,
                    purpose: newTplPurpose,
                    operation: newTplOperation,
                    systemPrompt: newTplSystemPrompt,
                  });
                  setIsAddingPromptTpl(false);
                  setNewTplName('');
                  setNewTplPurpose('');
                  setNewTplSystemPrompt('');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 mb-1">Template Name</label>
                <input
                  type="text"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  required
                  placeholder="e.g. CSAT Sentiment Analyzer"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Operation Type</label>
                  <select
                    value={newTplOperation}
                    onChange={(e) => setNewTplOperation(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                  >
                    <option value="Classification">Classification</option>
                    <option value="Response Generation">Response Generation</option>
                    <option value="Duplicate Analysis">Duplicate Analysis</option>
                    <option value="Missing Information">Missing Information</option>
                    <option value="Policy Validation">Policy Validation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Purpose / Description</label>
                  <input
                    type="text"
                    value={newTplPurpose}
                    onChange={(e) => setNewTplPurpose(e.target.value)}
                    placeholder="Short description"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">System Prompt Content</label>
                <textarea
                  value={newTplSystemPrompt}
                  onChange={(e) => setNewTplSystemPrompt(e.target.value)}
                  required
                  rows={6}
                  placeholder="You are SupportNova's..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono text-xs"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Create Template
                </button>
              </div>
            </form>
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
                  {(ruleMatrix ?? []).map((rule) => (
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
              {(testCases ?? []).map((tc) => {
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
                    <div>Adversarial Flags: <strong className="text-purple-400">{(testResult.pipeline2Output.adversarialPromptFlags ?? []).length}</strong></div>
                    <div>Bad Promises Flagged: <strong className="text-rose-400">{(testResult.pipeline2Output.unsupportedPromiseFlags ?? []).length}</strong></div>
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

      {/* Users & RBAC Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Enterprise User & RBAC Governance</span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage accounts, assign roles, enforce department scopes, and audit active sessions
              </p>
            </div>

            <button
              onClick={() => setIsAddingUser(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-md shadow-cyan-600/20 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New User</span>
            </button>
          </div>

          {/* Role Counts Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['Customer', 'Agent', 'Reviewer', 'Manager', 'Administrator'] as UserRole[]).map((r) => {
              const count = (users ?? []).filter((u) => u.role === r).length;
              return (
                <div
                  key={r}
                  onClick={() => setUserRoleFilter(userRoleFilter === r ? 'All' : r)}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    userRoleFilter === r
                      ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{r}s</span>
                  <span className="text-lg font-bold text-white font-mono mt-0.5 block">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Filter users by name, email, department, or company..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Filter Role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="All">All Roles</option>
                <option value="Customer">Customer</option>
                <option value="Agent">Agent</option>
                <option value="Reviewer">Reviewer</option>
                <option value="Manager">Manager</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
          </div>

          {/* Add User Modal */}
          {isAddingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-cyan-400" />
                    <span>Create Enterprise Account</span>
                  </h3>
                  <button
                    onClick={() => setIsAddingUser(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newUserName.trim() || !newUserEmail.trim()) return;
                    setUserActionLoading(true);
                    try {
                      if (onAddUser) {
                        await onAddUser({
                          name: newUserName.trim(),
                          email: newUserEmail.trim(),
                          role: newUserRole,
                          department: newUserDepartment,
                          title: newUserTitle.trim() || `${newUserRole} Specialist`,
                          phone: newUserPhone.trim(),
                          company: newUserCompany.trim(),
                        });
                      }
                      setIsAddingUser(false);
                      setNewUserName('');
                      setNewUserEmail('');
                    } finally {
                      setUserActionLoading(false);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="e.g. Rachel Adams"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="rachel.adams@supportnova.internal"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Assigned Role</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="Customer">Customer</option>
                        <option value="Agent">Agent</option>
                        <option value="Reviewer">Reviewer</option>
                        <option value="Manager">Manager</option>
                        <option value="Administrator">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Department</label>
                      <select
                        value={newUserDepartment}
                        onChange={(e) => setNewUserDepartment(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="Customer Support">Customer Support</option>
                        <option value="Hardware Diagnostics">Hardware Diagnostics</option>
                        <option value="Billing & Finance">Billing & Finance</option>
                        <option value="Account & Security">Account & Security</option>
                        <option value="Logistics & Shipping">Logistics & Shipping</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Job Title</label>
                      <input
                        type="text"
                        value={newUserTitle}
                        onChange={(e) => setNewUserTitle(e.target.value)}
                        placeholder="e.g. Senior Support Specialist"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={newUserCompany}
                        onChange={(e) => setNewUserCompany(e.target.value)}
                        placeholder="SupportNova Corp"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={userActionLoading}
                      className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {userActionLoading ? 'Saving...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* User Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">User & Identity</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Department / Org</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {(users ?? [])
                    .filter((u) => {
                      if (userRoleFilter !== 'All' && u.role !== userRoleFilter) return false;
                      if (!userSearch.trim()) return true;
                      const q = userSearch.toLowerCase();
                      return (
                        u.name.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q) ||
                        (u.department || '').toLowerCase().includes(q) ||
                        (u.company || '').toLowerCase().includes(q)
                      );
                    })
                    .map((u) => {
                      const getBadge = (role: UserRole) => {
                        switch (role) {
                          case 'Customer':
                            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                          case 'Agent':
                            return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                          case 'Reviewer':
                            return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                          case 'Manager':
                            return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                          case 'Administrator':
                            return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                        }
                      };

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                                {u.avatar || u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-100">{u.name}</div>
                                <div className="text-[11px] text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getBadge(u.role)}`}>
                              {u.role}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-slate-300">
                            {u.department || u.company || (u.role === 'Customer' ? 'Consumer' : 'General Support')}
                          </td>

                          <td className="px-4 py-3 text-slate-400">{u.title || `${u.role} Member`}</td>

                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {onDeleteUser && (
                                <button
                                  onClick={() => onDeleteUser(u.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
