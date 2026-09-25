import {
  Complaint,
  PolicyDocument,
  RuleMatrixEntry,
  Pipeline1Output,
  Pipeline2Output,
  ComparisonResult,
  UrgencyLevel,
  PriorityLevel,
  EscalationTier,
} from '../types';

export function runPipeline2RuleValidation(
  complaint: {
    title: string;
    description: string;
    productService: string;
    orderReference: string;
    customerType: string;
    requestedResolution: string;
  },
  pipeline1Output: Pipeline1Output | undefined,
  policies: PolicyDocument[],
  ruleMatrix: RuleMatrixEntry[]
): Pipeline2Output {
  const fullText = `${complaint.title} ${complaint.description} ${complaint.requestedResolution}`.toLowerCase();
  
  // 1. Adversarial & Prompt Injection Scanner
  const adversarialFlags: Pipeline2Output['adversarialPromptFlags'] = [];
  const injectionPatterns = [
    { pattern: 'ignore all', desc: 'Instruction override directive' },
    { pattern: 'ignore previous', desc: 'Context override directive' },
    { pattern: 'system override', desc: 'System impersonation token' },
    { pattern: 'system notice', desc: 'System prompt injection header' },
    { pattern: 'override directives', desc: 'Rule evasion keyword' },
    { pattern: 'as authorized by', desc: 'Social engineering authority claim' },
    { pattern: 'bypass', desc: 'Security bypass request' },
    { pattern: 'admin privileges', desc: 'Privilege escalation payload' },
  ];

  for (const item of injectionPatterns) {
    if (fullText.includes(item.pattern)) {
      adversarialFlags.push({
        patternDetected: item.pattern,
        description: `Adversarial manipulation phrase detected: "${item.pattern}" (${item.desc})`,
        riskLevel: 'Critical',
      });
    }
  }

  // 2. Identify Expected Rule from Matrix
  let matchedRule: RuleMatrixEntry | undefined;
  let expectedCategory = 'Customer Support';
  let expectedSubcategory = 'General Inquiry';
  let expectedDepartment = 'Customer Support';
  let expectedUrgency: UrgencyLevel = 'Low';
  let expectedPriority: PriorityLevel = 'P4';
  let mandatoryEscalation = false;
  let mandatoryEscalationTier: EscalationTier = 'None';
  const matchedRules: string[] = [];
  const applicablePolicyDocs: string[] = [];

  // Check critical safety / thermal runaway
  const safetyKeywords = ['smoke', 'burning', 'swollen', 'fire', 'explosion', 'sparks', 'melted', 'chemical smell', 'overheating'];
  const hasSafety = safetyKeywords.some((kw) => fullText.includes(kw));

  // Check legal / litigation
  const legalKeywords = ['attorney', 'lawyer', 'lawsuit', 'sue', 'court', 'ftc', 'cfpb', 'litigation', 'counsel'];
  const hasLegal = legalKeywords.some((kw) => fullText.includes(kw));

  // Check billing / double charge / refund
  const billingKeywords = ['double charge', 'duplicate charge', 'charged twice', 'refund', 'overcharged', 'invoice'];
  const hasBilling = billingKeywords.some((kw) => fullText.includes(kw));

  // Check lost / delivery
  const deliveryKeywords = ['lost shipment', 'tracking', 'not delivered', 'courier', 'carrier', 'package lost'];
  const hasDelivery = deliveryKeywords.some((kw) => fullText.includes(kw));

  // Check account / security
  const securityKeywords = ['hacked', 'unauthorized access', 'takeover', '2fa', 'password reset', 'gdpr'];
  const hasSecurity = securityKeywords.some((kw) => fullText.includes(kw));

  if (hasSafety) {
    matchedRule = ruleMatrix.find((r) => r.id === 'RULE-SAF-01') || ruleMatrix.find((r) => r.department === 'Trust & Safety');
    expectedCategory = 'Hardware & Devices';
    expectedSubcategory = 'Battery Overheating / Fire Hazard';
    expectedDepartment = 'Trust & Safety';
    expectedUrgency = 'Critical';
    expectedPriority = 'P1';
    mandatoryEscalation = true;
    mandatoryEscalationTier = 'Critical Management Escalation';
    if (matchedRule) matchedRules.push(matchedRule.id);
    applicablePolicyDocs.push('POL-WAR-02');
  } else if (hasLegal) {
    matchedRule = ruleMatrix.find((r) => r.id === 'RULE-LEG-01') || ruleMatrix.find((r) => r.department === 'Legal & Compliance');
    expectedCategory = 'Legal & Compliance';
    expectedSubcategory = 'Litigation Threat';
    expectedDepartment = 'Legal & Compliance';
    expectedUrgency = 'Critical';
    expectedPriority = 'P1';
    mandatoryEscalation = true;
    mandatoryEscalationTier = 'Compliance Review';
    if (matchedRule) matchedRules.push(matchedRule.id);
    applicablePolicyDocs.push('POL-LEG-01');
  } else if (hasSecurity) {
    matchedRule = ruleMatrix.find((r) => r.id === 'RULE-SEC-01') || ruleMatrix.find((r) => r.department === 'Account Security');
    expectedCategory = 'Account & Security';
    expectedSubcategory = 'Account Takeover Suspicion';
    expectedDepartment = 'Account Security';
    expectedUrgency = 'High';
    expectedPriority = 'P1';
    mandatoryEscalation = true;
    mandatoryEscalationTier = 'Department Manager';
    if (matchedRule) matchedRules.push(matchedRule.id);
    applicablePolicyDocs.push('POL-SEC-01');
  } else if (hasBilling) {
    if (fullText.includes('double') || fullText.includes('twice')) {
      matchedRule = ruleMatrix.find((r) => r.id === 'RULE-BIL-01');
      expectedCategory = 'Billing & Payments';
      expectedSubcategory = 'Double Charge';
      expectedDepartment = 'Billing & Finance';
      expectedUrgency = 'Medium';
      expectedPriority = 'P2';
      applicablePolicyDocs.push('POL-BIL-03');
    } else {
      matchedRule = ruleMatrix.find((r) => r.id === 'RULE-RET-01') || ruleMatrix.find((r) => r.id === 'RULE-RET-02');
      expectedCategory = 'Billing & Payments';
      expectedSubcategory = 'Refund Delay';
      expectedDepartment = 'Billing & Finance';
      expectedUrgency = 'Medium';
      expectedPriority = 'P2';
      applicablePolicyDocs.push('POL-RET-01');
    }
    if (matchedRule) matchedRules.push(matchedRule.id);
  } else if (hasDelivery) {
    matchedRule = ruleMatrix.find((r) => r.id === 'RULE-DEL-01');
    expectedCategory = 'Delivery & Logistics';
    expectedSubcategory = 'Lost Shipment';
    expectedDepartment = 'Logistics & Fulfillment';
    expectedUrgency = 'Medium';
    expectedPriority = 'P2';
    if (matchedRule) matchedRules.push(matchedRule.id);
    applicablePolicyDocs.push('POL-DEL-04');
  } else {
    // Default fallback rule
    expectedCategory = 'Service & Support Quality';
    expectedSubcategory = 'General Inquiry';
    expectedDepartment = 'Customer Support';
    expectedUrgency = 'Low';
    expectedPriority = 'P3';
  }

  // Enterprise / VIP priority elevation rule
  if ((complaint.customerType === 'Premium VIP' || complaint.customerType === 'Enterprise') && expectedPriority !== 'P1') {
    if (expectedPriority === 'P2') expectedPriority = 'P1';
    else if (expectedPriority === 'P3') expectedPriority = 'P2';
  }

  // 3. Unsupported Promise & Hallucination Detector
  const unsupportedPromiseFlags: Pipeline2Output['unsupportedPromiseFlags'] = [];
  const hallucinationFlags: Pipeline2Output['hallucinationFlags'] = [];
  const mandatoryActionMissingFlags: string[] = [];

  if (pipeline1Output) {
    const aiResponseText = (pipeline1Output.draftedResponse + ' ' + pipeline1Output.internalAgentGuidance).toLowerCase();

    // Check if AI promised cash refund for past-policy orders
    if (fullText.includes('month') || fullText.includes('90 day') || fullText.includes('last year') || fullText.includes('11 month')) {
      if (aiResponseText.includes('refund has been authorized') || aiResponseText.includes('will send a 100% full refund')) {
        unsupportedPromiseFlags.push({
          claim: 'AI promised full cash refund for order past 30-day eligibility window',
          reason: 'Violates POL-RET-01 Sec 01 (Max 30 days for cash returns)',
          violatedRuleId: 'RULE-RET-02',
        });
      }
    }

    // Check if AI promised arbitrary large sums or wire transfers
    if (aiResponseText.includes('wire transfer') || (fullText.includes('$1,000') && aiResponseText.includes('approved $1,000'))) {
      unsupportedPromiseFlags.push({
        claim: 'AI approved unverified cash settlement / wire transfer claim',
        reason: 'No rule permits arbitrary customer payouts without Manager or Legal signoff',
        violatedRuleId: 'RULE-RET-01',
      });
    }

    // Check cited policy documents against active knowledge base
    for (const cited of pipeline1Output.citedPolicies || []) {
      const exists = policies.some((p) => p.id === cited.docId && p.status === 'Active');
      if (!exists) {
        hallucinationFlags.push({
          citedDocId: cited.docId,
          reason: `Policy document "${cited.docId}" does not exist in the active organizational knowledge base`,
        });
      }
    }

    // Mandatory safety check in AI response
    if (hasSafety && !aiResponseText.includes('disconnect') && !aiResponseText.includes('power') && !aiResponseText.includes('safe') && !aiResponseText.includes('unplug')) {
      mandatoryActionMissingFlags.push('Missing mandatory safety warning (cease use, disconnect power) in generated customer response');
    }
  }

  // Adversarial inject forces reviewer queue
  if (adversarialFlags.length > 0) {
    mandatoryActionMissingFlags.push('Reviewer verification mandatory due to detected adversarial prompt pattern');
  }

  return {
    expectedCategory,
    expectedSubcategory,
    expectedDepartment,
    expectedUrgency,
    expectedPriority,
    mandatoryEscalation,
    mandatoryEscalationTier,
    matchedRules,
    applicablePolicyDocs,
    policyEligibilityApproved: unsupportedPromiseFlags.length === 0,
    unsupportedPromiseFlags,
    hallucinationFlags,
    adversarialPromptFlags: adversarialFlags,
    mandatoryActionMissingFlags,
    validatedAt: new Date().toISOString(),
  };
}

