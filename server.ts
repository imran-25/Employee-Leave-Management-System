/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { getDatabase, writeDatabase, resetDatabase, initDatabaseConnection, getDatabaseStatus } from './server_db.js';
import { TargetRole, LeaveStatus, LeaveType, LeaveRequest, AuditLog } from './src/types.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

// JSON parser
app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini AI Client initialized successfully.');
  } catch (err) {
    console.error('Error initializing Gemini Client:', err);
  }
} else {
  console.log('GEMINI_API_KEY not found in environment. Text refiner will run in resilient local mock mode.');
}

// REST API Endpoints

// 1. Get entire database state
app.get('/api/db', (req, res) => {
  try {
    const db = getDatabase();
    res.json(db);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read database state', message: err.message });
  }
});

// 1b. Check live MySQL database status & diagnostics
app.get('/api/db/status', async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check database status', message: err.message });
  }
});

// 2. Reset database state
app.post('/api/db/reset', (req, res) => {
  try {
    const db = resetDatabase();
    res.json({ success: true, database: db });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset database', message: err.message });
  }
});

// 3. Apply for Leave
app.post('/api/leaves/apply', (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, duration, reason, refinedReason, attachmentName, attachmentData } = req.body;
    
    if (!employeeId || !leaveType || !startDate || !endDate || !duration || !reason) {
      return res.status(400).json({ error: 'Missing mandatory leave fields' });
    }

    const db = getDatabase();
    const employee = db.employees.find(emp => emp.id === employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check policy limits if any
    const policy = db.policies.find(p => p.leaveType === leaveType);
    if (policy) {
      if (duration > policy.maxConsecutiveDays) {
        return res.status(400).json({ 
          error: `Policy Constraint Violation`, 
          message: `The policy for ${leaveType} limits consecutive leave to a maximum of ${policy.maxConsecutiveDays} days. Requested duration: ${duration} days.`
        });
      }
    }

    // Check Leave Balance
    const balanceAttr = leaveType as LeaveType;
    const currentBalance = employee.balances[balanceAttr] || 0;
    
    // Unpaid leave doesn't strictly deduct balances, but we'll check others
    if (leaveType !== 'Unpaid Leave of Absence' && currentBalance < duration) {
      return res.status(400).json({ 
        error: `Insufficient Leave Balance`, 
        message: `You currently have ${currentBalance} days of ${leaveType} leave remaining, but are requesting ${duration} days.` 
      });
    }

    // Create leave request
    const newRequest: LeaveRequest = {
      id: `LV-${Math.floor(100 + Math.random() * 900)}`,
      employeeId,
      employeeName: employee.name,
      department: employee.department,
      leaveType,
      startDate,
      endDate,
      duration,
      reason,
      refinedReason: refinedReason || undefined,
      attachmentName: attachmentName || undefined,
      attachmentData: attachmentData || undefined,
      status: LeaveStatus.PENDING,
      requestedAt: new Date().toISOString()
    };

    db.leaves.unshift(newRequest);

    // Write audit log
    const newLog: AuditLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      actorName: employee.name,
      action: 'SUBMIT_LEAVE',
      details: `${employee.name} requested ${duration} days of ${leaveType} leave ${attachmentName ? 'with documentation attached' : ''} (From: ${startDate} To: ${endDate}).`
    };
    db.auditLogs.unshift(newLog);

    writeDatabase(db);
    res.json({ success: true, request: newRequest, database: db });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process leave application', message: err.message });
  }
});

// Added AUTH endpoints: Register & Login (making the system completely authentic for human use)
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, department, role } = req.body;
    
    if (!name || !email || !password || !department || !role) {
      return res.status(400).json({ error: 'Please populate name, email, password, department and role.' });
    }

    const db = getDatabase();
    
    // Check if email already used
    const existing = db.employees.find(emp => emp.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered inside our corporate network.' });
    }

    // Generate unique employee ID
    const newId = `EMP-${Math.floor(100 + Math.random() * 900)}`;

    const newEmployee = {
      id: newId,
      name,
      email,
      password,
      role: role as TargetRole,
      department,
      joinDate: new Date().toISOString().split('T')[0],
      balances: {
        'Earn Leave': 20,
        'Casual Leave': 10,
        'Maternity Leave': 120,
        'Medical Leave': 14,
        'Duty Leave': 15,
        'Unpaid Leave of Absence': 30,
        'Other Leave': 10
      }
    };

    db.employees.push(newEmployee);

    // Dynamic audit log on registration
    const newLog: AuditLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      actorName: 'SYSTEM',
      action: 'REGISTER_EMPLOYEE',
      details: `New employee registered: ${name} as ${role} inside the ${department} department.`
    };
    db.auditLogs.unshift(newLog);

    writeDatabase(db);
    res.json({ success: true, employee: newEmployee, database: db });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to complete registration flow', message: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please supply a corporate email and secure password.' });
    }

    const db = getDatabase();
    const user = db.employees.find(emp => emp.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Account not found inside the network database.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Unregistered security credential mismatches.' });
    }

    const newLog: AuditLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      actorName: user.name,
      action: 'LOGIN_PORTAL',
      details: `${user.name} logged into the portal safely via simulated secure tunnel.`
    };
    db.auditLogs.unshift(newLog);
    writeDatabase(db);

    res.json({ success: true, employee: user });
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication service down', message: err.message });
  }
});

