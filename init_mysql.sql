-- ELMS Database Initialization Script for MySQL / XAMPP / WampServer
-- Database Name: elms_db

CREATE DATABASE IF NOT EXISTS `elms_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `elms_db`;

-- Drop existing tables for a clean setup
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `leave_requests`;
DROP TABLE IF EXISTS `leave_policies`;
DROP TABLE IF EXISTS `leave_balances`;
DROP TABLE IF EXISTS `employees`;

-- 1. Employees Table
CREATE TABLE `employees` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL DEFAULT 'password123',
  `role` ENUM('HR Admin', 'Manager', 'Employee') NOT NULL DEFAULT 'Employee',
  `department` VARCHAR(100) NOT NULL,
  `joinDate` DATE NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Leave Balances Table
CREATE TABLE `leave_balances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employeeId` VARCHAR(50) NOT NULL,
  `leaveType` VARCHAR(50) NOT NULL,
  `balance` INT NOT NULL DEFAULT 0,
  FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `emp_leave_type` (`employeeId`, `leaveType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Leave Policies Table
CREATE TABLE `leave_policies` (
  `leaveType` VARCHAR(50) PRIMARY KEY,
  `yearlyLimit` INT NOT NULL,
  `maxConsecutiveDays` INT NOT NULL,
  `requiresDocumentation` TINYINT(1) NOT NULL DEFAULT 0,
  `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Leave Requests Table
CREATE TABLE `leave_requests` (
  `id` VARCHAR(50) PRIMARY KEY,
  `employeeId` VARCHAR(50) NOT NULL,
  `employeeName` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `leaveType` VARCHAR(50) NOT NULL,
  `startDate` DATE NOT NULL,
  `endDate` DATE NOT NULL,
  `duration` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `refinedReason` TEXT DEFAULT NULL,
  `attachmentName` VARCHAR(255) DEFAULT NULL,
  `attachmentData` LONGTEXT DEFAULT NULL,
  `status` ENUM('Pending', 'Forwarded', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  `managerName` VARCHAR(150) DEFAULT NULL,
  `managerRemarks` TEXT DEFAULT NULL,
  `approverName` VARCHAR(150) DEFAULT NULL,
  `approverRemarks` TEXT DEFAULT NULL,
  `requestedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approvedOrRejectedAt` DATETIME DEFAULT NULL,
  FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Audit Logs Table
CREATE TABLE `audit_logs` (
  `id` VARCHAR(50) PRIMARY KEY,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actorName` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data: Employees
INSERT INTO `employees` (`id`, `name`, `email`, `password`, `role`, `department`, `joinDate`) VALUES
('EMP-101', 'Imran Tar', 'imrani.tar@gmail.com', 'password123', 'HR Admin', 'Human Resources', '2023-03-10'),
('EMP-202', 'Sarah Connor', 'sarah.connor@allied.com', 'password123', 'Manager', 'Operations', '2023-01-15'),
('EMP-303', 'Michael Scott', 'michael.scott@dundermifflin.com', 'password123', 'Employee', 'Sales', '2022-04-01'),
('EMP-404', 'Alan Turing', 'alan.turing@bletchley.edu', 'password123', 'Employee', 'Engineering', '2024-02-12'),
('EMP-505', 'Ada Lovelace', 'ada.lovelace@analytical.org', 'password123', 'Employee', 'Engineering', '2024-05-18');

-- Seed Data: Policies
INSERT INTO `leave_policies` (`leaveType`, `yearlyLimit`, `maxConsecutiveDays`, `requiresDocumentation`, `description`) VALUES
('Earn Leave', 20, 14, 0, 'Earned paid leave accumulated over service time.'),
('Casual Leave', 10, 3, 0, 'Leave for short-term urgent personal matters.'),
('Maternity Leave', 120, 90, 1, 'Paid maternity leave for female employees.'),
('Medical Leave', 14, 7, 1, 'Paid sick leave for illness, surgery, or medical recovery.'),
('Duty Leave', 15, 10, 0, 'Leave granted for official duties or external assignments.'),
('Unpaid Leave of Absence', 30, 30, 0, 'Extended leave of absence without pay.'),
('Other Leave', 10, 5, 0, 'Miscellaneous leave requiring special approval.');

-- Seed Data: Leave Balances for all employees
INSERT INTO `leave_balances` (`employeeId`, `leaveType`, `balance`) VALUES
('EMP-101', 'Earn Leave', 18), ('EMP-101', 'Casual Leave', 8), ('EMP-101', 'Maternity Leave', 120), ('EMP-101', 'Medical Leave', 12), ('EMP-101', 'Duty Leave', 15), ('EMP-101', 'Unpaid Leave of Absence', 30), ('EMP-101', 'Other Leave', 10),
('EMP-202', 'Earn Leave', 12), ('EMP-202', 'Casual Leave', 10), ('EMP-202', 'Maternity Leave', 120), ('EMP-202', 'Medical Leave', 14), ('EMP-202', 'Duty Leave', 15), ('EMP-202', 'Unpaid Leave of Absence', 30), ('EMP-202', 'Other Leave', 10),
('EMP-303', 'Earn Leave', 15), ('EMP-303', 'Casual Leave', 6), ('EMP-303', 'Maternity Leave', 120), ('EMP-303', 'Medical Leave', 10), ('EMP-303', 'Duty Leave', 15), ('EMP-303', 'Unpaid Leave of Absence', 30), ('EMP-303', 'Other Leave', 10),
('EMP-404', 'Earn Leave', 15), ('EMP-404', 'Casual Leave', 8), ('EMP-404', 'Maternity Leave', 120), ('EMP-404', 'Medical Leave', 14), ('EMP-404', 'Duty Leave', 15), ('EMP-404', 'Unpaid Leave of Absence', 30), ('EMP-404', 'Other Leave', 10),
('EMP-505', 'Earn Leave', 18), ('EMP-505', 'Casual Leave', 8), ('EMP-505', 'Maternity Leave', 120), ('EMP-505', 'Medical Leave', 12), ('EMP-505', 'Duty Leave', 15), ('EMP-505', 'Unpaid Leave of Absence', 30), ('EMP-505', 'Other Leave', 10);

-- Seed Data: Initial Leave Requests
INSERT INTO `leave_requests` (`id`, `employeeId`, `employeeName`, `department`, `leaveType`, `startDate`, `endDate`, `duration`, `reason`, `status`, `requestedAt`) VALUES
('LV-401', 'EMP-404', 'Alan Turing', 'Engineering', 'Earn Leave', '2026-07-10', '2026-07-15', 5, 'Summer holiday vacation.', 'Approved', '2026-06-10 10:00:00'),
('LV-402', 'EMP-303', 'Michael Scott', 'Sales', 'Casual Leave', '2026-06-20', '2026-06-22', 2, 'Emergency plumbing repair.', 'Rejected', '2026-06-12 08:30:00'),
('LV-403', 'EMP-505', 'Ada Lovelace', 'Engineering', 'Medical Leave', '2026-06-14', '2026-06-15', 2, 'Medical wisdom tooth surgery.', 'Approved', '2026-06-13 16:45:00');

-- Seed Data: Audit Logs
INSERT INTO `audit_logs` (`id`, `timestamp`, `actorName`, `action`, `details`) VALUES
('LOG-001', '2026-06-13 17:10:00', 'Imran Tar', 'APPROVE_LEAVE', 'Approved Medical Leave request LV-403 for Ada Lovelace (Duration: 2 days)');
