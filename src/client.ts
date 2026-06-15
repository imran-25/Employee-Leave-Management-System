/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ELMSDatabase, LeaveRequest } from './types.js';

export async function fetchDatabase(): Promise<ELMSDatabase> {
  const response = await fetch('/api/db');
  if (!response.ok) {
    throw new Error('Failed to retrieve system database state');
  }
  return response.json();
}

export async function resetDatabaseState(): Promise<ELMSDatabase> {
  const response = await fetch('/api/db/reset', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to restore initial database state');
  }
  const result = await response.json();
  return result.database;
}

export interface LeaveApplyPayload {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  refinedReason?: string;
}

export async function applyLeave(payload: LeaveApplyPayload): Promise<{ success: boolean; request: LeaveRequest; database: ELMSDatabase }> {
  const response = await fetch('/api/leaves/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || 'Failed to submit leave request');
  }
  return response.json();
}

export interface ApproveRejectPayload {
  leaveId: string;
  approverName: string;
  remarks: string;
}

export async function approveLeave(payload: ApproveRejectPayload): Promise<{ success: boolean; leave: LeaveRequest; database: ELMSDatabase }> {
  const response = await fetch('/api/leaves/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || 'Failed to approve leave request');
  }
  return response.json();
}

export async function rejectLeave(payload: ApproveRejectPayload): Promise<{ success: boolean; leave: LeaveRequest; database: ELMSDatabase }> {
  const response = await fetch('/api/leaves/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || 'Failed to reject leave request');
  }
  return response.json();
}

export interface RefineTextPayload {
  text: string;
  type: 'request' | 'policy';
  metadata?: {
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    duration?: number;
  };
}

export async function refineText(payload: RefineTextPayload): Promise<{ refinedText: string; note?: string }> {
  const response = await fetch('/api/refine-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || 'Failed to refine text draft');
  }
  return response.json();
}
