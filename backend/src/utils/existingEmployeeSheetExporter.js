const ExcelJS = require("exceljs");

const COLUMN_DEFINITIONS = [
  { header: "EMP ID", key: "empId" },
  { header: "EMP Name", key: "empName" },
  { header: "DOJ", key: "doj" },
  { header: "DOE", key: "doe" },
  { header: "Month", key: "month" },
  { header: "Designation", key: "designation" },
  { header: "Department", key: "departmentLabel" },
  { header: "Top Department", key: "topDepartment" },
  { header: "Type", key: "type" },
  { header: "Source Department", key: "sourceDepartment" },
  { header: "Beneficiary Department", key: "beneficiaryDepartment" },
  { header: "Source HOD", key: "sourceHod" },
  { header: "Beneficiary HOD", key: "beneficiaryHod" },
  { header: "WFO/WFH", key: "workMode" },
  { header: "Employee Type", key: "employeeType" },
  { header: "University Details", key: "universityDetails" },
  { header: "Location", key: "location" },
  { header: "Academy %", key: "academy" },
  { header: "Intensive %", key: "intensive" },
  { header: "NIAT Batch 1&2 %", key: "niatBatch12" },
  { header: "NIAT Batch 3 %", key: "niatBatch3" },
  { header: "NIAT Batch 4 %", key: "niatBatch4" },
  { header: "Other Products", key: "others" },
  { header: "Common Products", key: "common" },
];

function formatDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().slice(0, 10);
}

async function buildExistingEmployeeWorkbook(records = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Existing Employee Payroll";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Existing Employees", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = COLUMN_DEFINITIONS.map((column) => ({
    header: column.header,
    key: column.key,
    width: Math.min(Math.max(column.header.length + 4, 16), 40),
  }));

  const addRowFromRecord = (record = {}) => {
    const row = {};
    COLUMN_DEFINITIONS.forEach(({ key }) => {
      if (key === "doj" || key === "doe") {
        row[key] = formatDate(record[key]);
      } else {
        row[key] = record[key] ?? "";
      }
    });
    sheet.addRow(row);
  };

  if (records.length === 0) {
    addRowFromRecord();
  } else {
    records.forEach(addRowFromRecord);
  }

  sheet.getRow(1).font = { bold: true };

  return workbook;
}

module.exports = { buildExistingEmployeeWorkbook };


