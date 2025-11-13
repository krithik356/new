const ExcelJS = require("exceljs");

async function buildContributionWorkbook(contributions = [], options = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Employee Contribution Automation System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(options.sheetName || "Contributions", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Department", key: "department", width: 30 },
    { header: "Department Code", key: "code", width: 18 },
    { header: "HOD Name", key: "hodName", width: 25 },
    { header: "RP Email", key: "hodEmail", width: 30 },
    { header: "Submitted By", key: "submittedBy", width: 25 },
    { header: "Submitter Email", key: "submittedEmail", width: 30 },
    { header: "Academy %", key: "academy", width: 12 },
    { header: "Intensive %", key: "intensive", width: 12 },
    { header: "NIAT %", key: "niat", width: 12 },
    { header: "Total %", key: "total", width: 12 },
    { header: "Cycle", key: "cycle", width: 12 },
    { header: "Submitted At", key: "submittedAt", width: 24 },
    { header: "Remarks", key: "remarks", width: 40 },
  ];

  contributions.forEach((item) => {
    sheet.addRow({
      department: item.department?.name || "—",
      code: item.department?.code || "—",
      hodName: item.department?.hod?.name || "—",
      hodEmail: item.department?.hod?.email || "—",
      submittedBy: item.submittedBy?.name || "—",
      submittedEmail: item.submittedBy?.email || "—",
      academy: item.academy,
      intensive: item.intensive,
      niat: item.niat,
      total: (item.academy || 0) + (item.intensive || 0) + (item.niat || 0),
      cycle: item.cycle || "—",
      submittedAt: item.submittedAt
        ? new Date(item.submittedAt).toLocaleString()
        : "—",
      remarks: item.remarks || "",
    });
  });

  sheet.getRow(1).font = { bold: true };

  return workbook;
}

module.exports = { buildContributionWorkbook };
