export type UserRole = 'Customer' | 'Agent' | 'Reviewer' | 'Manager' | 'Administrator';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  title?: string;
  phone?: string;
  company?: string;
  status?: 'Active' | 'Inactive' | 'Suspended';
  joinedDate?: string;
}

export interface RolePermissions {
  canSubmitComplaint: boolean;
  canViewAllComplaints: boolean;
  canTriageAndRespond: boolean;
  canReviewAndOverride: boolean;
  canViewAnalytics: boolean;
  canManagePolicies: boolean;
  canManageRuleMatrix: boolean;
  canManagePromptTemplates: boolean;
  canRunSecurityTests: boolean;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  permissions: RolePermissions;
  expiresAt: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

export type ComplaintStatus =
  | 'New'
  | 'Analyzed'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Customer'
  | 'Escalated'
  | 'Resolved'
  | 'Closed'
  | 'Reopened';

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';
export type SentimentType = 'Frustrated' | 'Angry' | 'Neutral' | 'Polite / Patient' | 'Anxious';

export type EscalationTier =
  | 'None'
  | 'Supervisor Review'
  | 'Department Manager'
  | 'Specialist Team'
  | 'Compliance Review'
  | 'Critical Management Escalation';

export type DocumentProcessingStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'VALID'
  | 'PARSING'
  | 'PARSED'
  | 'INVALID';

export interface PolicyDocument {
  id: string; // e.g. POL-RET-01
  title: string;
  category: string;
  version: string;
  status: 'Active' | 'Superseded' | 'Draft';
  processingStatus?: DocumentProcessingStatus;
  effectiveDate: string;
  expiryDate?: string;
  summary: string;
  filename?: string;
  fileType?: string;
  fileSize?: number;
  checksum?: string;
  uploadedBy?: string;
  sections: PolicySection[];
  validationDetails?: {
    isValid: boolean;
    checkedAt: string;
    errors: string[];
    warnings: string[];
  };
  versionHistory?: Array<{
    version: string;
    status: 'Active' | 'Superseded' | 'Draft';
    effectiveDate: string;
    summary: string;
    changedBy?: string;
    updatedAt: string;
  }>;
}

export interface PolicySection {
  id: string; // e.g. SEC-01
  heading: string;
  content: string;
  wordCount?: number;
  charCount?: number;
  tokenEstimate?: number;
  checksum?: string;
  mandatoryConditions?: string[];
  prohibitions?: string[];
  maxRefundDays?: number;
  maxCompensationAmount?: number;
}

export interface RuleMatrixEntry {
  id: string; // e.g. RULE-RET-01
  category: string;
  subcategory: string;
  department: string;
  urgency: UrgencyLevel;
  priority: PriorityLevel;
  triggerConditions: string;
  mandatoryEscalation: boolean;
  escalationTier: EscalationTier;
  requiredActions: string[];
  prohibitedActions: string[];
  maxCompensationAllowed?: number;
  slaHours: number;
  referencePolicyId: string;
  referenceSectionId: string;
}

export type ResponseTone = 'Professional' | 'Empathetic' | 'Concise' | 'Formal' | 'Apologetic' | 'Informative';

export interface Pipeline1Output {
  primaryIssue: string;
  secondaryIssues: string[];
  category: string;
  subcategory: string;
  sentiment: SentimentType;
  urgency: UrgencyLevel;
  priority: PriorityLevel;
  entities: {
    orderId?: string;
    amount?: string;
    date?: string;
    deviceModel?: string;
    serialNumber?: string;
    customerEmail?: string;
    trackingNumber?: string;
  };
  summary?: string;
  recommendedDepartment: string;
  secondaryDepartments?: string[];
  citedPolicies: Array<{
    docId: string;
    sectionId: string;
    citationText: string;
    relevance: string;
  }>;
  resolutionSteps: string[];
  escalationRequired: boolean;
  escalationTier?: EscalationTier;
  escalationReason?: string;
  draftedResponse: string;
  responseTone?: ResponseTone;
  followUpRequired?: boolean;
  followUpReason?: string;
  followUpCommunication: string;
  internalAgentGuidance: string;
  clarificationQuestions?: string[];
  adversarialAnalysis?: {
    isAdversarial: boolean;
    threatType: string;
    threatDetails: string;
    recommendedAction: string;
  };
  rawJson?: string;
  modelUsed?: string | null;
  modelRequested?: string;
  pipelineStatus?: 'COMPLETED' | 'GENAI_UNAVAILABLE' | 'OFFLINE_DEMO_MODE_NOT_GENAI';
  errorCode?: string;
  error?: string;
  attempts?: number;
  isSimulatedOutput?: boolean;
  promptTemplateId?: string;
  promptVersion?: string;
  generatedAt?: string;
}

export interface Pipeline1Failure extends Partial<Pipeline1Output> {
  pipelineStatus: 'GENAI_UNAVAILABLE';
  errorCode: string;
  error: string;
  attempts: number;
  modelUsed: null;
  modelRequested: string;
}

export interface Pipeline2Output {
  expectedCategory: string;
  expectedSubcategory: string;
  expectedDepartment: string;
  expectedUrgency: UrgencyLevel;
  expectedPriority: PriorityLevel;
  mandatoryEscalation: boolean;
  mandatoryEscalationTier: EscalationTier;
  matchedRules: string[]; // Rule IDs
  applicablePolicyDocs: string[]; // Doc IDs
  policyEligibilityApproved: boolean;
  unsupportedPromiseFlags: Array<{
    claim: string;
    reason: string;
    violatedRuleId: string;
  }>;
  hallucinationFlags: Array<{
    citedDocId: string;
    reason: string;
  }>;
  adversarialPromptFlags: Array<{
    patternDetected: string;
    description: string;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  }>;
  mandatoryActionMissingFlags: string[];
  validatedAt: string;
}

export interface PythonValidationFinding {
  type: string;
  severity: 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

export interface PythonValidationResult {
  engine: string;
  status: 'Validated' | 'Crosscheck Flagged' | 'Execution Error';
  validationScore: number;
  passed: boolean;
  adversarialThreats: Array<{
    pattern: string;
    description: string;
    severity: string;
  }>;
  findings: PythonValidationFinding[];
  timestamp: string;
}

export interface ComparisonResult {
  categoryMatch: boolean;
  departmentMatch: boolean;
  urgencyMatch: boolean;
  priorityMatch: boolean;
  escalationMatch: boolean;
  policyTraceabilityValid: boolean;
  promisesApproved: boolean;
  verificationScore: number; // 0-100
  verificationStatus: 'Verified' | 'Manual Review';
  discrepancies: string[];
}

export interface ReviewerDecision {
  reviewedBy: string;
  reviewedAt: string;
  decision: 'Approved' | 'Modified' | 'Rejected' | 'Reclassified' | 'Reassigned' | 'Escalated';
  overriddenDepartment?: string;
  overriddenCategory?: string;
  overriddenUrgency?: UrgencyLevel;
  overriddenPriority?: PriorityLevel;
  overriddenResponse?: string;
  notes: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface ComplaintMessage {
  id: string;
  sender: 'Customer' | 'Agent' | 'System' | 'Reviewer';
  senderName: string;
  timestamp: string;
  text: string;
  isInternalNote?: boolean;
}

export interface MissingInformationResult {
  hasMissingInfo: boolean;
  missingFields: string[];
  clarificationPrompt?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  identifiedAt: string;
}

export interface Complaint {
  id: string; // CMP-2026-XXXX
  title: string;
  description: string;
  rawDescription?: string;
  customerType: 'Standard' | 'Premium VIP' | 'Enterprise' | 'Small Business';
  productService: string;
  orderReference: string;
  channel: 'Web Portal' | 'Email' | 'Chat' | 'Support Upload';
  submittedAt: string;
  customerEmail: string;
  customerName: string;
  status: ComplaintStatus;
  validationStatus?: 'VALID' | 'REJECTED' | 'NEEDS_CORRECTION';
  previousComplaintId?: string;
  previousComplaintIds?: string[];
  isRepeat: boolean;
  repeatCount?: number;
  isDuplicate?: boolean;
  duplicateComplaintId?: string;
  duplicateSimilarity?: number;
  missingInformation?: MissingInformationResult;
  requestedResolution: string;
  assignedDepartment: string;
  assignedAgent?: string;
  slaDeadline: string;
  slaHours: number;
  slaRiskStatus: 'Safe' | 'Approaching' | 'Breached';
  pipeline1Output?: Pipeline1Output | Pipeline1Failure | null;
  pipeline2Output?: Pipeline2Output | null;
  pythonValidation?: PythonValidationResult | null;
  comparisonResult?: ComparisonResult | null;
  reviewerDecision?: ReviewerDecision;
  auditTrail: AuditLogEntry[];
  messages: ComplaintMessage[];
  attachmentName?: string;
  csatRating?: number;
  csatFeedback?: string;
  csatSubmittedAt?: string;
}

export interface PromptVersion {
  version: string;
  systemPrompt: string;
  temperature: number;
  updatedAt: string;
  changelog: string;
  author?: string;
  model?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  purpose: string;
  operation: 'Classification' | 'Response Generation' | 'Duplicate Analysis' | 'Missing Information' | 'Policy Validation';
  version: string;
  model: string;
  systemPrompt: string;
  userPromptTemplate?: string;
  variables: string[];
  temperature: number;
  status: 'Active' | 'Archived';
  lastUpdated: string;
  author?: string;
  history?: PromptVersion[];
}

export interface SecurityTestCase {
  id: string;
  name: string;
  category: 'Prompt Injection' | 'Sentiment-Urgency Trap' | 'Unsupported Promise' | 'Policy Contradiction' | 'Missing Information';
  description: string;
  sampleComplaint: {
    title: string;
    description: string;
    productService: string;
    orderReference: string;
    customerType: 'Standard' | 'Premium VIP' | 'Enterprise';
    requestedResolution: string;
  };
  expectedDefense: string;
}
