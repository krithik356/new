const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const { ExistingEmployeePayroll } = require("../models/ExistingEmployeePayroll");
const { Department } = require("../models/Department");
const { User } = require("../models/User");
const { SignOffRequest } = require("../models/SignOffRequest");
const {
  buildExistingEmployeeWorkbook,
} = require("../utils/existingEmployeeSheetExporter");

const editableFields = [
  "empId",
  "empName",
  "doj",
  "doe",
  "month",
  "designation",
  "departmentLabel",
  "topDepartment",
  "type",
  "sourceDepartment",
  "beneficiaryDepartment",
  "sourceHod",
  "beneficiaryHod",
  "location",
  "employeeType",
  "amount",
  "academy",
  "intensive",
  "niatBatch12",
  "niatBatch3",
  "niatBatch4",
  "others",
  "common",
];

const columnDefinitions = [
  { header: "EMP ID", key: "empId" },
  { header: "EMP Name", key: "empName" },
  { header: "DOJ", key: "doj", isDate: true },
  { header: "DOE", key: "doe", isDate: true },
  { header: "Month", key: "month" },
  { header: "Designation", key: "designation" },
  { header: "Department", key: "departmentLabel" },
  { header: "Top Department", key: "topDepartment" },
  { header: "Type", key: "type" },
  { header: "Source Department", key: "sourceDepartment" },
  { header: "Beneficiary Department", key: "beneficiaryDepartment" },
  { header: "Source HOD", key: "sourceHod" },
  { header: "Beneficiary HOD", key: "beneficiaryHod" },
  { header: "Location", key: "location" },
  { header: "Employee Type", key: "employeeType" },
  { header: "Amount", key: "amount" },
  { header: "Academy %", key: "academy" },
  { header: "Intensive %", key: "intensive" },
  { header: "NIAT Batch 1&2 %", key: "niatBatch12" },
  { header: "NIAT Batch 3 %", key: "niatBatch3" },
  { header: "NIAT Batch 4 %", key: "niatBatch4" },
  { header: "Other Products", key: "others" },
  { header: "Common Products", key: "common" },
];

const percentageFields = [
  "academy",
  "intensive",
  "niatBatch12",
  "niatBatch3",
  "niatBatch4",
  "others",
  "common",
];

function normalizeDepartmentKey(value) {
  return value ? value.toString().trim().toLowerCase().replace(/\s+/g, "-") : "";
}

