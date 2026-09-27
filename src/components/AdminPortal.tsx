import React, { useState } from 'react';
import { Pagination } from './Pagination';
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

/* ---------- Palette tokens ---------- */
const PAL = {
  olive: '#373F51',
  gold: '#58A4B0',
  sienna: '#A9BCD0',
  oliveGold: '#506176',
  mahogany: '#293241',
  bg: '#373F51',
  card: 'rgba(41, 50, 65, 0.94)',
  cardSoft: 'rgba(80, 97, 118, 0.24)',
  border: 'rgba(169, 188, 208, 0.22)',
  borderStrong: 'rgba(88, 164, 176, 0.48)',
  text: '#F4F6FA',
  text2: '#D8DBE2',
  text3: '#A9BCD0',
};

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
  const [policyPage, setPolicyPage] = useState(1);
  const [rulePage, setRulePage] = useState(1);
  const [securityPage, setSecurityPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const adminPageSize = 8;
  const activePolicyCount = policies.filter((policy) => policy.status === 'Active').length;
  const adminRoleCounts = (['Customer', 'Agent', 'Reviewer', 'Manager', 'Administrator'] as UserRole[]).map((role) => ({
    label: role === 'Administrator' ? 'Admin' : role,
    count: users.filter((user) => user.role === role).length,
  }));
  const maxAdminRoleCount = Math.max(...adminRoleCounts.map((item) => item.count), 1);

  // User Management State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const filteredUsers = users.filter((user) => {
    if (userRoleFilter !== 'All' && user.role !== userRoleFilter) return false;
    if (!userSearch.trim()) return true;
    const query = userSearch.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.department || '').toLowerCase().includes(query) ||
      (user.company || '').toLowerCase().includes(query)
    );
  });
  const currentUserPage = Math.min(userPage, Math.max(1, Math.ceil(filteredUsers.length / adminPageSize)));
  const visibleUsers = filteredUsers.slice((currentUserPage - 1) * adminPageSize, currentUserPage * adminPageSize);
  const currentPolicyPage = Math.min(policyPage, Math.max(1, Math.ceil(policies.length / adminPageSize)));
  const visiblePolicies = policies.slice((currentPolicyPage - 1) * adminPageSize, currentPolicyPage * adminPageSize);
  const currentRulePage = Math.min(rulePage, Math.max(1, Math.ceil(ruleMatrix.length / adminPageSize)));
  const visibleRules = ruleMatrix.slice((currentRulePage - 1) * adminPageSize, currentRulePage * adminPageSize);
  const currentSecurityPage = Math.min(securityPage, Math.max(1, Math.ceil(testCases.length / adminPageSize)));
  const visibleSecurityTests = testCases.slice((currentSecurityPage - 1) * adminPageSize, currentSecurityPage * adminPageSize);
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

  // Document File Upload State
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

  // Prompt Template Management State
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

  /* ----------------------------------------------------------------
     SHARED STYLES
  ---------------------------------------------------------------- */
  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: `1px solid ${PAL.border}`,
    borderRadius: '1rem',
    boxShadow: 'inset 0 1px rgba(255, 238, 194, 0.05), 0 12px 28px rgba(0, 0, 0, 0.22)',
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(13, 15, 10, 0.9)',
    border: `1px solid rgba(215, 190, 130, 0.4)`,
    color: PAL.text,
    borderRadius: '0.6rem',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.75rem',
  };

  const goldBtn: React.CSSProperties = {
    background: 'linear-gradient(180deg, #e8b85e 0%, #d59837 100%)',
    color: '#21170b',
    fontWeight: 700,
    border: 'none',
    boxShadow: '0 10px 24px rgba(211, 145, 44, 0.3)',
    borderRadius: '0.6rem',
    letterSpacing: '0.02em',
  };

  const subtleBtn: React.CSSProperties = {
    background: 'rgba(81, 90, 71, 0.4)',
    color: PAL.text2,
    border: `1px solid rgba(215, 190, 130, 0.25)`,
    borderRadius: '0.6rem',
  };

  const monoLabel: React.CSSProperties = {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '10px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: PAL.text3,
  };

  return (
    <div className="admin-dashboard role-dashboard space-y-6">
      {/* ============================================================
          HEADER
      ============================================================ */}
      <div
        className="rounded-2xl p-6 shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(120deg, rgba(81, 90, 71, 0.55), rgba(117, 92, 27, 0.28) 55%, rgba(64, 4, 6, 0.32))',
          border: `1px solid ${PAL.borderStrong}`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, #515A47 0%, #D7BE82 35%, #7A4419 65%, #400406 100%)' }}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="admin-header-text px-2.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-widest font-mono"
                style={{
                  background: 'rgba(215, 190, 130, 0.16)',
                  color: PAL.gold,
                  border: `1px solid rgba(215, 190, 130, 0.4)`,
                }}
              >
                System Administration
              </span>
              <span className="admin-header-text text-xs" style={{ color: PAL.text2 }}>
                Policies, support rules, and team accounts
              </span>
            </div>
            <h1 className="admin-header-text text-2xl font-bold mt-2 tracking-tight" style={{ color: '#ffffff' }}>
              Admin dashboard
            </h1>
            <p className="admin-header-text text-xs mt-1 max-w-2xl" style={{ color: PAL.text3 }}>
              Manage support policies, routing rules, AI reply settings, security checks, and team accounts.
            </p>
          </div>

          {/* Tab Selector */}
          <div
            className="flex items-center space-x-1 p-1.5 rounded-xl border text-xs overflow-x-auto scrollbar-none whitespace-nowrap"
            style={{ background: 'rgba(13, 15, 10, 0.85)', borderColor: 'rgba(215, 190, 130, 0.25)' }}
          >
            {[
              { id: 'policies', icon: BookOpen, label: `Policies (${(policies ?? []).length})` },
              { id: 'ruleMatrix', icon: Grid, label: `Rule Matrix (${(ruleMatrix ?? []).length})` },
              { id: 'prompts', icon: FileCode, label: 'Prompts' },
              { id: 'security', icon: ShieldAlert, label: 'Security' },
              { id: 'users', icon: Users, label: `Users (${(users ?? []).length})` },
            ].map(({ id, icon: Icon, label }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className="px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 shrink-0 font-mono text-[11px] tracking-wider"
                  style={
                    isActive
                      ? { background: 'linear-gradient(180deg, #e8b85e 0%, #d59837 100%)', color: '#21170b', boxShadow: '0 6px 18px rgba(211, 145, 44, 0.3)' }
                      : { color: PAL.text3 }
                  }
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = PAL.gold; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = PAL.text3; }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================
          ANALYTICS
      ============================================================ */}
      <section className="role-analytics" aria-label="Administration overview">
        <div className="role-kpi-grid">
          {[
            { label: 'Active policies', value: activePolicyCount, note: `${policies.length} total policies`, tone: 'gold' },
            { label: 'Support rules', value: ruleMatrix.length, note: 'Used to route requests', tone: 'olive' },
            { label: 'AI settings', value: promptTemplates.length, note: 'Reply and review templates', tone: 'sienna' },
            { label: 'Team members', value: users.length, note: 'Across all roles', tone: 'mahogany' },
          ].map((item) => (
            <div className={`role-kpi role-kpi-${item.tone}`} key={item.label}>
              <span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small>
            </div>
          ))}
        </div>

        <div className="role-chart-card">
          <div className="role-chart-title">
            <div><strong>Team members</strong><small>Accounts by role</small></div>
            <Users className="w-4 h-4" style={{ color: PAL.gold }} />
          </div>
          <div className="role-bar-chart mt-4">
            {adminRoleCounts.map((item, index) => (
              <div className="role-bar-row" key={item.label}>
                <span>{item.label}</span>
                <div>
                  <i
                    className={`role-bar-${(['gold', 'olive', 'sienna', 'mahogany'] as const)[index % 4]}`}
                    style={{ width: `${users.length ? Math.max(item.count / maxAdminRoleCount * 100, item.count ? 8 : 0) : 0}%` }}
                  />
                </div>
                <b>{item.count}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          TAB: POLICIES
      ============================================================ */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center space-x-2" style={{ color: '#ffffff' }}>
              <BookOpen className="w-4 h-4" style={{ color: PAL.gold }} />
              <span>Support policies</span>
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setIsUploadingDoc(true); setIsAddingPolicy(false); }}
                className="px-3 py-1.5 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                style={goldBtn}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload PDF / DOCX</span>
              </button>
              <button
                onClick={() => { setIsAddingPolicy(true); setIsUploadingDoc(false); }}
                className="px-3 py-1.5 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                style={subtleBtn}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add policy manually</span>
              </button>
            </div>
          </div>

          {/* Upload Modal */}
          {isUploadingDoc && (
            <form
              onSubmit={handleDocumentUploadSubmit}
              className="p-5 space-y-4"
              style={{
                background: 'rgba(20, 22, 14, 0.94)',
                border: `1px solid rgba(215, 190, 130, 0.45)`,
                borderRadius: '1rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${PAL.border}` }}>
                <div className="flex items-center space-x-2">
                  <UploadCloud className="w-4 h-4" style={{ color: PAL.gold }} />
                  <span className="text-xs font-bold" style={{ color: '#ffffff' }}>
                    Upload a policy document (PDF, DOCX, TXT)
                  </span>
                  <span
                    className="px-2 py-0.5 text-[10px] rounded font-mono"
                    style={{ background: 'rgba(215, 190, 130, 0.15)', color: PAL.gold, border: `1px solid rgba(215, 190, 130, 0.3)` }}
                  >
                    Auto reader
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadingDoc(false)}
                  className="text-xs cursor-pointer"
                  style={{ color: PAL.text3 }}
                >
                  Cancel
                </button>
              </div>

              {uploadError && (
                <div
                  className="p-3 rounded-lg text-xs flex items-center space-x-2"
                  style={{ background: 'rgba(64, 4, 6, 0.4)', border: '1px solid rgba(142, 55, 54, 0.5)', color: '#e0a1a0' }}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#e0a1a0' }} />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccessInfo && (
                <div
                  className="p-3 rounded-lg text-xs flex items-center space-x-2"
                  style={{ background: 'rgba(81, 90, 71, 0.35)', border: '1px solid rgba(116, 131, 101, 0.55)', color: '#a7bc8d' }}
                >
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#a7bc8d' }} />
                  <span>{uploadSuccessInfo.message || 'Document parsed into traceable chunks and indexed!'}</span>
                </div>
              )}

              <div
                className="border-2 border-dashed rounded-xl p-6 text-center transition"
                style={{ borderColor: 'rgba(215, 190, 130, 0.35)', background: 'rgba(13, 15, 10, 0.6)' }}
              >
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
                      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="policy-file-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                  <FileUp className="w-8 h-8" style={{ color: PAL.gold }} />
                  <span className="text-xs font-semibold" style={{ color: PAL.text }}>
                    {uploadFile ? (
                      <span className="font-mono" style={{ color: PAL.gold }}>
                        {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      'Choose or drop a PDF, DOCX, or TXT policy file'
                    )}
                  </span>
                  <span className="text-[11px]" style={{ color: PAL.text3 }}>
                    We'll read the document and prepare it for use in support replies.
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block mb-1" style={monoLabel}>Document ID</label>
                  <input
                    type="text"
                    value={uploadDocumentId}
                    onChange={(e) => setUploadDocumentId(e.target.value)}
                    required
                    pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*"
                    maxLength={80}
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={monoLabel}>Title</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Return and Refund Guidelines v2.0"
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={monoLabel}>Category</label>
                  <input
                    type="text"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    required
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={monoLabel}>Version</label>
                  <input
                    type="text"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    placeholder="2.0"
                    required
                    pattern="[0-9]+(\.[0-9]+){0,3}(-[A-Za-z0-9.-]+)?"
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={monoLabel}>Effective Date</label>
                  <input
                    type="date"
                    value={uploadEffectiveDate}
                    onChange={(e) => setUploadEffectiveDate(e.target.value)}
                    required
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={monoLabel}>Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={uploadExpiryDate}
                    min={uploadEffectiveDate || undefined}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px]" style={{ color: PAL.text3 }}>
                  Uploading a newer version will replace the previous version, which will be marked <strong style={{ color: PAL.gold }}>Superseded</strong>.
                </span>
                <button
                  type="submit"
                  disabled={uploadParsing || !uploadFile}
                  className="px-4 py-2 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  style={goldBtn}
                >
                  {uploadParsing ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Reading document...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Read and save policy</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Add Policy */}
          {isAddingPolicy && (
            <form onSubmit={handleCreatePolicy} className="p-5 space-y-4" style={cardStyle}>
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${PAL.border}` }}>
                <span className="text-xs font-bold" style={{ color: '#ffffff' }}>Add New Policy Document (Manual)</span>
                <button type="button" onClick={() => setIsAddingPolicy(false)} className="text-xs cursor-pointer" style={{ color: PAL.text3 }}>
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block mb-1" style={monoLabel}>Document Title</label>
                  <input
                    type="text"
                    value={newPolicyTitle}
                    onChange={(e) => setNewPolicyTitle(e.target.value)}
                    required
                    placeholder="e.g. VIP Concierge Support SOP"
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={monoLabel}>Category</label>
                  <input
                    type="text"
                    value={newPolicyCategory}
                    onChange={(e) => setNewPolicyCategory(e.target.value)}
                    required
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={monoLabel}>Version</label>
                  <input
                    type="text"
                    value={newPolicyVersion}
                    onChange={(e) => setNewPolicyVersion(e.target.value)}
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={monoLabel}>Document Summary & Rules</label>
                <textarea
                  value={newPolicySummary}
                  onChange={(e) => setNewPolicySummary(e.target.value)}
                  rows={3}
                  required
                  placeholder="Detail the policy conditions, deadlines, and constraints..."
                  className="w-full p-2"
                  style={inputStyle}
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 text-xs font-semibold cursor-pointer" style={goldBtn}>
                  Save Policy to Knowledge Base
                </button>
              </div>
            </form>
          )}

          {/* Policy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visiblePolicies.map((pol) => (
              <div
                key={pol.id}
                className="admin-policy-card p-5 space-y-3 transition"
                style={{
                  background: pol.status === 'Superseded' ? 'rgba(20, 22, 14, 0.75)' : PAL.card,
                  border: `1px solid ${
                    pol.processingStatus === 'INVALID'
                      ? 'rgba(142, 55, 54, 0.5)'
                      : pol.status === 'Superseded'
                      ? 'rgba(117, 92, 27, 0.5)'
                      : PAL.border
                  }`,
                  borderRadius: '1rem',
                  boxShadow: 'inset 0 1px rgba(255, 238, 194, 0.05), 0 12px 28px rgba(0, 0, 0, 0.18)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: 'rgba(215, 190, 130, 0.12)', color: PAL.gold, border: `1px solid rgba(215, 190, 130, 0.3)` }}
                    >
                      {pol.id}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider font-mono" style={{ color: PAL.text3 }}>
                      v{pol.version}
                    </span>
                    {pol.processingStatus && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono"
                        style={
                          pol.processingStatus === 'PARSED'
                            ? { background: 'rgba(81, 90, 71, 0.4)', color: '#a7bc8d', border: '1px solid rgba(116, 131, 101, 0.5)' }
                            : pol.processingStatus === 'INVALID'
                            ? { background: 'rgba(64, 4, 6, 0.4)', color: '#e0a1a0', border: '1px solid rgba(142, 55, 54, 0.5)' }
                            : { background: 'rgba(117, 92, 27, 0.3)', color: PAL.gold, border: '1px solid rgba(117, 92, 27, 0.5)' }
                        }
                      >
                        {pol.processingStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className="px-2 py-0.5 text-[10px] font-semibold rounded font-mono"
                      style={
                        pol.status === 'Active'
                          ? { background: 'rgba(81, 90, 71, 0.35)', color: '#a7bc8d', border: '1px solid rgba(116, 131, 101, 0.5)' }
                          : pol.status === 'Superseded'
                          ? { background: 'rgba(117, 92, 27, 0.3)', color: PAL.gold, border: '1px solid rgba(117, 92, 27, 0.5)' }
                          : { background: 'rgba(81, 90, 71, 0.25)', color: PAL.text3, border: `1px solid ${PAL.border}` }
                      }
                    >
                      {pol.status}
                    </span>

                    {onTogglePolicyStatus && (
                      <button
                        onClick={() =>
                          onTogglePolicyStatus(pol.id, pol.status === 'Active' ? 'Superseded' : 'Active')
                        }
                        className="text-[10px] cursor-pointer underline"
                        style={{ color: PAL.gold }}
                        title="Toggle Active vs Superseded version status"
                      >
                        {pol.status === 'Active' ? 'Mark Outdated' : 'Set Active'}
                      </button>
                    )}

                    <button
                      onClick={() => onDeletePolicy(pol.id)}
                      className="p-1 rounded transition cursor-pointer"
                      style={{ color: PAL.text3 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#e0a1a0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = PAL.text3; }}
                      title="Delete Policy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                  {pol.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: PAL.text2 }}>
                  {pol.summary}
                </p>

                <div
                  className="admin-policy-subcard grid grid-cols-3 gap-2 py-1.5 px-2 rounded-lg text-[10px] font-mono"
                  style={{ background: 'rgba(13, 15, 10, 0.6)', border: `1px solid ${PAL.border}` }}
                >
                  <div>
                    <span className="block" style={{ color: PAL.text3 }}>FILE TYPE</span>
                    <span className="font-semibold" style={{ color: PAL.text }}>{pol.fileType || 'SOP DOC'}</span>
                  </div>
                  <div>
                    <span className="block" style={{ color: PAL.text3 }}>SIZE</span>
                    <span style={{ color: PAL.text }}>{pol.fileSize ? `${Math.round(pol.fileSize / 1024)} KB` : '42 KB'}</span>
                  </div>
                  <div>
                    <span className="block" style={{ color: PAL.text3 }}>CHECKSUM</span>
                    <span className="truncate block" style={{ color: PAL.gold }}>{pol.checksum || 'sha256-verified'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2" style={{ borderTop: `1px solid ${PAL.border}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider block font-mono" style={{ color: PAL.text3 }}>
                      Traceable Chunks ({(pol.sections ?? []).length})
                    </span>
                    <button
                      onClick={() => setInspectPolicyChunks(pol)}
                      className="text-[10px] font-medium cursor-pointer"
                      style={{ color: PAL.gold }}
                    >
                      Inspect All Chunks
                    </button>
                  </div>
                  {(pol.sections ?? []).slice(0, 2).map((sec) => (
                    <div
                      key={sec.id}
                      className="admin-policy-subcard p-2.5 rounded-lg text-xs"
                      style={{ background: 'rgba(13, 15, 10, 0.6)', border: `1px solid ${PAL.border}` }}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1" style={{ color: PAL.text2 }}>
                        <span>[{sec.id}] {sec.heading}</span>
                        {sec.wordCount && (
                          <span className="text-[10px] font-mono" style={{ color: PAL.text3 }}>
                            {sec.wordCount} words • ~{sec.tokenEstimate || Math.round(sec.wordCount * 1.3)} tokens
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-normal line-clamp-2" style={{ color: PAL.text3 }}>
                        {sec.content}
                      </p>
                    </div>
                  ))}
                  {(pol.sections ?? []).length > 2 && (
                    <button
                      onClick={() => setInspectPolicyChunks(pol)}
                      className="admin-policy-subcard w-full text-center text-[10px] py-1 rounded cursor-pointer"
                      style={{ color: PAL.text3, background: 'rgba(13, 15, 10, 0.5)', border: `1px solid ${PAL.border}` }}
                    >
                      +{(pol.sections ?? []).length - 2} more chunks...
                    </button>
                  )}
                </div>

                {(pol.versionHistory ?? []).length > 0 && (
                  <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${PAL.border}` }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider block font-mono" style={{ color: PAL.text3 }}>
                      Version History ({(pol.versionHistory ?? []).length} previous)
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {(pol.versionHistory ?? []).map((vh, vIdx) => (
                        <div
                          key={vIdx}
                          className="admin-policy-subcard flex items-center justify-between p-1.5 rounded text-[10px]"
                          style={{ background: 'rgba(13, 15, 10, 0.5)', border: `1px solid ${PAL.border}` }}
                        >
                          <div className="space-x-1.5 truncate">
                            <span className="font-mono font-bold" style={{ color: PAL.text2 }}>v{vh.version}</span>
                            <span style={{ color: PAL.text3 }}>({vh.effectiveDate})</span>
                            <span className="truncate" style={{ color: PAL.text2 }}>{vh.summary}</span>
                          </div>
                          {onRollbackPolicy && (
                            <button
                              onClick={() => onRollbackPolicy(pol.id, vh.version)}
                              className="px-2 py-0.5 rounded text-[9px] font-semibold cursor-pointer shrink-0 ml-2"
                              style={{ background: 'rgba(215, 190, 130, 0.15)', color: PAL.gold, border: `1px solid rgba(215, 190, 130, 0.3)` }}
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
          <Pagination page={currentPolicyPage} pageSize={adminPageSize} totalItems={policies.length} onPageChange={setPolicyPage} />
        </div>
      )}

      {/* ============================================================
          POLICY CHUNKS INSPECTOR MODAL
      ============================================================ */}
      {inspectPolicyChunks && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13, 15, 10, 0.85)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl"
            style={{
              background: 'rgba(20, 22, 14, 0.98)',
              border: `1px solid ${PAL.borderStrong}`,
              borderRadius: '1rem',
            }}
          >
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${PAL.border}` }}>
              <div>
                <h3 className="text-sm font-bold flex items-center space-x-2" style={{ color: '#ffffff' }}>
                  <FileText className="w-4 h-4" style={{ color: PAL.gold }} />
                  <span>Traceable Chunks: {inspectPolicyChunks.title} (v{inspectPolicyChunks.version})</span>
                </h3>
                <span className="text-xs" style={{ color: PAL.text3 }}>
                  {(inspectPolicyChunks.sections ?? []).length} deterministic chunks indexed for retrieval
                </span>
              </div>
              <button
                onClick={() => setInspectPolicyChunks(null)}
                className="text-xs cursor-pointer px-2 py-1 rounded-lg"
                style={{ color: PAL.text2, background: 'rgba(81, 90, 71, 0.35)', border: `1px solid ${PAL.border}` }}
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {(inspectPolicyChunks.sections ?? []).map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className="p-3.5 rounded-xl space-y-1.5"
                  style={{ background: 'rgba(13, 15, 10, 0.7)', border: `1px solid ${PAL.border}` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold" style={{ color: PAL.gold }}>
                      [{sec.id}] {sec.heading}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: PAL.text3 }}>
                      Hash: {sec.checksum || 'sha256'} • ~{sec.tokenEstimate || 30} tokens
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: PAL.text2 }}>
                    {sec.content}
                  </p>
                  {sec.mandatoryConditions && sec.mandatoryConditions.length > 0 && (
                    <div
                      className="text-[11px] p-2 rounded"
                      style={{ background: 'rgba(81, 90, 71, 0.3)', border: '1px solid rgba(116, 131, 101, 0.5)', color: '#a7bc8d' }}
                    >
                      <strong>Mandatory Conditions:</strong> {sec.mandatoryConditions.join('; ')}
                    </div>
                  )}
                  {sec.prohibitions && sec.prohibitions.length > 0 && (
                    <div
                      className="text-[11px] p-2 rounded"
                      style={{ background: 'rgba(64, 4, 6, 0.35)', border: '1px solid rgba(142, 55, 54, 0.5)', color: '#e0a1a0' }}
                    >
                      <strong>Prohibitions:</strong> {sec.prohibitions.join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB: PROMPTS
      ============================================================ */}
      {activeTab === 'prompts' && (
        <div className="p-6 space-y-5" style={cardStyle}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3" style={{ borderBottom: `1px solid ${PAL.border}` }}>
            <div>
              <h2 className="text-sm font-bold flex items-center space-x-2" style={{ color: '#ffffff' }}>
                <FileCode className="w-4 h-4" style={{ color: PAL.gold }} />
                <span>AI reply settings and versions</span>
              </h2>
              <p className="text-xs mt-0.5" style={{ color: PAL.text3 }}>
                Choose how AI sorts requests, drafts replies, and checks for missing details.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {promptSaved && (
                <span className="text-xs flex items-center space-x-1 font-semibold" style={{ color: '#a7bc8d' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settings saved</span>
                </span>
              )}
              <button
                onClick={() => setIsAddingPromptTpl(true)}
                className="px-3 py-1.5 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                style={goldBtn}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Template</span>
              </button>
            </div>
          </div>

          {/* Template Selector Tabs */}
          <div className="flex flex-wrap gap-2 pb-2" style={{ borderBottom: `1px solid ${PAL.border}` }}>
            {(promptTemplates ?? []).map((tpl) => {
              const isActive = activePrompt?.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedPromptId(tpl.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition cursor-pointer"
                  style={
                    isActive
                      ? { background: 'linear-gradient(180deg, #e8b85e 0%, #d59837 100%)', color: '#21170b', boxShadow: '0 8px 22px rgba(211, 145, 44, 0.3)' }
                      : { background: 'rgba(13, 15, 10, 0.7)', color: PAL.text2, border: `1px solid ${PAL.border}` }
                  }
                >
                  <span>{tpl.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                    style={
                      isActive
                        ? { background: 'rgba(33, 23, 11, 0.25)', color: '#21170b' }
                        : { background: 'rgba(215, 190, 130, 0.15)', color: PAL.gold }
                    }
                  >
                    v{tpl.version}
                  </span>
                </button>
              );
            })}
          </div>

          {activePrompt && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(13, 15, 10, 0.7)', border: `1px solid ${PAL.border}` }}>
                  <span className="block font-semibold" style={monoLabel}>Template ID & Purpose</span>
                  <span className="font-mono font-bold block" style={{ color: PAL.gold }}>{activePrompt.id}</span>
                  <span className="text-[11px] truncate block" style={{ color: PAL.text2 }}>{activePrompt.purpose || 'Operation prompt'}</span>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(13, 15, 10, 0.7)', border: `1px solid ${PAL.border}` }}>
                  <span className="block font-semibold" style={monoLabel}>Model & Operation</span>
                  <span className="font-mono block" style={{ color: PAL.text }}>{activePrompt.model}</span>
                  <span className="text-[10px] font-semibold" style={{ color: PAL.gold }}>{activePrompt.operation || 'Response Generation'}</span>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(13, 15, 10, 0.7)', border: `1px solid ${PAL.border}` }}>
                  <span className="block font-semibold" style={monoLabel}>Version & Updated</span>
                  <span className="font-semibold block" style={{ color: '#a7bc8d' }}>v{activePrompt.version} ({activePrompt.status})</span>
                  <span className="text-[10px]" style={{ color: PAL.text3 }}>{activePrompt.lastUpdated} by {activePrompt.author || 'AI Admin'}</span>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(13, 15, 10, 0.7)', border: `1px solid ${PAL.border}` }}>
                  <span className="block font-semibold" style={monoLabel}>Temperature ({promptTemperature})</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={promptTemperature}
                    onChange={(e) => setPromptTemperature(Number(e.target.value))}
                    className="w-full mt-2"
                    style={{ accentColor: PAL.gold }}
                  />
                </div>
              </div>

              {(activePrompt.variables ?? []).length > 0 && (
                <div
                  className="flex items-center space-x-2 text-xs p-2.5 rounded-xl"
                  style={{ background: 'rgba(13, 15, 10, 0.6)', border: `1px solid ${PAL.border}` }}
                >
                  <span className="font-bold font-mono" style={{ ...monoLabel, color: PAL.text2 }}>Available Variables:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(activePrompt.variables ?? []).map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded font-mono text-[10px]"
                        style={{ background: 'rgba(215, 190, 130, 0.12)', color: PAL.gold, border: `1px solid rgba(215, 190, 130, 0.3)` }}
                      >
                        {`{${v}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 font-mono uppercase tracking-widest" style={{ color: PAL.gold }}>
                  System Prompt Directive (Version Controlled)
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={10}
                  className="w-full p-3 font-mono text-xs leading-relaxed"
                  style={{
                    background: 'rgba(13, 15, 10, 0.9)',
                    border: `1px solid rgba(215, 190, 130, 0.35)`,
                    color: PAL.text,
                    borderRadius: '0.75rem',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1 font-mono uppercase tracking-widest" style={{ color: PAL.gold }}>
                    Changelog Note
                  </label>
                  <input
                    type="text"
                    value={promptChangelog}
                    onChange={(e) => setPromptChangelog(e.target.value)}
                    placeholder="e.g. Added stricter refund check for 30+ days policies"
                    className="w-full p-2.5 text-xs"
                    style={inputStyle}
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
                    className="w-full py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer"
                    style={goldBtn}
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Deploy New Version</span>
                  </button>
                </div>
              </div>

              {(activePrompt.history ?? []).length > 0 && (
                <div className="pt-4 space-y-2" style={{ borderTop: `1px solid ${PAL.border}` }}>
                  <span className="text-xs font-bold flex items-center space-x-1.5 font-mono uppercase tracking-widest" style={{ color: PAL.gold }}>
                    Version History Timeline ({(activePrompt.history ?? []).length})
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {(activePrompt.history ?? []).map((h, hIdx) => (
                      <div
                        key={hIdx}
                        className="p-3 rounded-xl flex items-center justify-between text-xs"
                        style={{ background: 'rgba(13, 15, 10, 0.7)', border: `1px solid ${PAL.border}` }}
                      >
                        <div className="space-y-0.5 max-w-lg">
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="font-bold" style={{ color: PAL.gold }}>v{h.version}</span>
                            <span className="text-[10px]" style={{ color: PAL.text3 }}>({h.updatedAt})</span>
                            {h.author && <span className="text-[10px]" style={{ color: PAL.text2 }}>by {h.author}</span>}
                            <span className="text-[10px]" style={{ color: PAL.text3 }}>Temp: {h.temperature}</span>
                          </div>
                          <p className="text-[11px] italic" style={{ color: PAL.text2 }}>
                            "{h.changelog}"
                          </p>
                        </div>
                        {onRollbackPrompt && (
                          <button
                            onClick={() => onRollbackPrompt(activePrompt.id, h.version)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                            style={subtleBtn}
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

      {/* ============================================================
          ADD PROMPT TEMPLATE MODAL
      ============================================================ */}
      {isAddingPromptTpl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13, 15, 10, 0.85)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="max-w-lg w-full p-6 space-y-4 shadow-2xl"
            style={{ background: 'rgba(20, 22, 14, 0.98)', border: `1px solid ${PAL.borderStrong}`, borderRadius: '1rem' }}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${PAL.border}` }}>
              <h3 className="text-sm font-bold" style={{ color: '#ffffff' }}>Create AI Prompt Template</h3>
              <button
                onClick={() => setIsAddingPromptTpl(false)}
                className="text-xs cursor-pointer"
                style={{ color: PAL.text3 }}
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
                <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Template Name</label>
                <input
                  type="text"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  required
                  placeholder="e.g. CSAT Sentiment Analyzer"
                  className="w-full p-2.5"
                  style={inputStyle}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Operation Type</label>
                  <select
                    value={newTplOperation}
                    onChange={(e) => setNewTplOperation(e.target.value as any)}
                    className="w-full p-2.5"
                    style={inputStyle}
                  >
                    <option value="Classification">Classification</option>
                    <option value="Response Generation">Response Generation</option>
                    <option value="Duplicate Analysis">Duplicate Analysis</option>
                    <option value="Missing Information">Missing Information</option>
                    <option value="Policy Validation">Policy Validation</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Purpose</label>
                  <input
                    type="text"
                    value={newTplPurpose}
                    onChange={(e) => setNewTplPurpose(e.target.value)}
                    placeholder="Short description"
                    className="w-full p-2.5"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>System Prompt Content</label>
                <textarea
                  value={newTplSystemPrompt}
                  onChange={(e) => setNewTplSystemPrompt(e.target.value)}
                  required
                  rows={6}
                  placeholder="You are SupportNova's..."
                  className="w-full p-2.5 font-mono text-xs"
                  style={inputStyle}
                />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 font-semibold cursor-pointer" style={goldBtn}>
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB: RULE MATRIX
      ============================================================ */}
      {activeTab === 'ruleMatrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold flex items-center space-x-2" style={{ color: '#ffffff' }}>
                <Grid className="w-4 h-4" style={{ color: PAL.gold }} />
                <span>Support rules</span>
              </h2>
              <p className="text-xs mt-0.5" style={{ color: PAL.text3 }}>
                Set the rules used to sort requests, choose a team, and decide when to ask for extra help.
              </p>
            </div>
            <button
              onClick={() => setIsAddingRule(true)}
              className="px-3 py-1.5 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
              style={goldBtn}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a rule</span>
            </button>
          </div>

          {isAddingRule && (
            <form onSubmit={handleCreateRule} className="p-5 space-y-4" style={cardStyle}>
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${PAL.border}` }}>
                <span className="text-xs font-bold" style={{ color: '#ffffff' }}>Add New Rule Matrix Entry</span>
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="text-xs cursor-pointer"
                  style={{ color: PAL.text3 }}
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Category</label>
                  <input
                    type="text"
                    value={ruleCat}
                    onChange={(e) => setRuleCat(e.target.value)}
                    required
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Subcategory</label>
                  <input
                    type="text"
                    value={ruleSubcat}
                    onChange={(e) => setRuleSubcat(e.target.value)}
                    required
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Responsible Dept</label>
                  <select
                    value={ruleDept}
                    onChange={(e) => setRuleDept(e.target.value)}
                    className="w-full p-2"
                    style={inputStyle}
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>SLA (Hours)</label>
                  <input
                    type="number"
                    value={ruleSla}
                    onChange={(e) => setRuleSla(Number(e.target.value))}
                    className="w-full p-2"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Rule Urgency</label>
                  <select
                    value={ruleUrgency}
                    onChange={(e: any) => setRuleUrgency(e.target.value)}
                    className="w-full p-2"
                    style={inputStyle}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Mandatory Escalation</label>
                  <select
                    value={ruleMandatoryEscalation ? 'true' : 'false'}
                    onChange={(e) => setRuleMandatoryEscalation(e.target.value === 'true')}
                    className="w-full p-2"
                    style={inputStyle}
                  >
                    <option value="false">No (Frontline resolution)</option>
                    <option value="true">Yes (Mandatory)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Escalation Tier</label>
                  <select
                    value={ruleEscalationTier}
                    onChange={(e: any) => setRuleEscalationTier(e.target.value)}
                    className="w-full p-2"
                    style={inputStyle}
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
                <label className="block text-xs mb-1 font-mono uppercase tracking-widest" style={monoLabel}>
                  Trigger Conditions / Regex / Keywords
                </label>
                <input
                  type="text"
                  value={ruleTriggers}
                  onChange={(e) => setRuleTriggers(e.target.value)}
                  required
                  placeholder="e.g. Keywords: smoke, sparks, swelling, thermal runaway"
                  className="w-full p-2"
                  style={inputStyle}
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 text-xs font-semibold cursor-pointer" style={goldBtn}>
                  Save Rule to Matrix
                </button>
              </div>
            </form>
          )}

          {/* Rule Matrix Table */}
          <div className="overflow-hidden" style={cardStyle}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ background: 'rgba(13, 15, 10, 0.85)' }}>
                    {['Rule ID', 'Category & Subcategory', 'Routing Dept', 'Urgency / Pri', 'Mandatory Escalation', 'Trigger Conditions', 'SLA', 'Action'].map((h, i) => (
                      <th
                        key={h}
                        className={`py-3 px-3 ${i === 7 ? 'text-right' : ''}`}
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.65rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: PAL.gold,
                          borderBottom: `1px solid ${PAL.border}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRules.map((rule) => (
                    <tr
                      key={rule.id}
                      style={{ borderBottom: `1px solid rgba(215, 190, 130, 0.1)` }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(215, 190, 130, 0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: PAL.gold }}>
                        {rule.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold block" style={{ color: '#ffffff' }}>{rule.category}</span>
                        <span className="text-[11px]" style={{ color: PAL.text3 }}>{rule.subcategory}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium" style={{ color: PAL.gold }}>
                        {rule.department}
                      </td>
                      <td className="py-2.5 px-3 font-mono" style={{ color: PAL.text2 }}>
                        {rule.urgency} / {rule.priority}
                      </td>
                      <td className="py-2.5 px-3">
                        {rule.mandatoryEscalation ? (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                            style={{ background: 'rgba(64, 4, 6, 0.5)', color: '#e0a1a0', border: '1px solid rgba(142, 55, 54, 0.55)' }}
                          >
                            {rule.escalationTier}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px]" style={{ color: PAL.text3 }}>None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] max-w-xs truncate" style={{ color: PAL.text2 }}>
                        {rule.triggerConditions}
                      </td>
                      <td className="py-2.5 px-3 font-mono" style={{ color: PAL.text3 }}>
                        {rule.slaHours}h
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onDeleteRule(rule.id)}
                          className="p-1 rounded cursor-pointer"
                          style={{ color: PAL.text3 }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#e0a1a0'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = PAL.text3; }}
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
          <Pagination page={currentRulePage} pageSize={adminPageSize} totalItems={ruleMatrix.length} onPageChange={setRulePage} />
        </div>
      )}

      {/* ============================================================
          TAB: SECURITY
      ============================================================ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6" style={cardStyle}>
            <h2 className="text-sm font-bold flex items-center space-x-2" style={{ color: '#ffffff' }}>
              <ShieldAlert className="w-4 h-4" style={{ color: PAL.gold }} />
              <span>Security checks</span>
            </h2>
            <p className="text-xs mt-1 max-w-3xl" style={{ color: PAL.text3 }}>
              Run test requests to make sure unsafe instructions and unsupported refund offers are caught and sent for review.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {visibleSecurityTests.map((tc) => {
                const isRunning = runningTestId === tc.id;
                return (
                  <div
                    key={tc.id}
                    className="p-5 space-y-3 relative overflow-hidden"
                    style={{
                      background: 'rgba(13, 15, 10, 0.7)',
                      border: `1px solid ${PAL.border}`,
                      borderRadius: '1rem',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold" style={{ color: PAL.gold }}>
                        {tc.id}
                      </span>
                      <span
                        className="px-2 py-0.5 text-[10px] font-semibold rounded font-mono"
                        style={{ background: 'rgba(215, 190, 130, 0.12)', color: PAL.gold, border: `1px solid rgba(215, 190, 130, 0.3)` }}
                      >
                        {tc.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold" style={{ color: '#ffffff' }}>
                      {tc.name}
                    </h3>

                    <p className="text-xs" style={{ color: PAL.text2 }}>
                      {tc.description}
                    </p>

                    <div
                      className="p-3 rounded-lg text-[11px] space-y-1"
                      style={{ background: 'rgba(13, 15, 10, 0.85)', border: `1px solid ${PAL.border}` }}
                    >
                      <span className="font-semibold block text-[10px] font-mono uppercase tracking-widest" style={{ color: PAL.text3 }}>
                        Example request:
                      </span>
                      <p className="font-mono italic" style={{ color: PAL.text2 }}>
                        "{tc.sampleComplaint.description.slice(0, 140)}..."
                      </p>
                    </div>

                    <div
                      className="text-[11px] p-2.5 rounded"
                      style={{ background: 'rgba(81, 90, 71, 0.28)', border: '1px solid rgba(116, 131, 101, 0.5)', color: '#a7bc8d' }}
                    >
                      <strong className="block mb-0.5">Expected result:</strong>
                      {tc.expectedDefense}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleRunSecurityBenchmark(tc.id)}
                        disabled={isRunning}
                        className="px-3.5 py-1.5 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                        style={{
                          background: 'linear-gradient(180deg, #8e3736 0%, #400406 100%)',
                          color: '#f5edda',
                          border: 'none',
                          borderRadius: '0.6rem',
                          boxShadow: '0 10px 24px rgba(64, 4, 6, 0.35)',
                        }}
                      >
                        <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                        <span>{isRunning ? 'Running check...' : 'Run check'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={currentSecurityPage} pageSize={adminPageSize} totalItems={testCases.length} onPageChange={setSecurityPage} />
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className="p-6 space-y-4 shadow-2xl"
              style={{
                background: 'rgba(20, 22, 14, 0.98)',
                border: `2px solid ${PAL.borderStrong}`,
                borderRadius: '1rem',
              }}
            >
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${PAL.border}` }}>
                <div className="flex items-center space-x-2">
                  <span
                    className="p-1.5 rounded-lg"
                    style={{ background: 'rgba(215, 190, 130, 0.15)', color: PAL.gold, border: `1px solid rgba(215, 190, 130, 0.3)` }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: '#ffffff' }}>
                      Check result: {testResult.testCase.name}
                    </h3>
                    <span className="text-xs font-semibold" style={{ color: testResult.passedDefense ? '#a7bc8d' : '#e0a1a0' }}>
                      Status: {testResult.passedDefense ? 'Passed (unsafe request caught)' : 'Failed'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setTestResult(null)}
                  className="text-xs cursor-pointer"
                  style={{ color: PAL.text3 }}
                >
                  Dismiss
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(13, 15, 10, 0.85)', border: `1px solid ${PAL.border}` }}>
                  <span className="text-[10px] uppercase font-bold block mb-1 font-mono tracking-widest" style={{ color: PAL.text3 }}>
                    Pipeline 1 (GenAI)
                  </span>
                  <div className="space-y-1">
                    <div style={{ color: PAL.text2 }}>Urgency: <strong style={{ color: '#ffffff' }}>{testResult.pipeline1Output.urgency}</strong></div>
                    <div style={{ color: PAL.text2 }}>Dept: <strong style={{ color: '#ffffff' }}>{testResult.pipeline1Output.recommendedDepartment}</strong></div>
                    <div style={{ color: PAL.text2 }}>Escalation: <strong style={{ color: '#ffffff' }}>{testResult.pipeline1Output.escalationRequired ? 'Yes' : 'No'}</strong></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'rgba(13, 15, 10, 0.85)', border: `1px solid ${PAL.border}` }}>
                  <span className="text-[10px] uppercase font-bold block mb-1 font-mono tracking-widest" style={{ color: PAL.text3 }}>
                    Python Crosscheck
                  </span>
                  <div className="space-y-1">
                    <div style={{ color: PAL.text2 }}>
                      Status: <strong style={{ color: testResult.pythonValidation?.passed ? '#a7bc8d' : PAL.gold }}>
                        {testResult.pythonValidation?.status || 'Validated'}
                      </strong>
                    </div>
                    <div style={{ color: PAL.text2 }}>Score: <strong className="font-mono" style={{ color: '#ffffff' }}>{testResult.pythonValidation?.validationScore ?? 90}%</strong></div>
                    <div style={{ color: PAL.text2 }}>Findings: <strong style={{ color: '#e0a1a0' }}>{testResult.pythonValidation?.findings?.length || 0}</strong></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'rgba(13, 15, 10, 0.85)', border: `1px solid ${PAL.border}` }}>
                  <span className="text-[10px] uppercase font-bold block mb-1 font-mono tracking-widest" style={{ color: PAL.text3 }}>
                    Pipeline 2 (Rules)
                  </span>
                  <div className="space-y-1">
                    <div style={{ color: PAL.text2 }}>Adversarial: <strong style={{ color: PAL.gold }}>{(testResult.pipeline2Output.adversarialPromptFlags ?? []).length}</strong></div>
                    <div style={{ color: PAL.text2 }}>Bad Promises: <strong style={{ color: '#e0a1a0' }}>{(testResult.pipeline2Output.unsupportedPromiseFlags ?? []).length}</strong></div>
                    <div style={{ color: PAL.text2 }}>Escalation: <strong style={{ color: '#ffffff' }}>{testResult.pipeline2Output.mandatoryEscalation ? 'YES' : 'No'}</strong></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'rgba(13, 15, 10, 0.85)', border: `1px solid ${PAL.border}` }}>
                  <span className="text-[10px] uppercase font-bold block mb-1 font-mono tracking-widest" style={{ color: PAL.text3 }}>
                    Final Adjudication
                  </span>
                  <div className="space-y-1">
                    <div style={{ color: PAL.text2 }}>
                      Status: <strong style={{ color: testResult.comparisonResult.verificationStatus === 'Verified' ? '#a7bc8d' : PAL.gold }}>
                        {testResult.comparisonResult.verificationStatus}
                      </strong>
                    </div>
                    <div style={{ color: PAL.text2 }}>Score: <strong style={{ color: '#ffffff' }}>{testResult.comparisonResult.verificationScore}%</strong></div>
                    <div className="text-[11px]" style={{ color: PAL.text3 }}>AI + Python + Rules triangulated.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB: USERS
      ============================================================ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold flex items-center space-x-2" style={{ color: '#ffffff' }}>
                <Users className="w-4 h-4" style={{ color: PAL.gold }} />
                <span>Team accounts and roles</span>
              </h2>
              <p className="text-xs" style={{ color: PAL.text3 }}>
                Add team members, choose their roles, and manage their access.
              </p>
            </div>

            <button
              onClick={() => setIsAddingUser(true)}
              className="px-3 py-1.5 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shrink-0"
              style={goldBtn}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add team member</span>
            </button>
          </div>

          {/* Role counts */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['Customer', 'Agent', 'Reviewer', 'Manager', 'Administrator'] as UserRole[]).map((r) => {
              const count = (users ?? []).filter((u) => u.role === r).length;
              const isActive = userRoleFilter === r;
              return (
                <div
                  key={r}
                  onClick={() => {
                    setUserRoleFilter(isActive ? 'All' : r);
                    setUserPage(1);
                  }}
                  className="p-3 rounded-xl text-center transition cursor-pointer"
                  style={{
                    background: isActive ? 'rgba(215, 190, 130, 0.12)' : 'rgba(20, 22, 14, 0.7)',
                    border: `1px solid ${isActive ? PAL.gold : PAL.border}`,
                    boxShadow: isActive ? '0 0 0 1px rgba(215, 190, 130, 0.35)' : 'none',
                  }}
                >
                  <span className="text-[10px] uppercase font-bold block font-mono tracking-widest" style={{ color: PAL.text3 }}>
                    {r}s
                  </span>
                  <span className="text-lg font-bold font-mono mt-0.5 block" style={{ color: '#ffffff' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Search & Filter */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3"
            style={{ background: 'rgba(13, 15, 10, 0.7)', border: `1px solid ${PAL.border}`, borderRadius: '0.85rem' }}
          >
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5" style={{ color: PAL.text3 }} />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Filter users by name, email, department, or company..."
                className="w-full pl-8 pr-3 py-1.5 text-xs"
                style={inputStyle}
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: PAL.text3 }}>Filter Role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-2.5 py-1.5 text-xs"
                style={inputStyle}
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
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(13, 15, 10, 0.85)', backdropFilter: 'blur(6px)' }}
            >
              <div
                className="max-w-lg w-full p-6 space-y-4 shadow-2xl"
                style={{ background: 'rgba(20, 22, 14, 0.98)', border: `1px solid ${PAL.borderStrong}`, borderRadius: '1rem' }}
              >
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${PAL.border}` }}>
                  <h3 className="text-sm font-bold flex items-center space-x-2" style={{ color: '#ffffff' }}>
                    <UserPlus className="w-4 h-4" style={{ color: PAL.gold }} />
                    <span>Create team account</span>
                  </h3>
                  <button
                    onClick={() => setIsAddingUser(false)}
                    className="cursor-pointer"
                    style={{ color: PAL.text3 }}
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
                      <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="e.g. Rachel Adams"
                        className="w-full px-3 py-1.5"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Email *</label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="rachel@supportnova.internal"
                        className="w-full px-3 py-1.5"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Assigned Role</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="w-full px-3 py-1.5"
                        style={inputStyle}
                      >
                        <option value="Customer">Customer</option>
                        <option value="Agent">Agent</option>
                        <option value="Reviewer">Reviewer</option>
                        <option value="Manager">Manager</option>
                        <option value="Administrator">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Department</label>
                      <select
                        value={newUserDepartment}
                        onChange={(e) => setNewUserDepartment(e.target.value)}
                        className="w-full px-3 py-1.5"
                        style={inputStyle}
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
                      <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Job Title</label>
                      <input
                        type="text"
                        value={newUserTitle}
                        onChange={(e) => setNewUserTitle(e.target.value)}
                        placeholder="e.g. Senior Support Specialist"
                        className="w-full px-3 py-1.5"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-mono uppercase tracking-widest" style={monoLabel}>Company</label>
                      <input
                        type="text"
                        value={newUserCompany}
                        onChange={(e) => setNewUserCompany(e.target.value)}
                        placeholder="SupportNova Corp"
                        className="w-full px-3 py-1.5"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-3" style={{ borderTop: `1px solid ${PAL.border}` }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="flex-1 py-2 font-semibold transition cursor-pointer"
                      style={subtleBtn}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={userActionLoading}
                      className="flex-1 py-2 font-semibold transition cursor-pointer disabled:opacity-50"
                      style={goldBtn}
                    >
                      {userActionLoading ? 'Saving...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* User Table */}
          <div className="overflow-hidden" style={cardStyle}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead style={{ background: 'rgba(13, 15, 10, 0.85)' }}>
                  <tr>
                    {['User & Identity', 'Assigned Role', 'Department / Org', 'Title', 'Status', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 ${i === 4 ? 'text-center' : ''} ${i === 5 ? 'text-right' : ''}`}
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.65rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: PAL.gold,
                          borderBottom: `1px solid ${PAL.border}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => {
                      const badgeStyle = (role: UserRole): React.CSSProperties => {
                        switch (role) {
                          case 'Customer': return { background: 'rgba(81, 90, 71, 0.35)', color: '#a7bc8d', border: '1px solid rgba(116, 131, 101, 0.5)' };
                          case 'Agent': return { background: 'rgba(215, 190, 130, 0.12)', color: PAL.gold, border: `1px solid rgba(215, 190, 130, 0.35)` };
                          case 'Reviewer': return { background: 'rgba(117, 92, 27, 0.3)', color: PAL.gold, border: '1px solid rgba(117, 92, 27, 0.55)' };
                          case 'Manager': return { background: 'rgba(122, 68, 25, 0.32)', color: '#e4b98a', border: '1px solid rgba(122, 68, 25, 0.6)' };
                          case 'Administrator': return { background: 'rgba(64, 4, 6, 0.5)', color: '#e0a1a0', border: '1px solid rgba(142, 55, 54, 0.55)' };
                        }
                      };

                      return (
                        <tr
                          key={u.id}
                          style={{ borderBottom: `1px solid rgba(215, 190, 130, 0.1)` }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(215, 190, 130, 0.04)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2.5">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono"
                                style={{ background: 'rgba(215, 190, 130, 0.12)', color: PAL.gold, border: `1px solid rgba(215, 190, 130, 0.3)` }}
                              >
                                {u.avatar || u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold" style={{ color: '#ffffff' }}>{u.name}</div>
                                <div className="text-[11px]" style={{ color: PAL.text3 }}>{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase tracking-widest"
                              style={badgeStyle(u.role)}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="px-4 py-3" style={{ color: PAL.text2 }}>
                            {u.department || u.company || (u.role === 'Customer' ? 'Consumer' : 'General Support')}
                          </td>

                          <td className="px-4 py-3" style={{ color: PAL.text3 }}>
                            {u.title || `${u.role} Member`}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest"
                              style={{ background: 'rgba(81, 90, 71, 0.35)', color: '#a7bc8d', border: '1px solid rgba(116, 131, 101, 0.5)' }}
                            >
                              Active
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {onDeleteUser && (
                                <button
                                  onClick={() => onDeleteUser(u.id)}
                                  className="p-1.5 rounded transition cursor-pointer"
                                  style={{ color: PAL.text3 }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#e0a1a0'; e.currentTarget.style.background = 'rgba(64, 4, 6, 0.3)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = PAL.text3; e.currentTarget.style.background = 'transparent'; }}
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
          <Pagination page={currentUserPage} pageSize={adminPageSize} totalItems={filteredUsers.length} onPageChange={setUserPage} />
        </div>
      )}
    </div>
  );
};