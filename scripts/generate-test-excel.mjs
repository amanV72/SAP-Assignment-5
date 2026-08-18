/**
 * Generates test-cases.xlsx with edge-case rows for every validation
 * rule in EmployeeService.uploadEmployees().
 *
 * Run from the workspace root:
 *   node scripts/generate-test-excel.mjs
 *
 * Output: test-cases.xlsx (workspace root)
 */

import { createRequire } from "module";
import { writeFileSync } from "fs";

const require = createRequire(import.meta.url);
const XLSX    = require("xlsx");

// ─── Column headers (must match exactly what the service expects) ────────────
const HEADERS = [
    "Employee ID",
    "Employee Name",
    "Email",
    "Department",
    "Manager ID",
    "Joining Date",
    "Salary",
    "Location"
];

// ─── Today and related dates ─────────────────────────────────────────────────
const today = new Date();
today.setHours(0, 0, 0, 0);

const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const fmt = (d) => d.toISOString().split("T")[0];   // YYYY-MM-DD string

// ─── Test rows ────────────────────────────────────────────────────────────────
//  Each row has a comment column (injected as the last header) so the tester
//  knows what to expect.  The service ignores unknown columns, so "Test Case"
//  is purely informational.
const COMMENT_HEADER = "Test Case / Expected Result";

