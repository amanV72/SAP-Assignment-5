sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/m/Title",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/ScrollContainer",
    "sap/m/BusyDialog",
    "sap/ui/core/Icon"
], (
    Controller, JSONModel, MessageBox, MessageToast,
    Dialog, Button, VBox, HBox, MText, MTitle,
    MTable, MColumn, ColumnListItem, ScrollContainer,
    BusyDialog, Icon
) => {
    "use strict";

    return Controller.extend("com.employee.employeemasterui.controller.ListView", {

        // ============================================================
        // Lifecycle
        // ============================================================

        onInit() {
            // Rows model — employee list
            const oRowsModel = new JSONModel({ all: [], filtered: [] });
            this.getView().setModel(oRowsModel, "rows");

            // Departments model — "All departments" + dynamic items from OData
            const oDeptsModel = new JSONModel({ items: [] });
            this.getView().setModel(oDeptsModel, "depts");

            // Managers model — "All managers" + dynamic items from OData
            const oMgrsModel = new JSONModel({ items: [] });
            this.getView().setModel(oMgrsModel, "mgrs");

            this._loadEmployees();
            this._loadDepartments();
            this._loadManagers();
        },


        // ============================================================
        // Data Loading
        // ============================================================

        _loadEmployees() {
            const oModel      = this.getOwnerComponent().getModel();
            const oListBinding = oModel.bindList("/Employees", null, [], [], {
                $expand: "department,manager"
            });

            oListBinding.requestContexts(0, Infinity).then((aContexts) => {
                const aEmployees = aContexts.map((oCtx) => {
                    const oData = oCtx.getObject();
                    return {
                        employeeId:               oData.employeeId,
                        employeeName:             oData.employeeName,
                        email:                    oData.email,
                        department_departmentName: oData.department
                            ? oData.department.departmentName
                            : (oData.department_departmentName || ""),
                        manager_managerId:         oData.manager
                            ? oData.manager.managerId
                            : (oData.manager_managerId || ""),
                        // ← now exposed for the Manager column in the table
                        manager_managerName:       oData.manager
                            ? oData.manager.managerName
                            : "",
                        joiningDate:              oData.joiningDate,
                        salary:                   oData.salary,
                        location:                 oData.location
                    };
                });

                const oRowsModel = this.getView().getModel("rows");
                oRowsModel.setProperty("/all", aEmployees);
                oRowsModel.setProperty("/filtered", aEmployees);
                this._updateCountText(aEmployees.length);

            }).catch((oError) => {
                MessageBox.error("Failed to load employees: " + (oError.message || oError));
            });
        },

        // ── Fix 1: Load Departments from OData and populate the depts model ──
        _loadDepartments() {
            const oModel   = this.getOwnerComponent().getModel();
            const oBinding = oModel.bindList("/Departments");

            oBinding.requestContexts(0, Infinity).then((aCtx) => {
                // Prepend the "All departments" sentinel item
                const aItems = [{ key: "ALL", text: "All departments" }].concat(
                    aCtx.map((oCtx) => {
                        const sName = oCtx.getObject().departmentName;
                        return { key: sName, text: sName };
                    })
                );
                this.getView().getModel("depts").setProperty("/items", aItems);
            }).catch(() => {
                // Fallback — keep an "All departments" only item; filter still works
                this.getView().getModel("depts")
                    .setProperty("/items", [{ key: "ALL", text: "All departments" }]);
            });
        },

        // ── Load Managers from OData and populate the mgrs model ─────────────
        _loadManagers() {
            const oModel   = this.getOwnerComponent().getModel();
            const oBinding = oModel.bindList("/Managers");

            oBinding.requestContexts(0, Infinity).then((aCtx) => {
                const aItems = [{ key: "ALL", text: "All managers" }].concat(
                    aCtx.map((oCtx) => {
                        const o = oCtx.getObject();
                        return { key: o.managerId, text: o.managerName };
                    })
                );
                this.getView().getModel("mgrs").setProperty("/items", aItems);
            }).catch(() => {
                this.getView().getModel("mgrs")
                    .setProperty("/items", [{ key: "ALL", text: "All managers" }]);
            });
        },


        // ============================================================
        // Search & Filter
        // ============================================================

        onSearch() {
            this._applyFilters();
        },

        onDepartmentFilter() {
            this._applyFilters();
        },

        onManagerFilter() {
            this._applyFilters();
        },

        _applyFilters() {
            const oView       = this.getView();
            const sQuery      = oView.byId("employeeSearchField").getValue().toLowerCase().trim();
            const sDepartment = oView.byId("departmentFilter").getSelectedKey();
            const sManager    = oView.byId("managerFilter").getSelectedKey();
            const oRowsModel  = oView.getModel("rows");
            const aAll        = oRowsModel.getProperty("/all");

            const aFiltered = aAll.filter((oEmp) => {
                const bMatchSearch = !sQuery ||
                    (oEmp.employeeId       || "").toLowerCase().includes(sQuery) ||
                    (oEmp.employeeName     || "").toLowerCase().includes(sQuery) ||
                    (oEmp.email            || "").toLowerCase().includes(sQuery);

                const bMatchDept = sDepartment === "ALL" ||
                    (oEmp.department_departmentName || "") === sDepartment;

                const bMatchMgr = sManager === "ALL" ||
                    (oEmp.manager_managerId || "") === sManager;

                return bMatchSearch && bMatchDept && bMatchMgr;
            });

            oRowsModel.setProperty("/filtered", aFiltered);
            this._updateCountText(aFiltered.length);
        },

        _updateCountText(iCount) {
            const oText = this.getView().byId("employeeCountText");
            if (oText) {
                oText.setText(iCount + " employee" + (iCount !== 1 ? "s" : ""));
            }
        },


        // ============================================================
        // Refresh
        // ============================================================

        onRefresh() {
            const oView = this.getView();
            const oSearch = oView.byId("employeeSearchField");
            if (oSearch) { oSearch.setValue(""); }
            const oDeptFilter = oView.byId("departmentFilter");
            if (oDeptFilter) { oDeptFilter.setSelectedKey("ALL"); }
            const oMgrFilter = oView.byId("managerFilter");
            if (oMgrFilter) { oMgrFilter.setSelectedKey("ALL"); }

            this._loadEmployees();
            MessageToast.show("Employee data refreshed");
        },

        onUploadHistory() {
            this.getOwnerComponent().getRouter()
                .navTo("RouteUploadHistory");
        },


        // ============================================================
        // Row Navigation
        // ============================================================

        onEmployeePress(oEvent) {
            const oItem    = oEvent.getSource();
            const oContext = oItem.getBindingContext("rows");
            if (!oContext) { return; }
            const oEmployee = oContext.getObject();
            MessageToast.show("Selected: " + oEmployee.employeeName);
        },


        // ============================================================
        // Excel Upload — entry point
        // ============================================================

        onUploadExcel() {
            if (!this._oFileInput) {
                this._oFileInput = document.createElement("input");
                this._oFileInput.type   = "file";
                this._oFileInput.accept = ".xlsx";
                this._oFileInput.style.display = "none";
                document.body.appendChild(this._oFileInput);

                this._oFileInput.addEventListener("change", (oEvent) => {
                    const oFile = oEvent.target.files[0];
                    if (oFile) { this._processUploadFile(oFile); }
                    this._oFileInput.value = "";
                });
            }
            this._oFileInput.click();
        },

        _processUploadFile(oFile) {
            if (!oFile.name.toLowerCase().endsWith(".xlsx")) {
                MessageBox.error("Only .xlsx Excel files are allowed.");
                return;
            }

            const oReader = new FileReader();

            oReader.onload = (oLoadEvent) => {
                const sBase64   = oLoadEvent.target.result.split(",")[1];
                const sFileName = oFile.name;
                this._callUploadAction(sFileName, sBase64);
            };

            oReader.onerror = () => {
                MessageBox.error("Failed to read the selected file.");
            };

            oReader.readAsDataURL(oFile);
        },


        // ============================================================
        // Excel Upload — OData action call
        // ============================================================

        _callUploadAction(sFileName, sBase64) {
            // Show busy indicator
            if (!this._oBusyDialog) {
                this._oBusyDialog = new BusyDialog({
                    title: "Uploading...",
                    text:  "Validating and saving employee records"
                });
            }
            this._oBusyDialog.open();

            const oModel         = this.getOwnerComponent().getModel();
            const oActionBinding = oModel.bindContext("/uploadEmployees(...)");

            oActionBinding.setParameter("fileName",    sFileName);
            oActionBinding.setParameter("fileContent", sBase64);

            oActionBinding.execute()
                .then(() => {
                    this._oBusyDialog.close();
                    const oResult = oActionBinding.getBoundContext().getObject();
                    this._loadEmployees();
                    this._fetchErrorsAndShowDialog(oResult);
                })
                .catch((oError) => {
                    this._oBusyDialog.close();
                    const sMsg = oError.message || JSON.stringify(oError);
                    MessageBox.error("Upload failed: " + sMsg);
                });
        },


        // ============================================================
        // Fetch UploadErrors and show result dialog
        // ============================================================

        /**
         * After a successful uploadEmployees call, reads the latest
         * UploadErrors from the server (linked to the newest UploadLog)
         * and opens the rich result dialog.
         *
         * @param {object} oResult  - UploadResult from the action
         */
        _fetchErrorsAndShowDialog(oResult) {
            const iTotal    = oResult.totalRecords   || 0;
            const iSuccess  = oResult.successRecords || 0;
            const iFailed   = oResult.failedRecords  || 0;
            const sStatus   = oResult.status         || "SUCCESS";
            const sUploadId = oResult.uploadId       || "";

            if (iFailed === 0) {
                // Pure success — no error table needed
                this._openResultDialog(sStatus, iTotal, iSuccess, 0, []);
                return;
            }

            if (!sUploadId) {
                // No upload ID in response — show summary without error detail
                this._openResultDialog(sStatus, iTotal, iSuccess, iFailed, []);
                return;
            }

            // Filter UploadErrors by the exact upload_ID returned by the action.
            // The @Capabilities.FilterRestrictions.Filterable annotation on the
            // UploadErrors entity enables $filter for this entity.
            const oModel      = this.getOwnerComponent().getModel();
            const oErrBinding = oModel.bindList(
                "/UploadErrors",
                null, [], [],
                { $filter: `upload_ID eq ${sUploadId}` }
            );

            oErrBinding.requestContexts(0, Infinity).then((aErrCtx) => {
                const aErrors = aErrCtx
                    .map((oCtx) => oCtx.getObject())
                    .sort((a, b) => (a.rowNo || 0) - (b.rowNo || 0))
                    .map((o) => ({
                        rowNo:        o.rowNo,
                        employeeId:   o.employeeId   || "—",
                        errorMessage: o.errorMessage || ""
                    }));
                this._openResultDialog(sStatus, iTotal, iSuccess, iFailed, aErrors);
            }).catch(() => {
                this._openResultDialog(sStatus, iTotal, iSuccess, iFailed, []);
            });
        },


        // ============================================================
        // Rich Result Dialog
        // ============================================================

        /**
         * Builds and opens the upload result dialog programmatically.
         * Shows a colour-coded summary bar and — when there are errors —
         * a scrollable table with Row No | Employee ID | Error Message.
         */
        _openResultDialog(sStatus, iTotal, iSuccess, iFailed, aErrors) {

            // ── summary colour ──────────────────────────────────────
            const mStatusStyle = {
                SUCCESS: { icon: "sap-icon://accept",        color: "#188918", label: "Upload Successful" },
                PARTIAL: { icon: "sap-icon://warning",       color: "#e9730c", label: "Upload Partially Successful" },
                FAILED:  { icon: "sap-icon://error",         color: "#bb0000", label: "Upload Failed" }
            };
            const oStyle = mStatusStyle[sStatus] || mStatusStyle.PARTIAL;

            // ── header ──────────────────────────────────────────────
            const oHeaderIcon = new Icon({
                src:  oStyle.icon,
                size: "1.4rem",
                color: oStyle.color
            }).addStyleClass("uploadResultIcon");

            const oHeaderTitle = new MTitle({
                text:  oStyle.label,
                level: "H2"
            }).addStyleClass("uploadResultTitle");

            const oHeader = new HBox({
                alignItems: "Center",
                items: [ oHeaderIcon, oHeaderTitle ]
            }).addStyleClass("uploadResultHeader");

            // ── summary pills ────────────────────────────────────────
            const _pill = (sLabel, iVal, sCls) =>
                new VBox({ alignItems: "Center" })
                    .addStyleClass("uploadSummaryPill " + sCls)
                    .addItem(new MText({ text: String(iVal) }).addStyleClass("uploadPillNumber"))
                    .addItem(new MText({ text: sLabel       }).addStyleClass("uploadPillLabel"));

            const oSummaryBar = new HBox({
                justifyContent: "SpaceAround",
                items: [
                    _pill("Total",   iTotal,   "pillTotal"),
                    _pill("Success", iSuccess, "pillSuccess"),
                    _pill("Failed",  iFailed,  "pillFailed")
                ]
            }).addStyleClass("uploadSummaryBar");

            // ── error table (only when there are errors) ─────────────
            const aDialogItems = [ oHeader, oSummaryBar ];

            if (aErrors.length) {
                const oTableModel = new JSONModel({ errors: aErrors });

                const oErrorHeading = new MText({
                    text: "Validation Errors"
                }).addStyleClass("uploadErrorHeading");

                const oTable = new MTable({
                    inset: false,
                    showSeparators: "Inner",
                    columns: [
                        new MColumn({ width: "12%",  header: new MText({ text: "Row No"       }).addStyleClass("uploadErrColHdr") }),
                        new MColumn({ width: "22%",  header: new MText({ text: "Employee ID"  }).addStyleClass("uploadErrColHdr") }),
                        new MColumn({ width: "66%",  header: new MText({ text: "Error Message"}).addStyleClass("uploadErrColHdr") })
                    ],
                    items: {
                        path:     "/errors",
                        template: new ColumnListItem({
                            cells: [
                                new MText({ text: "{rowNo}"        }).addStyleClass("uploadErrCellMono"),
                                new MText({ text: "{employeeId}"   }).addStyleClass("uploadErrCellMono"),
                                new MText({ text: "{errorMessage}" }).addStyleClass("uploadErrCell")
                            ]
                        })
                    }
                }).addStyleClass("uploadErrorTable");

                oTable.setModel(oTableModel);

                const oScroll = new ScrollContainer({
                    height:     "260px",
                    vertical:   true,
                    horizontal: false,
                    content:    [ oTable ]
                }).addStyleClass("uploadErrorScroll");

                aDialogItems.push(oErrorHeading, oScroll);
            }

            // ── dialog ───────────────────────────────────────────────
            if (this._oResultDialog) {
                this._oResultDialog.destroy();
            }

            this._oResultDialog = new Dialog({
                contentWidth: "560px",
                resizable:    true,
                draggable:    true,
                content: [
                    new VBox({ items: aDialogItems }).addStyleClass("uploadResultBody")
                ],
                buttons: [
                    new Button({
                        text:  "Close",
                        type:  "Emphasized",
                        press: () => this._oResultDialog.close()
                    })
                ],
                afterClose: () => {
                    this._oResultDialog.destroy();
                    this._oResultDialog = null;
                }
            }).addStyleClass("uploadResultDialog");

            this._oResultDialog.open();
        }

    });
});
