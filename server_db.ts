/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { TargetRole, LeaveStatus, ELMSDatabase, LeavePolicy, LeaveType } from './src/types.js';

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
      refinedReason: 'Subject: Formal Leave Request: Annual Leave Submission (July 10, 2026 - July 15, 2026)\n\nDear Management,\n\nI am writing to formally request annual leave starting from July 10, 2026, with a return date of July 16, 2026. This totals 5 working days.\n\nDuring my absence, I plan to travel to the Lake District for a hiking excursion and spend time with my family.\n\nThank you for considering my request.',
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
      refinedReason: 'Subject: Urgent Casual Leave Request: Home Maintenance Emergency\n\nDear HR Department,\n\nI am writing to request 2 days of casual leave from June 20, 2026, to June 22, 2026, due to an unexpected plumbing and home repair emergency at my primary residence.\n\nBest regards,\nMichael Scott',
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
      refinedReason: 'Subject: Notification of Sick Leave: Wisdom Tooth Extraction Surgery\n\nDear HR,\n\nPlease accept this request for 2 days of sick leave from June 14, 2026, to June 15, 2026. I am scheduled for medical wisdom tooth extraction and my dental surgeon has advised a 2-day recovery period.',
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

// =====================================================================
// MySQL Dual Database Driver configuration and state loading
// =====================================================================
let mysqlPool: mysql.Pool | null = null;
const isMySQLEnabled = !!(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);

if (isMySQLEnabled) {
  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('MySQL Connection Pool initialized for WampServer dual-integration.');
  } catch (err) {
    console.error('Failed to create MySQL Pool, running in JSON-only fallback mode:', err);
  }
}

/**
 * Initializes and polls the DB, syncing state asynchronously if active
 */
export async function initDatabaseConnection(): Promise<void> {
  if (!isMySQLEnabled || !mysqlPool) {
    console.log('Running ELMS with Resilient JSON Local DB Driver.');
    return;
  }

  try {
    const [rows]: any = await mysqlPool.query("SHOW TABLES LIKE 'employees'");
    if (rows.length === 0) {
      console.log('MySQL connected successfully. Warning: Corporate schemas NOT detected. Please import "/init_mysql.sql" inside phpMyAdmin list to seed relational tables.');
      return;
    }

    console.log('Synchronizing ELMS state cache from local MySQL...');
    
    // Fetch relational elements
    const [employeesRows]: any = await mysqlPool.query('SELECT * FROM employees');
    const [balancesRows]: any = await mysqlPool.query('SELECT * FROM leave_balances');
    const [policiesRows]: any = await mysqlPool.query('SELECT * FROM leave_policies');
    const [requestsRows]: any = await mysqlPool.query('SELECT * FROM leave_requests');
    const [logsRows]: any = await mysqlPool.query('SELECT * FROM audit_logs');

    // Build the balance dictionary map
    const balancesMap: Record<string, Record<string, number>> = {};
    for (const b of balancesRows) {
      if (!balancesMap[b.employeeId]) {
        balancesMap[b.employeeId] = {};
      }
      balancesMap[b.employeeId][b.leaveType] = b.balance;
    }

    // Map employees
    const employeesList = employeesRows.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      password: emp.password,
      role: emp.role,
      department: emp.department,
      joinDate: emp.joinDate instanceof Date ? emp.joinDate.toISOString().split('T')[0] : emp.joinDate,
      balances: balancesMap[emp.id] || { Annual: 20, Sick: 10, Casual: 7, Parental: 60, Unpaid: 30 }
    }));

    // Map policies
    const policiesList = policiesRows.map((p: any) => ({
      leaveType: p.leaveType,
      yearlyLimit: p.yearlyLimit,
      maxConsecutiveDays: p.maxConsecutiveDays,
      requiresDocumentation: p.requiresDocumentation === 1 || p.requiresDocumentation === true,
      description: p.description
    }));

    // Map leave requests
    const leavesList = requestsRows.map((l: any) => ({
      id: l.id,
      employeeId: l.employeeId,
      employeeName: l.employeeName,
      department: l.department,
      leaveType: l.leaveType,
      startDate: l.startDate instanceof Date ? l.startDate.toISOString().split('T')[0] : l.startDate,
      endDate: l.endDate instanceof Date ? l.endDate.toISOString().split('T')[0] : l.endDate,
      duration: l.duration,
      reason: l.reason,
      refinedReason: l.refinedReason || undefined,
      attachmentName: l.attachmentName || undefined,
      attachmentData: l.attachmentData || undefined,
      status: l.status,
      requestedAt: l.requestedAt,
      approvedOrRejectedAt: l.approvedOrRejectedAt || undefined,
      approverName: l.approverName || undefined,
      approverRemarks: l.approverRemarks || undefined
    })).sort((a: any, b: any) => b.requestedAt.localeCompare(a.requestedAt));

    // Map log files
    const logsList = logsRows.map((g: any) => ({
      id: g.id,
      timestamp: g.timestamp,
      actorName: g.actorName,
      action: g.action,
      details: g.details
    })).sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));

    const mysqlDatabaseSnapshot: ELMSDatabase = {
      employees: employeesList,
      policies: policiesList.length > 0 ? policiesList : DEFAULT_POLICIES,
      leaves: leavesList,
      auditLogs: logsList
    };

    // Commit snapshot back to cache file for synchronous read processes
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(mysqlDatabaseSnapshot, null, 2), 'utf-8');
    console.log(`ELMS synchronized with MySQL. Loaded ${employeesList.length} employees, ${leavesList.length} requests, and ${logsList.length} logs successfully.`);
  } catch (err) {
    console.error('Error pre-loading from local MySQL schema. Falling back to secure JSON state file.', err);
  }
}

