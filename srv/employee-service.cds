using employee.master as db from '../db/schema';

@path : '/employee'
service EmployeeService {

    // ============================================================
    // Employee Master
    // ============================================================
    @odata.draft.enabled
    entity Employees as projection on db.Employees;


    // ============================================================
    // Department Reference Master
    // ============================================================

    @readonly
    entity Departments as projection on db.Departments;


    // ============================================================
    // Manager Reference Master
    // ============================================================

    @readonly
    entity Managers as projection on db.Managers;


    // ============================================================
    // Upload History
    // ============================================================

    entity UploadLogs as projection on db.UploadLogs;


    // ============================================================
    // Upload Validation Errors
    // ============================================================

    entity UploadErrors as projection on db.UploadErrors;


    // ============================================================
    // Excel Upload
    // ============================================================

    action uploadEmployees(
        fileName : String(255),
        fileContent : LargeBinary
    ) returns UploadResult;
    

    // ============================================================
    // Upload Result
    // ============================================================

    type UploadResult {
        totalRecords   : Integer;
        successRecords : Integer;
        failedRecords  : Integer;
        status         : String(30);
        message        : String(500);
    };
}