// Helper function to safely escape regex special characters
function escapeRegex(str) {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Frontend DEPARTMENT_OPTIONS - exact copy from frontend
// These are the valid department values that should be accepted
const FRONTEND_DEPARTMENT_OPTIONS = [
  'CT (NWD_CT)',
  'NIAT_CGE (NWD_SA_NIAT_CGE)',
  'NIAT_Lead Qualification (NWD_PS_LQ_NIAT-LQ)',
  'Intensive_CGE (NWD_SA_IN_CGE)',
  'NIAT_Offline Lead Generation (NWD_PS_NIAT_OLG)',
  'AC_Lead Qualification (NWD_PS_AC-LQ)',
  'B2B Marketing (NWD_PST_B2B)',
  'Lead Generation (NWD_PS_LG)',
  'Influencer Marketing & Digital Affiliate (NWD_IMDA)',
  'PST - Placement Coordinator (NWD_PST_PC)',
  'Central Tech Team (NWD_TEC_CTT)',
  'AC_Customer Support (NWD_ASS_ACCS)',
  'Payments Retention Team (NWD_ASS_PYRT)',
  'Intensive Student Success (NWD_ISS_Int_SS)',
  'PST - Lead Acquisition (NWD_PST_LA)',
  'Sales POD (NWD_TEC_SA)',
  'Content & Learning Outcomes POD (NWD_TEC_CO&LO)',
  'Placement Support POD (NWD_TEC_PSP)',
  'Pre Sales POD (NWD_TEC_PSAP)',
  'NIAT Student Success POD (NWD_TEC_NSSP)',
  'DSA POD (NWD_TEC_DSAP)',
  'Academy Student Success POD (NWD_TEC_ASSP)',
  'NIAT_Instructors (NWD_NIAT_AC_IN)',
  'QR - Query Resolution (NWD_QR)',
  'NIAT_Instructors & Mentors (NWD_NIAT_AC_I&M)',
  'Placement Success Management (NWD_PSM)',
  'PST - Corporate Relations (NWD_PST_CR)',
  'Pre-Sales Studio (NWD_PS_ST)',
  'College Dost & SEO (NWD_PS_LG_CD&SEO)',
  'PST - Customer Support (NWD_PST_CS)',
  'Academy_CGE (NWD_SA_AC_CGE)',
  'IN_Customer Support (NWD_ASS_IN_CS)',
  'NIAT_Student Success (NWD_NIAT_AC_SS)',
  'Academy_Training (NWD_SA_AC_TR)',
  'AS - Program Registration Expert (NWD_BU_AS_PRE)',
  'Sales (NWD_SA)',
  'Pre Sales (NWD_PS)',
  'Data Science and Machine Learning (NWD_DSML)',
  'Placement Support Team (NWD_PST)',
  'Intensive Student Success (Intensive Student Success_NWD_ISS_Int_SS)',
  'University Partnerships (NWD_UP)',
  'Lead Qualification (NWD_PS_LQ)',
  'NxtWave Abroad (NWD_NA)',
  'Content Marketing (NWD__BM_CM)',
  'HR - Talent Acquisition (NWD_HR_TA)',
  'Product-Learning (NW_P_PDL)',
  'Product - NxtGig AI Accelerator (NWD_P_NXTGIG)',
  'Business Operations (NWD_BO)',
  'Academy_Hiring (NWD_SA_AC_HI)',
  'PC - Positive Community Building (NWD_PS_PC_PCB)',
  'Assessment Content and Ops (NWD_CCD_AC_Ops)',
  'Product-Sales (NW_P_PRS)',
  'Website Team (NWD_TEC_WT)',
  'Central Team- Academy Student Success (NWD_ASS_CT)',
  'NIAT_Master Class (NWD_DSML_NIAT_MC)',
  'NIAT_Robotics (NWD_NIAT_AC_R)',
  'University Partnerships (NWD_UPS)',
  'NxtWave Studio (NW_NXT_ST)',
  'DSA (NWD_CD_DSA)',
  'Topin Tech (NWD_PST_TT)',
  'HR - HRBP (NWD_HRBP)',
  'NIFA (NWD_NIFA)',
  'Webinar Studio (NWD_VH_WS)',
  'NIAT_Program Operations (NWD_NIAT_AC_PO)',
  'Success Coach (NWD_ASS_SC)',
  'AC_4.0 Tribe (NWD_PS_LG_AC-4.0T&NET)',
  'NIAT_Offline Lead Generation (NWD_AS_PRE_NIAT_OLG)',
  'PC - Positive Community Building (NWD_PC_PCB)',
  'NIAT (NWD_PSS_NIAT)',
  'AC_Digital Marketing (NWD_PS_AC_DM)',
  'HR - Admin (NWD_HR_ADM)',
  'Product (NWD_P)',
  'L&D - Presales (NWD_PS_LD)',
  'Video House (NWD_VH)',
  'Product Design (NWD_DS_PD)',
  'Student Engagement (NWD_ASS_SE)',
  'Curriculum Development: English (NWD_CCD_CD_E)',
  'Graphic Design (NWD_DS_GD)',
  '10xIIT (NWD_10XIIT)',
  'College Dost & SEO (NWD_CDSEO)',
  'Pre Sales (NWD_BO_PS)',
  'Academy_QA (NWD_SA_AC_QA)',
  'HR - Operations (NWD_HR_OPS)',
  "Founder's Office (NWD_FO)",
  'Internal Audit (NWD_IA)',
  'Finance (NWD_F&L_FIN)',
  'HR - Human Resources (NWD_HR)',
  'Influencer Marketing & Digital Affiliate (NWD_PS_LG_IM&DA)',
  'GenAI Social Media (NWD_GAISM)',
  'Curriculum Development: Aptitude (NWD_CCD_CD_A)',
  'NxtWave Edge - Colleges (NWD_NWEC)',
  'CD - Curriculum Development (NWD_TEC_CUD)',
  'CD - Curriculum Development (NWD_CD_CD)',
  'PO - Procurement (NWD_HR_PO)',
  'FP&A (NWD_F&L_FP&A)',
  'Digital Marketing (NWD_PS_DM)',
  'PST - Placement Content Team (NWD_PST_PCT)',
  'B2B Partnership (NWD_B2BP)',
  'Affiliate Admission Consultant (NWD_PS_AAC)',
  'Brand Marketing (NWD_BM)',
  'HR - Learning & Development (NWD_HR_L&D)',
  'NIAT_Instructors_Aptitude & English (NWD_NIAT_AC_I_A&E)',
  'Placement Preparation (NWD_ASS_PP)',
  'Pre-Onboarding (Pre-Onboarding_NWD_ASS_PO)',
  'Content Development- DSML (NWD_CD_DSML)',
  'Legal (NWD_L)',
  'NIAT_Student Engagement (NWD_NIAT_AC_SE)',
  'NIAT Studio (NWD_NIAT_S)',
  'Legal (NWD_F&L_LE)',
  'HR - Payroll And Compliance (NWD_HR_P&C)',
  'College Plus Student Success (NWD_ISS_CPSS)',
  'NIAT Hostel Facilities Team (NWD_NIAT_HFT)',
  'NIAT_Instructors_DSA (NWD_NIAT_AC_DSA)',
  'Sales Quality & Compliance Audit (NWD_IA_SQ&CA)',
  'Intensive Student Success (NWD_ISS)',
  'NIAT_Maths Instructors and Mentors (NWD_NIAT_MIM)',
  'HR - Systems (NWD_HR_HRS)',
  'Control Tower (NWD_FO_CT)',
  'NIAT_Product (NWD_NIAT_AC_PRO)',
  'NIAT_CRM & Data (NWD_NIAT_AC_CRM&D)',
  'Design Studio (NWD_DS)',
  'CD - Content Development (NWD_DSML_CDCD)',
  'Content Development (NWD_CD)',
  'Student Engagement (NWD_SS_AC_SE)',
  'AC_Success Coach (NWD_SS_AC_SC)',
  'Business Process Excellence & Assurance (NWD_IA_BPE&A)',
  'Financial Audit (NWD_IA_FA)',
  'AC_Customer Support (NWD_SS_AC_CS)',
  'Pre Sales',
  'Business Operations',
  'Product',
  'AS - Program Registration Expert',
  'CD - Curriculum Development',
  'Tech Team',
  'Data Science and Machine Learning',
  'NIAT_Academics',
  'Sales',
  'Placement Support Team',
  'Placement Success Management',
  'Content Development',
  'Video House',
  '10xIIT',
];

// Static mapping from frontend DEPARTMENT_OPTIONS to department info
// This maps department names from uploaded sheets to frontend dropdown values
// Format: "Department Name (CODE)" -> { name, code, hod }
const DEPARTMENT_MAPPING = {
  // Exact matches from frontend dropdown
  "CT (NWD_CT)": { name: "CT", code: "NWD_CT", hod: "Rahul Attuluri" },
  "NIAT_CGE (NWD_SA_NIAT_CGE)": { name: "NIAT_CGE", code: "NWD_SA_NIAT_CGE", hod: "Sai Sumanth Reddy Gattikoppula" },
  "NIAT_Lead Qualification (NWD_PS_LQ_NIAT-LQ)": { name: "NIAT_Lead Qualification", code: "NWD_PS_LQ_NIAT-LQ", hod: "Kadari Hari Krishna" },
  "Intensive_CGE (NWD_SA_IN_CGE)": { name: "Intensive_CGE", code: "NWD_SA_IN_CGE", hod: "Aniketh Mustoor" },
  "NIAT_Offline Lead Generation (NWD_PS_NIAT_OLG)": { name: "NIAT_Offline Lead Generation", code: "NWD_PS_NIAT_OLG", hod: "Shiva Shanker Reddy Devasani" },
  "AC_Lead Qualification (NWD_PS_AC-LQ)": { name: "AC_Lead Qualification", code: "NWD_PS_AC-LQ", hod: "Kadari Hari Krishna" },
  "B2B Marketing (NWD_PST_B2B)": { name: "B2B Marketing", code: "NWD_PST_B2B", hod: "Girish Akash Yeshwanth Karri" },
  "Lead Generation (NWD_PS_LG)": { name: "Lead Generation", code: "NWD_PS_LG", hod: "Shiva Shanker Reddy Devasani" },
  "Influencer Marketing & Digital Affiliate (NWD_IMDA)": { name: "Influencer Marketing & Digital Affiliate", code: "NWD_IMDA", hod: "N.A." },
  "PST - Placement Coordinator (NWD_PST_PC)": { name: "PST - Placement Coordinator", code: "NWD_PST_PC", hod: "Girish Akash Yeshwanth Karri" },
  "Central Tech Team (NWD_TEC_CTT)": { name: "Central Tech Team", code: "NWD_TEC_CTT", hod: "Revanth Gopi Konakanchi" },
  "AC_Customer Support (NWD_ASS_ACCS)": { name: "AC_Customer Support", code: "NWD_ASS_ACCS", hod: "Vamshi Gadagoju" },
  "Payments Retention Team (NWD_ASS_PYRT)": { name: "Payments Retention Team", code: "NWD_ASS_PYRT", hod: "Vamshi Gadagoju" },
  "Intensive Student Success (NWD_ISS_Int_SS)": { name: "Intensive Student Success", code: "NWD_ISS_Int_SS", hod: "Rahul Attuluri" },
  "PST - Lead Acquisition (NWD_PST_LA)": { name: "PST - Lead Acquisition", code: "NWD_PST_LA", hod: "Girish Akash Yeshwanth Karri" },
  "Sales POD (NWD_TEC_SA)": { name: "Sales POD", code: "NWD_TEC_SA", hod: "Sai Sumanth Reddy Gattikoppula" },
  "Content & Learning Outcomes POD (NWD_TEC_CO&LO)": { name: "Content & Learning Outcomes POD", code: "NWD_TEC_CO&LO", hod: "Pavan Gangireddy" },
  "Placement Support POD (NWD_TEC_PSP)": { name: "Placement Support POD", code: "NWD_TEC_PSP", hod: "Girish Akash Yeshwanth Karri" },
  "Pre Sales POD (NWD_TEC_PSAP)": { name: "Pre Sales POD", code: "NWD_TEC_PSAP", hod: "Shiva Shanker Reddy Devasani" },
  "NIAT Student Success POD (NWD_TEC_NSSP)": { name: "NIAT Student Success POD", code: "NWD_TEC_NSSP", hod: "Aniketh Mustoor" },
  "DSA POD (NWD_TEC_DSAP)": { name: "DSA POD", code: "NWD_TEC_DSAP", hod: "Sashank Reddy Gujjula" },
  "Academy Student Success POD (NWD_TEC_ASSP)": { name: "Academy Student Success POD", code: "NWD_TEC_ASSP", hod: "Revanth Gopi Konakanchi" },
  "NIAT_Instructors (NWD_NIAT_AC_IN)": { name: "NIAT_Instructors", code: "NWD_NIAT_AC_IN", hod: "Venkata Abhinav Devaguptapu" },
  "QR - Query Resolution (NWD_QR)": { name: "QR - Query Resolution", code: "NWD_QR", hod: "Vishnu Vamsi Vardhan Tallam" },
  "NIAT_Instructors & Mentors (NWD_NIAT_AC_I&M)": { name: "NIAT_Instructors & Mentors", code: "NWD_NIAT_AC_I&M", hod: "Rahul Attuluri" },
  "Placement Success Management (NWD_PSM)": { name: "Placement Success Management", code: "NWD_PSM", hod: "Vishnu Vamsi Vardhan Tallam" },
  "PST - Corporate Relations (NWD_PST_CR)": { name: "PST - Corporate Relations", code: "NWD_PST_CR", hod: "Girish Akash Yeshwanth Karri" },
  "Pre-Sales Studio (NWD_PS_ST)": { name: "Pre-Sales Studio", code: "NWD_PS_ST", hod: "Joiet Joseph" },
  "College Dost & SEO (NWD_PS_LG_CD&SEO)": { name: "College Dost & SEO", code: "NWD_PS_LG_CD&SEO", hod: "Shiva Shanker Reddy Devasani" },
  "PST - Customer Support (NWD_PST_CS)": { name: "PST - Customer Support", code: "NWD_PST_CS", hod: "Girish Akash Yeshwanth Karri" },
  "Academy_CGE (NWD_SA_AC_CGE)": { name: "Academy_CGE", code: "NWD_SA_AC_CGE", hod: "Tathagat Bisoyi" },
  "IN_Customer Support (NWD_ASS_IN_CS)": { name: "IN_Customer Support", code: "NWD_ASS_IN_CS", hod: "Vamshi Gadagoju" },
  "NIAT_Student Success (NWD_NIAT_AC_SS)": { name: "NIAT_Student Success", code: "NWD_NIAT_AC_SS", hod: "Pavan Reddy Dharma" },
  "Academy_Training (NWD_SA_AC_TR)": { name: "Academy_Training", code: "NWD_SA_AC_TR", hod: "Kumar Verma" },
  "AS - Program Registration Expert (NWD_BU_AS_PRE)": { name: "AS - Program Registration Expert", code: "NWD_BU_AS_PRE", hod: "Anil Kumar Ganguri" },
  "Sales (NWD_SA)": { name: "Sales", code: "NWD_SA", hod: "Sai Sumanth Reddy Gattikoppula" },
  "Pre Sales (NWD_PS)": { name: "Pre Sales", code: "NWD_PS", hod: "Shiva Shanker Reddy Devasani" },
  "Data Science and Machine Learning (NWD_DSML)": { name: "Data Science and Machine Learning", code: "NWD_DSML", hod: "Akhil Jogiparthi" },
  "Placement Support Team (NWD_PST)": { name: "Placement Support Team", code: "NWD_PST", hod: "Girish Akash Yeshwanth Karri" },
  "Intensive Student Success (Intensive Student Success_NWD_ISS_Int_SS)": { name: "Intensive Student Success", code: "NWD_ISS_Int_SS", hod: "Aniketh Mustoor" },
  "University Partnerships (NWD_UP)": { name: "University Partnerships", code: "NWD_UP", hod: "Karthik Reddy Vummadi" },
  "Lead Qualification (NWD_PS_LQ)": { name: "Lead Qualification", code: "NWD_PS_LQ", hod: "Shiva Shanker Reddy Devasani" },
  "NxtWave Abroad (NWD_NA)": { name: "NxtWave Abroad", code: "NWD_NA", hod: "Shiva Shanker Reddy Devasani" },
  "Content Marketing (NWD__BM_CM)": { name: "Content Marketing", code: "NWD__BM_CM", hod: "Nikita Aggarwal" },
  "HR - Talent Acquisition (NWD_HR_TA)": { name: "HR - Talent Acquisition", code: "NWD_HR_TA", hod: "Hari Haran Gorijavola" },
  "Product-Learning (NW_P_PDL)": { name: "Product-Learning", code: "NW_P_PDL", hod: "Revanth Gopi Konakanchi" },
  "Product - NxtGig AI Accelerator (NWD_P_NXTGIG)": { name: "Product - NxtGig AI Accelerator", code: "NWD_P_NXTGIG", hod: "Revanth Gopi Konakanchi" },
  "Business Operations (NWD_BO)": { name: "Business Operations", code: "NWD_BO", hod: "Shivam Singh" },
  "Academy_Hiring (NWD_SA_AC_HI)": { name: "Academy_Hiring", code: "NWD_SA_AC_HI", hod: "Kumar Verma" },
  "PC - Positive Community Building (NWD_PS_PC_PCB)": { name: "PC - Positive Community Building", code: "NWD_PS_PC_PCB", hod: "Shiva Shanker Reddy Devasani" },
  "Assessment Content and Ops (NWD_CCD_AC_Ops)": { name: "Assessment Content and Ops", code: "NWD_CCD_AC_Ops", hod: "Sai teja Manchukanti" },
  "Product-Sales (NW_P_PRS)": { name: "Product-Sales", code: "NW_P_PRS", hod: "Revanth Gopi Konakanchi" },
  "Website Team (NWD_TEC_WT)": { name: "Website Team", code: "NWD_TEC_WT", hod: "Revanth Gopi Konakanchi" },
  "Central Team- Academy Student Success (NWD_ASS_CT)": { name: "Central Team- Academy Student Success", code: "NWD_ASS_CT", hod: "Vamshi Gadagoju" },
  "NIAT_Master Class (NWD_DSML_NIAT_MC)": { name: "NIAT_Master Class", code: "NWD_DSML_NIAT_MC", hod: "Akhil Jogiparthi" },
  "NIAT_Robotics (NWD_NIAT_AC_R)": { name: "NIAT_Robotics", code: "NWD_NIAT_AC_R", hod: "Sai Teja Manchukanti" },
  "University Partnerships (NWD_UPS)": { name: "University Partnerships", code: "NWD_UPS", hod: "Karthik Reddy Vummadi" },
  "NxtWave Studio (NW_NXT_ST)": { name: "NxtWave Studio", code: "NW_NXT_ST", hod: "Joiet Joseph" },
  "DSA (NWD_CD_DSA)": { name: "DSA", code: "NWD_CD_DSA", hod: "Sashank Reddy Gujjula" },
  "Topin Tech (NWD_PST_TT)": { name: "Topin Tech", code: "NWD_PST_TT", hod: "Girish Akash Yeshwanth Karri" },
  "HR - HRBP (NWD_HRBP)": { name: "HR - HRBP", code: "NWD_HRBP", hod: "Radha Alekhya Kommanaboina" },
  "NIFA (NWD_NIFA)": { name: "NIFA", code: "NWD_NIFA", hod: "Akhil Jogiparthi" },
  "Webinar Studio (NWD_VH_WS)": { name: "Webinar Studio", code: "NWD_VH_WS", hod: "Joiet Joseph" },
  "NIAT_Program Operations (NWD_NIAT_AC_PO)": { name: "NIAT_Program Operations", code: "NWD_NIAT_AC_PO", hod: "Pavan Reddy Dharma" },
  "Success Coach (NWD_ASS_SC)": { name: "Success Coach", code: "NWD_ASS_SC", hod: "Vamshi Gadagoju" },
  "AC_4.0 Tribe (NWD_PS_LG_AC-4.0T&NET)": { name: "AC_4.0 Tribe", code: "NWD_PS_LG_AC-4.0T&NET", hod: "Shiva Shanker Reddy Devasani" },
  "NIAT_Offline Lead Generation (NWD_AS_PRE_NIAT_OLG)": { name: "NIAT_Offline Lead Generation", code: "NWD_AS_PRE_NIAT_OLG", hod: "Mansoor Valli Gangupalli" },
  "PC - Positive Community Building (NWD_PC_PCB)": { name: "PC - Positive Community Building", code: "NWD_PC_PCB", hod: "Sashank K" },
  "NIAT (NWD_PSS_NIAT)": { name: "NIAT", code: "NWD_PSS_NIAT", hod: "Shiva Shanker Reddy Devasani" },
  "Student Engagement (NWD_ASS_SE)": { name: "Student Engagement", code: "NWD_ASS_SE", hod: "Vamshi Gadagoju" },
  "Placement Preparation (NWD_ASS_PP)": { name: "Placement Preparation", code: "NWD_ASS_PP", hod: "Vamshi Gadagoju" },
  "Pre-Onboarding (Pre-Onboarding_NWD_ASS_PO)": { name: "Pre-Onboarding", code: "Pre-Onboarding_NWD_ASS_PO", hod: "Vamshi Gadagoju" },
  "AC_Digital Marketing (NWD_PS_AC_DM)": { name: "AC_Digital Marketing", code: "NWD_PS_AC_DM", hod: "Shiva Shanker Reddy Devasani" },
  "HR - Admin (NWD_HR_ADM)": { name: "HR - Admin", code: "NWD_HR_ADM", hod: "Bala Bhaskar Reddy Dodda" },
  "Product (NWD_P)": { name: "Product", code: "NWD_P", hod: "Revanth Gopi Konakanchi" },
  "L&D - Presales (NWD_PS_LD)": { name: "L&D - Presales", code: "NWD_PS_LD", hod: "Shiva Shanker Reddy Devasani" },
  "Video House (NWD_VH)": { name: "Video House", code: "NWD_VH", hod: "Joiet Joseph" },
  "Product Design (NWD_DS_PD)": { name: "Product Design", code: "NWD_DS_PD", hod: "Aman Maheshwari" },
  "Curriculum Development: English (NWD_CCD_CD_E)": { name: "Curriculum Development: English", code: "NWD_CCD_CD_E", hod: "Sai teja Manchukanti" },
  "Graphic Design (NWD_DS_GD)": { name: "Graphic Design", code: "NWD_DS_GD", hod: "Aman Maheshwari" },
  "10xIIT (NWD_10XIIT)": { name: "10xIIT", code: "NWD_10XIIT", hod: "Srikar Naidu Edumudi" },
  "College Dost & SEO (NWD_CDSEO)": { name: "College Dost & SEO", code: "NWD_CDSEO", hod: "Shiva Shanker Reddy Devasani" },
  "Pre Sales (NWD_BO_PS)": { name: "Pre Sales", code: "NWD_BO_PS", hod: "Shivam Singh" },
  "Academy_QA (NWD_SA_AC_QA)": { name: "Academy_QA", code: "NWD_SA_AC_QA", hod: "Tathagat Bisoyi" },
  "HR - Operations (NWD_HR_OPS)": { name: "HR - Operations", code: "NWD_HR_OPS", hod: "Divya Sri Nandigam" },
  "Founder's Office (NWD_FO)": { name: "Founder's Office", code: "NWD_FO", hod: "Rahul Attuluri" },
  "Internal Audit (NWD_IA)": { name: "Internal Audit", code: "NWD_IA", hod: "Radha Alekhya Kommanaboina" },
  "Finance (NWD_F&L_FIN)": { name: "Finance", code: "NWD_F&L_FIN", hod: "Penmetsa Anirudh Varma" },
  "HR - Human Resources (NWD_HR)": { name: "HR - Human Resources", code: "NWD_HR", hod: "Radha Alekhya Kommanaboina" },
  "Influencer Marketing & Digital Affiliate (NWD_PS_LG_IM&DA)": { name: "Influencer Marketing & Digital Affiliate", code: "NWD_PS_LG_IM&DA", hod: "Shiva Shanker Reddy Devasani" },
  "GenAI Social Media (NWD_GAISM)": { name: "GenAI Social Media", code: "NWD_GAISM", hod: "Rahul Yenninti" },
  "Curriculum Development: Aptitude (NWD_CCD_CD_A)": { name: "Curriculum Development: Aptitude", code: "NWD_CCD_CD_A", hod: "Sai teja Manchukanti" },
  "NxtWave Edge - Colleges (NWD_NWEC)": { name: "NxtWave Edge - Colleges", code: "NWD_NWEC", hod: "Srikar Naidu Edumudi" },
  "CD - Curriculum Development (NWD_TEC_CUD)": { name: "CD - Curriculum Development", code: "NWD_TEC_CUD", hod: "Pavan Gangireddy" },
  "CD - Curriculum Development (NWD_CD_CD)": { name: "CD - Curriculum Development", code: "NWD_CD_CD", hod: "Pavan Gangireddy" },
  "PO - Procurement (NWD_HR_PO)": { name: "PO - Procurement", code: "NWD_HR_PO", hod: "Bala Bhaskar Reddy Dodda" },
  "FP&A (NWD_F&L_FP&A)": { name: "FP&A", code: "NWD_F&L_FP&A", hod: "Devansh Mohata" },
  "Digital Marketing (NWD_PS_DM)": { name: "Digital Marketing", code: "NWD_PS_DM", hod: "Shivam Singh" },
  "PST - Placement Content Team (NWD_PST_PCT)": { name: "PST - Placement Content Team", code: "NWD_PST_PCT", hod: "Sai Teja Manchukanti" },
  "B2B Partnership (NWD_B2BP)": { name: "B2B Partnership", code: "NWD_B2BP", hod: "Girish Akash Yeshwanth Karri" },
  "Affiliate Admission Consultant (NWD_PS_AAC)": { name: "Affiliate Admission Consultant", code: "NWD_PS_AAC", hod: "Shiva Shanker Reddy Devasani" },
  "Brand Marketing (NWD_BM)": { name: "Brand Marketing", code: "NWD_BM", hod: "Nikita Aggarwal" },
  "HR - Learning & Development (NWD_HR_L&D)": { name: "HR - Learning & Development", code: "NWD_HR_L&D", hod: "Munagala Varun Reddy" },
  "NIAT_Instructors_Aptitude & English (NWD_NIAT_AC_I_A&E)": { name: "NIAT_Instructors_Aptitude & English", code: "NWD_NIAT_AC_I_A&E", hod: "Sai Teja Manchukanti" },
  "Content Development- DSML (NWD_CD_DSML)": { name: "Content Development- DSML", code: "NWD_CD_DSML", hod: "Sashank Reddy Gujjula" },
  "Legal (NWD_L)": { name: "Legal", code: "NWD_L", hod: "Megha Ahuja" },
  "NIAT_Student Engagement (NWD_NIAT_AC_SE)": { name: "NIAT_Student Engagement", code: "NWD_NIAT_AC_SE", hod: "Pavan Reddy Dharma" },
  "NIAT Studio (NWD_NIAT_S)": { name: "NIAT Studio", code: "NWD_NIAT_S", hod: "Joiet Joseph" },
  "Legal (NWD_F&L_LE)": { name: "Legal", code: "NWD_F&L_LE", hod: "Megha Ahuja" },
  "HR - Payroll And Compliance (NWD_HR_P&C)": { name: "HR - Payroll And Compliance", code: "NWD_HR_P&C", hod: "Brahma Reddy Karumuru" },
  "College Plus Student Success (NWD_ISS_CPSS)": { name: "College Plus Student Success", code: "NWD_ISS_CPSS", hod: "Aniketh Mustoor" },
  "NIAT Hostel Facilities Team (NWD_NIAT_HFT)": { name: "NIAT Hostel Facilities Team", code: "NWD_NIAT_HFT", hod: "Anil Kumar Ganguri" },
  "NIAT_Instructors_DSA (NWD_NIAT_AC_DSA)": { name: "NIAT_Instructors_DSA", code: "NWD_NIAT_AC_DSA", hod: "Rahul Attuluri" },
  "Sales Quality & Compliance Audit (NWD_IA_SQ&CA)": { name: "Sales Quality & Compliance Audit", code: "NWD_IA_SQ&CA", hod: "Radha Alekhya Kommanaboina" },
  "Intensive Student Success (NWD_ISS)": { name: "Intensive Student Success", code: "NWD_ISS", hod: "Aniketh Mustoor" },
  "NIAT_Maths Instructors and Mentors (NWD_NIAT_MIM)": { name: "NIAT_Maths Instructors and Mentors", code: "NWD_NIAT_MIM", hod: "Kompella Sai Manvish" },
  "HR - Systems (NWD_HR_HRS)": { name: "HR - Systems", code: "NWD_HR_HRS", hod: "Divya Sri Nandigam" },
  "Control Tower (NWD_FO_CT)": { name: "Control Tower", code: "NWD_FO_CT", hod: "Rahul Attuluri" },
  "NIAT_Product (NWD_NIAT_AC_PRO)": { name: "NIAT_Product", code: "NWD_NIAT_AC_PRO", hod: "Rahul Attuluri" },
  "NIAT_CRM & Data (NWD_NIAT_AC_CRM&D)": { name: "NIAT_CRM & Data", code: "NWD_NIAT_AC_CRM&D", hod: "Aniketh Mustoor" },
  "Design Studio (NWD_DS)": { name: "Design Studio", code: "NWD_DS", hod: "Aman Maheshwari" },
  "CD - Content Development (NWD_DSML_CDCD)": { name: "CD - Content Development", code: "NWD_DSML_CDCD", hod: "Rushikesh Konapure" },
  "Content Development (NWD_CD)": { name: "Content Development", code: "NWD_CD", hod: "Sashank Reddy Gujjula" },
  "Student Engagement (NWD_SS_AC_SE)": { name: "Student Engagement", code: "NWD_SS_AC_SE", hod: "Aniketh Mustoor" },
  "AC_Success Coach (NWD_SS_AC_SC)": { name: "AC_Success Coach", code: "NWD_SS_AC_SC", hod: "Aniketh Mustoor" },
  "Business Process Excellence & Assurance (NWD_IA_BPE&A)": { name: "Business Process Excellence & Assurance", code: "NWD_IA_BPE&A", hod: "Radha Alekhya Kommanaboina" },
  "Financial Audit (NWD_IA_FA)": { name: "Financial Audit", code: "NWD_IA_FA", hod: "Radha Alekhya Kommanaboina" },
  "AC_Customer Support (NWD_SS_AC_CS)": { name: "AC_Customer Support", code: "NWD_SS_AC_CS", hod: "Aniketh Mustoor" },
  
  // Also support name-only matches (without code)
  "CT": { name: "CT", code: "NWD_CT", hod: "Rahul Attuluri" },
  "NIAT_CGE": { name: "NIAT_CGE", code: "NWD_SA_NIAT_CGE", hod: "Sai Sumanth Reddy Gattikoppula" },
  "AC_Customer Support": { name: "AC_Customer Support", code: "NWD_ASS_ACCS", hod: "Vamshi Gadagoju" },
  "Central Team- Academy Student Success": { name: "Central Team- Academy Student Success", code: "NWD_ASS_CT", hod: "Vamshi Gadagoju" },
  "IN_Customer Support": { name: "IN_Customer Support", code: "NWD_ASS_IN_CS", hod: "Vamshi Gadagoju" },
  "Payments Retention Team": { name: "Payments Retention Team", code: "NWD_ASS_PYRT", hod: "Vamshi Gadagoju" },
  "Placement Preparation": { name: "Placement Preparation", code: "NWD_ASS_PP", hod: "Vamshi Gadagoju" },
  "Pre-Onboarding": { name: "Pre-Onboarding", code: "Pre-Onboarding_NWD_ASS_PO", hod: "Vamshi Gadagoju" },
  "Student Engagement": { name: "Student Engagement", code: "NWD_ASS_SE", hod: "Vamshi Gadagoju" },
  "Success Coach": { name: "Success Coach", code: "NWD_ASS_SC", hod: "Vamshi Gadagoju" },
};

// Helper function to find department from mapping (no DB query)
function findDepartmentFromMapping(deptLabel) {
  if (!deptLabel) return null;
  
  const trimmed = deptLabel.trim();
  
  // Try exact match first
  if (DEPARTMENT_MAPPING[trimmed]) {
    return DEPARTMENT_MAPPING[trimmed];
  }
  
  // Try matching name part before parentheses
  const nameMatch = trimmed.match(/^(.+?)\s*\(/);
  if (nameMatch) {
    const namePart = nameMatch[1].trim();
    if (DEPARTMENT_MAPPING[namePart]) {
      return DEPARTMENT_MAPPING[namePart];
    }
  }
  
  // Try matching code part inside parentheses
  const codeMatch = trimmed.match(/\(([^)]+)\)/);
  if (codeMatch) {
    const codePart = codeMatch[1].trim();
    // Find by code
    for (const [key, value] of Object.entries(DEPARTMENT_MAPPING)) {
      if (value.code === codePart || value.code === codePart.replace(/_/g, "-")) {
        return value;
      }
    }
  }
  
  // Try case-insensitive partial match
  const lowerTrimmed = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(DEPARTMENT_MAPPING)) {
    if (key.toLowerCase().includes(lowerTrimmed) || lowerTrimmed.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return null;
}

async function findDepartmentMetaFromLabel(label) {
  if (!label) {
    return null;
  }

  // First try mapping from frontend dropdown values (no DB query)
  const mappedDept = findDepartmentFromMapping(label);
  if (mappedDept) {
    // Still need to get the ObjectId from DB, but we know the department exists
    const department = await Department.findOne({
      $or: [
        { name: mappedDept.name },
        { code: mappedDept.code },
      ],
    })
      .select("name code _id")
      .lean();

    if (department) {
      return {
        departmentId: department._id,
        departmentKey: normalizeDepartmentKey(department.code || department.name),
        departmentLabel: department.name || department.code || "",
        hod: mappedDept.hod, // Include HOD info
      };
    }
  }

  // Fallback to DB query if not found in mapping
  const trimmed = label.trim();
  const normalized = normalizeDepartmentKey(trimmed);
  
  const department = await Department.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") } },
      { code: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") } },
      { code: normalized },
    ],
  })
    .select("name code _id")
    .lean();

  if (department) {
    return {
      departmentId: department._id,
      departmentKey: normalizeDepartmentKey(department.code || department.name),
      departmentLabel: department.name || department.code || "",
    };
  }

  return null;
}