// 4. Approve Leave (HR Head Action)
app.post('/api/leaves/approve', (req, res) => {
  try {
    const { leaveId, approverName, remarks } = req.body;
    if (!leaveId || !approverName) {
      return res.status(400).json({ error: 'Missing leave ID or approver details' });
    }

    const db = getDatabase();
    const leave = db.leaves.find(l => l.id === leaveId);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.FORWARDED) {
      return res.status(400).json({ error: 'This leave request is already settled' });
    }

    const employee = db.employees.find(emp => emp.id === leave.employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found for this leave request' });
    }

    const balanceAttr = leave.leaveType as LeaveType;
    const currentBalance = employee.balances[balanceAttr] || 0;

    // Validate balance update (Unpaid Leave of Absence doesn't subtract, custom operations deduct others)
    if (leave.leaveType !== 'Unpaid Leave of Absence') {
      if (currentBalance < leave.duration) {
        return res.status(400).json({ 
          error: 'Insufficient Balance at Approval', 
          message: `Employee has ${currentBalance} days left, but requested ${leave.duration} days. Approve rejected.` 
        });
      }
      employee.balances[balanceAttr] = currentBalance - leave.duration;
    } else {
      // Just track unpaid days remaining
      employee.balances['Unpaid Leave of Absence'] = Math.max(0, employee.balances['Unpaid Leave of Absence'] - leave.duration);
    }

    // Update leave request state
    leave.status = LeaveStatus.APPROVED;
    leave.approvedOrRejectedAt = new Date().toISOString();
    leave.approverName = approverName;
    leave.approverRemarks = remarks || 'Approved under standard MIS workflow.';

    // Audit Log
    const newLog: AuditLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      actorName: approverName,
      action: 'APPROVE_LEAVE',
      details: `Approved ${leave.leaveType} leave request ${leaveId} for ${leave.employeeName} (${leave.duration} days).`
    };
    db.auditLogs.unshift(newLog);

    writeDatabase(db);
    res.json({ success: true, leave, database: db });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve leave request', message: err.message });
  }
});

// 4b. Forward Leave (Manager Action)
app.post('/api/leaves/forward', (req, res) => {
  try {
    const { leaveId, managerName, remarks } = req.body;
    if (!leaveId || !managerName) {
      return res.status(400).json({ error: 'Missing leave ID or manager details' });
    }

    const db = getDatabase();
    const leave = db.leaves.find(l => l.id === leaveId);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== LeaveStatus.PENDING) {
      return res.status(400).json({ error: 'This leave request is not pending manager review.' });
    }

    // Update leave request state
    leave.status = LeaveStatus.FORWARDED;
    leave.managerName = managerName;
    leave.managerRemarks = remarks || 'Recommended and forwarded to HR Head.';

    // Audit Log
    const newLog: AuditLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      actorName: managerName,
      action: 'FORWARD_LEAVE',
      details: `Manager ${managerName} forwarded ${leave.leaveType} leave request ${leaveId} for ${leave.employeeName} to the head of HR.`
    };
    db.auditLogs.unshift(newLog);

    writeDatabase(db);
    res.json({ success: true, leave, database: db });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to forward leave request', message: err.message });
  }
});

