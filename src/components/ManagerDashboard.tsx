import React, { useState } from 'react';
import type { Complaint } from '../types/index.ts';
import { Pagination } from './Pagination';
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
  const [tablePage, setTablePage] = useState(1);

  const filtered = selectedDept === 'All'
    ? (complaints ?? [])
    : (complaints ?? []).filter((c) => c.assignedDepartment === selectedDept);

  const total = (filtered ?? []).length;
  const verified = (filtered ?? []).filter((c) => c.comparisonResult?.verificationStatus === 'Verified').length;
  const manualReview = (filtered ?? []).filter((c) => c.comparisonResult?.verificationStatus === 'Manual Review').length;
  const autoVerificationRate = total > 0 ? Math.round((verified / total) * 100) : 100;

  const resolved = (filtered ?? []).filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const escalated = (filtered ?? []).filter((c) => c.status === 'Escalated').length;
  const slaBreached = (filtered ?? []).filter((c) => c.slaRiskStatus === 'Breached').length;
  const slaApproaching = (filtered ?? []).filter((c) => c.slaRiskStatus === 'Approaching').length;
  const slaComplianceRate = total > 0 ? Math.round(((total - slaBreached) / total) * 100) : 100;
  const tablePageSize = 10;
  const currentTablePage = Math.min(tablePage, Math.max(1, Math.ceil(filtered.length / tablePageSize)));
  const visibleRows = filtered.slice((currentTablePage - 1) * tablePageSize, currentTablePage * tablePageSize);

  // Department distribution
  const deptCounts: Record<string, number> = {};
  (complaints ?? []).forEach((c) => {
    if (c?.assignedDepartment) {
      deptCounts[c.assignedDepartment] = (deptCounts[c.assignedDepartment] || 0) + 1;
    }
  });

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  (complaints ?? []).forEach((c) => {
    const cat = c?.pipeline1Output?.category || 'General';
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
  <div className="manager-dashboard role-dashboard space-y-6">
    {/* Header */}
    <div className="rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-widest bg-[#D7BE82]/15 text-[#D7BE82] border border-[#D7BE82]/30 font-mono">
              Team overview
            </span>
            <span className="text-xs text-[#bcb8a9]">
              Requests, response times, and review status
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2 tracking-tight">
            Support team dashboard
          </h1>
          <p className="text-xs text-[#8f8a78] mt-1 max-w-2xl">
            See how many requests your teams are handling, what needs attention, and how quickly issues are being resolved.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setTablePage(1);
            }}
            className="rounded-lg px-3 py-2 text-xs focus:outline-none"
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
            className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>

    {/* KPI Cards — use role-kpi pattern for the tech look */}
    <div className="role-kpi-grid">
      <div className="role-kpi role-kpi-gold">
        <span>Total requests</span>
        <strong>{total}</strong>
        <small>
          Team: {selectedDept} · <span className="text-[#a7bc8d]">{resolved} Resolved</span>
        </small>
      </div>

      <div className="role-kpi role-kpi-olive">
        <span>Requests passing checks</span>
        <strong>{autoVerificationRate}%</strong>
        <small>
          <span className="text-[#a7bc8d]">{verified} Verified</span> · {manualReview} In Review
        </small>
      </div>

      <div className="role-kpi role-kpi-sienna">
        <span>Within response time</span>
        <strong>{slaComplianceRate}%</strong>
        <small>
          <span className={slaBreached > 0 ? 'text-[#e0a1a0]' : ''}>{slaBreached} Late</span> · {slaApproaching} Approaching
        </small>
      </div>

      <div className="role-kpi role-kpi-mahogany">
        <span>Sent to a supervisor</span>
        <strong>{escalated}</strong>
        <small>
          Of all requests · <span className="text-[#e0a1a0]">{total > 0 ? Math.round((escalated / total) * 100) : 0}%</span>
        </small>
      </div>
    </div>

    {/* Analytics Breakdown Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Department Distribution */}
      <div className="role-chart-card">
        <div className="role-chart-title mb-4">
          <div>
            <strong>Requests by team</strong>
            <small>Distribution across departments</small>
          </div>
          <Building className="w-4 h-4 text-[#D7BE82]" />
        </div>

        <div className="role-bar-chart">
          {Object.entries(deptCounts).map(([dept, count]) => {
            const pct = complaints.length > 0 ? Math.round((count / complaints.length) * 100) : 0;
            return (
              <div key={dept} className="role-bar-row">
                <span>{dept}</span>
                <div><i className="role-bar-gold" style={{ width: `${pct}%` }} /></div>
                <b>{count}</b>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="role-chart-card">
        <div className="role-chart-title mb-4">
          <div>
            <strong>Requests by type</strong>
            <small>Category distribution</small>
          </div>
          <BarChart3 className="w-4 h-4 text-[#D7BE82]" />
        </div>

        <div className="role-bar-chart">
          {Object.entries(categoryCounts).map(([cat, count]) => {
            const pct = complaints.length > 0 ? Math.round((count / complaints.length) * 100) : 0;
            return (
              <div key={cat} className="role-bar-row">
                <span>{cat}</span>
                <div><i className="role-bar-sienna" style={{ width: `${pct}%` }} /></div>
                <b>{count}</b>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* SLA Risk Board */}
    <div className="role-chart-card">
      <div className="flex items-center justify-between mb-4">
        <div className="role-chart-title">
          <div>
            <strong>Requests needing attention</strong>
            <small>Requests close to their deadline or needing help</small>
          </div>
        </div>
        <Clock className="w-4 h-4 text-[#D7BE82]" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr>
              <th className="py-2.5 px-3">Ticket ID</th>
              <th className="py-2.5 px-3">Title</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Urgency / Priority</th>
              <th className="py-2.5 px-3">Response time</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 px-3 font-mono font-semibold text-[#D7BE82]">
                  {c.id}
                </td>
                <td className="py-2.5 px-3 font-medium text-[#f5edda] max-w-xs truncate">
                  {c.title}
                </td>
                <td className="py-2.5 px-3">
                  {c.assignedDepartment}
                </td>
                <td className="py-2.5 px-3">
                  <span className="font-mono">
                    {c.pipeline1Output?.urgency} / {c.pipeline1Output?.priority}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      c.slaRiskStatus === 'Breached'
                        ? 'bg-[#400406]/60 text-[#e0a1a0] border border-[#8e3736]/60'
                        : c.slaRiskStatus === 'Approaching'
                        ? 'bg-[#755C1B]/40 text-[#e4c77f] border border-[#755C1B]/60'
                        : 'bg-[#515A47]/50 text-[#a7bc8d] border border-[#748365]/60'
                    }`}
                  >
                    {c.slaRiskStatus}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => onSelectComplaint(c)}
                    className="px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer bg-[#D7BE82]/15 text-[#D7BE82] border border-[#D7BE82]/35 hover:bg-[#D7BE82]/25"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={currentTablePage} pageSize={tablePageSize} totalItems={filtered.length} onPageChange={setTablePage} />
    </div>
  </div>
);
};
