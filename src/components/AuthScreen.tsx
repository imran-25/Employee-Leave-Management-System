/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Lock, 
  Mail, 
  User, 
  Briefcase, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Star
} from 'lucide-react';
import { Employee, TargetRole } from '../types.js';

interface AuthScreenProps {
  employees: Employee[];
  onLoginSuccess: (user: Employee) => void;
  onRegisterSuccess: (user: Employee, updatedEmployees: Employee[]) => void;
  onLoginStateChange?: (loading: boolean) => void;
}

export default function AuthScreen({
  employees,
  onLoginSuccess,
  onRegisterSuccess
}: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Engineering');
  const [regRole, setRegRole] = useState<TargetRole>(TargetRole.EMPLOYEE);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Handle traditional Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please complete all credential fields.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Server rejected credentials.');
      }

      onLoginSuccess(data.employee);
    } catch (err: any) {
      setLoginError(err.message || 'Connecting to auth bridge failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle traditional Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    // Human-style form validations
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegError('All fields are required to establish an account ledger.');
      return;
    }

    if (regPassword.length < 5) {
      setRegError('Password must be at least 5 characters for corporate compliance.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Password confirmation mismatch. Please type carefully.');
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          department: regDepartment,
          role: regRole
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register account.');
      }

      onRegisterSuccess(data.employee, data.database.employees);
    } catch (err: any) {
      setRegError(err.message || 'System Registration error. Try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Human Ease feature: Quick test logins
  const handleQuickLogin = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('password123'); // Standard default pwd
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Centered Brand / Logo Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex h-12 w-12 rounded-xl bg-indigo-600 items-center justify-center text-white shadow-md mb-4">
          <Layers className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          ELMS Portal Login
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-sans max-w-sm mx-auto">
          Employee Leave Management System & HR Compliance Ledger.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          
          {/* Custom Tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1.5 mb-8 border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setRegError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login-form-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase font-mono tracking-wider mb-1.5">
                      Corporate Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="email@company.com"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-250 rounded-lg bg-slate-50 placeholder:text-slate-400 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase font-mono tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-10 py-2 border border-slate-250 rounded-lg bg-slate-50 placeholder:text-slate-400 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700 flex items-start gap-2 animate-pulse">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer"
                  >
                    {isLoggingIn ? "Signing inside secure bridge..." : "Sign Into Portal"}
                  </button>
                </form>

                {/* Preseeded Pilot Accounts Selector */}
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center font-mono mb-4">
                    Enterprise Presets for Testing
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 text-left">
                    {employees.slice(0, 4).map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleQuickLogin(emp.email)}
                        className="p-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-lg transition text-left flex flex-col justify-between"
                      >
                        <span className="text-slate-700 font-bold block text-[11px] truncate">{emp.name}</span>
                        <div className="flex justify-between items-baseline mt-1.5 w-full">
                          <span className="text-[9px] font-mono font-semibold text-indigo-650 bg-indigo-55/10 px-1 py-0.2 rounded uppercase truncate">
                            {emp.role.split(' ')[0]}
                          </span>
                          <span className="text-[8px] text-slate-400 font-mono">1-click</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-450 mt-3 text-center leading-relaxed">
                    💡 Clicking any preset will populate variables automatically. Password is <code className="font-mono bg-slate-50 px-1 py-0.5 text-slate-650">password123</code>.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register-form-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase font-mono tracking-wider mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Michael Scott"
                        className="block w-full pl-10 pr-3 py-1.5 border border-slate-250 rounded-lg bg-slate-50 placeholder:text-slate-400 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase font-mono tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="mscott@company.com"
                        className="block w-full pl-10 pr-3 py-1.5 border border-slate-250 rounded-lg bg-slate-50 placeholder:text-slate-400 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase font-mono tracking-wider mb-1">
                        Department
                      </label>
                      <select
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        className="block w-full px-2 py-1.5 border border-slate-250 rounded-lg bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Sales">Sales</option>
                        <option value="Operations">Operations</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase font-mono tracking-wider mb-1">
                        System Designation
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as TargetRole)}
                        className="block w-full px-2 py-1.5 border border-slate-250 rounded-lg bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-semibold"
                      >
                        <option value={TargetRole.EMPLOYEE}>Regular Employee</option>
                        <option value={TargetRole.MANAGER}>Operations Manager</option>
                        <option value={TargetRole.HR}>HR Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase font-mono tracking-wider mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 5 chars"
                        className="block w-full px-3 py-1.5 border border-slate-250 rounded-lg bg-slate-50 placeholder:text-slate-400 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase font-mono tracking-wider mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Retype password"
                        className="block w-full px-3 py-1.5 border border-slate-250 rounded-lg bg-slate-50 placeholder:text-slate-400 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  {regError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors mt-2 cursor-pointer"
                  >
                    {isRegistering ? "Assembling employee record..." : "Register & Sign In"}
                  </button>
                </form>

                <div className="border-t border-slate-100 pt-4 text-center">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    🛡️ Creating an account establishes a digital leave credit budget in compliance with company standard operational policies (Annual: 20 days, Sick: 10 days, Casual: 7 days).
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
