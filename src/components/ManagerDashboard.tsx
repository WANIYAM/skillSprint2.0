import React, { useState } from 'react';
import type { Complaint } from '../types/index.ts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Users,
  Building,
  ShieldCheck,
  ChevronRight,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';

interface ManagerDashboardProps {
  complaints: Complaint[];
  departments: string[];
  onSelectComplaint: (complaint: Complaint) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  complaints,
  departments,
  onSelectComplaint,
}) => {
  const [selectedDept, setSelectedDept] = useState('All');

  const filtered = selectedDept === 'All'
    ? complaints
    : complaints.filter((c) => c.assignedDepartment === selectedDept);

  const total = filtered.length;
  const verified = filtered.filter((c) => c.comparisonResult?.verificationStatus === 'Verified').length;
  const manualReview = filtered.filter((c) => c.comparisonResult?.verificationStatus === 'Manual Review').length;
  const autoVerificationRate = total > 0 ? Math.round((verified / total) * 100) : 100;

  const resolved = filtered.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const escalated = filtered.filter((c) => c.status === 'Escalated').length;
  const slaBreached = filtered.filter((c) => c.slaRiskStatus === 'Breached').length;
  const slaApproaching = filtered.filter((c) => c.slaRiskStatus === 'Approaching').length;
  const slaComplianceRate = total > 0 ? Math.round(((total - slaBreached) / total) * 100) : 100;

  // Department distribution
  const deptCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    deptCounts[c.assignedDepartment] = (deptCounts[c.assignedDepartment] || 0) + 1;
  });

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    const cat = c.pipeline1Output?.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Customer',
      'Type',
      'Department',
      'Category',
      'Urgency',
      'Priority',
      'Status',
      'VerificationStatus',
      'VerificationScore',
      'SLARisk',
      'SubmittedAt',
    ];

    const rows = filtered.map((c) => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.customerName}"`,
      c.customerType,
      `"${c.assignedDepartment}"`,
      `"${c.pipeline1Output?.category || ''}"`,
      c.pipeline1Output?.urgency || 'Low',
      c.pipeline1Output?.priority || 'P3',
      c.status,
      c.comparisonResult?.verificationStatus || 'N/A',
      c.comparisonResult?.verificationScore || 0,
      c.slaRiskStatus,
      c.submittedAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `supportnova_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Operations & Executive Governance
              </span>
              <span className="text-xs text-slate-400">
                SLA Compliance & AI Alignment Metrics
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Manager Intelligence Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time monitoring of complaint volume, SLA adherence, escalation trends, and Pipeline 1 vs 2 alignment.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Volume</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">{total}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Scope: {selectedDept}</span>
            <span className="text-emerald-400 font-semibold">{resolved} Resolved</span>
          </div>
        </div>

        {/* Auto-Verification Rate */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pipeline Alignment Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {autoVerificationRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-emerald-400">{verified} Verified</span>
            <span className="text-amber-400 font-semibold">{manualReview} In Review</span>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">SLA Compliance</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {slaComplianceRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className={slaBreached > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
              {slaBreached} Breached
            </span>
            <span className="text-amber-400">{slaApproaching} Approaching</span>
          </div>
        </div>

        {/* Escalated Rate */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Escalated Tickets</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">{escalated}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-slate-400">Critical & P1 Tiers</span>
            <span className="text-rose-400 font-semibold">
              {total > 0 ? Math.round((escalated / total) * 100) : 0}% of total
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Building className="w-4 h-4 text-blue-400" />
            <span>Complaint Volume by Department</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(deptCounts).map(([dept, count]) => {
              const pct = complaints.length > 0 ? Math.round((count / complaints.length) * 100) : 0;
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{dept}</span>
                    <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Issue Category Distribution</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = complaints.length > 0 ? Math.round((count / complaints.length) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{cat}</span>
                    <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SLA Risk Board */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>At-Risk & Critical Escalation Board</span>
          </h3>
          <span className="text-xs text-slate-400">
            Cases nearing deadline or requiring intervention
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Ticket ID</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Urgency / Pri</th>
                <th className="py-2.5 px-3">SLA Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-400">
                    {c.id}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-200 max-w-xs truncate">
                    {c.title}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {c.assignedDepartment}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-slate-300">
                      {c.pipeline1Output?.urgency} / {c.pipeline1Output?.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.slaRiskStatus === 'Breached'
                          ? 'bg-rose-500/20 text-rose-400'
                          : c.slaRiskStatus === 'Approaching'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {c.slaRiskStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectComplaint(c)}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
