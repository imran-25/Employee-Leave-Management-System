/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Settings, 
  FileCheck, 
  X, 
  HelpCircle, 
  Terminal, 
  ShieldAlert,
  Search,
  Filter,
  Check,
  XSquare,
  Sparkles,
  RefreshCw,
  PlusCircle,
  FileText
} from 'lucide-react';
import { Employee, LeaveRequest, LeavePolicy, LeaveStatus, AuditLog } from '../types.js';
import { refineText } from '../client.js';

interface AdminDashboardProps {
  currentUser: Employee;
  employees: Employee[];
  leaves: LeaveRequest[];
  policies: LeavePolicy[];
  auditLogs: AuditLog[];
  onApproveLeave: (leaveId: string, remarks: string) => Promise<void>;
  onRejectLeave: (leaveId: string, remarks: string) => Promise<void>;
  isProcessing: boolean;
}

export default function AdminDashboard({
  currentUser,
  employees,
  leaves,
  policies,
  auditLogs,
  onApproveLeave,
  onRejectLeave,
  isProcessing
}: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'leaves' | 'policies' | 'audit'>('employees');
  
  // Pending approvals control
  const pendingRequests = leaves.filter(l => l.status === LeaveStatus.PENDING);
  const [approverRemarks, setApproverRemarks] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Policy Builder / AI policy refiner states
  const [draftPolicyNotes, setDraftPolicyNotes] = useState('');
  const [refinedPolicyText, setRefinedPolicyText] = useState('');
  const [isRefiningPolicy, setIsRefiningPolicy] = useState(false);
  const [showPolicyRefiner, setShowPolicyRefiner] = useState(false);

  // Search filter
  const [empSearch, setEmpSearch] = useState('');

  // Calculations for MIS metrics
  const totalEmployeesCount = employees.length;
  const pendingCount = pendingRequests.length;
  const leavesApproved = leaves.filter(l => l.status === LeaveStatus.APPROVED).length;
  const totalDurationDaysApproved = leaves
    .filter(l => l.status === LeaveStatus.APPROVED)
    .reduce((acc, curr) => acc + curr.duration, 0);

  // Filtered employees
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
    emp.id.toLowerCase().includes(empSearch.toLowerCase()) ||
    emp.department.toLowerCase().includes(empSearch.toLowerCase())
  );

  // Filtered leaves history
  const filteredLeaves = leaves.filter(leave => {
    if (statusFilter === 'ALL') return true;
    return leave.status === statusFilter;
  });

  const handleRefinePolicyNotes = async () => {
    if (!draftPolicyNotes.trim()) {
      alert('Please enter a few general draft rule notes first!');
      return;
    }
    setIsRefiningPolicy(true);
    try {
      const response = await refineText({
        text: draftPolicyNotes,
        type: 'policy'
      });
      setRefinedPolicyText(response.refinedText);
      setShowPolicyRefiner(true);
    } catch (err: any) {
      alert('Failed to refine policy: ' + err.message);
    } finally {
      setIsRefiningPolicy(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. MIS DASHBOARD HIGHLIGHTS & STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Employees Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-55/70 text-indigo-650 flex items-center justify-center font-bold">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Employees Ledger</span>
            <span className="text-xl font-bold font-mono text-slate-900 block mt-0.5">{totalEmployeesCount} Accounts</span>
          </div>
        </div>

        {/* Metric 2: Pending Workflow Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-650 flex items-center justify-center font-bold">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Pending Approvals</span>
            <span className={`text-xl font-bold font-mono block mt-0.5 ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              {pendingCount} Requests
            </span>
          </div>
        </div>

        {/* Metric 3: Total Approved */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-650 flex items-center justify-center font-bold">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Leaves Approved</span>
            <span className="text-xl font-bold font-mono text-slate-900 block mt-0.5">{leavesApproved} Approved</span>
          </div>
        </div>

        {/* Metric 4: Total Days Off */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-650 flex items-center justify-center font-bold">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Total Leave Days</span>
            <span className="text-xl font-bold font-mono text-slate-900 block mt-0.5">{totalDurationDaysApproved} Applied Days</span>
          </div>
        </div>

      </div>

      {/* 2. PENDING REQUESTS APPRIVAL BOX */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/5 to-amber-600/10 border border-amber-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 animate-bounce" />
            <h3 className="font-semibold text-amber-900 text-sm">Action Items Required ({pendingCount} pending approvals)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-lg border border-amber-100 p-4 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  {/* Category and date span */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="px-2 py-0.5 bg-amber-55/70 text-amber-800 text-[9px] font-bold font-mono rounded uppercase">
                        {req.leaveType}
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs mt-1.5 flex items-center gap-1">
                        {req.employeeName} <span className="font-mono text-[9px] text-slate-400">({req.employeeId})</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{req.department}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-indigo-750 block">{req.duration} Leave {req.duration === 1 ? 'Day' : 'Days'}</span>
                      <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{req.startDate} to {req.endDate}</span>
                    </div>
                  </div>

                  {/* Reasons box */}
                  <div className="mt-3 bg-slate-50 rounded p-2.5 space-y-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Original rough draft</span>
                      <p className="text-slate-700 text-xs mt-0.5 italic leading-relaxed">"{req.reason}"</p>
                    </div>

                    {req.refinedReason && (
                      <div className="bg-gradient-to-r from-violet-500/5 to-indigo-500/10 p-2 rounded border border-indigo-100">
                        <span className="text-[9px] font-bold text-violet-600 uppercase font-mono flex items-center gap-0.5">
                          <Sparkles className="h-3 w-3" /> Submitted Letter (Refined by Gemini)
                        </span>
                        <pre className="text-[10px] text-slate-750 font-sans mt-1 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                          {req.refinedReason}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* HR Action options */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 block font-mono">HR DECISION REMARKS / WORKFLOW NOTES</label>
                    <input
                      type="text"
                      placeholder="e.g. Approved standard leave / please reschedule dates"
                      value={approverRemarks[req.id] || ''}
                      onChange={(e) => setApproverRemarks(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 focus:bg-white rounded w-full p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      id={`reject-btn-${req.id}`}
                      disabled={isProcessing}
                      onClick={() => onRejectLeave(req.id, approverRemarks[req.id] || '')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-100 text-[11px] rounded transition duration-200 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      <XSquare className="h-3.5 w-3.5" /> REJECT REQUEST
                    </button>
                    
                    <button
                      id={`approve-btn-${req.id}`}
                      disabled={isProcessing}
                      onClick={() => onApproveLeave(req.id, approverRemarks[req.id] || '')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded shadow-xs transition duration-200 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> APPROVE & REDUCT
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SUBTAB CHANGER FOR LEDGER TABLES */}
      <div className="space-y-4">
        
        {/* Navigation Row */}
        <div className="border-b border-slate-200 flex flex-wrap gap-2 pb-1">
          <button
            onClick={() => setActiveSubTab('employees')}
            className={`py-2 px-4 text-xs font-semibold font-mono border-b-2 transition ${
              activeSubTab === 'employees' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Employee Balances ({totalEmployeesCount})
          </button>
          
          <button
            onClick={() => setActiveSubTab('leaves')}
            className={`py-2 px-4 text-xs font-semibold font-mono border-b-2 transition relative ${
              activeSubTab === 'leaves' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Ledger Master ({leaves.length})
          </button>

          <button
            onClick={() => setActiveSubTab('policies')}
            className={`py-2 px-4 text-xs font-semibold font-mono border-b-2 transition ${
              activeSubTab === 'policies' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Policies Schema ({policies.length})
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`py-2 px-4 text-xs font-semibold font-mono border-b-2 transition ${
              activeSubTab === 'audit' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            MIS Audit Trial Logs ({auditLogs.length})
          </button>
        </div>

        {/* LEDGERS VIEWS */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          
          {/* TAB 1: EMPLOYEES BALANCES LEDGER */}
          {activeSubTab === 'employees' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2">
                <div>
                  <h4 className="font-semibold text-slate-850 text-sm">Employee Leaves Balances Ledger</h4>
                  <p className="text-xs text-slate-500">Live active calculated credit days for each registered account, dynamically synchronised.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, ID or dept..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-205 py-1.5 pl-8 pr-3 text-xs rounded-md w-full focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="px-4 py-3">Employee ID</th>
                      <th className="px-4 py-3">Name details</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-center">Annual</th>
                      <th className="px-4 py-3 text-center">Sick</th>
                      <th className="px-4 py-3 text-center">Casual</th>
                      <th className="px-4 py-3 text-center">Parental</th>
                      <th className="px-5 py-3 text-center text-slate-400">Unpaid</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">{emp.id}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900 block">{emp.name}</span>
                          <span className="text-slate-400 text-[10px] block mt-0.5">{emp.email}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-650 font-medium">{emp.department}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            emp.role === 'HR Admin' ? 'bg-indigo-50 text-indigo-700' :
                            emp.role === 'Manager' ? 'bg-violet-50 text-violet-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-indigo-950">{emp.balances.Annual}</td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-700">{emp.balances.Sick}</td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-700">{emp.balances.Casual}</td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-violet-700">{emp.balances.Parental}</td>
                        <td className="px-5 py-3.5 text-center font-mono text-slate-500">{emp.balances.Unpaid}</td>
                      </tr>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 text-xs italic">
                          No matching records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER LEAVE HISTORIES */}
          {activeSubTab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline gap-2">
                <div>
                  <h4 className="font-semibold text-slate-850 text-sm">System Holiday Requests Ledger</h4>
                  <p className="text-xs text-slate-500">History of all requested leave instances recorded inside the system database.</p>
                </div>

                <div className="flex gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Filter by State:
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs rounded px-2 py-1 focus:bg-white focus:outline-none"
                  >
                    <option value="ALL">All states</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Employee name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Duration (Span)</th>
                      <th className="px-4 py-3">Reason outline</th>
                      <th className="px-4 py-3">Decision Stat</th>
                      <th className="px-4 py-3">Approver notes</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredLeaves.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3.5 font-mono font-semibold text-slate-500">{l.id}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900 block">{l.employeeName}</span>
                          <span className="text-slate-400 text-[10px] block mt-0.5">{l.employeeId} • {l.department}</span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-700">{l.leaveType}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-indigo-950 font-mono block">{l.duration} Days</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{l.startDate} to {l.endDate}</span>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="truncate text-slate-650" title={l.reason}>{l.reason}</p>
                          {l.refinedReason && (
                            <span className="px-1.5 py-0.2 bg-violet-50 text-violet-750 text-[9px] rounded mt-0.5 font-mono font-medium inline-block">
                              ✓ Gemini Letter Attached
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                            l.status === LeaveStatus.PENDING ? 'bg-amber-150 text-amber-800' :
                            l.status === LeaveStatus.APPROVED ? 'bg-emerald-100/80 text-emerald-800' :
                            'bg-slate-150 text-slate-800'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-xs italic text-[11px]">
                          {l.status === LeaveStatus.PENDING ? (
                            <span className="text-slate-400 text-[10px]">Awaiting review...</span>
                          ) : (
                            <span title={l.approverRemarks || ''}>
                              <strong className="text-slate-700 font-semibold font-mono not-italic">{l.approverName}: </strong>
                              "{l.approverRemarks || 'No feedback left.'}"
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredLeaves.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs italic">
                          No matching holiday records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: HR COMPLIANCE POLICIES */}
          {activeSubTab === 'policies' && (
            <div className="space-y-6">
              
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-semibold text-slate-850 text-sm">HR Compliance Limits & System Policies</h4>
                <p className="text-xs text-slate-500">Rules configured to govern leave maximum entries, documentation mandates, and approval boundaries.</p>
              </div>

              {/* Policy Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map(policy => (
                  <div key={policy.leaveType} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-850 text-xs font-mono">{policy.leaveType} Leave Category</span>
                      <span className="text-slate-400 text-[10px] font-mono uppercase bg-slate-200/55 px-1.5 py-0.5 rounded font-bold">
                        {policy.requiresDocumentation ? 'Documentation Required' : 'No documentation required'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{policy.description}</p>
                    <div className="pt-2 border-t border-slate-150 flex gap-4 text-xs font-mono font-medium text-indigo-900">
                      <span>Annual Limit: {policy.yearlyLimit} days</span>
                      <span>Max Consecutive: {policy.maxConsecutiveDays} days</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Policy Refiner tool - fully fulfilling first refine text prompt */}
              <div className="border border-indigo-100 rounded-xl bg-indigo-50/35 p-5 mt-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                  <h5 className="font-bold text-slate-850 text-xs uppercase font-mono">MIS Policy Refiner Assistant (AI powered)</h5>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  HR managers can draft guidelines informally, and the Gemini service will rewrite them into standard corporate directive wording, ready to append into your compliance manual.
                </p>

                <div className="space-y-2">
                  <textarea
                    placeholder="Enter raw rule directives e.g. sick days above 2 days needs a medical letter from recognized hospital with stamp, otherwise it gets rejected."
                    value={draftPolicyNotes}
                    onChange={(e) => setDraftPolicyNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleRefinePolicyNotes}
                      disabled={isRefiningPolicy || !draftPolicyNotes.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRefiningPolicy ? 'animate-spin' : ''}`} />
                      Refine Rules Policy with Gemini
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showPolicyRefiner && refinedPolicyText && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-indigo-150 pt-3"
                    >
                      <span className="font-bold text-violet-600 uppercase text-[10px] block font-mono">Refined Directive Copytext Outcome</span>
                      <div className="mt-2 text-xs bg-white border border-indigo-100 p-4 rounded text-slate-755 leading-relaxed font-sans whitespace-pre-wrap">
                        {refinedPolicyText}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>
          )}

          {/* TAB 4: AUDIT TRAIL LOG RECORD */}
          {activeSubTab === 'audit' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-semibold text-slate-850 text-sm">Durable MIS Database Operations Audit Log</h4>
                <p className="text-xs text-slate-500">Rigorous logs recording operations, state deduct triggers, and security settlements sequentially.</p>
              </div>

              <div className="bg-slate-900 border border-slate-950 font-mono text-[11px] p-4 text-slate-200 rounded-lg space-y-2.5 max-h-[420px] overflow-y-auto">
                <div className="text-emerald-400 font-semibold border-b border-slate-800 pb-1.5 text-[10px] flex items-center gap-1">
                  <Terminal className="h-3.5 w-3.5" /> MIS_PERSISTENCE_SERVICE: AUDIT_STREAMS
                </div>
                {auditLogs.map(log => (
                  <div key={log.id} className="flex gap-2 items-start py-0.5 hover:bg-slate-800/40 rounded px-1 transition duration-150">
                    <span className="text-indigo-400 font-bold shrink-0">[{log.id}]</span>
                    <span className="text-slate-500 shrink-0 select-none">|</span>
                    <span className="text-indigo-305 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-slate-500 shrink-0 select-none">|</span>
                    <span className="text-amber-500 shrink-0">[{log.action}]</span>
                    <span className="text-slate-500 shrink-0 select-none">|</span>
                    <span className="text-slate-300">{log.details}</span>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
