import React, { useState, useEffect, useCallback } from 'react';
import type {
  Complaint,
  PolicyDocument,
  RuleMatrixEntry,
  PromptTemplate,
  SecurityTestCase,
  UserRole,
  UserProfile,
} from './types/index.ts';
import { Navbar } from './components/Navbar';
import { CustomerPortal } from './components/CustomerPortal';
import { AgentDashboard } from './components/AgentDashboard';
import { ReviewerQueue } from './components/ReviewerQueue';
import { ManagerDashboard } from './components/ManagerDashboard';
import { AdminPortal } from './components/AdminPortal';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { AccessDenied } from './components/AccessDenied';
import { AuthPage } from './components/AuthPage';
import { UserProfileModal } from './components/UserProfileModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { INITIAL_USERS, DEPARTMENTS } from './data/initialData';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function App() {
  // Session & Authentication State (Requirement 1, 2, 4: Strict RBAC Session)
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('supportnova_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('supportnova_auth_token') || null;
    } catch {
      return null;
    }
  });

  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Complaint & Knowledge Base State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [ruleMatrix, setRuleMatrix] = useState<RuleMatrixEntry[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [testCases, setTestCases] = useState<SecurityTestCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Inspector modal state
  const [inspectComplaint, setInspectComplaint] = useState<Complaint | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDepartment, setCurrentDepartment] = useState('All');

  // Flash Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    const timer = setTimeout(() => setNotification(null), 4500);
    return () => clearTimeout(timer);
  }, []);

  // Secure API fetch helper with automatic auth headers & role verification
  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers || {});
      if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }
      if (currentUser) {
        headers.set('x-user-role', currentUser.role);
        headers.set('x-user-email', currentUser.email);
        headers.set('x-user-id', currentUser.id);
      }
      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      try {
        const res = await fetch(url, { ...options, headers });
        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          showNotification(
            'error',
            errData.error || 'Access Denied (403): You do not have permission for this action.'
          );
          throw new Error(errData.error || 'Access Denied');
        }
        if (res.status === 401) {
          showNotification('error', 'Session expired. Please sign in again.');
          setCurrentUser(null);
          setAuthToken(null);
          localStorage.removeItem('supportnova_auth_user');
          localStorage.removeItem('supportnova_auth_token');
          throw new Error('Unauthorized');
        }
        return res;
      } catch (err: any) {
        if (!err.message?.includes('Access Denied') && !err.message?.includes('Unauthorized')) {
          showNotification('error', err.message || 'Network communication error.');
        }
        throw err;
      }
    },
    [authToken, currentUser, showNotification]
  );

  // Fetch data specifically scoped to authenticated user's role
  const fetchData = useCallback(
    async (activeUser?: UserProfile | null) => {
      const user = activeUser !== undefined ? activeUser : currentUser;
      if (!user) return;

      try {
        setIsLoading(true);
        const complaintsUrl =
          user.role === 'Customer'
            ? `/api/complaints?email=${encodeURIComponent(user.email)}`
            : '/api/complaints';

        const promises: Promise<Response | null>[] = [
          apiFetch(complaintsUrl),
          apiFetch('/api/knowledge-base'),
          apiFetch('/api/rule-matrix'),
        ];

        if (user.role === 'Administrator') {
          promises.push(apiFetch('/api/prompt-templates'));
          promises.push(apiFetch('/api/test-scenarios'));
          promises.push(apiFetch('/api/users').catch(() => null));
        }

        const [compRes, polRes, ruleRes, promptRes, testRes, userRes] = await Promise.all(promises);

        if (compRes && compRes.ok) {
          const data = await compRes.json();
          setComplaints(data.complaints || []);
        }
        if (polRes && polRes.ok) {
          const data = await polRes.json();
          setPolicies(data.policies || []);
        }
        if (ruleRes && ruleRes.ok) {
          const data = await ruleRes.json();
          setRuleMatrix(data.ruleMatrix || []);
        }
        if (promptRes && promptRes.ok) {
          const data = await promptRes.json();
          setPromptTemplates(data.promptTemplates || []);
        }
        if (testRes && testRes.ok) {
          const data = await testRes.json();
          setTestCases(data.testCases || []);
        }
        if (userRes && userRes.ok) {
          const data = await userRes.json();
          if (data.users && data.users.length > 0) {
            setUsers(data.users);
          }
        }
      } catch (err) {
        console.error('Failed to load SupportNova data from API:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [apiFetch, currentUser]
  );

  useEffect(() => {
    if (currentUser && authToken) {
      fetchData(currentUser);
    }
  }, [currentUser, authToken, fetchData]);

  // Login Success Handler (Requirement 1, 4, 5: Automatic Role Routing)
  const handleLoginSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('supportnova_auth_user', JSON.stringify(user));
    localStorage.setItem('supportnova_auth_token', token);
    showNotification('success', `Welcome back, ${user.name}! Accessing ${user.role} workspace.`);
    fetchData(user);
  };

  // Sign Out Handler (Requirement 20: Clean Logout)
  const handleSignOut = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
    localStorage.removeItem('supportnova_auth_user');
    localStorage.removeItem('supportnova_auth_token');
    setCurrentUser(null);
    setAuthToken(null);
    setComplaints([]);
    showNotification('success', 'You have been safely signed out.');
  };

  // Profile Update Handler
  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('supportnova_auth_user', JSON.stringify(data.user));
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? data.user : u)));
        showNotification('success', 'Profile updated successfully.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Profile update failed.');
    }
  };

  // Customer: Submit New Complaint
  const handleSubmitComplaint = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/complaints', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          customerName: currentUser?.name || formData.customerName,
          customerEmail: currentUser?.email || formData.customerEmail,
        }),
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

  // Agent/Customer: Send Message
  const handleSendMessage = async (complaintId: string, text: string, nextStatus?: any) => {
    try {
      const res = await apiFetch(`/api/complaints/${complaintId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          sender: currentUser?.role === 'Customer' ? 'Customer' : 'Agent',
          senderName: currentUser?.name || 'Support Specialist',
          text,
          nextStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? data.complaint : c))
        );
        showNotification('success', 'Message sent successfully.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      showNotification('error', 'Failed to dispatch message.');
    }
  };

  // Customer: Escalation Request
  const handleCustomerEscalate = async (complaintId: string, reason: string) => {
    try {
      const res = await apiFetch(`/api/complaints/${complaintId}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? data.complaint : c))
        );
        showNotification('success', 'Ticket escalated for priority supervisor review.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to escalate ticket.');
    }
  };

  // Customer: CSAT Feedback
  const handleCustomerFeedback = async (complaintId: string, rating: number, feedback: string) => {
    try {
      const res = await apiFetch(`/api/complaints/${complaintId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback }),
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? data.complaint : c))
        );
        showNotification('success', 'Thank you! Your CSAT review has been recorded.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to submit CSAT review.');
    }
  };

  // Agent: Update Status
  const handleUpdateStatus = async (complaintId: string, status: any, dept?: string, agent?: string) => {
    try {
      const res = await apiFetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          assignedDepartment: dept,
          assignedAgent: agent || currentUser?.name,
          actor: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Agent',
        }),
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

  // Reviewer: Decision (Approve / Reject / Modify / Override)
  const handleReviewDecision = async (complaintId: string, decisionData: any) => {
    try {
      const res = await apiFetch(`/api/complaints/${complaintId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          ...decisionData,
          reviewedBy: currentUser?.name || 'Reviewer Specialist',
        }),
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

  // Reviewer: Re-run Dual Pipeline
  const handleReAnalyze = async (complaintId: string) => {
    try {
      const res = await apiFetch(`/api/complaints/${complaintId}/re-analyze`, {
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

  // Administrator: Knowledge Base Handlers
  const handleUploadDocument = async (uploadData: any) => {
    const res = await apiFetch('/api/knowledge-base/upload', {
      method: 'POST',
      body: JSON.stringify(uploadData),
    });
    if (res.ok) {
      const data = await res.json();
      const polRes = await apiFetch('/api/knowledge-base');
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
      const res = await apiFetch(`/api/knowledge-base/${id}/status`, {
        method: 'PATCH',
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
    const res = await apiFetch('/api/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
    if (res.ok) {
      const data = await res.json();
      setPolicies((prev) => [...prev, data.policy]);
      showNotification('success', `Policy ${data.policy.id} added to Knowledge Base.`);
    }
  };

  const handleUpdatePolicy = async (id: string, policyData: any) => {
    const res = await apiFetch(`/api/knowledge-base/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    });
    if (res.ok) {
      const data = await res.json();
      setPolicies((prev) => prev.map((p) => (p.id === id ? data.policy : p)));
      showNotification('success', `Policy ${id} updated.`);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    const res = await apiFetch(`/api/knowledge-base/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      showNotification('success', `Policy ${id} removed.`);
    }
  };

  // Administrator: Rule Matrix Handlers
  const handleAddRule = async (ruleData: any) => {
    const res = await apiFetch('/api/rule-matrix', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
    if (res.ok) {
      const data = await res.json();
      setRuleMatrix((prev) => [...prev, data.rule]);
      showNotification('success', `Rule ${data.rule.id} added to Rule Matrix.`);
    }
  };

  const handleUpdateRule = async (id: string, ruleData: any) => {
    const res = await apiFetch(`/api/rule-matrix/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    });
    if (res.ok) {
      const data = await res.json();
      setRuleMatrix((prev) => prev.map((r) => (r.id === id ? data.rule : r)));
      showNotification('success', `Rule ${id} updated.`);
    }
  };

  const handleDeleteRule = async (id: string) => {
    const res = await apiFetch(`/api/rule-matrix/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRuleMatrix((prev) => prev.filter((r) => r.id !== id));
      showNotification('success', `Rule ${id} deleted.`);
    }
  };

  // Administrator: Prompt Templates
  const handleAddPromptTemplate = async (templateData: any) => {
    const res = await apiFetch('/api/prompt-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
    if (res.ok) {
      const data = await res.json();
      setPromptTemplates((prev) => [...prev, data.promptTemplate]);
      showNotification('success', `Prompt template '${data.promptTemplate.name}' created.`);
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create prompt template');
    }
  };

  const handleUpdatePromptTemplate = async (id: string, templateData: any) => {
    const res = await apiFetch(`/api/prompt-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
    if (res.ok) {
      const data = await res.json();
      setPromptTemplates((prev) =>
        prev.map((t) => (t.id === id ? data.promptTemplate : t))
      );
      showNotification('success', data.message || `Prompt template ${id} updated.`);
    }
  };

  const handleRollbackPrompt = async (id: string, targetVersion: string) => {
    const res = await apiFetch(`/api/prompt-templates/${id}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ targetVersion }),
    });
    if (res.ok) {
      const data = await res.json();
      setPromptTemplates((prev) =>
        prev.map((t) => (t.id === id ? data.promptTemplate : t))
      );
      showNotification('success', `Prompt template rolled back to v${targetVersion}.`);
    }
  };

  const handleRollbackPolicy = async (id: string, targetVersion: string) => {
    const res = await apiFetch(`/api/knowledge-base/${id}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ targetVersion }),
    });
    if (res.ok) {
      const data = await res.json();
      setPolicies((prev) => prev.map((p) => (p.id === id ? data.policy : p)));
      showNotification('success', `Policy document rolled back to v${targetVersion}.`);
    }
  };

  // Administrator: Security Test Cases
  const handleRunTestCase = async (testCaseId: string) => {
    const res = await apiFetch('/api/test-scenarios/run', {
      method: 'POST',
      body: JSON.stringify({ testCaseId }),
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Test case run failed');
  };

  // Administrator: User Management CRUD
  const handleAddUser = async (userData: any) => {
    const res = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => [...prev, data.user]);
      showNotification('success', `User ${data.user.name} created.`);
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (id: string, userData: any) => {
    const res = await apiFetch(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
      showNotification('success', `User ${data.user.name} updated.`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showNotification('success', 'User removed from system.');
    }
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

  // ---------------- RENDERING ----------------

  // 1. Unauthenticated View (Requirement 1, 2, 3, 4: Clean Login/Signup/Forgot flow)
  if (!currentUser || !authToken) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} users={users} />;
  }

  // 2. Authenticated View (Requirement 1, 6, 7, 8, 9, 10: Role-Specific View ONLY)
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white w-full overflow-x-hidden">
        {/* Flash Toast Notification */}
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-2xl bg-slate-900 border border-slate-700 text-xs animate-in fade-in slide-in-from-bottom-2 max-w-md">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="text-slate-200 font-medium leading-relaxed">{notification.message}</span>
          </div>
        )}

        {/* Role-Dedicated Navigation (Requirement 11, 12: No Role Leakage) */}
        <Navbar
          currentUser={currentUser}
          manualReviewCount={manualReviewCount}
          totalComplaints={complaints.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenProfileModal={() => setProfileModalOpen(true)}
          onSignOut={handleSignOut}
        />

        {/* Main Role-Specific Workspace Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">
                Loading {currentUser.role} Workspace Data...
              </p>
            </div>
          ) : (
            <>
              {/* Customer Experience (Requirement 6) */}
              {currentUser.role === 'Customer' && (
                <CustomerPortal
                  complaints={searchedComplaints}
                  onSubmitComplaint={handleSubmitComplaint}
                  onSendMessage={(id, text) => handleSendMessage(id, text)}
                  onSelectComplaint={(c) => setInspectComplaint(c)}
                  isLoading={isSubmitting}
                  currentUser={currentUser}
                  policies={policies}
                  onEscalateComplaint={handleCustomerEscalate}
                  onSubmitFeedback={handleCustomerFeedback}
                />
              )}

              {/* Agent Experience (Requirement 7) */}
              {currentUser.role === 'Agent' && (
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

              {/* Reviewer Experience (Requirement 8) */}
              {currentUser.role === 'Reviewer' && (
                <ReviewerQueue
                  complaints={searchedComplaints}
                  onSelectComplaint={(c) => setInspectComplaint(c)}
                  onReviewDecision={handleReviewDecision}
                  onReAnalyze={handleReAnalyze}
                  departments={DEPARTMENTS}
                />
              )}

              {/* Manager Experience (Requirement 9) */}
              {currentUser.role === 'Manager' && (
                <ManagerDashboard
                  complaints={searchedComplaints}
                  departments={DEPARTMENTS}
                  onSelectComplaint={(c) => setInspectComplaint(c)}
                />
              )}

              {/* Administrator Experience (Requirement 10) */}
              {currentUser.role === 'Administrator' && (
                <AdminPortal
                  policies={policies}
                  ruleMatrix={ruleMatrix}
                  promptTemplates={promptTemplates}
                  testCases={testCases}
                  users={users}
                  onAddPolicy={handleAddPolicy}
                  onUpdatePolicy={handleUpdatePolicy}
                  onDeletePolicy={handleDeletePolicy}
                  onUploadDocument={handleUploadDocument}
                  onTogglePolicyStatus={handleTogglePolicyStatus}
                  onAddRule={handleAddRule}
                  onUpdateRule={handleUpdateRule}
                  onDeleteRule={handleDeleteRule}
                  onUpdatePromptTemplate={handleUpdatePromptTemplate}
                  onAddPromptTemplate={handleAddPromptTemplate}
                  onRollbackPrompt={handleRollbackPrompt}
                  onRollbackPolicy={handleRollbackPolicy}
                  onRunTestCase={handleRunTestCase}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
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

        {/* User Profile & Active Session Modal */}
        {profileModalOpen && (
          <UserProfileModal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            currentUser={currentUser}
            authToken={authToken}
            onUpdateProfile={handleUpdateProfile}
            onSignOut={handleSignOut}
            onSwitchPersona={() => {
              setProfileModalOpen(false);
              handleSignOut();
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
