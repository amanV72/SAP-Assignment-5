namespace employee.master;

using { cuid, managed } from '@sap/cds/common';


// ============================================================
// Department Reference Master
// ============================================================

entity Departments {
    key departmentName : String(100);
}


// ============================================================
// Manager Reference Master
// ============================================================

entity Managers {
    key managerId   : String(20);
    managerName : String(100) not null;
}


// ============================================================
// Employee Master
// ============================================================

entity Employees : managed {

    key employeeId   : String(20) ;

    employeeName : String(100) not null;

    email        : String(150) not null @assert.format: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$';

    department   : Association to Departments not null;

    manager      : Association to Managers;

    joiningDate  : Date not null;

    salary       : Decimal(15,2) @assert.range: [0, 5000000];

    location     : String(100);
}


// ============================================================
// Excel Upload Log
// ============================================================

entity UploadLogs : cuid, managed {

    fileName       : String(255) not null;

    uploadedBy     : String(100);

    uploadDate     : Timestamp;

    totalRecords   : Integer;

    successRecords : Integer;

    failedRecords  : Integer;

    status         : String(30);
}


// ============================================================
// Upload Validation Errors
// ============================================================

entity UploadErrors : cuid {

    upload        : Association to UploadLogs not null;

    rowNo         : Integer not null;

    employeeId    : String(20);

    errorMessage  : String(500) not null;
}