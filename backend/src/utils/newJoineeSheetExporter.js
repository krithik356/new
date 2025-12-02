const ExcelJS = require("exceljs");

const COLUMN_DEFINITIONS = [
  { header: "EMP Name", key: "employeeName" },
  { header: "DOJ", key: "doj" },
  { header: "Designation", key: "designation" },
  { header: "Department", key: "departmentLabel" },
  { header: "Top Department", key: "topDepartment" },
  { header: "Type", key: "type" },
  { header: "Source Department", key: "sourceDepartment" },
  { header: "Beneficiary Department", key: "beneficiaryDepartment" },
  { header: "Source HOD", key: "sourceHod" },
  { header: "Beneficiary HOD", key: "beneficiaryHod" },
  { header: "WFO/WFH", key: "workMode" },
  { header: "Work Location", key: "workLocation" },
  { header: "Employment Type", key: "employmentType" },
  { header: "Remarks", key: "remarks" },
  { header: "CTC Range", key: "ctcRange" },
  { header: "Experience Range", key: "experienceRange" },
  { header: "New Type", key: "newType" },
  { header: "Replacement Employee Name", key: "replacementEmployeeName" },
  { header: "Product / Working Domain", key: "productOrDomain" },
  { header: "Asset Requirement", key: "assetRequirement" },
  { header: "Processor", key: "processor" },
  { header: "Operating System", key: "operatingSystem" },
  { header: "Storage (SSD)", key: "storage" },
  { header: "RAM", key: "ram" },
  { header: "Display Size", key: "displaySize" },
  { header: "Graphic Card", key: "graphicCard" },
  { header: "Peripherals", key: "peripherals" },
  { header: "Head Phone", key: "headPhone" },
  { header: "Mobile Phone", key: "mobilePhone" },
  { header: "Science (SBU)", key: "scienceSbu" },
  { header: "Budget Amount", key: "budgetAmount" },
  { header: "Academy", key: "academy" },
  { header: "Intensive", key: "intensive" },
  { header: "NIAT Batch 1", key: "niatBatch1" },
  { header: "NIAT Batch 2", key: "niatBatch2" },
  { header: "NIAT Batch 3", key: "niatBatch3" },
  { header: "Others", key: "others" },
  { header: "Common", key: "common" },
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

async function buildNewJoineeWorkbook(records = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "New Joinee Payroll";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("New Joinees", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = COLUMN_DEFINITIONS.map((column) => ({
    header: column.header,
    key: column.key,
    width: Math.min(Math.max(column.header.length + 4, 16), 40),
  }));

  if (records.length === 0) {
    // add a single empty row when there are no records
    const emptyRow = {};
    COLUMN_DEFINITIONS.forEach(({ key }) => {
      emptyRow[key] = "";
    });
    sheet.addRow(emptyRow);
  } else {
    records.forEach((record) => {
      const row = {};
      COLUMN_DEFINITIONS.forEach(({ key }) => {
        if (key === "doj") {
          row[key] = formatDate(record[key]);
        } else {
          row[key] = record[key] ?? "";
        }
      });
      sheet.addRow(row);
    });
  }

  // Make the header row (first row) bold
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  // Also style each cell individually to ensure bold formatting is applied
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
  });

  return workbook;
}

module.exports = { buildNewJoineeWorkbook };


