sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller, JSONModel, MessageToast) => {
    "use strict";

    return Controller.extend("com.employee.employeemasterui.controller.UploadHistory", {

        // ============================================================
        // Lifecycle
        // ============================================================

        onInit() {
            const oHistoryModel = new JSONModel({ logs: [] });
            this.getView().setModel(oHistoryModel, "history");

            // Load data when the route is matched (not just on first render)
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteUploadHistory").attachPatternMatched(
                this._onRouteMatched, this
            );
        },

        _onRouteMatched() {
            this._loadHistory();
        },


        // ============================================================
        // Data Loading
        // ============================================================

        _loadHistory() {
            const oModel   = this.getOwnerComponent().getModel();
            const oBinding = oModel.bindList("/UploadLogs");

            oBinding.requestContexts(0, Infinity).then((aCtx) => {
                const aLogs = aCtx
                    .map((oCtx) => oCtx.getObject())
                    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
                    .map((o) => ({
                        fileName:       o.fileName       || "",
                        uploadedBy:     o.uploadedBy     || "—",
                        uploadDate:     o.uploadDate
                            ? new Date(o.uploadDate).toLocaleString()
                            : "—",
                        totalRecords:   o.totalRecords   ?? "—",
                        successRecords: o.successRecords ?? "—",
                        failedRecords:  o.failedRecords  ?? "—",
                        status:         o.status         || "—",
                        statusState:    o.status === "SUCCESS" ? "Success"
                                      : o.status === "PARTIAL" ? "Warning"
                                      : "Error"
                    }));

                this.getView().getModel("history").setProperty("/logs", aLogs);
                this._updateStats(aLogs);
                this._updateSubtitle(aLogs.length);

            }).catch(() => {
                MessageToast.show("Failed to load upload history.");
            });
        },


        // ============================================================
        // Stats strip
        // ============================================================

        _updateStats(aLogs) {
            const oView   = this.getView();
            const iTotal  = aLogs.length;
            const iSuc    = aLogs.filter(l => l.status === "SUCCESS").length;
            const iPart   = aLogs.filter(l => l.status === "PARTIAL").length;
            const iFail   = aLogs.filter(l => l.status === "FAILED").length;

            oView.byId("statTotalUploads").setText(String(iTotal));
            oView.byId("statSuccess").setText(String(iSuc));
            oView.byId("statPartial").setText(String(iPart));
            oView.byId("statFailed").setText(String(iFail));
        },

        _updateSubtitle(iCount) {
            this.getView().byId("uploadHistorySubtitle")
                .setText(iCount + " upload session" + (iCount !== 1 ? "s" : ""));
        },


        // ============================================================
        // Toolbar actions
        // ============================================================

        onRefresh() {
            this._loadHistory();
            MessageToast.show("History refreshed");
        },


        // ============================================================
        // Navigation
        // ============================================================

        onNavBack() {
            const oHistory = window.history;
            if (oHistory.length > 1) {
                oHistory.go(-1);
            } else {
                this.getOwnerComponent().getRouter()
                    .navTo("RouteListView", {}, true);
            }
        }

    });
});
