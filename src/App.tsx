/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header.js';
import EmployeeDashboard from './components/EmployeeDashboard.js';
import AdminDashboard from './components/AdminDashboard.js';
import { fetchDatabase, resetDatabaseState, applyLeave, approveLeave, rejectLeave } from './client.js';
import { Employee, LeaveRequest, LeavePolicy, AuditLog, TargetRole } from './types.js';
import { Layers, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // App system states
  const [currentUserId, setCurrentUserId] = useState<string>('EMP-404'); // Alan Turing default
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load database state on launch
  const loadDatabase = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await fetchDatabase();
      setEmployees(data.employees);
      setLeaves(data.leaves);
      setPolicies(data.policies);
      setAuditLogs(data.auditLogs);
      setErrorMsg(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to connect to the ELMS MIS Backend. Please make sure the server is healthy.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Simulator user change
  const handleUserChange = (userId: string) => {
    setCurrentUserId(userId);
  };

  // Restore/Reset Database State
  const handleResetDb = async () => {
    setIsResetting(true);
    try {
      const updatedDb = await resetDatabaseState();
      setEmployees(updatedDb.employees);
      setLeaves(updatedDb.leaves);
      setPolicies(updatedDb.policies);
      setAuditLogs(updatedDb.auditLogs);
      alert('Database reset successful. Seed employees, policies and log streams restored.');
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Submit Leave Hook
  const onSubmitLeave = async (payload: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    duration: number;
    reason: string;
    refinedReason?: string;
  }) => {
    try {
      const response = await applyLeave(payload);
      if (response.success) {
        setEmployees(response.database.employees);
        setLeaves(response.database.leaves);
        setPolicies(response.database.policies);
        setAuditLogs(response.database.auditLogs);
        alert(`Leave request successfully submitted! Reserved ${payload.duration} days of ${payload.leaveType} leave.`);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Submission failed');
    }
  };

  // Approve Leave Hook
  const onApproveLeave = async (leaveId: string, remarks: string) => {
    try {
      const currentUserObj = employees.find(e => e.id === currentUserId);
      const approverName = currentUserObj ? currentUserObj.name : 'HR Manager';

      const response = await approveLeave({
        leaveId,
        approverName,
        remarks
      });
      if (response.success) {
        setEmployees(response.database.employees);
        setLeaves(response.database.leaves);
        setPolicies(response.database.policies);
        setAuditLogs(response.database.auditLogs);
        alert('Leave application approved. Balances allocated and audit logs written successfully.');
      }
    } catch (err: any) {
      alert('Approval failed: ' + err.message);
    }
  };

  // Reject Leave Hook
  const onRejectLeave = async (leaveId: string, remarks: string) => {
    try {
      const currentUserObj = employees.find(e => e.id === currentUserId);
      const approverName = currentUserObj ? currentUserObj.name : 'HR Manager';

      const response = await rejectLeave({
        leaveId,
        approverName,
        remarks
      });
      if (response.success) {
        setEmployees(response.database.employees);
        setLeaves(response.database.leaves);
        setPolicies(response.database.policies);
        setAuditLogs(response.database.auditLogs);
        alert('Leave application rejected. Reserved balance successfully released.');
      }
    } catch (err: any) {
      alert('Rejection failed: ' + err.message);
    }
  };

  // Retrieve Active simulated user entity
  const activeUser = employees.find(e => e.id === currentUserId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center animate-spin">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Initializing Employee Leave Management System</h2>
          <p className="text-slate-400 text-xs font-mono max-w-sm">Booting full-stack MIS database persistence engine & micro-services...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-xl border border-rose-100 shadow-md max-w-md space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Connection Failure</h2>
          <p className="text-slate-500 text-xs leading-relaxed">{errorMsg}</p>
          <button 
            onClick={() => loadDatabase()} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg cursor-pointer transition shadow-sm"
          >
            Retry Connection Bridge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-start">
      
      {/* 1. Portal Header & Simulation settings bar */}
      <Header
        employees={employees}
        currentUserId={currentUserId}
        onUserChange={handleUserChange}
        onResetDb={handleResetDb}
        isResetting={isResetting}
      />

      {/* 2. Main Portal Body */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {activeUser && (
          <div className="space-y-8">
            
            {/* Display banner on Admin portal or employee portal */}
            <div className="bg-white rounded-xl border border-slate-205 p-3 px-4 shadow-sm flex flex-col sm:flex-row justify-between items-baseline gap-2">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                  activeUser.role === TargetRole.HR || activeUser.role === TargetRole.MANAGER ? 'bg-indigo-600' : 'bg-emerald-500'
                }`} />
                <span className="text-xs text-slate-500 font-mono">
                  ELMS PORTAL VIEW: <strong className="text-slate-800 uppercase">{activeUser.role} CONSOLE</strong>
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                {activeUser.role === TargetRole.HR || activeUser.role === TargetRole.MANAGER ? (
                  <span>Permissions: Full read/write audit ledger, approval triggers.</span>
                ) : (
                  <span>Permissions: Personal balance calculations, submit requests, AI Text refiner.</span>
                )}
              </div>
            </div>

            {/* Portal Switch View routing */}
            {activeUser.role === TargetRole.HR || activeUser.role === TargetRole.MANAGER ? (
              <AdminDashboard
                currentUser={activeUser}
                employees={employees}
                leaves={leaves}
                policies={policies}
                auditLogs={auditLogs}
                onApproveLeave={onApproveLeave}
                onRejectLeave={onRejectLeave}
                isProcessing={isResetting}
              />
            ) : (
              <EmployeeDashboard
                employee={activeUser}
                leaves={leaves}
                policies={policies}
                onSubmitLeave={onSubmitLeave}
                isSubmitting={isResetting}
              />
            )}

          </div>
        )}

      </main>

      {/* Footer information */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Employee Leave Management System (ELMS) — An MIS Enterprise Approach.</p>
          <p className="text-slate-550 mt-1">Designed by Systems Administrator imrani.tar@gmail.com with Google Gemini AI Studio</p>
        </div>
      </footer>

    </div>
  );
}