export function runComparisonEngine(
  p1: Pipeline1Output | undefined,
  p2: Pipeline2Output,
  pyVal?: import('../types').PythonValidationResult
): ComparisonResult {
  if (!p1) {
    return {
      categoryMatch: false,
      departmentMatch: false,
      urgencyMatch: false,
      priorityMatch: false,
      escalationMatch: false,
      policyTraceabilityValid: false,
      promisesApproved: false,
      verificationScore: 0,
      verificationStatus: 'Manual Review',
      discrepancies: ['Pipeline 1 output missing or incomplete'],
    };
  }

  const discrepancies: string[] = [];
  let scorePoints = 0;
  const maxPoints = 100;

  // 1. Category match (20 pts)
  const categoryMatch = p1.category.toLowerCase().trim() === p2.expectedCategory.toLowerCase().trim() ||
    p1.category.toLowerCase().includes(p2.expectedCategory.toLowerCase()) ||
    p2.expectedCategory.toLowerCase().includes(p1.category.toLowerCase());
  if (categoryMatch) {
    scorePoints += 20;
  } else {
    discrepancies.push(`Category mismatch: GenAI suggested "${p1.category}", Rule Matrix requires "${p2.expectedCategory}"`);
  }

  // 2. Department match (25 pts)
  const departmentMatch = p1.recommendedDepartment.toLowerCase().trim() === p2.expectedDepartment.toLowerCase().trim();
  if (departmentMatch) {
    scorePoints += 25;
  } else {
    discrepancies.push(`Department routing mismatch: GenAI routed to "${p1.recommendedDepartment}", Rule Matrix requires "${p2.expectedDepartment}"`);
  }

  // 3. Urgency match (20 pts)
  const urgencyMatch = p1.urgency === p2.expectedUrgency;
  if (urgencyMatch) {
    scorePoints += 20;
  } else {
    discrepancies.push(`Urgency mismatch: GenAI assessed "${p1.urgency}", Rule Matrix requires "${p2.expectedUrgency}"`);
  }

  // 4. Priority match (10 pts)
  const priorityMatch = p1.priority === p2.expectedPriority;
  if (priorityMatch) {
    scorePoints += 10;
  } else {
    discrepancies.push(`Priority tier difference: GenAI set "${p1.priority}", Rule Matrix calculated "${p2.expectedPriority}"`);
  }

  // 5. Escalation agreement (15 pts)
  const escalationMatch = p1.escalationRequired === p2.mandatoryEscalation;
  if (escalationMatch) {
    scorePoints += 15;
  } else {
    discrepancies.push(`Escalation disagreement: GenAI escalation = ${p1.escalationRequired}, Rule Matrix mandatory escalation = ${p2.mandatoryEscalation}`);
  }

  // 6. Policy traceability & Hallucination check (10 pts)
  const policyTraceabilityValid = p2.hallucinationFlags.length === 0;
  if (policyTraceabilityValid) {
    scorePoints += 10;
  } else {
    discrepancies.push(`Policy hallucination detected: ${p2.hallucinationFlags.map((f) => f.citedDocId).join(', ')}`);
  }

  // Safety checks (Deductions)
  const promisesApproved = p2.unsupportedPromiseFlags.length === 0;
  if (!promisesApproved) {
    scorePoints = Math.max(0, scorePoints - 40);
    p2.unsupportedPromiseFlags.forEach((flag) => {
      discrepancies.push(`Unsupported Promise: ${flag.claim} (${flag.reason})`);
    });
  }

  if (p2.adversarialPromptFlags.length > 0) {
    scorePoints = Math.min(scorePoints, 35);
    p2.adversarialPromptFlags.forEach((adv) => {
      discrepancies.push(`Adversarial Threat Flag: ${adv.description}`);
    });
  }

  if (p2.mandatoryActionMissingFlags.length > 0) {
    p2.mandatoryActionMissingFlags.forEach((ma) => {
      discrepancies.push(`Missing Mandatory Action: ${ma}`);
    });
  }

  // Cross-check with Python Validator
  if (pyVal) {
    if (!pyVal.passed) {
      scorePoints = Math.min(scorePoints, pyVal.validationScore);
      pyVal.findings.forEach((finding) => {
        discrepancies.push(`[Python Crosscheck] ${finding.message}`);
      });
      pyVal.adversarialThreats.forEach((threat) => {
        discrepancies.push(`[Python Crosscheck] Adversarial threat: ${threat.description}`);
      });
    }
  }

  // Decision rule:
  // Verified ONLY if verification score >= 85 AND zero unsupported promises AND zero adversarial flags AND urgency matched for Critical AND Python crosscheck passed
  const isCritical = p2.expectedUrgency === 'Critical';
  const passesCriticalCheck = !isCritical || (urgencyMatch && departmentMatch && escalationMatch);
  const passesPythonCheck = !pyVal || pyVal.passed;

  const verificationStatus: 'Verified' | 'Manual Review' =
    scorePoints >= 85 && promisesApproved && p2.adversarialPromptFlags.length === 0 && passesCriticalCheck && passesPythonCheck
      ? 'Verified'
      : 'Manual Review';

  return {
    categoryMatch,
    departmentMatch,
    urgencyMatch,
    priorityMatch,
    escalationMatch,
    policyTraceabilityValid,
    promisesApproved,
    verificationScore: Math.round(scorePoints),
    verificationStatus,
    discrepancies,
  };
}
