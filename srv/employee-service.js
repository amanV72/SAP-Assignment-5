const cds = require('@sap/cds');
const XLSX = require('xlsx');

class EmployeeService extends cds.ApplicationService {

    async init() {

        const { Employees, Departments, Managers, UploadLogs, UploadErrors } = this.entities;

        // ============================================================
        // Excel Upload
        // ============================================================

        this.on('uploadEmployees', async (req) => {

            const {
                fileName,
                fileContent
            } = req.data;

            // --------------------------------------------------------
            // Basic file validation
            // --------------------------------------------------------

            if (!fileName) {
                return req.error(400, 'File name is required');
            }

            if (!fileContent) {
                return req.error(400, 'Excel file is required');
            }

            if (!fileName.toLowerCase().endsWith('.xlsx')) {
                return req.error(400, 'Only .xlsx Excel files are allowed');
            }

            // --------------------------------------------------------
            // Convert Base64 → Buffer
            // --------------------------------------------------------

            let buffer;

            try {
                buffer = Buffer.from(fileContent, 'base64');
            } catch (error) {
                return req.error(400, 'Invalid Excel file content');
            }

            // --------------------------------------------------------
            // Read Excel
            // --------------------------------------------------------

            let workbook;

            try {
                workbook = XLSX.read(buffer, {
                    type: 'buffer',
                    cellDates: true
                });
            } catch (error) {
                return req.error(400, 'Unable to read Excel file');
            }

            if (!workbook.SheetNames.length) {
                return req.error(400, 'Excel file does not contain any sheet');
            }

            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const rows = XLSX.utils.sheet_to_json(sheet, {
                defval: ''
            });

            if (!rows.length) {
                return req.error(400, 'Excel file is empty');
            }

            // --------------------------------------------------------
            // Required Excel columns
            // --------------------------------------------------------

            const requiredColumns = [
                'Employee ID',
                'Employee Name',
                'Email',
                'Department',
                'Joining Date'
            ];

            const excelColumns = Object.keys(rows[0]);

            const missingColumns = requiredColumns.filter(
                column => !excelColumns.includes(column)
            );

            if (missingColumns.length) {
                return req.error(
                    400,
                    `Missing Excel columns: ${missingColumns.join(', ')}`
                );
            }

            // --------------------------------------------------------
            // Load reference data
            // --------------------------------------------------------

            const departments = await SELECT.from(Departments);

            const managers = await SELECT.from(Managers);

            const existingEmployees = await SELECT.from(Employees);

            const departmentSet = new Set(
                departments.map(d => d.departmentName)
            );

            const managerSet = new Set(
                managers.map(m => m.managerId)
            );

            const employeeSet = new Set(
                existingEmployees.map(e => e.employeeId)
            );

            // Used to detect duplicates INSIDE Excel
            const excelEmployeeSet = new Set();

            const validEmployees = [];
            const errors = [];

            // --------------------------------------------------------
            // Process every Excel row
            // --------------------------------------------------------

            rows.forEach((row, index) => {

                // Excel row number
                // Header = row 1
                const rowNo = index + 2;

                const employeeId =
                    String(row['Employee ID'] || '').trim();

                const employeeName =
                    String(row['Employee Name'] || '').trim();

                const email =
                    String(row['Email'] || '').trim();

                const department =
                    String(row['Department'] || '').trim();

                const managerId =
                    String(row['Manager ID'] || '').trim();

                const joiningDate =
                    row['Joining Date'];

                const salaryValue =
                    row['Salary'];

                const location =
                    String(row['Location'] || '').trim();

                // ----------------------------------------------------
                // Mandatory validation
                // ----------------------------------------------------

                if (!employeeId) {
                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage: 'Employee ID is mandatory'
                    });

                    return;
                }

                if (!employeeName) {
                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage: 'Employee Name is mandatory'
                    });

                    return;
                }

                if (!email) {
                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage: 'Email is mandatory'
                    });