/**
 * Propagates synchronous updates from app to the async MySQL instance live!
 */
async function syncToMySQL(db: ELMSDatabase): Promise<void> {
  if (!mysqlPool) return;
  try {
    // 1. Sync policies
    for (const pol of db.policies) {
      await mysqlPool.query(
        `INSERT INTO leave_policies (leaveType, yearlyLimit, maxConsecutiveDays, requiresDocumentation, description)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE yearlyLimit = VALUES(yearlyLimit), maxConsecutiveDays = VALUES(maxConsecutiveDays), 
                               requiresDocumentation = VALUES(requiresDocumentation), description = VALUES(description)`,
        [pol.leaveType, pol.yearlyLimit, pol.maxConsecutiveDays, pol.requiresDocumentation ? 1 : 0, pol.description]
      );
    }

    // 2. Sync employees & balances
    for (const emp of db.employees) {
      await mysqlPool.query(
        `INSERT INTO employees (id, name, email, password, role, department, joinDate)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password = VALUES(password), 
                               role = VALUES(role), department = VALUES(department), joinDate = VALUES(joinDate)`,
        [emp.id, emp.name, emp.email, emp.password, emp.role, emp.department, emp.joinDate]
      );

      // Sync Balances
      for (const [leaveType, bal] of Object.entries(emp.balances)) {
        await mysqlPool.query(
          `INSERT INTO leave_balances (employeeId, leaveType, balance)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE balance = VALUES(balance)`,
          [emp.id, leaveType, bal]
        );
      }
    }

    // 3. Sync Leave Requests
    for (const req of db.leaves) {
      await mysqlPool.query(
        `INSERT INTO leave_requests (id, employeeId, employeeName, department, leaveType, startDate, endDate, duration, reason, refinedReason, attachmentName, attachmentData, status, requestedAt, approvedOrRejectedAt, approverName, approverRemarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), approvedOrRejectedAt = VALUES(approvedOrRejectedAt), 
                               approverName = VALUES(approverName), approverRemarks = VALUES(approverRemarks)`,
        [
          req.id, req.employeeId, req.employeeName, req.department, req.leaveType,
          req.startDate, req.endDate, req.duration, req.reason, req.refinedReason || null,
          req.attachmentName || null, req.attachmentData || null, req.status,
          req.requestedAt, req.approvedOrRejectedAt || null, req.approverName || null, req.approverRemarks || null
        ]
      );
    }

    // 4. Sync Audit Logs
    for (const log of db.auditLogs) {
      await mysqlPool.query(
        `INSERT INTO audit_logs (id, timestamp, actorName, action, details)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE timestamp = VALUES(timestamp), actorName = VALUES(actorName), 
                               action = VALUES(action), details = VALUES(details)`,
        [log.id, log.timestamp, log.actorName, log.action, log.details]
      );
    }
  } catch (err) {
    console.error('MySQL database transactional sync issue encountered:', err);
  }
}

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
    // Dual synchronisation: Update MySQL ledger state asynchronously in the background
    if (isMySQLEnabled) {
      syncToMySQL(db);
    }
  } catch (error) {
    console.error('Error writing to leave management database:', error);
  }
}

export function resetDatabase(): ELMSDatabase {
  writeDatabase(INITIAL_DATABASE);
  
  // Truncate MySQL records live on system resets if active
  if (isMySQLEnabled && mysqlPool) {
    Promise.resolve().then(async () => {
      try {
        await mysqlPool!.query('SET FOREIGN_KEY_CHECKS = 0');
        await mysqlPool!.query('TRUNCATE TABLE audit_logs');
        await mysqlPool!.query('TRUNCATE TABLE leave_requests');
        await mysqlPool!.query('TRUNCATE TABLE leave_balances');
        await mysqlPool!.query('TRUNCATE TABLE leave_policies');
        await mysqlPool!.query('TRUNCATE TABLE employees');
        await mysqlPool!.query('SET FOREIGN_KEY_CHECKS = 1');
        await syncToMySQL(INITIAL_DATABASE);
        console.log('MySQL successfully reset to clean simulation state.');
      } catch (err) {
        console.error('Failed to reset MySQL during master initialization:', err);
      }
    });
  }
  
  return INITIAL_DATABASE;
}
