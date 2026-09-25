import React, { useState, useEffect } from 'react';
import {
  Complaint,
  PolicyDocument,
  RuleMatrixEntry,
  PromptTemplate,
  SecurityTestCase,
  UserRole,
} from './types';
import { Navbar } from './components/Navbar';
import { CustomerPortal } from './components/CustomerPortal';
import { AgentDashboard } from './components/AgentDashboard';
import { ReviewerQueue } from './components/ReviewerQueue';
import { ManagerDashboard } from './components/ManagerDashboard';
import { AdminPortal } from './components/AdminPortal';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { DEPARTMENTS } from './data/initialData';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('Agent');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [ruleMatrix, setRuleMatrix] = useState<RuleMatrixEntry[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [testCases, setTestCases] = useState<SecurityTestCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Inspector modal state
  const [inspectComplaint, setInspectComplaint] = useState<Complaint | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDepartment, setCurrentDepartment] = useState('All');

  // Flash Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [compRes, polRes, ruleRes, promptRes, testRes] = await Promise.all([
        fetch('/api/complaints'),
        fetch('/api/knowledge-base'),
        fetch('/api/rule-matrix'),
        fetch('/api/prompt-templates'),
        fetch('/api/test-scenarios'),
      ]);

      if (compRes.ok) {
        const data = await compRes.json();
        setComplaints(data.complaints || []);
      }
      if (polRes.ok) {
        const data = await polRes.json();
        setPolicies(data.policies || []);
      }
      if (ruleRes.ok) {
        const data = await ruleRes.json();
        setRuleMatrix(data.ruleMatrix || []);
      }
      if (promptRes.ok) {
        const data = await promptRes.json();
        setPromptTemplates(data.promptTemplates || []);
      }
      if (testRes.ok) {
        const data = await testRes.json();
        setTestCases(data.testCases || []);
      }
    } catch (err) {
      console.error('Failed to load SupportNova data from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit New Complaint
  const handleSubmitComplaint = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit complaint');
      }

      const data = await res.json();
      setComplaints((prev) => [data.complaint, ...prev]);
      showNotification(
        'success',
        `Complaint ${data.complaint.id} received and processed through Dual-Pipeline!`
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Submission error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Message / Response
  const handleSendMessage = async (complaintId: string, text: string, nextStatus?: any) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: currentRole === 'Customer' ? 'Customer' : 'Agent',
          senderName: currentRole === 'Customer' ? 'Customer User' : 'Support Specialist',
          text,
          nextStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? data.complaint : c))
        );
        showNotification('success', 'Message sent and complaint updated.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      showNotification('error', 'Failed to dispatch message.');
    }
  };

  // Update Status
  const handleUpdateStatus = async (complaintId: string, status: any, dept?: string, agent?: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assignedDepartment: dept, assignedAgent: agent, actor: currentRole }),
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? data.complaint : c))
        );
        showNotification('success', `Complaint marked as ${status}.`);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  // Reviewer Decision
  const handleReviewDecision = async (complaintId: string, decisionData: any) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decisionData),
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? data.complaint : c))
        );
        showNotification(
          'success',
          `Review decision recorded: ${decisionData.decision} on ticket ${complaintId}`
        );
      }
    } catch (err) {
      console.error('Review decision error:', err);
      showNotification('error', 'Failed to record reviewer decision.');
    }
  };

  // Re-run Dual Pipeline
  const handleReAnalyze = async (complaintId: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/re-analyze`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? data.complaint : c))
        );
        showNotification('success', `Ticket ${complaintId} re-analyzed through Dual-Pipeline.`);
      }
    } catch (err) {
      console.error('Re-analyze failed:', err);
      showNotification('error', 'Failed to re-analyze ticket.');
    }
  };

  // Admin Knowledge Base Handlers
  const handleUploadDocument = async (uploadData: any) => {
    const res = await fetch('/api/knowledge-base/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadData),
    });
    if (res.ok) {
      const data = await res.json();
      // Refresh policies list to reflect new policy and any superseded versions
      const polRes = await fetch('/api/knowledge-base');
      if (polRes.ok) {
        const polData = await polRes.json();
        setPolicies(polData.policies);
      }
      showNotification('success', data.message || `Document parsed into ${data.chunkCount} traceable sections.`);
      return data;
    } else {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to upload document');
    }
  };

  const handleTogglePolicyStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/knowledge-base/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setPolicies((prev) => prev.map((p) => (p.id === id ? data.policy : p)));
        showNotification('success', `Policy status set to ${newStatus}.`);
      }
    } catch (err) {
      console.error('Toggle policy status error:', err);
      showNotification('error', 'Failed to update policy status.');
    }
  };

  const handleAddPolicy = async (policyData: any) => {
    const res = await fetch('/api/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policyData),
    });
    if (res.ok) {
      const data = await res.json();
      setPolicies((prev) => [...prev, data.policy]);
      showNotification('success', `Policy ${data.policy.id} added to Knowledge Base.`);
    }
  };

  const handleUpdatePolicy = async (id: string, policyData: any) => {
    const res = await fetch(`/api/knowledge-base/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policyData),
    });
    if (res.ok) {
      const data = await res.json();
      setPolicies((prev) => prev.map((p) => (p.id === id ? data.policy : p)));
      showNotification('success', `Policy ${id} updated.`);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    const res = await fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      showNotification('success', `Policy ${id} removed.`);
    }
  };

  // Admin Rule Matrix Handlers
  const handleAddRule = async (ruleData: any) => {
    const res = await fetch('/api/rule-matrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    if (res.ok) {
      const data = await res.json();
      setRuleMatrix((prev) => [...prev, data.rule]);
      showNotification('success', `Rule ${data.rule.id} added to Rule Matrix.`);
    }
  };

  const handleUpdateRule = async (id: string, ruleData: any) => {
    const res = await fetch(`/api/rule-matrix/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    if (res.ok) {
      const data = await res.json();
      setRuleMatrix((prev) => prev.map((r) => (r.id === id ? data.rule : r)));
      showNotification('success', `Rule ${id} updated.`);
    }
  };

  const handleDeleteRule = async (id: string) => {
    const res = await fetch(`/api/rule-matrix/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRuleMatrix((prev) => prev.filter((r) => r.id !== id));
      showNotification('success', `Rule ${id} deleted.`);
    }
  };

  // Admin Prompt Templates
  const handleUpdatePromptTemplate = async (id: string, templateData: any) => {
    const res = await fetch(`/api/prompt-templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    });
    if (res.ok) {
      const data = await res.json();
      setPromptTemplates((prev) =>
        prev.map((t) => (t.id === id ? data.promptTemplate : t))
      );
      showNotification('success', `Prompt template ${id} updated.`);
    }
  };

  // Security Test Case Run
  const handleRunTestCase = async (testCaseId: string) => {
    const res = await fetch('/api/test-scenarios/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testCaseId }),
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Test case run failed');
  };

  // Filter complaints by search query
  const searchedComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.productService.toLowerCase().includes(q) ||
      c.orderReference.toLowerCase().includes(q) ||
      (c.pipeline1Output?.category || '').toLowerCase().includes(q)
    );
  });

  const manualReviewCount = complaints.filter(
    (c) => c.comparisonResult?.verificationStatus === 'Manual Review'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl bg-slate-900 border border-slate-700 text-xs animate-in fade-in slide-in-from-bottom-2">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-slate-200 font-medium">{notification.message}</span>
        </div>
      )}

      {/* Main Navbar with Role Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        manualReviewCount={manualReviewCount}
        totalComplaints={complaints.length}
        onNewComplaintClick={() => setCurrentRole('Customer')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">
              Initializing SupportNova Intelligence Engine & Knowledge Base...
            </p>
          </div>
        ) : (
          <>
            {currentRole === 'Customer' && (
              <CustomerPortal
                complaints={searchedComplaints}
                onSubmitComplaint={handleSubmitComplaint}
                onSendMessage={(id, text) => handleSendMessage(id, text)}
                onSelectComplaint={(c) => setInspectComplaint(c)}
                isLoading={isSubmitting}
              />
            )}

            {currentRole === 'Agent' && (
              <AgentDashboard
                complaints={searchedComplaints}
                onSelectComplaint={(c) => setInspectComplaint(c)}
                onSendMessage={(id, text, nextSt) => handleSendMessage(id, text, nextSt)}
                onUpdateStatus={handleUpdateStatus}
                currentDepartment={currentDepartment}
                onDepartmentChange={setCurrentDepartment}
                departments={DEPARTMENTS}
              />
            )}

            {currentRole === 'Reviewer' && (
              <ReviewerQueue
                complaints={searchedComplaints}
                onSelectComplaint={(c) => setInspectComplaint(c)}
                onReviewDecision={handleReviewDecision}
                onReAnalyze={handleReAnalyze}
                departments={DEPARTMENTS}
              />
            )}

            {currentRole === 'Manager' && (
              <ManagerDashboard
                complaints={searchedComplaints}
                departments={DEPARTMENTS}
                onSelectComplaint={(c) => setInspectComplaint(c)}
              />
            )}

            {currentRole === 'Administrator' && (
              <AdminPortal
                policies={policies}
                ruleMatrix={ruleMatrix}
                promptTemplates={promptTemplates}
                testCases={testCases}
                onAddPolicy={handleAddPolicy}
                onUpdatePolicy={handleUpdatePolicy}
                onDeletePolicy={handleDeletePolicy}
                onUploadDocument={handleUploadDocument}
                onTogglePolicyStatus={handleTogglePolicyStatus}
                onAddRule={handleAddRule}
                onUpdateRule={handleUpdateRule}
                onDeleteRule={handleDeleteRule}
                onUpdatePromptTemplate={handleUpdatePromptTemplate}
                onRunTestCase={handleRunTestCase}
                departments={DEPARTMENTS}
              />
            )}
          </>
        )}
      </main>

      {/* Complaint Deep-Dive Dossier Modal */}
      {inspectComplaint && (
        <ComplaintDetailModal
          complaint={inspectComplaint}
          onClose={() => setInspectComplaint(null)}
          policies={policies}
        />
      )}
    </div>
  );
}