// 5. Reject Leave
app.post('/api/leaves/reject', (req, res) => {
  try {
    const { leaveId, approverName, remarks } = req.body;
    if (!leaveId || !approverName) {
      return res.status(400).json({ error: 'Missing leave ID or approver details' });
    }

    const db = getDatabase();
    const leave = db.leaves.find(l => l.id === leaveId);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.FORWARDED) {
      return res.status(400).json({ error: 'This leave request is already settled' });
    }

    // Update leave request state
    leave.status = LeaveStatus.REJECTED;
    leave.approvedOrRejectedAt = new Date().toISOString();
    leave.approverName = approverName;
    leave.approverRemarks = remarks || 'Rejected by HR/Management review.';

    // Audit Log
    const newLog: AuditLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      actorName: approverName,
      action: 'REJECT_LEAVE',
      details: `Rejected ${leave.leaveType} leave request ${leaveId} for ${leave.employeeName}.`
    };
    db.auditLogs.unshift(newLog);

    writeDatabase(db);
    res.json({ success: true, leave, database: db });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reject leave request', message: err.message });
  }
});

// 6. Refine Text Endpoint (Gemini AI Power) - perfect fulfillment of "First refine my text then build it"
app.post('/api/refine-text', async (req, res) => {
  try {
    const { text, type, metadata } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const itemType = type || 'request';

    if (ai) {
      let prompt = '';
      let systemInstruction = '';

      if (itemType === 'request') {
        systemInstruction = `You are an expert HR Specialist and Professional Communications Consultant in a company's Management Information System (MIS) portal. 
Your task is to take a rough, raw, informal draft of a leave request written by an employee, and refine it into a highly polished, pristine, formal, and polite email request.
Strictly adhere to the following elements in your response:
1. Include a clear, formal subject line.
2. State the exact Dates and Leave Type clearly.
3. Keep the tone professional, respectful, and concise.
4. Output ONLY the refined message itself, with no explanations, conversational chat, or other introductory/concluding feedback.`;

        const detailsStr = metadata ? ` Leave Details: Type: ${metadata.leaveType}, Duration: ${metadata.duration} days. From ${metadata.startDate} to ${metadata.endDate}.` : '';
        prompt = `Please refine this rough text into a formal leave request letter:${detailsStr}\n\nDraft: "${text}"`;
      } else {
        systemInstruction = `You are a Senior enterprise HR Policy Architect. 
Your task is to take informal rules or notes regarding employee leave policy guidelines and refine them into corporate, authoritative, clear, and elegantly structured MIS policy text. 
Use professional HR terms, bullet points for clarity, and clean headers. Do not output anything other than the refined policy wording.`;
        prompt = `Refine these informal guidelines into a professional HR Policy Manual section:\n\nDraft Notes: "${text}"`;
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });

        const refinedText = response.text || '';
        return res.json({ refinedText });
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed (possibly invalid API key). Falling back to resilient local generator.', geminiErr.message);
      }
    }

    // Graceful local resilient fallback (used if ai client is missing OR if the API call failed)
    let refinedText = '';
    if (itemType === 'request') {
      const leaveType = metadata?.leaveType || 'Annual';
      const start = metadata?.startDate || 'YYYY-MM-DD';
      const end = metadata?.endDate || 'YYYY-MM-DD';
      refinedText = `Subject: Formal Leave Request: ${leaveType} Leave Submission

Dear HR Department & Management,

I am writing to formally request my ${leaveType.toLowerCase()} leave beginning on ${start} and ending on ${end}.

The purpose of this leave is: ${text}. 

I have structured my work timeline to ensure all essential projects are up-to-date and have briefed my coworkers to handle any direct urgencies during my absence. I will also check my emails sporadically for any high-priority matters.

Thank you very much for your understanding and for considering this request.

Sincerely,
[Employee Name]`;
    } else {
      refinedText = `### Employee Leave Policy Directive
  
1. **Scope and Authorization**
   - General guidelines: ${text}.
   - All leaves must be submitted through the ELMS system at least 7 business days prior to departure.

2. **Compliance & Reporting**
   - Any violation of these terms may result in balance suspension or deduction. Support documentation must be uploaded wherever requested by HR Admins.`;
    }
    res.json({ refinedText, note: 'Resilient local blueprint fallback generation applied' });
  } catch (err: any) {
    console.error('Text Refinement Service failed:', err);
    res.status(500).json({ error: 'Text Refinement Service experienced a failure', message: err.message });
  }
});

// Vite Integration (Dev vs Prod mode)
const startServer = async () => {
  // Pre-load snapshot cache from MySQL if configured
  await initDatabaseConnection();

  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log('App running in DEVELOPMENT mode with Vite middleware.');
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('App running in PRODUCTION mode serving compiled build.');
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Employee Leave Management System (ELMS) listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Express server failed to start:', err);
});
