/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { TargetRole, LeaveStatus, ELMSDatabase, LeavePolicy } from './src/types.js';

const DB_FILE_PATH = path.join(process.cwd(), 'leave_management_db.json');

const DEFAULT_POLICIES: LeavePolicy[] = [
  {
    leaveType: 'Annual',
    yearlyLimit: 20,
    maxConsecutiveDays: 14,
    requiresDocumentation: false,
    description: 'General paid vacation. Requires submission 2 weeks in advance.'
  },
  {
    leaveType: 'Sick',
    yearlyLimit: 10,
    maxConsecutiveDays: 5,
    requiresDocumentation: true,
    description: 'Paid medical leave for recovery or doctor appointments.'
  },
  {
    leaveType: 'Casual',
    yearlyLimit: 7,
    maxConsecutiveDays: 3,
    requiresDocumentation: false,
    description: 'Urgent personal work or emergency leave.'
  },
  {
    leaveType: 'Parental',
    yearlyLimit: 60,
    maxConsecutiveDays: 45,
    requiresDocumentation: true,
    description: 'Paid parental leave for childbirth or adoption.'
  },
  {
    leaveType: 'Unpaid',
    yearlyLimit: 30,
    maxConsecutiveDays: 30,
    requiresDocumentation: false,
    description: 'Extended leave of absence without pay. Subject to special management approval.'
  }
];