/**
 * Finds a Department by its full name format (e.g., "AC_Customer Support (NWD_ASS_ACCS)")
 * Handles both full format and partial matches
 * Uses frontend dropdown mapping first, then falls back to DB
 */
async function findDepartmentByFullName(fullName) {
  if (!fullName) return null;

  const trimmed = fullName.trim();
  
  // First try mapping from frontend dropdown values (no DB query)
  const mappedDept = findDepartmentFromMapping(trimmed);
  if (mappedDept) {
    // Still need to get the ObjectId from DB, but we know the department exists
    const department = await Department.findOne({
      $or: [
        { name: mappedDept.name },
        { code: mappedDept.code },
      ],
    })
      .select("name code _id")
      .lean();

    if (department) {
      return {
        departmentId: department._id,
        departmentKey: normalizeDepartmentKey(department.code || department.name),
        departmentLabel: department.name || department.code || "",
        hod: mappedDept.hod, // Include HOD info
      };
    }
  }
  
  // Fallback to DB query if not found in mapping
  const exactEscaped = escapeRegex(trimmed);
  let department = await Department.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${exactEscaped}$`, "i") } },
      { code: { $regex: new RegExp(`^${exactEscaped}$`, "i") } },
    ],
  })
    .select("name code _id")
    .lean();

  if (department) {
    return {
      departmentId: department._id,
      departmentKey: normalizeDepartmentKey(department.code || department.name),
      departmentLabel: department.name || department.code || "",
    };
  }

  // Try matching name part before parentheses (e.g., "AC_Customer Support" from "AC_Customer Support (NWD_ASS_ACCS)")
  const nameMatch = trimmed.match(/^(.+?)\s*\(/);
  if (nameMatch) {
    const namePart = nameMatch[1].trim();
    const nameEscaped = escapeRegex(namePart);
    
    if (nameEscaped) {
      // Try exact match first
      department = await Department.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${nameEscaped}$`, "i") } },
          { code: { $regex: new RegExp(`^${nameEscaped}$`, "i") } },
        ],
      })
        .select("name code _id")
        .lean();

      if (department) {
        return {
          departmentId: department._id,
          departmentKey: normalizeDepartmentKey(department.code || department.name),
          departmentLabel: department.name || department.code || "",
        };
      }

      // Try contains match (more flexible)
      department = await Department.findOne({
        $or: [
          { name: { $regex: new RegExp(nameEscaped, "i") } },
          { code: { $regex: new RegExp(nameEscaped, "i") } },
        ],
      })
        .select("name code _id")
        .lean();

      if (department) {
        return {
          departmentId: department._id,
          departmentKey: normalizeDepartmentKey(department.code || department.name),
          departmentLabel: department.name || department.code || "",
        };
      }
    }
  }

  // Try matching code part inside parentheses (e.g., "NWD_ASS_ACCS" from "AC_Customer Support (NWD_ASS_ACCS)")
  const codeMatch = trimmed.match(/\(([^)]+)\)/);
  if (codeMatch) {
    const codePart = codeMatch[1].trim();
    const codeEscaped = escapeRegex(codePart);
    
    if (codeEscaped) {
      // Try exact match first
      department = await Department.findOne({
        $or: [
          { code: { $regex: new RegExp(`^${codeEscaped}$`, "i") } },
          { name: { $regex: new RegExp(`^${codeEscaped}$`, "i") } },
        ],
      })
        .select("name code _id")
        .lean();

      if (department) {
        return {
          departmentId: department._id,
          departmentKey: normalizeDepartmentKey(department.code || department.name),
          departmentLabel: department.name || department.code || "",
        };
      }

      // Try contains match (more flexible)
      department = await Department.findOne({
        $or: [
          { code: { $regex: new RegExp(codeEscaped, "i") } },
          { name: { $regex: new RegExp(codeEscaped, "i") } },
        ],
      })
        .select("name code _id")
        .lean();

      if (department) {
        return {
          departmentId: department._id,
          departmentKey: normalizeDepartmentKey(department.code || department.name),
          departmentLabel: department.name || department.code || "",
        };
      }
    }
  }

  // Try partial match on the full string (case-insensitive, contains)
  if (exactEscaped) {
    department = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp(exactEscaped, "i") } },
        { code: { $regex: new RegExp(exactEscaped, "i") } },
      ],
    })
      .select("name code _id")
      .lean();

    if (department) {
      return {
        departmentId: department._id,
        departmentKey: normalizeDepartmentKey(department.code || department.name),
        departmentLabel: department.name || department.code || "",
      };
    }
  }

  // Try matching without underscores (e.g., "NIAT_CGE" -> "NIAT CGE")
  const withoutUnderscores = trimmed.replace(/_/g, " ");
  const withoutUnderscoresEscaped = escapeRegex(withoutUnderscores);
  if (withoutUnderscoresEscaped && withoutUnderscoresEscaped !== exactEscaped) {
    department = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp(withoutUnderscoresEscaped, "i") } },
        { code: { $regex: new RegExp(withoutUnderscoresEscaped, "i") } },
      ],
    })
      .select("name code _id")
      .lean();

    if (department) {
      return {
        departmentId: department._id,
        departmentKey: normalizeDepartmentKey(department.code || department.name),
        departmentLabel: department.name || department.code || "",
      };
    }
  }

  // Try matching without spaces (e.g., "NIAT CGE" -> "NIATCGE")
  const withoutSpaces = trimmed.replace(/\s+/g, "");
  const withoutSpacesEscaped = escapeRegex(withoutSpaces);
  if (withoutSpacesEscaped && withoutSpacesEscaped !== exactEscaped) {
    department = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp(withoutSpacesEscaped, "i") } },
        { code: { $regex: new RegExp(withoutSpacesEscaped, "i") } },
      ],
    })
      .select("name code _id")
      .lean();

    if (department) {
      return {
        departmentId: department._id,
        departmentKey: normalizeDepartmentKey(department.code || department.name),
        departmentLabel: department.name || department.code || "",
      };
    }
  }

  return null;
}

