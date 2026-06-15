/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TargetRole {
  EMPLOYEE = 'Employee',
  HR = 'HR Admin',
  MANAGER = 'Manager'
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Parental' | 'Unpaid';

export interface LeaveBalances {
  Annual: number;
  Sick: number;
  Casual: number;
  Parental: number;
  Unpaid: number; // usually infinite but tracked
}

export interface Employee {
  id: string; // EMP-001, etc.
  name: string;
  email: string;
  role: TargetRole;
  department: string;
  joinDate: string;
  balances: LeaveBalances;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  duration: number; // in days
  reason: string;
  refinedReason?: string; // AI refined text
  status: LeaveStatus;
  requestedAt: string;
  approvedOrRejectedAt?: string;
  approverRemarks?: string;
  approverName?: string;
}

export interface LeavePolicy {
  leaveType: LeaveType;
  yearlyLimit: number;
  maxConsecutiveDays: number;
  requiresDocumentation: boolean;
  description: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  action: string;
  details: string;
}

export interface ELMSDatabase {
  employees: Employee[];
  leaves: LeaveRequest[];
  policies: LeavePolicy[];
  auditLogs: AuditLog[];
}
