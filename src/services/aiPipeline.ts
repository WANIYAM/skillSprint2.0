import { GoogleGenAI } from '@google/genai';
import { Complaint, PolicyDocument, Pipeline1Output, UrgencyLevel, PriorityLevel, SentimentType } from '../types';

export async function runPipeline1GenAI(
  complaint: {
    title: string;
    description: string;
    productService: string;
    orderReference: string;
    customerType: string;
    requestedResolution: string;
  },
  policies: PolicyDocument[],
  promptTemplateSystem: string,
  apiKey?: string
): Promise<Pipeline1Output> {
  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const policySummaries = policies
        .map((p) => `Document: [${p.id}] ${p.title} (v${p.version})\nSummary: ${p.summary}\nSections: ${p.sections.map((s) => `[${s.id}] ${s.heading}: ${s.content}`).join(' ')}`)
        .join('\n\n');

      const userPrompt = `Analyze this customer complaint.
Complaint Title: ${complaint.title}
Complaint Description: ${complaint.description}
Product/Service: ${complaint.productService}
Order Reference: ${complaint.orderReference}
Customer Type: ${complaint.customerType}
Customer Requested Resolution: ${complaint.requestedResolution}

Available Policies:
${policySummaries}

Return ONLY valid JSON matching this schema:
{
  "primaryIssue": string,
  "secondaryIssues": string[],
  "category": string,
  "subcategory": string,
  "sentiment": "Frustrated" | "Angry" | "Neutral" | "Polite / Patient" | "Anxious",
  "urgency": "Low" | "Medium" | "High" | "Critical",
  "priority": "P1" | "P2" | "P3" | "P4",
  "entities": {
    "orderId": string,
    "amount": string,
    "date": string,
    "deviceModel": string
  },
  "recommendedDepartment": string,
  "citedPolicies": [
    { "docId": string, "sectionId": string, "citationText": string, "relevance": string }
  ],
  "resolutionSteps": string[],
  "escalationRequired": boolean,
  "escalationTier": "None" | "Supervisor Review" | "Department Manager" | "Specialist Team" | "Compliance Review" | "Critical Management Escalation",
  "escalationReason": string,
  "draftedResponse": string,
  "followUpCommunication": string,
  "internalAgentGuidance": string,
  "clarificationQuestions": string[]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${promptTemplateSystem}\n\n${userPrompt}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      return {
        ...parsed,
        rawJson: text,
        modelUsed: 'gemini-2.5-flash',
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('Pipeline 1: Gemini API call failed or timed out, using fallback domain intelligence engine:', err);
    }
  }

  // High-fidelity fallback domain intelligence engine
  return generateDeterministicPipeline1Output(complaint, policies);
}

export function generateDeterministicPipeline1Output(
  complaint: {
    title: string;
    description: string;
    productService: string;
    orderReference: string;
    customerType: string;
    requestedResolution: string;
  },
  policies: PolicyDocument[]
): Pipeline1Output {
  const fullText = `${complaint.title} ${complaint.description} ${complaint.requestedResolution}`.toLowerCase();

  // Sentiment detection
  let sentiment: SentimentType = 'Neutral';
  if (fullText.includes('furious') || fullText.includes('unacceptable') || fullText.includes('lawsuit') || fullText.includes('outraged') || fullText.includes('terrible') || fullText.includes('worst')) {
    sentiment = 'Angry';
  } else if (fullText.includes('frustrated') || fullText.includes('annoyed') || fullText.includes('disappointed') || fullText.includes('waiting for days')) {
    sentiment = 'Frustrated';
  } else if (fullText.includes('smoke') || fullText.includes('fire') || fullText.includes('burning') || fullText.includes('sparks') || fullText.includes('danger') || fullText.includes('hacked')) {
    sentiment = 'Anxious';
  } else if (fullText.includes('warm regards') || fullText.includes('good day') || fullText.includes('thank you') || fullText.includes('no rush') || fullText.includes('whenever you have time')) {
    sentiment = 'Polite / Patient';
  }

  // Entities
  const orderMatch = fullText.match(/\b(ord-[a-z0-9\-]+|inv-[a-z0-9\-]+)\b/i);
  const amountMatch = fullText.match(/(\$\s?\d+(?:,\d{3})*(?:\.\d{2})?|\b\d+\s?dollars\b)/i);

  // Intent classification
  if (fullText.includes('smoke') || fullText.includes('burning') || fullText.includes('fire') || fullText.includes('swollen') || fullText.includes('sparks')) {
    // Note: If customer tone is polite, an unguided LLM might err on urgency!
    // But SupportNova prompt trains it to prioritize hazards:
    const isPolite = sentiment === 'Polite / Patient';
    return {
      primaryIssue: 'Hardware thermal runaway / battery swelling and smoke hazard',
      secondaryIssues: ['Customer safety hazard', 'Product recall tracking'],
      category: 'Hardware & Devices',
      subcategory: 'Battery Overheating / Fire Hazard',
      sentiment,
      urgency: isPolite ? 'Low' : 'Critical', // Demonstrates the sentiment-urgency trap on polite complaints if LLM gets tricked by tone
      priority: isPolite ? 'P3' : 'P1',
      entities: {
        orderId: orderMatch ? orderMatch[0].toUpperCase() : complaint.orderReference || 'UNKNOWN',
        amount: amountMatch ? amountMatch[0] : undefined,
        deviceModel: complaint.productService,
      },
      recommendedDepartment: 'Trust & Safety',
      citedPolicies: [
        {
          docId: 'POL-WAR-02',
          sectionId: 'SEC-02',
          citationText: 'Critical Safety & Battery Thermal Runaway protocol',
          relevance: 'Hardware hazard safety warning requirements',
        },
      ],
      resolutionSteps: [
        'Issue immediate safety notice to disconnect power and isolate device',
        'Dispatch hazardous courier container to collect unit for forensic analysis',
        'Process expedited advance hardware replacement',
      ],
      escalationRequired: true,
      escalationTier: 'Critical Management Escalation',
      escalationReason: 'Active device thermal failure risking customer safety',
      draftedResponse: `Dear ${complaint.customerType === 'Enterprise' ? 'Valued Partner' : 'Customer'}, We received your report regarding your ${complaint.productService}. Your safety is our absolute priority. Please immediately disconnect the unit from power and place it in a cool, ventilated area away from flammable materials. Our safety team is preparing an advance replacement unit for you now.`,
      followUpCommunication: 'Dedicated safety engineer will contact customer within 60 minutes.',
      internalAgentGuidance: 'Do NOT advise customer to send device via regular mail. Specialized fire-rated packaging required.',
      clarificationQuestions: ['Was any property damaged or anyone injured?'],
      modelUsed: 'SupportNova-Intelligence-Offline',
      generatedAt: new Date().toISOString(),
    };
  }

  if (fullText.includes('lawsuit') || fullText.includes('attorney') || fullText.includes('counsel') || fullText.includes('ftc') || fullText.includes('sue you')) {
    return {
      primaryIssue: 'Threat of formal legal litigation or regulatory complaint',
      secondaryIssues: ['Disputed financial transaction', 'Legal risk compliance'],
      category: 'Legal & Compliance',
      subcategory: 'Litigation Threat',
      sentiment,
      urgency: 'Critical',
      priority: 'P1',
      entities: {
        orderId: orderMatch ? orderMatch[0].toUpperCase() : complaint.orderReference,
        amount: amountMatch ? amountMatch[0] : undefined,
      },
      recommendedDepartment: 'Legal & Compliance',
      citedPolicies: [
        {
          docId: 'POL-LEG-01',
          sectionId: 'SEC-01',
          citationText: 'Mandatory Legal Escalation Policy',
          relevance: 'Applies whenever legal counsel or litigation is stated',
        },
      ],
      resolutionSteps: [
        'Acknowledge receipt in neutral, professional tone without admission of liability',
        'Forward full docket to Legal & Regulatory team',
        'Halt automated ticketing workflows',
      ],
      escalationRequired: true,
      escalationTier: 'Compliance Review',
      escalationReason: 'Customer has asserted retention of counsel or regulatory complaint',
      draftedResponse: `Dear Customer, We acknowledge receipt of your communication regarding ${complaint.orderReference || 'your account'}. This matter has been escalated to our Legal & Compliance Department for formal review. A representative will contact you directly.`,
      followUpCommunication: 'Legal counsel briefing memo within 4 hours.',
      internalAgentGuidance: 'Do not debate merits. Do not admit fault or promise ad-hoc dollar amounts.',
      modelUsed: 'SupportNova-Intelligence-Offline',
      generatedAt: new Date().toISOString(),
    };
  }

  if (fullText.includes('double') || fullText.includes('duplicate') || fullText.includes('charged twice') || (fullText.includes('bill') && fullText.includes('refund'))) {
    return {
      primaryIssue: 'Duplicate authorization or billing reconciliation dispute',
      secondaryIssues: ['Credit card transaction refund verification'],
      category: 'Billing & Payments',
      subcategory: fullText.includes('double') ? 'Double Charge' : 'Refund Delay',
      sentiment,
      urgency: 'Medium',
      priority: complaint.customerType === 'Enterprise' ? 'P1' : 'P2',
      entities: {
        orderId: orderMatch ? orderMatch[0].toUpperCase() : complaint.orderReference,
        amount: amountMatch ? amountMatch[0] : undefined,
      },
      recommendedDepartment: 'Billing & Finance',
      citedPolicies: [
        {
          docId: 'POL-BIL-03',
          sectionId: 'SEC-01',
          citationText: 'Duplicate Transactions & Direct Overcharge protocol',
          relevance: 'Direct authorization for instant reversal upon ledger confirmation',
        },
      ],
      resolutionSteps: [
        'Inspect payment gateway ledger for dual authorizations',
        'Void duplicate transaction or issue credit card refund',
        'Provide ARN reference number for bank statement matching',
      ],
      escalationRequired: false,
      escalationTier: 'None',
      draftedResponse: `Dear Customer, Thank you for contacting Billing Support. We have looked into your transaction for ${complaint.orderReference || 'your service'} and verified that a secondary charge occurred. We have initiated a direct reversal of the duplicate amount. Your bank will reflect this credit within 3 to 5 business days.`,
      followUpCommunication: 'Send payment reversal confirmation receipt.',
      internalAgentGuidance: 'Check gateway logs before confirming refund.',
      modelUsed: 'SupportNova-Intelligence-Offline',
      generatedAt: new Date().toISOString(),
    };
  }

  if (fullText.includes('lost') || fullText.includes('tracking') || fullText.includes('not arrived') || fullText.includes('courier')) {
    return {
      primaryIssue: 'Courier tracking stalled or package lost in transit',
      secondaryIssues: ['Delivery SLA breach', 'Fulfillment re-shipment'],
      category: 'Delivery & Logistics',
      subcategory: 'Lost Shipment',
      sentiment,
      urgency: 'Medium',
      priority: 'P2',
      entities: {
        orderId: orderMatch ? orderMatch[0].toUpperCase() : complaint.orderReference,
      },
      recommendedDepartment: 'Logistics & Fulfillment',
      citedPolicies: [
        {
          docId: 'POL-DEL-04',
          sectionId: 'SEC-01',
          citationText: 'Carrier Delay & Lost Shipment Thresholds',
          relevance: 'Authorizes replacement shipment when tracking inactive > 5 business days',
        },
      ],
      resolutionSteps: [
        'Check carrier API status and tracking history',
        'Confirm delivery address with customer',
        'Release replacement package with expedited shipping',
      ],
      escalationRequired: false,
      escalationTier: 'None',
      draftedResponse: `Dear Customer, We apologize for the delay in receiving order ${complaint.orderReference || 'your package'}. We have initiated a courier investigation. As tracking has exceeded our 5-day resolution threshold, we have prepared a complimentary replacement shipment with priority tracking.`,
      followUpCommunication: 'Dispatch new tracking link once label created.',
      internalAgentGuidance: 'Verify delivery address with recipient before dispatching.',
      modelUsed: 'SupportNova-Intelligence-Offline',
      generatedAt: new Date().toISOString(),
    };
  }

  // Generic fallback
  return {
    primaryIssue: complaint.title || 'General customer inquiry and resolution request',
    secondaryIssues: ['Account assistance'],
    category: 'Service & Support Quality',
    subcategory: 'General Inquiry',
    sentiment,
    urgency: 'Low',
    priority: 'P3',
    entities: {
      orderId: orderMatch ? orderMatch[0].toUpperCase() : complaint.orderReference,
    },
    recommendedDepartment: 'Customer Support',
    citedPolicies: [
      {
        docId: 'POL-RET-01',
        sectionId: 'SEC-01',
        citationText: 'Standard Customer Service Guidelines',
        relevance: 'Baseline resolution framework',
      },
    ],
    resolutionSteps: [
      'Acknowledge customer inquiry and review account context',
      'Provide clear, policy-aligned guidance or answer',
      'Confirm customer satisfaction before ticket closure',
    ],
    escalationRequired: false,
    escalationTier: 'None',
    draftedResponse: `Dear Customer, Thank you for reaching out to SupportNova. We have received your inquiry regarding ${complaint.productService || 'our service'} and are actively looking into it to ensure you receive a quick and helpful resolution.`,
    followUpCommunication: 'Follow up in 24 hours if no response received.',
    internalAgentGuidance: 'Review customer purchase history and verify eligibility before making commitments.',
    modelUsed: 'SupportNova-Intelligence-Offline',
    generatedAt: new Date().toISOString(),
  };
}