async function resolveDepartmentContext({ role, userDepartment, payload }) {
  const isHodLike = role === "HOD" || role === "DataFiller";

  if (isHodLike) {
    if (!userDepartment) {
      throw new Error("Department mapping missing for HOD user.");
    }

    const department = await Department.findById(userDepartment)
      .select("name code")
      .lean();

    if (!department) {
      throw new Error("Assigned department not found for the current HOD.");
    }

    return {
      departmentId: department._id,
      departmentKey: normalizeDepartmentKey(department.code || department.name),
      departmentLabel: department.name || department.code || "",
    };
  }

  if (role !== "Admin") {
    throw new Error("Unsupported role.");
  }

  if (payload.departmentId) {
    if (!mongoose.Types.ObjectId.isValid(payload.departmentId)) {
      throw new Error("Invalid department identifier.");
    }

    const department = await Department.findById(payload.departmentId)
      .select("name code")
      .lean();

    if (!department) {
      throw new Error("Department not found.");
    }

    return {
      departmentId: department._id,
      departmentKey: normalizeDepartmentKey(
        payload.departmentKey || department.code || department.name
      ),
      departmentLabel:
        payload.departmentLabel || department.name || department.code || "",
    };
  }

  if (payload.departmentKey || payload.departmentLabel) {
    const deptInput = payload.departmentLabel || payload.departmentKey;
    
    // First, check if it's an exact match in frontend dropdown values
    const trimmedInput = deptInput.trim();
    const exactMatch = FRONTEND_DEPARTMENT_OPTIONS.find(
      (dept) => dept.toLowerCase() === trimmedInput.toLowerCase()
    );
    
    if (exactMatch) {
      // Use the exact frontend value - extract name and code
      const match = exactMatch.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (match) {
        const name = match[1].trim();
        const code = match[2].trim();
        return {
          departmentId: null, // Don't require DB lookup
          departmentKey: normalizeDepartmentKey(code || name),
          departmentLabel: name || code || exactMatch,
        };
      } else {
        // No parentheses - just use as-is
        return {
          departmentId: null,
          departmentKey: normalizeDepartmentKey(exactMatch),
          departmentLabel: exactMatch,
        };
      }
    }
    
    // Try case-insensitive partial match in frontend dropdown
    const partialMatch = FRONTEND_DEPARTMENT_OPTIONS.find(
      (dept) => dept.toLowerCase().includes(trimmedInput.toLowerCase()) ||
                trimmedInput.toLowerCase().includes(dept.toLowerCase())
    );
    
    if (partialMatch) {
      const match = partialMatch.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (match) {
        const name = match[1].trim();
        const code = match[2].trim();
        return {
          departmentId: null,
          departmentKey: normalizeDepartmentKey(code || name),
          departmentLabel: name || code || partialMatch,
        };
      } else {
        return {
          departmentId: null,
          departmentKey: normalizeDepartmentKey(partialMatch),
          departmentLabel: partialMatch,
        };
      }
    }
    
    // Try matching by code part (e.g., "NWD_TEC_CTT")
    const codeMatch = trimmedInput.match(/\(([^)]+)\)/);
    if (codeMatch) {
      const codePart = codeMatch[1].trim();
      const codeMatchDept = FRONTEND_DEPARTMENT_OPTIONS.find(
        (dept) => dept.includes(`(${codePart})`) || dept.includes(codePart)
      );
      
      if (codeMatchDept) {
        const match = codeMatchDept.match(/^(.+?)\s*\(([^)]+)\)$/);
        if (match) {
          const name = match[1].trim();
          const code = match[2].trim();
          return {
            departmentId: null,
            departmentKey: normalizeDepartmentKey(code || name),
            departmentLabel: name || code || codeMatchDept,
          };
        }
      }
    }
    
    // If no match found in frontend dropdown, use the input as-is (don't throw error)
    // Extract name and code if possible
    const inputMatch = trimmedInput.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (inputMatch) {
      const name = inputMatch[1].trim();
      const code = inputMatch[2].trim();
      return {
        departmentId: null,
        departmentKey: normalizeDepartmentKey(code || name),
        departmentLabel: name || code || trimmedInput,
      };
    }
    
    // Fallback: use input as-is
    return {
      departmentId: null,
      departmentKey: normalizeDepartmentKey(trimmedInput),
      departmentLabel: trimmedInput,
    };
  }

  return {
    departmentId: null,
    departmentKey: "",
    departmentLabel: "",
  };
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function validatePercentageAllocation(payload) {
  const values = percentageFields
    .map((field) => toNumber(payload[field]))
    .filter((value) => value !== null);

  if (values.length === 0) {
    return;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  if (Math.round(total * 100) / 100 !== 100) {
    throw new Error("Allocation percentages must equal 100%.");
  }
}

/**
 * Picks editable fields from request body
 * @param {Object} body - Request body object
 * @returns {Object} Object containing only editable fields
 */
function pickEditableFields(body) {
  return editableFields.reduce((acc, field) => {
    if (body[field] !== undefined) {
      acc[field] = body[field];
    }
    return acc;
  }, {});
}

function normalizeDates(payload) {
  const cloned = { ...payload };
  if (cloned.doj) {
    cloned.doj = new Date(cloned.doj);
  }
  if (cloned.doe) {
    cloned.doe = new Date(cloned.doe);
  }
  return cloned;
}

function normalizeHeaderValue(cell) {
  if (!cell) {
    return "";
  }
  const rawValue =
    typeof cell === "string"
      ? cell
      : cell?.text ?? cell?.result ?? cell?.toString?.() ?? "";
  return rawValue
    .toString()
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function validateWorksheetColumns(worksheet) {
  const headerRow = worksheet.getRow(1);
  const receivedHeaders = headerRow.values.slice(1);

  // Allow extra columns (like "Location" which was removed) but require minimum columns
  if (receivedHeaders.length < columnDefinitions.length) {
    const difference = columnDefinitions.length - receivedHeaders.length;
    throw new Error(
      `Sheet header has ${receivedHeaders.length} column(s) but ${columnDefinitions.length} are required (${difference} missing column(s)). Please download the latest template using "Generate Sheet".`
    );
  }

  // Validate that required columns exist in correct order (ignore extra columns)
  columnDefinitions.forEach((column, index) => {
    const expected = normalizeHeaderValue(column.header);
    const actual = normalizeHeaderValue(receivedHeaders[index]);
    if (expected !== actual) {
      const displayActual =
        typeof receivedHeaders[index] === "object"
          ? receivedHeaders[index]?.text ??
            receivedHeaders[index]?.result ??
            receivedHeaders[index]?.toString?.() ??
            ""
          : receivedHeaders[index] ?? "";
      throw new Error(
        `Column ${index + 1} is "${displayActual}" but should be "${
          column.header
        }". Please ensure the header row matches the generated template exactly (formatting such as bold/italics is ignored). Extra columns will be ignored.`
      );
    }
  });
}

function mapRowToPayload(row) {
  const payload = {};

  columnDefinitions.forEach((column, index) => {
    const cell = row.getCell(index + 1).value;
    if (column.isDate) {
      if (!cell) {
        payload[column.key] = null;
      } else if (cell instanceof Date) {
        payload[column.key] = cell;
      } else if (cell?.result) {
        const date = new Date(cell.result);
        payload[column.key] = Number.isNaN(date.getTime()) ? null : date;
      } else {
        const date = new Date(cell);
        payload[column.key] = Number.isNaN(date.getTime()) ? null : date;
      }
    } else if (typeof cell === "object" && cell?.text) {
      payload[column.key] = cell.text.trim();
    } else if (cell === null || cell === undefined) {
      payload[column.key] = "";
    } else {
      payload[column.key] = cell.toString().trim();
    }
  });

  return payload;
}

async function listExistingEmployees(req, res) {
  try {
    // Verify model is loaded
    if (!ExistingEmployeePayroll || typeof ExistingEmployeePayroll.find !== "function") {
      console.error("FATAL: ExistingEmployeePayroll model not loaded correctly!");
      console.error("Model value:", ExistingEmployeePayroll);
      return res.status(500).json({
        success: false,
        message: "Server configuration error. Please restart the server.",
      });
    }

    const { role, department: userDepartment } = req.user;
    const { department: queryDepartment } = req.query;

    const filter = {};

    if (role === "HOD" || role === "DataFiller") {
      const { id: userId } = req.user;
      
      // Get HOD's email to find their Source Department category
      const hodUser = await User.findById(userId).select("email").lean();
      const hodEmail = hodUser?.email?.toLowerCase();
      
      // Find which Source Department(s) this HOD manages
      const hodSourceDepartments = [];
      for (const [sourceDept, email] of Object.entries(SOURCE_DEPARTMENT_TO_HOD_EMAIL)) {
        if (email.toLowerCase() === hodEmail) {
          hodSourceDepartments.push(sourceDept);
        }
      }
      
      // Determine which department(s) to filter by
      let targetDepartmentId = userDepartment;
      
      // If queryDepartment is provided and is a valid ObjectId, use it (for HODs with multiple departments)
      if (queryDepartment && mongoose.Types.ObjectId.isValid(queryDepartment)) {
        // Verify this department belongs to the HOD
        const dept = await Department.findById(queryDepartment).select("hod").lean();
        if (dept && dept.hod && dept.hod.toString() === userId.toString()) {
          targetDepartmentId = queryDepartment;
        } else if (userDepartment && queryDepartment.toString() === userDepartment.toString()) {
          // Also allow if it matches user's assigned department
          targetDepartmentId = queryDepartment;
        }
      }
      
      if (!targetDepartmentId && hodSourceDepartments.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "Department mapping missing for current HOD.",
        });
      }

      // HOD sees:
      // 1. Records where sourceDepartment matches their Source Department category
      // 2. Records in their assigned department (if they have one)
      // 3. Pending sign-offs targeted to their department (to accept/reject)
      // 4. Records they requested sign-off for (to see status and edit/delete)
      
      const filterConditions = [];
      
      // Filter by Source Department if HOD manages a Source Department category
      if (hodSourceDepartments.length > 0) {
        filterConditions.push({
          sourceDepartment: { $in: hodSourceDepartments },
        });
      }
      
      // Also include records from their assigned department
      if (targetDepartmentId) {
        filterConditions.push({
          department: targetDepartmentId,
        });
      }
      
      // Get sign-off related records
      const signOffFilter = { status: "pending" };
      if (targetDepartmentId) {
        signOffFilter.targetDepartment = targetDepartmentId;
      }
      
      const pendingSignOffs = await SignOffRequest.find(signOffFilter)
        .select("payrollRecord")
        .lean();

      const requestedSignOffs = await SignOffRequest.find({
        requestedBy: userId,
      })
        .select("payrollRecord")
        .lean();

      const pendingPayrollIds = pendingSignOffs.map((s) => s.payrollRecord);
      const requestedPayrollIds = requestedSignOffs.map((s) => s.payrollRecord);

      // Combine all IDs that should be visible
      const allVisibleIds = [
        ...new Set([
          ...pendingPayrollIds.map((id) => id.toString()),
          ...requestedPayrollIds.map((id) => id.toString()),
        ]),
      ];

      if (filterConditions.length > 0) {
        if (allVisibleIds.length > 0) {
          filter.$or = [
            ...filterConditions,
            { _id: { $in: allVisibleIds.map((id) => new mongoose.Types.ObjectId(id)) } },
          ];
        } else {
          filter.$or = filterConditions;
        }
      } else if (allVisibleIds.length > 0) {
        filter._id = { $in: allVisibleIds.map((id) => new mongoose.Types.ObjectId(id)) };
      } else {
        // No filters - return empty
        filter._id = { $in: [] };
      }
    } else if (role === "Admin") {
      // Admin sees all records, optionally filtered by queryDepartment
      if (queryDepartment && queryDepartment !== "all") {
        filter.departmentKey = normalizeDepartmentKey(queryDepartment);
      }
    } else if (queryDepartment) {
      filter.departmentKey = normalizeDepartmentKey(queryDepartment);
    }

    // Only select fields that are actually needed (reduces payload size)
    const records = await ExistingEmployeePayroll.find(filter)
      .select("empId empName doj doe month designation departmentLabel topDepartment type sourceDepartment beneficiaryDepartment sourceHod beneficiaryHod location employeeType amount academy intensive niatBatch12 niatBatch3 niatBatch4 others common department departmentKey uploadOrder createdAt updatedAt")
      .sort({ uploadOrder: 1, createdAt: 1 })
      .lean();

    // Get sign-off request status for each record (including accepted/rejected)
    // Only fetch if we have records (optimization)
    let signOffRequests = [];
    if (records.length > 0) {
      const recordIds = records.map((r) => r._id);
      signOffRequests = await SignOffRequest.find({
        payrollRecord: { $in: recordIds },
      })
        .select("payrollRecord status targetDepartment remark requestedBy")
        .lean();
    }

    // Create a map of payroll record ID to sign-off request
    const signOffMap = {};
    signOffRequests.forEach((req) => {
      signOffMap[req.payrollRecord.toString()] = {
        status: req.status,
        targetDepartment: req.targetDepartment,
        remark: req.remark,
        requestedBy: req.requestedBy,
      };
    });

    // Add sign-off status to each record
    // For HODs: show pending if targeted to their department, or show all statuses if they requested it
    // For Admins: show all sign-off statuses
    const { id: userId } = req.user;
    const recordsWithSignOff = records.map((record) => {
      const signOffInfo = signOffMap[record._id.toString()];
      let signoffStatus = null;
      
      if (signOffInfo) {
        if (role === "HOD" || role === "DataFiller") {
          // Show pending if targeted to their department (so they can accept/reject)
          if (
            userDepartment &&
            signOffInfo.targetDepartment &&
            signOffInfo.targetDepartment.toString() === userDepartment.toString()
          ) {
            signoffStatus = signOffInfo.status;
          }
          // Also show all statuses (pending, accepted, rejected) if they were the requester
          // This ensures they can see the status of their sign-off requests
          else if (
            signOffInfo.requestedBy &&
            signOffInfo.requestedBy.toString() === userId.toString()
          ) {
            signoffStatus = signOffInfo.status;
          }
        } else {
          // For Admins, show all sign-off statuses
          signoffStatus = signOffInfo.status;
        }
      }

      return {
        ...record,
        signoffStatus,
        signoffTargetDepartment: signOffInfo?.targetDepartment || null,
        signoffRemark: signOffInfo?.remark || null,
        signoffRequestedBy: signOffInfo?.requestedBy || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: recordsWithSignOff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch existing employee payroll entries.",
    });
  }
}

async function exportExistingEmployees(req, res) {
  try {
    const { role, department: userDepartment } = req.user;
    const { department: queryDepartment } = req.query;

    const filter = {};

    if (role === "HOD" || role === "DataFiller") {
      const { id: userId } = req.user;
      
      // Get HOD's email to find their Source Department category
      const hodUser = await User.findById(userId).select("email").lean();
      const hodEmail = hodUser?.email?.toLowerCase();
      
      // Find which Source Department(s) this HOD manages
      const hodSourceDepartments = [];
      for (const [sourceDept, email] of Object.entries(SOURCE_DEPARTMENT_TO_HOD_EMAIL)) {
        if (email.toLowerCase() === hodEmail) {
          hodSourceDepartments.push(sourceDept);
        }
      }
      
      // Determine which department(s) to filter by
      let targetDepartmentId = userDepartment;
      
      // If queryDepartment is provided and is a valid ObjectId, use it (for HODs with multiple departments)
      if (queryDepartment && mongoose.Types.ObjectId.isValid(queryDepartment)) {
        // Verify this department belongs to the HOD
        const dept = await Department.findById(queryDepartment).select("hod").lean();
        if (dept && dept.hod && dept.hod.toString() === userId.toString()) {
          targetDepartmentId = queryDepartment;
        } else if (userDepartment && queryDepartment.toString() === userDepartment.toString()) {
          // Also allow if it matches user's assigned department
          targetDepartmentId = queryDepartment;
        }
      }
      
      if (!targetDepartmentId && hodSourceDepartments.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Department mapping missing for current HOD.",
        });
      }

      // HOD sees:
      // 1. Records where sourceDepartment matches their Source Department category
      // 2. Records in their assigned department (if they have one)
      // 3. Pending sign-offs targeted to their department (to accept/reject)
      // 4. Records they requested sign-off for (to see status and edit/delete)
      
      const filterConditions = [];
      
      // Filter by Source Department if HOD manages a Source Department category
      if (hodSourceDepartments.length > 0) {
        filterConditions.push({
          sourceDepartment: { $in: hodSourceDepartments },
        });
      }
      
      // Also include records from their assigned department
      if (targetDepartmentId) {
        filterConditions.push({
          department: targetDepartmentId,
        });
      }
      
      // Get sign-off related records
      const signOffFilter = { status: "pending" };
      if (targetDepartmentId) {
        signOffFilter.targetDepartment = targetDepartmentId;
      }
      
      const pendingSignOffs = await SignOffRequest.find(signOffFilter)
        .select("payrollRecord")
        .lean();

      const requestedSignOffs = await SignOffRequest.find({
        requestedBy: userId,
      })
        .select("payrollRecord")
        .lean();

      const pendingPayrollIds = pendingSignOffs.map((s) => s.payrollRecord);
      const requestedPayrollIds = requestedSignOffs.map((s) => s.payrollRecord);

      // Combine all IDs that should be visible
      const allVisibleIds = [
        ...new Set([
          ...pendingPayrollIds.map((id) => id.toString()),
          ...requestedPayrollIds.map((id) => id.toString()),
        ]),
      ];

      if (filterConditions.length > 0) {
        if (allVisibleIds.length > 0) {
          filter.$or = [
            ...filterConditions,
            { _id: { $in: allVisibleIds.map((id) => new mongoose.Types.ObjectId(id)) } },
          ];
        } else {
          filter.$or = filterConditions;
        }
      } else if (allVisibleIds.length > 0) {
        filter._id = { $in: allVisibleIds.map((id) => new mongoose.Types.ObjectId(id)) };
      } else {
        // No filters - return empty
        filter._id = { $in: [] };
      }
    } else if (queryDepartment && queryDepartment !== "all") {
      filter.departmentKey = normalizeDepartmentKey(queryDepartment);
    }

    // Only select fields that are actually needed (reduces payload size)
    const records = await ExistingEmployeePayroll.find(filter)
      .select("empId empName doj doe month designation departmentLabel topDepartment type sourceDepartment beneficiaryDepartment sourceHod beneficiaryHod location employeeType amount academy intensive niatBatch12 niatBatch3 niatBatch4 others common department departmentKey uploadOrder createdAt updatedAt")
      .sort({ uploadOrder: 1, createdAt: 1 })
      .lean();

    const workbook = await buildExistingEmployeeWorkbook(records);
    const fileName = `existing_employees_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to export existing employee sheet.",
    });
  }
}

async function createExistingEmployee(req, res) {
  try {
    const { role, id: userId, department: userDepartment } = req.user;

    const departmentMeta = await resolveDepartmentContext({
      role,
      userDepartment,
      payload: {
        departmentId: req.body.departmentId,
        departmentKey: req.body.departmentKey || req.body.department,
        departmentLabel:
          req.body.departmentLabel || req.body.departmentName || "",
      },
    });

    const payload = normalizeDates({
      ...pickEditableFields(req.body),
      department: departmentMeta.departmentId,
      departmentKey: departmentMeta.departmentKey,
      departmentLabel: departmentMeta.departmentLabel,
      createdBy: userId,
      updatedBy: userId,
    });

    validatePercentageAllocation(payload);

    const record = await ExistingEmployeePayroll.create(payload);

    return res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create existing employee entry.",
    });
  }
}

async function updateExistingEmployee(req, res) {
  try {
    const { role, id: userId, department: userDepartment } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll entry identifier.",
      });
    }

    const record = await ExistingEmployeePayroll.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll entry not found.",
      });
    }

    // Check if HOD can edit: either from their department OR they requested sign-off that was accepted
    if (role === "HOD") {
      const canEditOwnDepartment =
        record.department &&
        userDepartment &&
        record.department.toString() === userDepartment.toString();

      // Check if user is the original requester of an accepted sign-off
      let canEditAsRequester = false;
      if (!canEditOwnDepartment) {
        const acceptedSignOff = await SignOffRequest.findOne({
          payrollRecord: id,
          status: "accepted",
          requestedBy: userId,
        }).lean();

        if (acceptedSignOff) {
          canEditAsRequester = true;
        }
      }

      if (!canEditOwnDepartment && !canEditAsRequester) {
        return res.status(403).json({
          success: false,
          message: "You can only edit entries from your department or entries you requested sign-off for.",
        });
      }
    }

    let departmentMeta = null;

    if (role === "Admin" && (req.body.departmentId || req.body.departmentKey)) {
      departmentMeta = await resolveDepartmentContext({
        role,
        payload: {
          departmentId: req.body.departmentId,
          departmentKey: req.body.departmentKey || req.body.department,
          departmentLabel:
            req.body.departmentLabel || req.body.departmentName || "",
        },
      });
    } else if (role === "HOD") {
      departmentMeta = await resolveDepartmentContext({
        role,
        userDepartment,
        payload: {},
      });
    }

    const updates = normalizeDates({
      ...pickEditableFields(req.body),
      updatedBy: userId,
    });

    // Remove undefined values to prevent overwriting with undefined
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    validatePercentageAllocation({ ...record.toObject(), ...updates });

    if (departmentMeta) {
      updates.department = departmentMeta.departmentId;
      updates.departmentKey = departmentMeta.departmentKey;
      updates.departmentLabel = departmentMeta.departmentLabel;
    }

    Object.assign(record, updates);
    await record.save();

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update payroll entry.",
    });
  }
}

async function deleteExistingEmployee(req, res) {
  try {
    const { id } = req.params;
    const { role, id: userId, department: userDepartment } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll entry identifier.",
      });
    }

    const record = await ExistingEmployeePayroll.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll entry not found.",
      });
    }

    // Check if HOD can delete: either from their department OR they requested sign-off that was accepted
    if (role === "HOD") {
      const canDeleteOwnDepartment =
        record.department &&
        userDepartment &&
        record.department.toString() === userDepartment.toString();

      // Check if user is the original requester of an accepted sign-off
      let canDeleteAsRequester = false;
      if (!canDeleteOwnDepartment) {
        const acceptedSignOff = await SignOffRequest.findOne({
          payrollRecord: id,
          status: "accepted",
          requestedBy: userId,
        }).lean();

        if (acceptedSignOff) {
          canDeleteAsRequester = true;
        }
      }

      if (!canDeleteOwnDepartment && !canDeleteAsRequester) {
        return res.status(403).json({
          success: false,
          message: "You can only delete entries from your department or entries you requested sign-off for.",
        });
      }
    }

    await record.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Payroll entry removed.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to delete payroll entry.",
    });
  }
}

async function uploadExistingEmployeesSheet(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid .xlsx file.",
      });
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(req.file.buffer);
    } catch (loadError) {
      return res.status(400).json({
        success: false,
        message: "Invalid Excel file format. Please ensure the file is a valid .xlsx file.",
      });
    }

    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded workbook has no worksheets. Please ensure the Excel file contains at least one sheet.",
      });
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "Uploaded workbook is empty.",
      });
    }

    if (worksheet.rowCount < 2) {
      return res.status(400).json({
        success: false,
        message: "Uploaded sheet has no data rows. Please ensure the sheet contains at least one data row after the header.",
      });
    }

    validateWorksheetColumns(worksheet);

    const { role, id: userId, department: userDepartment } = req.user;

    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex);
      if (row.values.filter(Boolean).length === 0) {
        continue;
      }

      const mappedPayload = mapRowToPayload(row);

      validatePercentageAllocation(mappedPayload);

      // For Admin uploads, use departmentLabel from the sheet directly
      // sourceDepartment is only used for HOD filtering, not for department assignment
      let departmentMeta = null;
      
      if (role === "Admin") {
        // Admin should use departmentLabel from the uploaded sheet
        // This allows all departments to be uploaded correctly
        departmentMeta = await resolveDepartmentContext({
          role,
          userDepartment,
          payload: {
            departmentKey: mappedPayload.departmentLabel,
            departmentLabel: mappedPayload.departmentLabel,
          },
        });
      } else {
        // For HOD uploads, use existing logic
        departmentMeta = await resolveDepartmentContext({
          role,
          userDepartment,
          payload: {
            departmentKey: mappedPayload.departmentLabel,
            departmentLabel: mappedPayload.departmentLabel,
          },
        });
      }

      const payload = normalizeDates({
        ...mappedPayload,
        department: departmentMeta.departmentId,
        departmentKey: departmentMeta.departmentKey,
        departmentLabel: departmentMeta.departmentLabel,
        uploadOrder: rowIndex, // Preserve the order from uploaded sheet
        updatedBy: userId,
      });

      if (!payload.empName?.trim()) {
        throw new Error(
          `Row ${rowIndex}: Employee name is required before import.`
        );
      }

      const identifier = payload.empId?.trim();
      const month = payload.month?.trim();
      let record = null;

      // Find existing record by empId AND month (allows same employee for different months)
      if (identifier && month) {
        record = await ExistingEmployeePayroll.findOne({ 
          empId: identifier,
          month: month
        });
      } else if (identifier) {
        // Fallback: if no month, use only empId (for backward compatibility)
        record = await ExistingEmployeePayroll.findOne({ empId: identifier });
      }

      if (record) {
        // Update existing record (same empId + month combination)
        Object.assign(record, payload);
        await record.save();
      } else {
        // Create new record (new empId + month combination)
        await ExistingEmployeePayroll.create({
          ...payload,
          createdBy: userId,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Sheet uploaded successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error.message || "Unable to process the uploaded existing employee sheet.",
    });
  }
}

// Mapping from Source Department values (from uploaded sheet) to actual Department names/codes
// This maps the "Source Department" column to the actual department the employee belongs to
// Format: "Source Department" -> Array of possible department names/codes
const SOURCE_DEPARTMENT_TO_ACTUAL_DEPARTMENTS = {
  "Management": ["CT (NWD_CT)", "Founder's Office (NWD_FO)", "Control Tower (NWD_FO_CT)"],
  "Sales": ["Sales (NWD_SA)", "Academy_CGE (NWD_SA_AC_CGE)", "Intensive_CGE (NWD_SA_IN_CGE)", "NIAT_CGE (NWD_SA_NIAT_CGE)", "Academy_Training (NWD_SA_AC_TR)", "Academy_Hiring (NWD_SA_AC_HI)", "Academy_QA (NWD_SA_AC_QA)", "Sales POD (NWD_TEC_SA)"],
  "Pre-Sales": ["Pre Sales (NWD_PS)", "Lead Generation (NWD_PS_LG)", "Lead Qualification (NWD_PS_LQ)", "AC_Lead Qualification (NWD_PS_AC-LQ)", "NIAT_Lead Qualification (NWD_PS_LQ_NIAT-LQ)", "AC_Digital Marketing (NWD_PS_AC_DM)", "L&D - Presales (NWD_PS_LD)", "PC - Positive Community Building (NWD_PS_PC_PCB)", "AC_4.0 Tribe (NWD_PS_LG_AC-4.0T&NET)", "College Dost & SEO (NWD_PS_LG_CD&SEO)", "Influencer Marketing & Digital Affiliate (NWD_PS_LG_IM&DA)", "Pre Sales POD (NWD_TEC_PSAP)", "Pre-Sales Studio (NWD_PS_ST)", "NIAT (NWD_PSS_NIAT)", "NIAT_Offline Lead Generation (NWD_PS_NIAT_OLG)"],
  "Sales - Intensive": ["Intensive_CGE (NWD_SA_IN_CGE)", "Intensive Student Success (NWD_ISS_Int_SS)", "Intensive Student Success (NWD_ISS)", "Intensive Student Success (Intensive Student Success_NWD_ISS_Int_SS)", "College Plus Student Success (NWD_ISS_CPSS)"],
  "Content Marketing": ["Content Marketing (NWD__BM_CM)", "Brand Marketing (NWD_BM)"],
  "Placement - Corporate Relations": ["Placement Support Team (NWD_PST)", "PST - Corporate Relations (NWD_PST_CR)", "PST - Customer Support (NWD_PST_CS)", "PST - Lead Acquisition (NWD_PST_LA)", "PST - Placement Coordinator (NWD_PST_PC)", "PST - Placement Content Team (NWD_PST_PCT)", "Topin Tech (NWD_PST_TT)", "B2B Marketing (NWD_PST_B2B)", "Placement Support POD (NWD_TEC_PSP)"],
  "Technology": ["Central Tech Team (NWD_TEC_CTT)", "Sales POD (NWD_TEC_SA)", "Content & Learning Outcomes POD (NWD_TEC_CO&LO)", "Placement Support POD (NWD_TEC_PSP)", "Pre Sales POD (NWD_TEC_PSAP)", "NIAT Student Success POD (NWD_TEC_NSSP)", "DSA POD (NWD_TEC_DSAP)", "Academy Student Success POD (NWD_TEC_ASSP)", "Website Team (NWD_TEC_WT)"],
  "Student Success - Academy": ["AC_Customer Support (NWD_ASS_ACCS)", "Central Team- Academy Student Success (NWD_ASS_CT)", "IN_Customer Support (NWD_ASS_IN_CS)", "Payments Retention Team (NWD_ASS_PYRT)", "Placement Preparation (NWD_ASS_PP)", "Pre-Onboarding (Pre-Onboarding_NWD_ASS_PO)", "Student Engagement (NWD_ASS_SE)", "Success Coach (NWD_ASS_SC)"],
  "Student Success - Intensive": ["Intensive Student Success (NWD_ISS_Int_SS)", "Intensive Student Success (NWD_ISS)", "Intensive Student Success (Intensive Student Success_NWD_ISS_Int_SS)", "College Plus Student Success (NWD_ISS_CPSS)", "PC - Positive Community Building (NWD_PC_PCB)"],
  "Placement Success Manager": ["Placement Success Management (NWD_PSM)"],
  "Query Resolution": ["QR - Query Resolution (NWD_QR)"],
  "NIAT - Academics": ["NIAT_Instructors (NWD_NIAT_AC_IN)", "NIAT_Instructors & Mentors (NWD_NIAT_AC_I&M)", "NIAT_Instructors_Aptitude & English (NWD_NIAT_AC_I_A&E)", "NIAT_Instructors_DSA (NWD_NIAT_AC_DSA)", "NIAT_Maths Instructors and Mentors (NWD_NIAT_MIM)", "NIAT_Product (NWD_NIAT_AC_PRO)", "NIAT_Program Operations (NWD_NIAT_AC_PO)", "NIAT_Student Engagement (NWD_NIAT_AC_SE)", "NIAT_Student Success (NWD_NIAT_AC_SS)", "NIAT_CRM & Data (NWD_NIAT_AC_CRM&D)"],
  "Video House": ["Video House (NWD_VH)", "NIAT Studio (NWD_NIAT_S)", "NxtWave Studio (NW_NXT_ST)", "Pre-Sales Studio (NWD_PS_ST)", "Webinar Studio (NWD_VH_WS)"],
  "PRE": ["AS - Program Registration Expert (NWD_BU_AS_PRE)", "NIAT_Offline Lead Generation (NWD_AS_PRE_NIAT_OLG)"],
  "Content - DS&ML": ["Data Science and Machine Learning (NWD_DSML)", "NIAT_Master Class (NWD_DSML_NIAT_MC)", "CD - Content Development (NWD_DSML_CDCD)", "Content Development- DSML (NWD_CD_DSML)"],
  "University Partnership": ["University Partnerships (NWD_UP)", "University Partnerships (NWD_UPS)"],
  "Talent Acquisition": ["HR - Talent Acquisition (NWD_HR_TA)"],
  "Product": ["Product (NWD_P)", "Product-Learning (NW_P_PDL)", "Product - NxtGig AI Accelerator (NWD_P_NXTGIG)", "Product-Sales (NW_P_PRS)"],
  "Business Ops": ["Business Operations (NWD_BO)", "Pre Sales (NWD_BO_PS)"],
  "Placement - Content": ["PST - Placement Content Team (NWD_PST_PCT)"],
  "NIAT Masterclass": ["NIAT_Master Class (NWD_DSML_NIAT_MC)"],
  "NIAT - Robotics": ["NIAT_Robotics (NWD_NIAT_AC_R)"],
  "Content - DS&Algo": ["DSA (NWD_CD_DSA)", "DSA POD (NWD_TEC_DSAP)", "Content Development (NWD_CD)"],
  "Student Success - NIAT": ["NIAT_Student Success (NWD_NIAT_AC_SS)", "NIAT Student Success POD (NWD_TEC_NSSP)"],
  "Human Resource": ["HR - Human Resources (NWD_HR)", "HR - HRBP (NWD_HRBP)", "HR - Admin (NWD_HR_ADM)", "HR - Operations (NWD_HR_OPS)", "HR - Payroll And Compliance (NWD_HR_P&C)", "HR - Systems (NWD_HR_HRS)", "PO - Procurement (NWD_HR_PO)", "HR - Learning & Development (NWD_HR_L&D)"],
  "NIAT - Program Ops": ["NIAT_Program Operations (NWD_NIAT_AC_PO)"],
  "Abroad": ["NxtWave Abroad (NWD_NA)"],
  "Founders Office": ["Founder's Office (NWD_FO)", "Control Tower (NWD_FO_CT)"],
  "Product Design": ["Product Design (NWD_DS_PD)"],
  "Graphic Design": ["Graphic Design (NWD_DS_GD)"],
  "10xIIT": ["10xIIT (NWD_10XIIT)"],
  "NxtWave Edge - Colleges": ["NxtWave Edge - Colleges (NWD_NWEC)"],
  "Intensive Offline": ["NIAT_Offline Lead Generation (NWD_PS_NIAT_OLG)", "NIAT_Offline Lead Generation (NWD_AS_PRE_NIAT_OLG)"],
  "Assessments POD": ["Assessment Content and Ops (NWD_CCD_AC_Ops)"],
  "Internal Audit": ["Internal Audit (NWD_IA)", "Business Process Excellence & Assurance (NWD_IA_BPE&A)", "Financial Audit (NWD_IA_FA)", "Sales Quality & Compliance Audit (NWD_IA_SQ&CA)"],
  "Finance": ["Finance (NWD_F&L_FIN)", "FP&A (NWD_F&L_FP&A)", "Legal (NWD_F&L_LE)", "Legal (NWD_L)"],
  "GenAI Social Media": ["GenAI Social Media (NWD_GAISM)"],
  "AI&Beyond": ["10xIIT (NWD_10XIIT)"],
  "Content - MERN": ["CD - Curriculum Development (NWD_TEC_CUD)", "CD - Curriculum Development (NWD_CD_CD)", "Curriculum Development: Aptitude (NWD_CCD_CD_A)", "Curriculum Development: English (NWD_CCD_CD_E)"],
  "HR - Admin/Facilities": ["HR - Admin (NWD_HR_ADM)", "PO - Procurement (NWD_HR_PO)", "NIAT Hostel Facilities Team (NWD_NIAT_HFT)"],
  "Branding": ["Brand Marketing (NWD_BM)", "Content Marketing (NWD__BM_CM)"],
  "HR - Learning & Development": ["HR - Learning & Development (NWD_HR_L&D)"],
  "Policy & Strategic Partnerships": ["Internal Audit (NWD_IA)", "HR - HRBP (NWD_HRBP)"],
  "NIFA": ["NIFA (NWD_NIFA)"],
  "Pre-Sales - Intensive": ["Pre Sales (NWD_PS)", "Intensive Student Success (NWD_ISS_Int_SS)"],
  "NIAT - Hiring team": ["Academy_Hiring (NWD_SA_AC_HI)"],
  "Masterclass": ["NIAT_Master Class (NWD_DSML_NIAT_MC)"],
  "NxtGen LP": ["Product - NxtGig AI Accelerator (NWD_P_NXTGIG)"],
};

// Mapping from Source Department to HOD email (for sign-off and filtering)
const SOURCE_DEPARTMENT_TO_HOD_EMAIL = {
  "Management": "rahul@nxtwave.co.in",
  "Sales": "sumanth@nxtwave.co.in",
  "Pre-Sales": "shanker@nxtwave.co.in",
  "Sales - Intensive": "aniketh@nxtwave.co.in",
  "Content Marketing": "sampreeth@nxtwave.co.in",
  "Placement - Corporate Relations": "girish@nxtwave.co.in",
  "Technology": "revanth@nxtwave.co.in",
  "Student Success - Academy": "vamshi@nxtwave.co.in",
  "Student Success - Intensive": "aniketh@nxtwave.co.in",
  "Placement Success Manager": "vamsitallam@nxtwave.co.in",
  "Query Resolution": "vamsitallam@nxtwave.co.in",
  "NIAT - Academics": "vamsitallam@nxtwave.co.in",
  "Video House": "joseph.joiet@nxtwave.co.in",
  "PRE": "anil@nxtwave.co.in",
  "Content - DS&ML": "akhil@nxtwave.co.in",
  "University Partnership": "karthik@nxtwave.co.in",
  "Talent Acquisition": "hari@nxtwave.co.in",
  "Product": "revanth@nxtwave.co.in",
  "Business Ops": "shivam.singh@nxtwave.co.in",
  "Placement - Content": "saiteja@nxtwave.co.in",
  "NIAT Masterclass": "akhil@nxtwave.co.in",
  "NIAT - Robotics": "saiteja@nxtwave.co.in",
  "Content - DS&Algo": "sashank@nxtwave.co.in",
  "Student Success - NIAT": "aniketh@nxtwave.co.in",
  "Human Resource": "alekhya.k@nxtwave.co.in",
  "NIAT - Program Ops": "pavan.dharma@nxtwave.co.in",
  "Abroad": "anil@nxtwave.co.in",
  "Founders Office": "rahul@nxtwave.co.in",
  "Product Design": "aman.maheshwari@nxtwave.co.in",
  "Graphic Design": "shivajibabu.velpula@nxtwave.co.in",
  "10xIIT": "srikar@nxtwave.co.in",
  "NxtWave Edge - Colleges": "sashank@nxtwave.co.in",
  "Intensive Offline": "aniketh@nxtwave.co.in",
  "Assessments POD": "sashank@nxtwave.co.in",
  "Internal Audit": "alekhya.k@nxtwave.co.in",
  "Finance": "akhilesh.jhawar@nxtwave.in",
  "GenAI Social Media": "rahul.yenninti@nxtwave.co.in",
  "AI&Beyond": "srikar@nxtwave.co.in",
  "Content - MERN": "pavangangireddy@nxtwave.co.in",
  "HR - Admin/Facilities": "balabhaskar@nxtwave.co.in",
  "Branding": "nikita.aggarwal@nxtwave.co.in",
  "HR - Learning & Development": "varun@nxtwave.co.in",
  "Policy & Strategic Partnerships": "alekhya.k@nxtwave.co.in",
  "NIFA": "akhil@nxtwave.co.in",
  "Pre-Sales - Intensive": "aniketh@nxtwave.co.in",
  "NIAT - Hiring team": "vamsitallam@nxtwave.co.in",
  "Masterclass": "akhil@nxtwave.co.in",
  "NxtGen LP": "revanth@nxtwave.co.in",
};

// Legacy mapping (keeping for backward compatibility)
const SOURCE_DEPARTMENT_TO_DB_DEPARTMENT = {
  Management: "Management",
  Sales: "Sales",
  "Pre-Sales": "Pre-Sales",
  "Sales - Intensive": "Sales - Intensive",
  "Content Marketing": "Content Marketing",
  "Placement - Corporate Relations": "Placement - Corporate Relations",
  Technology: "Technology",
  "Student Success - Academy": "Student Success - Academy",
  "Student Success - Intensive": "Student Success - Intensive",
  "Placement Success Manager": "Placement Success Manager",
  "Query Resolution": "Query Resolution",
  "NIAT - Academics": "NIAT - Academics",
  "Video House": "Video House",
  PRE: "PRE",
  "Content - DS&ML": "Content - DS&ML",
  "University Partnership": "University Partnership",
  "Talent Acquisition": "Talent Acquisition",
  Product: "Product",
  "Business Ops": "Business Ops",
  "Placement - Content": "Placement - Content",
  "NIAT Masterclass": "NIAT Masterclass",
  "NIAT - Robotics": "NIAT - Robotics",
  "Content - DS&Algo": "Content - DS&Algo",
  "Student Success - NIAT": "Student Success - NIAT",
  "Human Resource": "Human Resource",
  "NIAT - Program Ops": "NIAT - Program Ops",
  Abroad: "Abroad",
  "Founders Office": "Founders Office",
  "Product Design": "Product Design",
  "Graphic Design": "Graphic Design",
  "10xIIT": "10xIIT",
  "NxtWave Edge - Colleges": "NxtWave Edge - Colleges",
  "Intensive Offline": "Intensive Offline",
  "Assessments POD": "Assessments POD",
  "Internal Audit": "Internal Audit",
  Finance: "Finance",
  "GenAI Social Media": "GenAI Social Media",
  "AI&Beyond": "AI&Beyond",
  "Content - MERN": "Content - MERN",
  "HR - Admin/Facilities": "HR - Admin/Facilities",
  Branding: "Branding",
  "HR - Learning & Development": "HR - Learning & Development",
  "Policy & Strategic Partnerships": "Policy & Strategic Partnerships",
  NIFA: "NIFA",
  "Pre-Sales - Intensive": "Pre-Sales - Intensive",
  "NIAT - Hiring team": "NIAT - Hiring team",
  Masterclass: "Masterclass",
  "NxtGen LP": "NxtGen LP",
  "Chemistry Dept": "CT",
  CT: "CT",
};

/**
 * Finds Department documents by Source Department name
 * Returns the first matching department from the mapping
 */
async function findDepartmentBySourceDepartmentName(sourceDeptName) {
  if (!sourceDeptName) return null;

  const cleanName = sourceDeptName.trim();

  // First try the new mapping to actual departments
  const actualDepts = SOURCE_DEPARTMENT_TO_ACTUAL_DEPARTMENTS[cleanName];
  if (actualDepts && actualDepts.length > 0) {
    // Try to find the first matching department from the list
    for (const deptName of actualDepts) {
      // Try exact match first
      const mappedDept = findDepartmentFromMapping(deptName);
      if (mappedDept) {
        const department = await Department.findOne({
          $or: [
            { name: mappedDept.name },
            { code: mappedDept.code },
          ],
        }).lean();
        if (department) return department;
      }
      
      // Try matching by name part before parentheses
      const nameMatch = deptName.match(/^(.+?)\s*\(/);
      if (nameMatch) {
        const namePart = nameMatch[1].trim();
        const department = await Department.findOne({
          name: { $regex: new RegExp(`^${escapeRegex(namePart)}$`, "i") },
        }).lean();
        if (department) return department;
      }
      
      // Try matching by code inside parentheses
      const codeMatch = deptName.match(/\(([^)]+)\)/);
      if (codeMatch) {
        const codePart = codeMatch[1].trim();
        const department = await Department.findOne({
          code: { $regex: new RegExp(`^${escapeRegex(codePart)}$`, "i") },
        }).lean();
        if (department) return department;
      }
    }
  }

  // Fallback to legacy mapping
  const dbDeptName = SOURCE_DEPARTMENT_TO_DB_DEPARTMENT[cleanName];
  if (dbDeptName) {
    const escaped = escapeRegex(dbDeptName);
    const department = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { code: { $regex: new RegExp(`^${escaped}$`, "i") } },
      ],
    }).lean();
    if (department) return department;
  }

  // Try exact match with cleaned name
  const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let department = await Department.findOne({
    $or: [
      { name: new RegExp(`^${escaped}$`, "i") },
      { code: new RegExp(`^${escaped}$`, "i") },
    ],
  }).lean();
  if (department) return department;

  // Try partial match (contains) - more flexible
  const partialEscaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  department = await Department.findOne({
    $or: [
      { name: new RegExp(partialEscaped, "i") },
      { code: new RegExp(partialEscaped, "i") },
    ],
  }).lean();
  if (department) return department;

  // Try to extract department name if it contains parentheses
  const parenMatch = cleanName.match(/^(.+?)\s*\(/);
  if (parenMatch) {
    const extractedName = parenMatch[1].trim();
    const extractedEscaped = extractedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    department = await Department.findOne({
      $or: [
        { name: new RegExp(`^${extractedEscaped}$`, "i") },
        { name: new RegExp(extractedEscaped, "i") },
        { code: new RegExp(`^${extractedEscaped}$`, "i") },
        { code: new RegExp(extractedEscaped, "i") },
      ],
    }).lean();
    if (department) return department;
  }

  // Try to extract code from parentheses
  const codeMatch = cleanName.match(/\(([^)]+)\)/);
  if (codeMatch) {
    const extractedCode = codeMatch[1].trim();
    const codeEscaped = extractedCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    department = await Department.findOne({
      $or: [
        { code: new RegExp(`^${codeEscaped}$`, "i") },
        { code: new RegExp(codeEscaped, "i") },
        { name: new RegExp(`^${codeEscaped}$`, "i") },
      ],
    }).lean();
    if (department) return department;
  }

  // Try removing common suffixes like "Dept", "Department", etc.
  const nameWithoutSuffix = cleanName
    .replace(/\s+Dept\.?$/i, "")
    .replace(/\s+Department\.?$/i, "")
    .trim();
  if (nameWithoutSuffix !== cleanName) {
    const suffixEscaped = nameWithoutSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    department = await Department.findOne({
      $or: [
        { name: new RegExp(`^${suffixEscaped}$`, "i") },
        { name: new RegExp(suffixEscaped, "i") },
        { code: new RegExp(`^${suffixEscaped}$`, "i") },
      ],
    }).lean();
    if (department) return department;
  }

  // Final fallback: try to find any department that contains the key word(s)
  const words = cleanName
    .replace(/\s+Dept\.?$/i, "")
    .replace(/\s+Department\.?$/i, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length > 0) {
    const firstWord = words[0];
    const wordEscaped = firstWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    department = await Department.findOne({
      $or: [
        { name: new RegExp(wordEscaped, "i") },
        { code: new RegExp(wordEscaped, "i") },
      ],
    }).lean();
    if (department) return department;
  }

  return null;
}

/**
 * Request sign-off for an existing employee payroll record
 * Creates a sign-off request targeting the source department's HOD
 */
async function requestSignOff(req, res) {
  try {
    const { id: userId, department: userDepartment, role } = req.user;
    const { id } = req.params;

    const record = await ExistingEmployeePayroll.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Existing employee record not found.",
      });
    }

    if (!record.sourceDepartment) {
      return res.status(400).json({
        success: false,
        message: "Source Department is required to request sign-off.",
      });
    }

    // Check if there's already a sign-off request for this record (pending or completed)
    const existingRequest = await SignOffRequest.findOne({
      payrollRecord: id,
    }).sort({ createdAt: -1 }); // Get the most recent one

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "A pending sign-off request already exists for this record.",
        });
      }
      // Prevent duplicate sign-off requests even if previous one was completed
      return res.status(400).json({
        success: false,
        message: "A sign-off request has already been processed for this record. Cannot request again.",
      });
    }

    // Find the target department based on source department name
    const targetDepartment = await findDepartmentBySourceDepartmentName(
      record.sourceDepartment
    );

    if (!targetDepartment) {
      // Debug: Log available departments for troubleshooting
      const allDepartments = await Department.find({})
        .select("name code")
        .lean();
      console.error(
        `[SignOff] Could not find department for Source Department: "${record.sourceDepartment}"`
      );
      console.error(
        `[SignOff] Available departments:`,
        allDepartments.map((d) => `${d.name} (${d.code || "no code"})`)
      );

      return res.status(400).json({
        success: false,
        message: `Could not find department for Source Department: ${record.sourceDepartment}. Please ensure the Source Department matches an existing department in the system.`,
      });
    }

    // Prevent HOD from sending sign-off to their own department
    if (role === "HOD" || role === "DataFiller") {
      if (userDepartment && targetDepartment._id) {
        const userDeptId = userDepartment._id || userDepartment;
        const targetDeptId = targetDepartment._id;
        
        if (String(userDeptId) === String(targetDeptId)) {
          return res.status(400).json({
            success: false,
            message: "You cannot send a sign-off request to your own department. Please select a different Source Department.",
          });
        }
      }
    }

    // Create sign-off request
    const signOffRequest = await SignOffRequest.create({
      payrollRecord: id,
      status: "pending",
      targetDepartment: targetDepartment._id,
      requestedBy: userId,
    });

    // Fetch the updated payroll record with sign-off status
    const updatedRecord = await ExistingEmployeePayroll.findById(id).lean();
    
    // Return payroll record with sign-off status (matching frontend expectations)
    const recordWithSignOff = {
      ...updatedRecord,
      signoffStatus: signOffRequest.status,
      signoffTargetDepartment: signOffRequest.targetDepartment,
      signoffRemark: signOffRequest.remark || null,
      signoffRequestedBy: signOffRequest.requestedBy,
    };

    return res.status(200).json({
      success: true,
      message: "Sign-off request sent successfully.",
      data: recordWithSignOff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to request sign-off.",
    });
  }
}

/**
 * HOD decides on a sign-off request (accept or reject)
 * The id parameter is the payroll record ID (to match frontend expectations)
 */
async function decideSignOff(req, res) {
  try {
    const { id: userId, department: userDepartment } = req.user;
    const { id: payrollRecordId } = req.params;
    const { decision, remark } = req.body;

    if (!decision || !["accepted", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'accepted' or 'rejected'.",
      });
    }

    if (decision === "rejected" && !remark?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Remark is required when rejecting a sign-off request.",
      });
    }

    // Find the pending sign-off request for this payroll record
    const signOffRequest = await SignOffRequest.findOne({
      payrollRecord: payrollRecordId,
      status: "pending",
    }).populate("payrollRecord");

    if (!signOffRequest) {
      return res.status(404).json({
        success: false,
        message: "Pending sign-off request not found for this record.",
      });
    }

    // Verify this HOD is authorized to decide on this sign-off
    if (
      !signOffRequest.targetDepartment ||
      signOffRequest.targetDepartment.toString() !== userDepartment?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to decide on this sign-off request.",
      });
    }

    // Update sign-off request
    signOffRequest.status = decision;
    signOffRequest.decidedBy = userId;
    signOffRequest.remark = decision === "rejected" ? remark?.trim() || "" : "";

    await signOffRequest.save();

    // If accepted, update the payroll record's department to the HOD's department
    if (decision === "accepted" && signOffRequest.payrollRecord) {
      const payrollRecord = await ExistingEmployeePayroll.findById(
        payrollRecordId
      );

      if (payrollRecord) {
        payrollRecord.department = userDepartment;
        const hodDepartment = await Department.findById(userDepartment).lean();
        if (hodDepartment) {
          payrollRecord.departmentKey = normalizeDepartmentKey(
            hodDepartment.code || hodDepartment.name
          );
          payrollRecord.departmentLabel =
            hodDepartment.name || hodDepartment.code || "";
        }
        await payrollRecord.save();
      }
    }

    // Fetch the updated payroll record with sign-off status
    const updatedRecord = await ExistingEmployeePayroll.findById(payrollRecordId).lean();
    
    // Use the updated sign-off request we already have (no need to reload)
    // Return payroll record with sign-off status (matching frontend expectations)
    const recordWithSignOff = {
      ...updatedRecord,
      signoffStatus: signOffRequest.status,
      signoffTargetDepartment: signOffRequest.targetDepartment,
      signoffRemark: signOffRequest.remark || null,
      signoffRequestedBy: signOffRequest.requestedBy,
    };

    return res.status(200).json({
      success: true,
      message: `Sign-off request ${decision} successfully.`,
      data: recordWithSignOff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process sign-off decision.",
    });
  }
}

async function getHodDepartments(req, res) {
  try {
    const { id: userId, role } = req.user;

    if (role !== "HOD" && role !== "DataFiller") {
      return res.status(403).json({
        success: false,
        message: "Only HOD users can access their departments.",
      });
    }

    // Convert userId to ObjectId if it's a string
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    // Get all departments where this user is the HOD
    const departments = await Department.find({ hod: userIdObj })
      .select("name code _id")
      .lean();

    console.log(`Found ${departments.length} departments for HOD ${userId}`);

    // Also include the user's assigned department if it exists and is not already in the list
    if (req.user.department) {
      const assignedDept = await Department.findById(req.user.department)
        .select("name code _id")
        .lean();
      
      if (assignedDept) {
        const alreadyIncluded = departments.some(
          (d) => d._id.toString() === assignedDept._id.toString()
        );
        if (!alreadyIncluded) {
          departments.push(assignedDept);
          console.log(`Added assigned department: ${assignedDept.name}`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: departments.map((dept) => ({
        id: dept._id,
        name: dept.name,
        code: dept.code,
      })),
    });
  } catch (error) {
    console.error("Error in getHodDepartments:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch HOD departments.",
    });
  }
}

async function deleteAllExistingEmployees(req, res) {
  try {
    const { role } = req.user;

    // Only Admin can delete all entries
    if (role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete all entries.",
      });
    }

    // Delete all sign-off requests first (to avoid foreign key issues)
    await SignOffRequest.deleteMany({});

    // Delete all existing employee payroll entries
    const result = await ExistingEmployeePayroll.deleteMany({});

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} payroll entries.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete all payroll entries.",
    });
  }
}

module.exports = {
  listExistingEmployees,
  exportExistingEmployees,
  createExistingEmployee,
  updateExistingEmployee,
  deleteExistingEmployee,
  deleteAllExistingEmployees,
  uploadExistingEmployeesSheet,
  requestSignOff,
  decideSignOff,
  getHodDepartments,
};


