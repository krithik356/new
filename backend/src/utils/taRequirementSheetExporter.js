const ExcelJS = require("exceljs");

const COLUMN_DEFINITIONS = [
  { header: "HOD Name", key: "hodName" },
  { header: "Hiring Manager Name", key: "hiringManagerName" },
  { header: "Role Name", key: "roleName" },
  { header: "No of Positions", key: "noOfPositions" },
  { header: "Jan Positions", key: "januaryPositions" },
  { header: "Feb Positions", key: "februaryPositions" },
  { header: "March Positions", key: "marchPositions" },
  { header: "Min CTC (LPA)", key: "minCTC" },
  { header: "Max CTC (LPA)", key: "maxCTC" },
  { header: "Work Location", key: "workLocation" },
  { header: "Employment Type", key: "employmentType" },
  { header: "Employment Type Remarks", key: "employmentTypeRemarks" },
  { header: "Top Department", key: "topDepartment" },
  { header: "Dept", key: "department" },
  { header: "Beneficiary Department / POD Dept", key: "beneficiaryDepartment" },
  { header: "Experience Range", key: "experienceRange" },
  { header: "Hire Type", key: "hireType" },
  {
    header: "Replacement Employee Name (Only for replacement hires)",
    key: "replacementEmployeeName",
  },
  { header: "Product Working On", key: "productWorkingOn" },
  { header: "JD Link", key: "jdLink" },
  { header: "Asset to Provide", key: "assetToProvide" },
  { header: "Processor", key: "processor" },
  { header: "Operating System", key: "operatingSystem" },
  { header: "Storage (SSD)", key: "storage" },
  { header: "RAM", key: "ram" },
  { header: "Display Size", key: "displaySize" },
  { header: "Graphic Card (GPU) – optional", key: "graphicCard" },
  { header: "Peripherals", key: "peripherals" },
  { header: "iPad", key: "ipad" },
  { header: "Headphones", key: "headphones" },
  { header: "Mobile Phones", key: "mobilePhones" },
  { header: "External SSDs", key: "externalSsds" },
  { header: "Budget Amount", key: "budgetAmount" },
];

async function buildTARequirementWorkbook(records = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TA Requirements";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("TA Requirements", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = COLUMN_DEFINITIONS.map((column) => ({
    header: column.header,
    key: column.key,
    width: Math.min(Math.max(column.header.length + 4, 16), 50),
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
        if (key === "noOfPositions" || key === "januaryPositions" || key === "februaryPositions" || key === "marchPositions" || key === "minCTC" || key === "maxCTC") {
          row[key] = record[key] ?? 0;
        } else {
          row[key] = record[key] ?? "";
        }
      });
      sheet.addRow(row);
    });
  }

  sheet.getRow(1).font = { bold: true };

  return workbook;
}

module.exports = { buildTARequirementWorkbook };