                    return;
                }

                if (!department) {
                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage: 'Department is mandatory'
                    });

                    return;
                }

                if (!joiningDate) {
                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage: 'Joining Date is mandatory'
                    });

                    return;
                }

                // ----------------------------------------------------
                // Duplicate inside Excel
                // ----------------------------------------------------

                if (excelEmployeeSet.has(employeeId)) {

                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage:
                            'Duplicate Employee ID in uploaded Excel'
                    });

                    return;
                }

                excelEmployeeSet.add(employeeId);

                // ----------------------------------------------------
                // Duplicate against database
                // ----------------------------------------------------

                if (employeeSet.has(employeeId)) {

                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage:
                            'Employee ID already exists in database'
                    });

                    return;
                }

                // ----------------------------------------------------
                // Email validation
                // ----------------------------------------------------

                const emailRegex =
                    /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

                if (!emailRegex.test(email)) {

                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage: 'Invalid Email'
                    });

                    return;
                }

                // ----------------------------------------------------
                // Department validation
                // ----------------------------------------------------

                if (!departmentSet.has(department)) {

                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage:
                            `Invalid Department: ${department}`
                    });

                    return;
                }

                // ----------------------------------------------------
                // Manager validation
                // ----------------------------------------------------

                if (managerId && !managerSet.has(managerId)) {

                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage:
                            `Invalid Manager ID: ${managerId}`
                    });

                    return;
                }

                // ----------------------------------------------------
                // Salary validation
                // ----------------------------------------------------

                let salary = null;

                if (
                    salaryValue !== '' &&
                    salaryValue !== null &&
                    salaryValue !== undefined
                ) {

                    salary = Number(salaryValue);

                    if (
                        Number.isNaN(salary) ||
                        salary <= 0 ||
                        salary >= 5000000
                    ) {

                        errors.push({
                            rowNo,
                            employeeId,
                            errorMessage:
                                'Salary must be greater than 0 and less than 5000000'
                        });

                        return;
                    }
                }

                // ----------------------------------------------------
                // Joining Date validation
                // ----------------------------------------------------

                let parsedJoiningDate;

                if (joiningDate instanceof Date) {

                    parsedJoiningDate = joiningDate;

                } else {

                    parsedJoiningDate =
                        new Date(joiningDate);
                }

                if (
                    Number.isNaN(
                        parsedJoiningDate.getTime()
                    )
                ) {

                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage:
                            'Invalid Joining Date'
                    });

                    return;
                }

                const today = new Date();

                today.setHours(0, 0, 0, 0);

                parsedJoiningDate.setHours(0, 0, 0, 0);

                if (parsedJoiningDate > today) {

                    errors.push({
                        rowNo,
                        employeeId,
                        errorMessage:
                            'Joining Date cannot be a future date'
                    });

                    return;
                }

                // ----------------------------------------------------
                // Valid Employee
                // ----------------------------------------------------

                validEmployees.push({
                    employeeId,
                    employeeName,
                    email,
                    department_departmentName: department,
                    manager_managerId: managerId || null,
                    joiningDate: parsedJoiningDate
                        .toISOString()
                        .split('T')[0],
                    salary,
                    location
                });

            });

            // --------------------------------------------------------
            // Insert valid employees
            // --------------------------------------------------------

            if (validEmployees.length) {

                await INSERT.into(Employees)
                    .entries(validEmployees);
            }

            // --------------------------------------------------------
            // Create Upload Log
            // --------------------------------------------------------

            const uploadId = cds.utils.uuid();

            const totalRecords = rows.length;

            const successRecords = validEmployees.length;

            const failedRecords = errors.length;

            let status = 'SUCCESS';

            if (failedRecords > 0 && successRecords > 0) {
                status = 'PARTIAL';
            }

            if (failedRecords > 0 && successRecords === 0) {
                status = 'FAILED';
            }

            await INSERT.into(UploadLogs).entries({
                ID: uploadId,
                fileName,
                uploadedBy: req.user.id,
                uploadDate: new Date(),
                totalRecords,
                successRecords,
                failedRecords,
                status
            });

            // --------------------------------------------------------
            // Save validation errors
            // --------------------------------------------------------

            if (errors.length) {

                const errorEntries = errors.map(error => ({
                    ID: cds.utils.uuid(),
                    upload_ID: uploadId,
                    rowNo: error.rowNo,
                    employeeId: error.employeeId || null,
                    errorMessage: error.errorMessage
                }));

                await INSERT.into(UploadErrors)
                    .entries(errorEntries);
            }

            // --------------------------------------------------------
            // Response
            // --------------------------------------------------------

            return {
                uploadId: uploadId,
                totalRecords,
                successRecords,
                failedRecords,
                status,
                message:
                    status === 'SUCCESS'
                        ? 'All employees uploaded successfully'
                        : `${failedRecords} record(s) failed validation`
            };
        });

        await super.init();
    }
}

module.exports = EmployeeService;