export const INITIAL_DATABASE: ELMSDatabase = {
  employees: [
    {
      id: 'EMP-101',
      name: 'Imran Tar',
      email: 'imrani.tar@gmail.com',
      password: 'password123',
      role: TargetRole.HR,
      department: 'Human Resources',
      joinDate: '2023-03-10',
      balances: { Annual: 18, Sick: 9, Casual: 6, Parental: 60, Unpaid: 30 }
    },
    {
      id: 'EMP-202',
      name: 'Sarah Connor',
      email: 'sarah.connor@allied.com',
      password: 'password123',
      role: TargetRole.MANAGER,
      department: 'Operations',
      joinDate: '2023-01-15',
      balances: { Annual: 12, Sick: 10, Casual: 7, Parental: 60, Unpaid: 30 }
    },
    {
      id: 'EMP-303',
      name: 'Michael Scott',
      email: 'michael.scott@dundermifflin.com',
      password: 'password123',
      role: TargetRole.EMPLOYEE,
      department: 'Sales',
      joinDate: '2022-04-01',
      balances: { Annual: 15, Sick: 8, Casual: 5, Parental: 60, Unpaid: 30 }
    },
    {
      id: 'EMP-404',
      name: 'Alan Turing',
      email: 'alan.turing@bletchley.edu',
      password: 'password123',
      role: TargetRole.EMPLOYEE,
      department: 'Engineering',
      joinDate: '2024-02-12',
      balances: { Annual: 15, Sick: 10, Casual: 7, Parental: 60, Unpaid: 30 }
    },
    {
      id: 'EMP-505',
      name: 'Ada Lovelace',
      email: 'ada.lovelace@analytical.org',
      password: 'password123',
      role: TargetRole.EMPLOYEE,
      department: 'Engineering',
      joinDate: '2024-05-18',
      balances: { Annual: 18, Sick: 8, Casual: 7, Parental: 60, Unpaid: 30 }
    }
  ],
  leaves: [
    {
      id: 'LV-401',
      employeeId: 'EMP-404',
      employeeName: 'Alan Turing',
      department: 'Engineering',
      leaveType: 'Annual',
      startDate: '2026-07-10',
      endDate: '2026-07-15',
      duration: 5,
      reason: 'Summer holiday hiking in the Lake District and visiting parents.',
      refinedReason: 'Subject: Formal Leave Request: Annual Leave Submission (July 10, 2026 - July 15, 2026)\n\nDear Management,\n\nI am writing to formally request annual leave starting from July 10, 2026, with a return date of July 16, 2026. This totals 5 working days.\n\nDuring my absence, I plan to travel to the Lake District for a hiking excursion and spend time with my family. I have ensured that my current engineering deliverables are well-documented and on schedule. I will remain contactable via email for any urgent operational matters.\n\nThank you for considering my request.\n\nSincerely,\nAlan Turing',
      status: LeaveStatus.APPROVED,
      requestedAt: '2026-06-10T10:00:00.000Z',
      approvedOrRejectedAt: '2026-06-11T14:30:00.000Z',
      approverName: 'Sarah Connor',
      approverRemarks: 'Approved. Deliverables have been successfully reassigned for that week.'
    },
    {
      id: 'LV-402',
      employeeId: 'EMP-303',
      employeeName: 'Michael Scott',
      department: 'Sales',
      leaveType: 'Casual',
      startDate: '2026-06-20',
      endDate: '2026-06-22',
      duration: 2,
      reason: 'Emergency personal plumbing/home repair issue at my residence.',
      refinedReason: 'Subject: Urgent Casual Leave Request: Home Maintenance Emergency\n\nDear HR Department,\n\nI am writing to request 2 days of casual leave from June 20, 2026, to June 22, 2026, due to an unexpected plumbing and home repair emergency at my primary residence. My presence is required on-site to handle immediate repairs and satisfy insurance inspections.\n\nI will check my emails periodically and keep my sales team appraised of any client urgencies.\n\nBest regards,\nMichael Scott',
      status: LeaveStatus.REJECTED,
      requestedAt: '2026-06-12T08:30:00.000Z',
      approvedOrRejectedAt: '2026-06-13T09:15:00.000Z',
      approverName: 'Sarah Connor',
      approverRemarks: 'Rejected. Short notice during the end-of-quarter sales drive. Please coordinate with operations to reschedule.'
    },
    {
      id: 'LV-403',
      employeeId: 'EMP-505',
      employeeName: 'Ada Lovelace',
      department: 'Engineering',
      leaveType: 'Sick',
      startDate: '2026-06-14',
      endDate: '2026-06-15',
      duration: 2,
      reason: 'Wisdom tooth extraction surgery and doctor mandated rest.',
      refinedReason: 'Subject: Notification of Sick Leave: Wisdom Tooth Extraction Surgery\n\nDear HR,\n\nPlease accept this request for 2 days of sick leave from June 14, 2026, to June 15, 2026. I am scheduled for medical wisdom tooth extraction and my dental surgeon has advised a 2-day recovery period.\n\nI have attached my medical pre-approval certificate for reference.\n\nSincerely,\nAda Lovelace',
      status: LeaveStatus.APPROVED,
      requestedAt: '2026-06-13T16:45:00.000Z',
      approvedOrRejectedAt: '2026-06-13T17:10:00.000Z',
      approverName: 'Imran Tar',
      approverRemarks: 'Approved. Wishing you a speedy recovery, Ada.'
    },
    {
      id: 'LV-404',
      employeeId: 'EMP-303',
      employeeName: 'Michael Scott',
      department: 'Sales',
      leaveType: 'Annual',
      startDate: '2026-07-01',
      endDate: '2026-07-08',
      duration: 5,
      reason: 'Family trip down to Florida beaches to visit my relatives.',
      status: LeaveStatus.PENDING,
      requestedAt: '2026-06-14T11:20:00.000Z'
    }
  ],
  policies: DEFAULT_POLICIES,
  auditLogs: [
    {
      id: 'LOG-001',
      timestamp: '2026-06-13T17:10:00.000Z',
      actorName: 'Imran Tar',
      action: 'APPROVE_LEAVE',
      details: 'Approved Sick leave request LV-403 for Ada Lovelace (Duration: 2 days)'
    },
    {
      id: 'LOG-002',
      timestamp: '2026-06-14T11:20:00.000Z',
      actorName: 'Michael Scott',
      action: 'SUBMIT_LEAVE',
      details: 'Submitted Pending Annual leave request LV-404 (Duration: 5 days)'
    }
  ]
};

export function getDatabase(): ELMSDatabase {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      writeDatabase(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data) as ELMSDatabase;
  } catch (error) {
    console.error('Error reading leave management database:', error);
    return INITIAL_DATABASE;
  }
}

export function writeDatabase(db: ELMSDatabase): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to leave management database:', error);
  }
}

export function resetDatabase(): ELMSDatabase {
  writeDatabase(INITIAL_DATABASE);
  return INITIAL_DATABASE;
}
