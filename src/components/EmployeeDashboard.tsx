/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { Employee, LeaveRequest, LeavePolicy, LeaveType, LeaveStatus } from '../types.js';
import { refineText } from '../client.js';

interface EmployeeDashboardProps {
  employee: Employee;
  leaves: LeaveRequest[];
  policies: LeavePolicy[];
  onSubmitLeave: (payload: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    duration: number;
    reason: string;
    refinedReason?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export default function EmployeeDashboard({
  employee,
  leaves,
  policies,
  onSubmitLeave,
  isSubmitting
}: EmployeeDashboardProps) {
  // Filter leaves that belong to this employee
  const myLeaves = leaves.filter(l => l.employeeId === employee.id);

  // Form states
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(0);
  const [reason, setReason] = useState('');
  
  // Text Refine states
  const [isRefining, setIsRefining] = useState(false);
  const [refinedOutput, setRefinedOutput] = useState('');
  const [showRefinerPreview, setShowRefinerPreview] = useState(false);
  const [useRefined, setUseRefined] = useState(false);
  const [refinementNote, setRefinementNote] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('apply');
  const [expandedLeaveId, setExpandedLeaveId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate duration automatically on date changes
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setDuration(0);
        setErrorMsg('');
        return;
      }

      if (start > end) {
        setDuration(0);
        setErrorMsg('Start date must be on or before end date.');
        return;
      }

      setErrorMsg('');
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      setDuration(diffDays);
    } else {
      setDuration(0);
      setErrorMsg('');
    }
  }, [startDate, endDate]);

  const selectedPolicy = policies.find(p => p.leaveType === leaveType);

  // Handle refinement requests
  const handleRefineReason = async () => {
    if (!reason.trim()) {
      alert('Please enter a brief outline of your leave reason first to refine!');
      return;
    }
    
    setIsRefining(true);
    setErrorMsg('');
    try {
      const response = await refineText({
        text: reason,
        type: 'request',
        metadata: {
          leaveType,
          startDate,
          endDate,
          duration
        }
      });
      setRefinedOutput(response.refinedText);
      setRefinementNote(response.note || '');
      setShowRefinerPreview(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Communication failure with Gemini Text Refiner: ' + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || duration <= 0) {
      setErrorMsg('Please select a valid date range.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please specify a reason for your request.');
      return;
    }

    // Verify policy limits locally before sending to prompt quick validation
    if (selectedPolicy && duration > selectedPolicy.maxConsecutiveDays) {
      setErrorMsg(`Policy Constraint: Maximum consecutive leave allowed for ${leaveType} is ${selectedPolicy.maxConsecutiveDays} days.`);
      return;
    }

    if (leaveType !== 'Unpaid' && employee.balances[leaveType] < duration) {
      setErrorMsg(`Balance Check: Insufficient ${leaveType} leave balance. Remaining: ${employee.balances[leaveType]} days.`);
      return;
    }

    try {
      await onSubmitLeave({
        employeeId: employee.id,
        leaveType,
        startDate,
        endDate,
        duration,
        reason,
        refinedReason: useRefined ? refinedOutput : undefined
      });

      // Clear Form state upon successful application
      setStartDate('');
      setEndDate('');
      setReason('');
      setRefinedOutput('');
      setShowRefinerPreview(false);
      setUseRefined(false);
      setErrorMsg('');
      setActiveTab('history'); // switch to history view to see pending
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    }
  };

  // Color mappings
  const typeColors: Record<LeaveType, { bg: string; text: string; border: string }> = {
    Annual: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', border: 'border-indigo-100' },
    Sick: { bg: 'bg-rose-50/70', text: 'text-rose-700', border: 'border-rose-100' },
    Casual: { bg: 'bg-amber-50/70', text: 'text-amber-700', border: 'border-amber-100' },
    Parental: { bg: 'bg-violet-50/70', text: 'text-violet-700', border: 'border-violet-100' },
    Unpaid: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT: Mini Sidebar Profile Info & Balances Dashboard */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 font-bold text-white text-base font-mono flex items-center justify-center shadow">
              {employee.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 leading-tight">{employee.name}</h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">{employee.id} • {employee.department}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50/80 rounded p-2 text-center border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Designation</span>
              <span className="font-medium text-slate-700 mt-0.5 block">{employee.role}</span>
            </div>
            <div className="bg-slate-50/80 rounded p-2 text-center border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Join Date</span>
              <span className="font-medium text-slate-700 mt-0.5 block">{employee.joinDate}</span>
            </div>
          </div>
        </div>

        {/* Leave Balance List */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Calculated Leave Balances
          </h3>
          <p className="text-slate-500 text-[10px] mt-0.5 font-sans leading-relaxed">
            Updated in real-time under MIS-relational deduction rules.
          </p>

          <div className="mt-4 space-y-3">
            {(Object.keys(employee.balances) as LeaveType[]).map((type) => {
              const balance = employee.balances[type];
              const policy = policies.find(p => p.leaveType === type);
              const limit = policy ? policy.yearlyLimit : 30;
              const percent = Math.min(100, Math.max(0, (balance / limit) * 100));
              const color = typeColors[type];

              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${color.text} bg-current`} />
                      {type}
                    </span>
                    <span className="font-mono font-medium text-slate-950">
                      {balance} <span className="text-slate-400 font-sans text-[10px]">/ {limit} days</span>
                    </span>
                  </div>
                  
                  {/* Custom Progress bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        balance === 0 ? 'bg-slate-300' :
                        type === 'Sick' ? 'bg-rose-500' :
                        type === 'Annual' ? 'bg-indigo-500' :
                        type === 'Casual' ? 'bg-amber-500' :
                        'bg-violet-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-800 flex gap-2">
            <Info className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
            <p>
              Applying for leave reserves its duration from your balance immediately to enforce concurrency lockouts. Rejections free up reserved days.
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT: Main panel with Tab View */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        
        {/* Tab Controls */}
        <div className="bg-white rounded-lg p-1.5 border border-slate-200 shadow-sm flex gap-1">
          <button
            id="tab-apply"
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-2 px-4 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'apply'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="h-4 w-4" /> Apply for Leave
          </button>
          
          <button
            id="tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="h-4 w-4" /> Request History ({myLeaves.length})
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex-1">
          <AnimatePresence mode="wait">
            
            {/* APPLY TAB */}
            {activeTab === 'apply' && (
              <motion.div
                key="tab-apply-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="border-b border-slate-100 pb-3 mb-6">
                  <h3 className="font-semibold text-slate-800 text-base">New Leave Leave Application</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Submit leave details. Integrated with the <strong className="text-purple-600">Gemini LLM Text Refiner</strong> which polishes brief raw explanations into professional formats automatically.
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-5">
                  
                  {/* Select Leave Type & Policy Highlight */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 block">Leave Category</label>
                      <select
                        id="leave-type-select"
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                      >
                        <option value="Annual">Annual Leave (Vacation)</option>
                        <option value="Sick">Sick Leave (Medical)</option>
                        <option value="Casual">Casual Leave (Emergency)</option>
                        <option value="Parental">Parental Leave</option>
                        <option value="Unpaid">Unpaid Leave of Absence</option>
                      </select>
                    </div>

                    {selectedPolicy && (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-150 text-xs text-slate-600 self-end">
                        <span className="font-bold text-slate-700 block">Category Rules Policy</span>
                        <p className="mt-0.5 text-slate-500 text-[11px] leading-tight">{selectedPolicy.description}</p>
                        <div className="mt-1.5 flex gap-4 text-[10px] font-mono uppercase text-slate-500 font-semibold">
                          <span>Limit: {selectedPolicy.yearlyLimit} days/yr</span>
                          <span>Consecutive Max: {selectedPolicy.maxConsecutiveDays} days</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dates Configuration with Dynamic Calculator */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-150 space-y-4">
                    <span className="text-xs font-semibold text-slate-700 block">Relational Date Spans</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-400 uppercase font-mono">Start Date</label>
                        <input
                          type="date"
                          id="leave-start-input"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-400 uppercase font-mono">End Date</label>
                        <input
                          type="date"
                          id="leave-end-input"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="bg-indigo-50/50 rounded-md p-2.5 text-center border border-indigo-100/60 flex flex-col justify-center">
                        <span className="text-[10px] text-indigo-400 font-mono font-medium block uppercase">Calculated Duration</span>
                        <span className="text-xl font-bold font-mono text-indigo-950 mt-0.5">{duration} Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Leave Reason & "Polish on first click" system */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <label className="text-xs font-semibold text-slate-600">
                        Why are you taking leave? <span className="text-slate-400 font-normal">(Brief explanation)</span>
                      </label>
                      <button
                        type="button"
                        id="refine-ai-btn"
                        onClick={handleRefineReason}
                        disabled={isRefining || !reason.trim() || duration === 0}
                        title="Rewrite your brief scratchnote into a polished corporate letter automatically using Gemini AI"
                        className="text-xs text-indigo-600 hover:text-indigo-800 disabled:text-slate-350 flex items-center gap-1 font-semibold transition"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${isRefining ? 'animate-pulse text-violet-500' : 'text-indigo-500'}`} />
                        {isRefining ? 'Refining with Gemini...' : 'Polish Draft with AI'}
                      </button>
                    </div>

                    <textarea
                      id="leave-reason-textarea"
                      required
                      placeholder="e.g.: medical dental extraction on morning / family trip to relatives"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 font-sans focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 leading-relaxed"
                    />
                  </div>

                  {/* AI Refined Letter Sandbox block */}
                  <AnimatePresence>
                    {showRefinerPreview && refinedOutput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-violet-50 border border-violet-100 rounded-lg p-4 space-y-2.5">
                          <div className="flex justify-between items-center bg-violet-100/40 p-2 rounded text-slate-800 text-xs">
                            <span className="font-semibold text-violet-850 flex items-center gap-1.5 font-mono text-[11px]">
                              <Sparkles className="h-3.5 w-3.5 text-violet-600 animate-spin" /> GEMINI POLISHED COPYWRITING OUTCOME
                            </span>
                            <span className="text-[10px] text-slate-450 font-mono italic">
                              {refinementNote ? 'Resilient mode' : 'Prudence context applied'}
                            </span>
                          </div>

                          <pre className="text-[11px] text-slate-750 font-sans whitespace-pre-wrap leading-relaxed outline-none focus:outline-none bg-white p-3.5 border border-violet-200 rounded-md max-h-56 overflow-y-auto">
                            {refinedOutput}
                          </pre>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              id="use-refined-btn"
                              onClick={() => {
                                setUseRefined(true);
                                alert('Applied Refined Letter verbatim! It will be submitted to HR.');
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                                useRefined 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                              }`}
                            >
                              {useRefined ? '✓ Applied Verbatim to Request' : 'Use Polished Version for Submission'}
                            </button>
                            
                            {useRefined && (
                              <button
                                type="button"
                                onClick={() => setUseRefined(false)}
                                className="text-slate-700 p-1.5 text-xs hover:bg-slate-200 rounded font-medium flex items-center gap-1 transition"
                                title="Switch back to original raw draft summary"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Revert
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Display Error Message */}
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-xs text-rose-700 rounded-lg">
                      {errorMsg}
                    </div>
                  )}

                  {/* Submit buttons */}
                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="submit"
                      id="submit-leave-btn"
                      disabled={isSubmitting || duration <= 0}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting request...' : 'Submit Official Leave Request'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                </form>
              </motion.div>
            )}

            {/* REQUEST HISTORY TAB */}
            {activeTab === 'history' && (
              <motion.div
                key="tab-history-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="border-b border-slate-100 pb-3 mb-2 flex justify-between items-baseline">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">Your Leave History</h3>
                    <p className="text-xs text-slate-500 mt-1">Audit log of your completed and active leave requests in the system.</p>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-400">{myLeaves.length} Total records</span>
                </div>

                {myLeaves.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                    <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
                    <p>No leave requests found for this account.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myLeaves.map((leave) => {
                      const isExpanded = expandedLeaveId === leave.id;
                      const colors = typeColors[leave.leaveType] || { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-105' };
                      
                      return (
                        <div 
                          key={leave.id} 
                          className={`border rounded-lg transition-all overflow-hidden ${
                            leave.status === LeaveStatus.PENDING ? 'border-amber-100/80 bg-amber-50/10' :
                            leave.status === LeaveStatus.APPROVED ? 'border-emerald-100 hover:bg-emerald-50/5' :
                            'border-slate-150 bg-slate-50/20'
                          }`}
                        >
                          {/* Card Header Row */}
                          <div 
                            onClick={() => setExpandedLeaveId(isExpanded ? null : leave.id)}
                            className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${colors.bg} ${colors.text} border ${colors.border}`}>
                                {leave.leaveType}
                              </span>
                              
                              <div>
                                <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                  {leave.duration} {leave.duration === 1 ? 'Day' : 'Days'} 
                                  <span className="text-slate-400 font-mono text-[10px] font-normal">
                                    ({leave.startDate} to {leave.endDate})
                                  </span>
                                </h4>
                                <p className="text-slate-500 text-[11px] mt-0.5 truncate max-w-sm">
                                  {leave.reason}
                                </p>
                              </div>
                            </div>

                            {/* Status Banner */}
                            <div className="flex items-center gap-3 self-end md:self-auto">
                              
                              <span className={`px-2.5 py-1 rounded text-[11px] font-semibold font-mono flex items-center gap-1.5 ${
                                leave.status === LeaveStatus.PENDING ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                leave.status === LeaveStatus.APPROVED ? 'bg-emerald-100 text-emerald-800' :
                                'bg-slate-150 text-slate-800'
                              }`}>
                                {leave.status === LeaveStatus.PENDING && <Clock className="h-3 w-3 animate-spin" />}
                                {leave.status === LeaveStatus.APPROVED && <CheckCircle2 className="h-3 w-3" />}
                                {leave.status === LeaveStatus.REJECTED && <XCircle className="h-3 w-3" />}
                                {leave.status.toUpperCase()}
                              </span>

                              {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </div>

                          </div>

                          {/* Expanded detail box */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-white/50 border-t border-slate-100 p-4 space-y-4 text-xs text-slate-700"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Draft summaries */}
                                  <div>
                                    <span className="font-bold text-slate-450 uppercase text-[9px] block font-mono">Original Description</span>
                                    <p className="mt-1 text-slate-700 leading-relaxed italic pr-2">"{leave.reason}"</p>
                                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">Requested at: {new Date(leave.requestedAt).toLocaleString()}</span>
                                  </div>

                                  {/* AI polished copy if available */}
                                  {leave.refinedReason && (
                                    <div className="bg-indigo-50/35 border border-indigo-100/50 p-2.5 rounded">
                                      <span className="font-bold text-indigo-500 uppercase text-[9px] block font-mono flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-indigo-500" /> AI Refined Letter Submitted to HR
                                      </span>
                                      <pre className="mt-1.5 text-[10px] leading-relaxed font-sans whitespace-pre-wrap max-h-40 overflow-y-auto text-slate-650 p-1.5 bg-white border border-indigo-100 rounded">
                                        {leave.refinedReason}
                                      </pre>
                                    </div>
                                  )}
                                </div>

                                {/* Approver Details / Settlement remarks */}
                                {leave.status !== LeaveStatus.PENDING && (
                                  <div className={`p-3 rounded-lg border flex flex-col gap-1 ${
                                    leave.status === LeaveStatus.APPROVED ? 'bg-emerald-50/50 border-emerald-100 text-slate-800' : 'bg-slate-50 border-slate-150 text-slate-800'
                                  }`}>
                                    <span className="font-mono font-bold text-[10px] uppercase text-slate-500">
                                      Decided with Management remarks • {new Date(leave.approvedOrRejectedAt || '').toLocaleString()}
                                    </span>
                                    
                                    <div className="mt-1 flex gap-2">
                                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 ${
                                        leave.status === LeaveStatus.APPROVED ? 'bg-emerald-500' : 'bg-slate-400'
                                      }`} />
                                      <p className="font-sans leading-relaxed text-xs">
                                        <span className="font-semibold">{leave.approverName || 'SysAdmin'}: </span>
                                        "{leave.approverRemarks || 'No feedback left.'}"
                                      </p>
                                    </div>
                                  </div>
                                )}

                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
