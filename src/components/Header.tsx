/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, RefreshCw, Layers, Users } from 'lucide-react';
import { Employee } from '../types.js';

interface HeaderProps {
  employees: Employee[];
  currentUserId: string | null;
  onUserChange: (userId: string) => void;
  onResetDb: () => void;
  onLogout: () => void;
  isResetting: boolean;
}

export default function Header({
  employees,
  currentUserId,
  onUserChange,
  onResetDb,
  onLogout,
  isResetting
}: HeaderProps) {
  const currentUser = employees.find(e => e.id === currentUserId);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Title & Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-lg shadow-inner flex items-center justify-center">
              <Layers className="h-6 w-6" id="brand-logo" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  Employee Leave Management System <span className="text-indigo-400 font-mono text-xs px-2 py-0.5 bg-indigo-500/15 rounded-full border border-indigo-500/30">ELMS MIS</span>
                </h1>
              </div>
              <p className="text-slate-400 text-xs mt-0.5 max-w-xl leading-relaxed">
                Management Information System (MIS) approach to streamline tracking, approval workflows, and leave balance calculations for HR departments.
              </p>
            </div>
          </div>

          {/* Interactive controls: Role-simulator & Reset DB */}
          <div className="flex flex-wrap items-center gap-3 md:self-center">
            
            {/* Simulation Context Selector */}
            {currentUserId && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 flex items-center gap-2">
                <span className="text-slate-400 text-xs font-medium font-mono flex items-center gap-1 pl-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> DEV SIMULATOR:
                </span>
                <select
                  id="user-sim-selector"
                  value={currentUserId}
                  onChange={(e) => onUserChange(e.target.value)}
                  className="bg-slate-900 border-0 text-slate-100 text-xs font-semibold rounded p-1 focus:ring-1 focus:ring-indigo-500 cursor-pointer focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Database and Logs Trigger */}
            <button
              id="reset-db-btn"
              onClick={onResetDb}
              disabled={isResetting}
              title="Reset the local system database to default values"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-mono font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isResetting ? 'animate-spin text-indigo-400' : ''}`} />
              RESET SYSTEM
            </button>

            {/* Sign Out Trigger */}
            {currentUserId && (
              <button
                id="header-logout-btn"
                onClick={onLogout}
                className="px-3 py-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-1 cursor-pointer"
              >
                SIGN OUT
              </button>
            )}
            
          </div>

        </div>

        {/* Info banner for simulated credentials */}
        {currentUser && (
          <div className="mt-3.5 pt-2 border-t border-slate-800 flex flex-wrap gap-y-1 gap-x-6 text-xs text-slate-400 font-mono">
            <div>
              <span className="text-slate-500">Current User:</span>{' '}
              <strong className="text-indigo-300 font-medium">{currentUser.name}</strong>
            </div>
            <div>
              <span className="text-slate-500">ID:</span>{' '}
              <span className="text-slate-300">{currentUser.id}</span>
            </div>
            <div>
              <span className="text-slate-500">Department:</span>{' '}
              <span className="text-slate-300">{currentUser.department}</span>
            </div>
            <div>
              <span className="text-slate-500">MIS Clearance:</span>{' '}
              <span className="text-indigo-400 font-bold flex inline-flex items-center gap-0.5">
                <ShieldCheck className="h-3 w-3" /> {currentUser.role}
              </span>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