const rows = [
    // ── HAPPY PATH ────────────────────────────────────────────────────────────
    {
        "Employee ID":   "TCEMP001",
        "Employee Name": "Alice Happy",
        "Email":         "alice@company.com",
        "Department":    "IT",
        "Manager ID":    "MGR001",
        "Joining Date":  fmt(yesterday),
        "Salary":        75000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "✅ PASS — fully valid row"
    },
    {
        "Employee ID":   "TCEMP002",
        "Employee Name": "Bob Finance",
        "Email":         "bob.finance@company.com",
        "Department":    "Finance",
        "Manager ID":    "MGR003",
        "Joining Date":  fmt(today),
        "Salary":        120000,
        "Location":      "Mumbai",
        [COMMENT_HEADER]: "✅ PASS — joining date = today (boundary)"
    },
    {
        "Employee ID":   "TCEMP003",
        "Employee Name": "Carol HR",
        "Email":         "carol@company.com",
        "Department":    "HR",
        "Manager ID":    "",
        "Joining Date":  "2020-01-15",
        "Salary":        50000,
        "Location":      "",
        [COMMENT_HEADER]: "✅ PASS — no manager (optional), no location (optional)"
    },

    // ── MANDATORY FIELD MISSING ───────────────────────────────────────────────
    {
        "Employee ID":   "",
        "Employee Name": "No ID Employee",
        "Email":         "noid@company.com",
        "Department":    "IT",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        60000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Employee ID is mandatory"
    },
    {
        "Employee ID":   "TCEMP005",
        "Employee Name": "",
        "Email":         "noname@company.com",
        "Department":    "IT",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        60000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Employee Name is mandatory"
    },
    {
        "Employee ID":   "TCEMP006",
        "Employee Name": "No Email",
        "Email":         "",
        "Department":    "HR",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        55000,
        "Location":      "Mumbai",
        [COMMENT_HEADER]: "❌ FAIL — Email is mandatory"
    },
    {
        "Employee ID":   "TCEMP007",
        "Employee Name": "No Department",
        "Email":         "nodept@company.com",
        "Department":    "",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        55000,
        "Location":      "Mumbai",
        [COMMENT_HEADER]: "❌ FAIL — Department is mandatory"
    },
    {
        "Employee ID":   "TCEMP008",
        "Employee Name": "No Date",
        "Email":         "nodate@company.com",
        "Department":    "Finance",
        "Manager ID":    "",
        "Joining Date":  "",
        "Salary":        55000,
        "Location":      "Bangalore",
        [COMMENT_HEADER]: "❌ FAIL — Joining Date is mandatory"
    },

    // ── EMAIL VALIDATION ─────────────────────────────────────────────────────
    {
        "Employee ID":   "TCEMP009",
        "Employee Name": "Bad Email 1",
        "Email":         "abc.company.com",
        "Department":    "IT",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        60000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Invalid Email (no @ sign)"
    },
    {
        "Employee ID":   "TCEMP010",
        "Employee Name": "Bad Email 2",
        "Email":         "abc@companycom",
        "Department":    "IT",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        60000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Invalid Email (no dot in domain)"
    },
    {
        "Employee ID":   "TCEMP011",
        "Employee Name": "Bad Email 3",
        "Email":         "@company.com",
        "Department":    "HR",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        60000,
        "Location":      "Mumbai",
        [COMMENT_HEADER]: "❌ FAIL — Invalid Email (nothing before @)"
    },
    {
        "Employee ID":   "TCEMP012",
        "Employee Name": "Good Email Subdomain",
        "Email":         "user@mail.company.com",
        "Department":    "Finance",
        "Manager ID":    "MGR005",
        "Joining Date":  fmt(yesterday),
        "Salary":        80000,
        "Location":      "Hyderabad",
        [COMMENT_HEADER]: "✅ PASS — valid subdomain email"
    },

    // ── SALARY VALIDATION ────────────────────────────────────────────────────
    {
        "Employee ID":   "TCEMP013",
        "Employee Name": "Salary Zero",
        "Email":         "zero@company.com",
        "Department":    "IT",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        0,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Salary = 0 (must be > 0)"
    },
    {
        "Employee ID":   "TCEMP014",
        "Employee Name": "Salary Negative",
        "Email":         "negative@company.com",
        "Department":    "IT",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        -1000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Salary = -1000 (must be > 0)"
    },
    {
        "Employee ID":   "TCEMP015",
        "Employee Name": "Salary Exactly Limit",
        "Email":         "limit@company.com",
        "Department":    "HR",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        5000000,
        "Location":      "Mumbai",
        [COMMENT_HEADER]: "❌ FAIL — Salary = 50,00,000 (must be < 50,00,000, exclusive)"
    },
    {
        "Employee ID":   "TCEMP016",
        "Employee Name": "Salary One Below Limit",
        "Email":         "belowlimit@company.com",
        "Department":    "HR",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        4999999,
        "Location":      "Mumbai",
        [COMMENT_HEADER]: "✅ PASS — Salary = 49,99,999 (just under limit)"
    },
    {
        "Employee ID":   "TCEMP017",
        "Employee Name": "Salary Text",
        "Email":         "textsal@company.com",
        "Department":    "Finance",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        "ABCXYZ",
        "Location":      "Bangalore",
        [COMMENT_HEADER]: "❌ FAIL — Salary is non-numeric text"
    },
    {
        "Employee ID":   "TCEMP018",
        "Employee Name": "Salary Blank",
        "Email":         "blanksal@company.com",
        "Department":    "Finance",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        "",
        "Location":      "Bangalore",
        [COMMENT_HEADER]: "✅ PASS — Salary is optional; blank is allowed"
    },

    // ── DATE VALIDATION ───────────────────────────────────────────────────────
    {
        "Employee ID":   "TCEMP019",
        "Employee Name": "Future Date",
        "Email":         "future@company.com",
        "Department":    "IT",
        "Manager ID":    "",
        "Joining Date":  fmt(tomorrow),
        "Salary":        70000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Joining Date is a future date"
    },
    {
        "Employee ID":   "TCEMP020",
        "Employee Name": "Invalid Date String",
        "Email":         "baddate@company.com",
        "Department":    "HR",
        "Manager ID":    "",
        "Joining Date":  "32-13-2024",
        "Salary":        70000,
        "Location":      "Mumbai",
        [COMMENT_HEADER]: "❌ FAIL — Invalid date format (day=32, month=13)"
    },
    {
        "Employee ID":   "TCEMP021",
        "Employee Name": "Date as Text",
        "Email":         "datetext@company.com",
        "Department":    "Finance",
        "Manager ID":    "",
        "Joining Date":  "not-a-date",
        "Salary":        70000,
        "Location":      "Bangalore",
        [COMMENT_HEADER]: "❌ FAIL — Joining Date is not a date at all"
    },

    // ── DEPARTMENT VALIDATION ─────────────────────────────────────────────────
    {
        "Employee ID":   "TCEMP022",
        "Employee Name": "Wrong Dept",
        "Email":         "wrongdept@company.com",
        "Department":    "Marketing",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        60000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Department 'Marketing' not in ref table"
    },
    {
        "Employee ID":   "TCEMP023",
        "Employee Name": "Dept Case Wrong",
        "Email":         "deptcase@company.com",
        "Department":    "it",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        60000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Department 'it' (lowercase) not in ref table (case-sensitive)"
    },

    // ── MANAGER VALIDATION ────────────────────────────────────────────────────
    {
        "Employee ID":   "TCEMP024",
        "Employee Name": "Invalid Manager",
        "Email":         "invmgr@company.com",
        "Department":    "IT",
        "Manager ID":    "MGR999",
        "Joining Date":  fmt(yesterday),
        "Salary":        65000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — Manager ID 'MGR999' not in ref table"
    },
    {
        "Employee ID":   "TCEMP025",
        "Employee Name": "Valid Manager 5",
        "Email":         "mgr5@company.com",
        "Department":    "Finance",
        "Manager ID":    "MGR005",
        "Joining Date":  fmt(yesterday),
        "Salary":        90000,
        "Location":      "Hyderabad",
        [COMMENT_HEADER]: "✅ PASS — Manager ID 'MGR005' (Rohit Mehta) is valid"
    },

    // ── DUPLICATE CHECKS ─────────────────────────────────────────────────────
    {
        "Employee ID":   "TCEMP026",
        "Employee Name": "Duplicate A",
        "Email":         "dupa@company.com",
        "Department":    "IT",
        "Manager ID":    "MGR001",
        "Joining Date":  fmt(yesterday),
        "Salary":        70000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "✅ PASS — first occurrence of TCEMP026"
    },
    {
        "Employee ID":   "TCEMP026",
        "Employee Name": "Duplicate A (copy)",
        "Email":         "dupa2@company.com",
        "Department":    "IT",
        "Manager ID":    "MGR001",
        "Joining Date":  fmt(yesterday),
        "Salary":        70000,
        "Location":      "Pune",
        [COMMENT_HEADER]: "❌ FAIL — TCEMP026 appears twice in this sheet (in-Excel duplicate)"
    },
    {
        "Employee ID":   "EMP001",
        "Employee Name": "DB Duplicate",
        "Email":         "dbdup@company.com",
        "Department":    "HR",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        70000,
        "Location":      "Mumbai",
        [COMMENT_HEADER]: "❌ FAIL — EMP001 already exists in the database"
    },

    // ── LEADING / TRAILING WHITESPACE (edge) ─────────────────────────────────
    {
        "Employee ID":   "  TCEMP028  ",
        "Employee Name": "  Whitespace Edges  ",
        "Email":         "  ws@company.com  ",
        "Department":    "  IT  ",
        "Manager ID":    "  MGR002  ",
        "Joining Date":  fmt(yesterday),
        "Salary":        60000,
        "Location":      "  Pune  ",
        [COMMENT_HEADER]: "✅ PASS — service trims all string fields before validation"
    },

    // ── BOUNDARY SALARY ───────────────────────────────────────────────────────
    {
        "Employee ID":   "TCEMP029",
        "Employee Name": "Salary One Rupee",
        "Email":         "onerupee@company.com",
        "Department":    "IT",
        "Manager ID":    "",
        "Joining Date":  fmt(yesterday),
        "Salary":        1,
        "Location":      "Pune",
        [COMMENT_HEADER]: "✅ PASS — minimum valid salary (> 0)"
    },
    {
        "Employee ID":   "TCEMP030",
        "Employee Name": "Salary Decimal",
        "Email":         "decimal@company.com",
        "Department":    "Finance",
        "Manager ID":    "MGR003",
        "Joining Date":  fmt(yesterday),
        "Salary":        1234.56,
        "Location":      "Bangalore",
        [COMMENT_HEADER]: "✅ PASS — decimal salary (Decimal(15,2) in schema)"
    },
];

// ─── Build worksheet ─────────────────────────────────────────────────────────
const allHeaders = [...HEADERS, COMMENT_HEADER];

const wsData = [
    allHeaders,
    ...rows.map(r => allHeaders.map(h => r[h] ?? ""))
];

const ws = XLSX.utils.aoa_to_sheet(wsData);

// ── Column widths for readability ────────────────────────────────────────────
ws["!cols"] = [
    { wch: 14 },   // Employee ID
    { wch: 24 },   // Employee Name
    { wch: 30 },   // Email
    { wch: 14 },   // Department
    { wch: 12 },   // Manager ID
    { wch: 14 },   // Joining Date
    { wch: 12 },   // Salary
    { wch: 14 },   // Location
    { wch: 58 },   // Test Case / Expected Result
];

// ── Freeze the header row ────────────────────────────────────────────────────
ws["!freeze"] = { xSplit: 0, ySplit: 1 };

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Test Cases");

// ─── Write file ──────────────────────────────────────────────────────────────
const OUT = "test-cases.xlsx";
XLSX.writeFile(wb, OUT);
console.log(`✅  Written: ${OUT}  (${rows.length} test rows)`);
