import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiError } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'
import { useViewMode } from '../../providers/ViewModeProvider.jsx'
import { ExistingEmployeePayrollAPI } from '../../api/existingEmployeePayroll.js'
import ExistingEmployeeToolbar from '../../components/payroll/existing-employees/ExistingEmployeeToolbar.jsx'
import ExistingEmployeeTable from '../../components/payroll/existing-employees/ExistingEmployeeTable.jsx'

const COLUMN_DEFINITIONS = [
  { key: 'empId', label: 'EMP ID', width: '140px' },
  { key: 'empName', label: 'EMP Name', width: '200px' },
  { key: 'doj', label: 'DOJ', width: '140px' },
  { key: 'doe', label: 'DOE', width: '140px' },
  { key: 'month', label: 'Month', width: '140px' },
  { key: 'designation', label: 'Designation', width: '180px' },
  { key: 'departmentLabel', label: 'Department', width: '180px' },
  { key: 'topDepartment', label: 'Top Department', width: '180px' },
  { key: 'type', label: 'Type', width: '140px' },
  { key: 'sourceDepartment', label: 'Source Department', width: '200px' },
  { key: 'beneficiaryDepartment', label: 'Beneficiary Department', width: '220px' },
  { key: 'sourceHod', label: 'Source HOD', width: '180px' },
  { key: 'beneficiaryHod', label: 'Beneficiary HOD', width: '200px' },
  { key: 'universityDetails', label: 'University Details', width: '200px' },
  { key: 'location', label: 'Location', width: '180px' },
  { key: 'employeeType', label: 'Employee Type', width: '180px' },
  { key: 'amount', label: 'Amount', width: '140px' },
  { key: 'academy', label: 'Academy %', width: '140px' },
  { key: 'intensive', label: 'Intensive %', width: '140px' },
  { key: 'niatBatch12', label: 'NIAT Batch 1&2 %', width: '180px' },
  { key: 'niatBatch3', label: 'NIAT Batch 3 %', width: '160px' },
  { key: 'niatBatch4', label: 'NIAT Batch 4 %', width: '160px' },
  { key: 'others', label: 'Other Products', width: '150px' },
  { key: 'common', label: 'Common Products', width: '150px' },
]

const MONTH_OPTIONS = ['Jan-26', 'Feb-26', 'Mar-26']

const DEPARTMENT_OPTIONS = [
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
]

const DESIGNATION_OPTIONS = [
  'CEO - NxtWave (CEO - NxtWave_NWD_MGT_CT)',
  'Chief of Customer Engagement (Chief of Customer Engagement_NWD_MGT_CT)',
  'Senior Manager (Senior Manager_NWD_SA_NIAT_CGE_SM)',
  'Senior Business Development Associate (Senior Business Development Associate_NWD_PS_LQ_NIAT-LQ)',
  'Senior Business Development Associate (Senior Business Development Associate_NWD_SA_IN_CGE)',
  'Chief Operating Officer (Chief Operating Officer_NWD_MGT_CT)',
  'Area Business Head (Area Business Head_NWD_PS_NIAT_OLG)',
  'Team Lead (Team Lead_NWD_PS_LQ_AC_LQ)',
  'Copy Lead - Social Media (Copy Lead - Social Media_NWD_PST_B2BM)',
  'Operations Manager (Operations Manager_NWD_PS_LG_OM)',
  'Associate Senior Growth Manager (Associate Senior Growth Manager_NWD_PS_IM&DA)',
  'Business Development Associate (Business Development Associate_NWD_PS_LQ_AC_LQ_BDA)',
  'Head of Student Success (Head of Student Success_NWD_PST_PC)',
  'Software Development Engineer - II (Software Development Engineer - II_NWD_TEC_CTT)',
  'Customer Support Manager (Customer Support Manager_NWD_ASS_AC)',
  'Payments Operations Manager (Payments Operations Manager_NWD_ASS_PRT)',
  'Quality Analyst (Quality Analyst_NWD_ISS_Int_SS_QA)',
  'Business Development Associate (Business Development Associate_NWD_SA_IN_CGE)',
  'Lead Gen Manager (Lead Gen Manager_NWD_PST_LA)',
  'Data Lead - II (Data Lead - II_NWD_TEC_SA)',
  'Head of Engineering (Head of Engineering_NWD_TEC_CTT)',
  'Senior Engineering Manager (Senior Engineering Manager_NWD_TEC_CTT)',
  'Software Development Engineer - II (Software Development Engineer - II_NWD_TEC_CO&LO_SDE-II)',
  'Software Development Engineer - II (Software Development Engineer - II_NWD_TEC_PSP)',
  'Software Development Engineer - II (Software Development Engineer - II_NWD_TEC_PSAP)',
  'Software Development Engineer - II (Software Development Engineer - II_NWD_TEC_NSSP)',
  'Software Development Engineer - II (Software Development Engineer - II_NWD_TEC_DSAP)',
  'Software Development Engineer - II (Software Development Engineer - II_NWD_TEC_ASSP)',
  'Project Manager (Project Manager_NWD_TEC_ASSP)',
  'Senior Manager - Student Query Resolution (Senior Manager - Student Query Resolution_NWD_NIAT_AC_I_SM)',
  'Prompt Engineer (Prompt Engineer_NWD_QR)',
  'Project Manager (Project Manager_NWD_NIAT_AC_I&M_PM)',
  'Senior Manager (Senior Manager_NWD_PSM)',
  'Program Mentor Associate (Program Mentor Associate_NWD_NIAT_AC_I&M)',
  'Senior Project Manager (Senior Project Manager_NWD_TEC_CTT)',
  'Associate Vice President - Corporate Relations (Associate Vice President - Corporate Relations_NWD_PST_CR)',
  'Senior Video Producer (Senior Video Producer_NWD_VH_PS_S)',
  'Center Head (Center Head_NWD_S_NIAT_CGE)',
  'Associate Senior Manager (Associate Senior Manager_NWD_SA_IN_CGE_ASM)',
  'Program Mentor Associate (Program Mentor Associate_NWD_ISS_Int_SS_PMA)',
  'Senior Growth Associate (Senior Growth Associate_NWD_PS_CD&CEO)',
  'Placement Coordinator (Placement Coordinator_NWD_PST_CS_PC)',
  'Associate Software Engineer (Associate Software Engineer_NWD_TEC_PSAP)',
  'Business Development Manager (Business Development Manager_NWD_SA_AC_CGE_BDM)',
  'Associate Business Development Manager (Associate Business Development Manager_NWD_SA_NIAT_CGE_ABDM)',
  'Business Development Manager (Business Development Manager_NWD_SA_NIAT_CGE)',
  'Senior Business Development Associate (Senior Business Development Associate_NWD_SA_AC_CGE_SBDA)',
  'Customer Support Executive (Customer Support Executive_NWD_ASS_IN_CS)',
  'Business Development Manager (Business Development Manager_NWD_PS_LQ_NIAT-LQ)',
  'Senior Business Development Associate (Senior Business Development Associate_NWD_PS_LQ_AC-LQ)',
  'Team Lead (Team Lead_NWD_PS_LQ_NIAT_LQ_TL)',
  'Success Coach Manager (Success Coach Manager_NWD_NIAT_AC_SS_SCM)',
  'Associate Business Development Manager (Associate Business Development Manager_NWD_PS_LQ_AC-LQ_ABDM)',
  'Payments Retention Associate (Payments Retention Associate_NWD_ASS_PRT)',
  'Business Development Manager (Business Development Manager_NWD_SA_IN_CGE)',
  'Associate Business Development Manager (Associate Business Development Manager_NWD_SA_AC_CGE)',
  'Training Assistant (Training Assistant_NWD_SA_AC_TR)',
  'Assistant Business Development Manager (Assistant Business Development Manager_NWD_BU_AS_PRE_ABDM)',
  'Team Lead (Team Lead_NWD_S_A_CGE)',
  'Liaison associate (Liaison associate_NWD_BU_AS_PRE_LA)',
  'Student Relationship Officer (Student Relationship Officer_NWD_PS_NIAT_OLG)',
  'Head - Business Development (Head - Business Development_NWD_SA)',
  'Head of Presales (Head of Presales_NWD_PS)',
  'Zonal Manager (Zonal Manager_NWD_S_NIAT_CGE)',
  'VP - Business Development (VP - Business Development_NWD_DS&ML_VP-BD)',
  'Head - Training and Placement (Head - Training and Placement_NWD_PST)',
  'VP - Sales (VP - Sales_NWD_ISS_VP)',
  'VP- Strategic Partnerships (VP- Strategic Partnerships_NWD_UP)',
  'Head Lead-Qualification (Head Lead-Qualification_NWD_PS_LQ)',
  'Senior Business Development Manager (Senior Business Development Manager_NWD_NA_SBM)',
  'Associate Vice President - Corporate Relations (Associate Vice President - Corporate Relations_PST_CR_AVP)',
  'Content Lead (Content Lead_NWD_CM_CL)',
  'Talent Acquisition Manager (Talent Acquisition Manager_NWD_TA_TAM)',
  'Senior Business Development Training Manager (Senior Business Development Training Manager_NWD_SA_AC_TR)',
  'Associate Zonal Manager (Associate Zonal Manager_NWD_PS_LQ_NIAT-LQ)',
  'Program Manager (Program Manager_NWD_PS_LG_PM)',
  'Zonal Manager (Zonal Manager_NWD_PS_LQ_NIAT-LQ)',
  'Associate Product Manager (Associate Product Manager_NWD_P_L)',
  'Internal Product Manager (Internal Product Manager_NWD_P_NXTGIG)',
  'Associate Senior Manager (Associate Senior Manager_NWD_BU_AS_PRE)',
  'Success Coach (Success Coach_NWD_ASS_PRT)',
  'Onboarding Specialist (Onboarding Specialist_NWD_HR_TA)',
  'Program Manager (Program Manager_NWD_BO_PM)',
  'CRM Operations Manager (CRM Operations Manager_NWD_BO_CRMOM)',
  'Lead Generation Manager (Lead Generation Manager_NWD_PS_LG)',
  'Hiring Manager (Hiring Manager_NWD_S_A_H)',
  'Senior Community Manager (Senior Community Manager_NWD_PS_PCB)',
  'Associate Senior Manager (Associate Senior Manager_NWD_SA_NIAT_CGE)',
  'Operations Manager (Operations Manager_NWD_CCD_ACO)',
  'Program Manager (Program Manager_NWD_HR_TA)',
  'Project Manager (Project Manager_NWD_P_S_PM)',
  'Senior Webflow Developer (Senior Webflow Developer_NWD_TEC_WT_SWD)',
  'Program Manager (Program Manager_NWD_ASS_CT)',
  'Project Manager (Project Manager_NWD_DSML_NIAT_MC_PM)',
  'Business Development Manager (Business Development Manager_NWD_SA_AC_TR)',
  'Business Development Manager (Business Development Manager_NWD_PS_LQ_AC-LQ)',
  'Curriculum Development Manager (Curriculum Development Manager_NWD_NIAT_AC_I)',
  'Head of Student Success (Head of Student Success_NWD_NIAT_AC_R)',
  'Interview Guidance Expert (Interview Guidance Expert_NWD_CCD_ACO)',
  'Senior Manager (Senior Manager_NWD_SA_AC_CGE_SM)',
  "Founder's Office (Founder's Office_NWD_UPS)",
  'Project Manager (Project Manager_NWD_BO_PM)',
  'Senior Customer Support Executive (Senior Customer Support Executive_NWD_PST_CS_SCSE)',
  'Product Operations Manager (Product Operations Manager_NWD_P_L)',
  'Video Producer (Video Producer_NWD_VH_NWS)',
  'Project Manager (Project Manager_NWD_CD_DSA)',
  'Associate Project Manager (Associate Project Manager_NWD_ASS_CT)',
  'Associate Business Development Manager (Associate Business Development Manager_NWD_PS_LQ_NIAT-LQ)',
  'Success Coach (Success Coach_NWD_NIAT_AC_SS_SC)',
  'Senior Marketing Manager (Senior Marketing Manager_NWD_PST_TT_SMM)',
  'Marketing Manager (Marketing Manager_NWD_PST_TT_MM)',
  'HR Manager (HR Manager_NWD_HR_HRBP)',
  'Associate Talent Acquisition Manager (Associate Talent Acquisition Manager_NWD_HR_TA)',
  'Talent Acquisition Executive (Talent Acquisition Executive_NWD_HR_TA)',
  'Associate Project Manager (Associate Project Manager_NWD_NIFA_APM)',
  'Head of Talent Acquisition (Head of Talent Acquisition_NWD_HR_TA)',
  'Associate Project Manager (Associate Project Manager_NWD_BO_APM)',
  'Data Lead - II (Data Lead - II_NWD_TEC_PSP)',
  'Program Manager (Program Manager_NWD_QR)',
  'Team Lead - Video Editor (Team Lead - Video Editor_NWD_WS_VH_TL-VE)',
  'Program Manager (Program Manager_NWD_NIAT_AC_PO)',
  'Senior Quality Analyst (Senior Quality Analyst_NWD_ASS_AC_SC)',
  'Associate Solution Engineer (Associate Solution Engineer_NWD_PSM)',
  'Software Engineer (Software Engineer_NWD_QR)',
  'Chief of staff - Program Operations (Chief of Staff - Program Operations_NWD_NIAT_AC_PO)',
  'Success Coach (Success Coach_NWD_ASS_AC_SC)',
  'Customer Support Executive (Customer Support Executive_NWD_ASS_AC_CS)',
  'Data Lead (Data Lead_NWD_TEC_ASSP)',
  'Associate Product Manager (Associate Product Manager_NWD_PST_CS_APM)',
  'Business Development Associate (Business Development Associate_NWD_SA_AC_CGE_BDA)',
  'Hiring Associate (Hiring Associate_NWD_SA_AC_HI_HA)',
  'Business Development Manager (Business Development Manager_NWD_PS_LQ_BDM)',
  'Associate Growth Manager (Associate Growth Manager_NWD_PS_LG_AC-4.0T&NET)',
  'Associate Senior Manager - Student Success (Associate Senior Manager - Student Success_NWD_ISS_Int_SS)',
  'Quality Analyst (Quality Analyst_NWD_ASS_AC_SC)',
  'Customer Support Executive (Customer Support Executive_NWD_ISS_Int_SS_CSE)',
  'Associate Program Manager (Associate Program Manager_NWD_PS_LG_AC-4.0T&NET)',
  'Associate Senior Manager (Associate Senior Manager_NWD_AS_NIAT_OLG)',
  'Associate Regional Head (Associate Regional Head_NWD_PS_LQ_AC_LQ_ARH)',
  'Hiring Head (Hiring Head_NWD_SA_AC_HI_HH)',
  'Senior Manager Growth (Senior Manager Growth_NWD_PS_LG_SMG)',
  'Senior Manager (Senior Manager_NWD_PS_LG_NA)',
  'Program Mentor Associate (Program Mentor Associate_NWD_QR)',
  'Vice President-Sales (Vice President-Sales_NWD_SA_NIAT_CGE)',
  'Community Development Associate (Community Development Associate_NWD_ISS_PCB)',
  'Business Development Associate (Business Development Associate_NWD_SA_NIAT_CGE)',
  'Senior Business Development Associate (Senior Business Development Associate_NWD_BU_AS_PRE)',
  'Growth Manager (Growth Manager_NWD_PS_LG_NIAT)',
  'Senior Performance Marketing Associate (Senior Performance Marketing Associate_NWD_PS_DM)',
  'Software Development Engineer - I (Software Development Engineer - I_NWD_TEC_PSP)',
  'Community Development Associate (Community Development Associate_NWD_PS_PCB)',
  'Senior Placement Coordinator (Senior Placement Coordinator_NWD_PST_PC)',
  'Technical Support Engineer (Technical Support Engineer_NWD_ASS_AC_CS)',
  'Business Development Associate (Business Development Associate_NWD_PS_LQ_NIAT-LQ_BDA)',
  'Software Development Instructor (Software Development Instructor_NWD_NIAT_AC_IN)',
  "Founder's Office (Founder's Office_NWD_BO)",
  'Data Lead (Data Lead_NWD_TEC_SA)',
  'Partnerships Lead (Partnerships Lead_NWD_PST_B2B_PL)',
  'Growth Manager (Growth Manager_NWD_S_I_CGE)',
  'Associate State Business Head (Associate State Business Head_NWD_PS_NIAT_OLG)',
  'Associate Senior Manager (Associate Senior Manager_NWD_SA_AC_CGE_ASM)',
  'Copy Lead (Copy Lead_NWD_BM_CM_CL)',
  'Copy Writer (Copy Writer_NWD_CM_CPW)',
  'Product Manager - II (Product Manager - II_NWD_P_PL)',
  'Software Development Instructor (Software Development Instructor_NWD_TEC_PSM)',
  'Head-Student Success and Retention (Head-Student Success and Retention_NWD_ASS_CT)',
  'Operations Manager (Operations Manager_NWD_HR_ADM)',
  'Program Manager (Academy) (Program Manager (Academy)_NWD_NIAT_AC_PO)',
  'Data Lead (Data Lead_NWD_TEC_CO&LO_DL)',
  'Internal Product Manager (Internal Product Manager_NWD_P_IPM)',
  'Associate Senior Business Development Manager (Associate Senior Business Development Manager_NWD_PS_NIAT_LQ)',
  'Zonal Business Head (Zonal Business Head_NWD_PS_NIAT_OLG)',
  'Lead L&D Presales (Lead L&D Presales_NWD_PS_L&D)',
  'Video Editor (Video Editor_NWD_VH_VE)',
  'Product Designer - II (Product Designer - II_NWD_DS_PD_PD-II)',
  'Head - Retention Marketing and Engagement (Head - Retention Marketing and Engagement_NWD_SE)',
  'Project Manager (Project Manager_NWD_CCD_ACO)',
  'Head of Department - English and Communication Skills (Head of Department - English and Communication Skills_NWD_CCD_CDE)',
  'Associate Senior Manager (Associate Senior Manager_NWD_PS_LQ_AC-LQ)',
  'Regional Head (Regional Head_NWD_SA_AC_CGE_RH)',
  'Vice President - Learning & Development (Vice President - Learning & Development_NWD_SA_AC_CGE)',
  'Senior Graphic Designer (Senior Graphic Designer_NWD_DS_GD_SGDR)',
  'Visual Designer - II (Visual Designer - II_NWD_DS_GD)',
  'Data Lead (Data Lead_NWD_TEC_PSAP)',
  'Vice President-Partnerships (Vice President-Partnerships_NWD_10xIIT)',
  'Tech Educator (Tech Educator_NWD_NIAT_AC_I)',
  'Regional Head (Regional Head_NWD_PS_AC_LQ)',
  'SEO Manager (SEO Manager_NWD_PS_CD&SEO)',
  'Regional Head (Regional Head_NWD_SA_NIAT_CGE)',
  'Growth Manager (Growth Manager_NWD_PS_NIAT_LQ)',
  'Business Operations Associate (Business Operations Associate_NWD_BO_PS)',
  'Associate Cinematographer (Associate Cinematographer_NWD_VH_NWS)',
  'Business Development Associate (Business Development Associate_NWD_SA_AC_QA)',
  'Director Digital Marketing (Director Digital Marketing_NWD_PS_LG_DDM)',
  'Data Lead (Data Lead_NWD_TEC_PSP)',
  'Associate Software Engineer (Associate Software Engineer_NWD_TEC_WT_ASE)',
  'Talent Acquisition Operations Executive (Talent Acquisition Operations Executive_NWD_HR_TA)',
  'Business Operations Associate (Business Operations Associate_NWD_PST_LA)',
  'Senior Operations Associate (Senior Operations Associate_NWD_HR_OPS)',
  'Program Management Associate (Program Management Associate_NWD_NIAT_AC_PO)',
  'Junior Data Analyst (Junior Data Analyst_NWD_ASS_SE_JDA)',
  'Business Development Associate - I (Business Development Associate - I_NWD_BU_AS_PRE_BDA - I)',
  'Senior Content Developer - B2B (Senior Content Developer - B2B_NWD_PST_B2BM)',
  'Associate Hiring Manager (Associate Hiring Manager_NWD_SA_AC_HI_AHM)',
  'Head of Business Strategy (Head of Business Strategy_NWD_FO_HBS)',
  'Video Editor (Video Editor_NWD_VH_NWS)',
  'Associate Vice President - Business Development (Associate Vice President - Business Development_NWD_BU_AS_PRE_AVP-BD)',
  'Finance and Accounts Manager (Finance and Accounts Manager_NWD_HR_IA)',
  'Finance Manager (Finance Manager_NWD_F&L_FIN_FM)',
  'Senior Associate (Senior Associate_NWD_F&L_F)',
  'Associate (Associate_NWD_F&L_F)',
  "Founder's Office (Founder's Office_NWD_HR)",
  'Business Development Training Manager (Business Development Training Manager_NWD_S_A_T)',
  'Software Development Engineer - I (Software Development Engineer - I_NWD_TEC_DSAP)',
  'Software Development Engineer - I (Software Development Engineer - I_NWD_TEC_CO&LO_SDE-I)',
  'Associate Software Engineer (Associate Software Engineer_NWD_TEC_CO&LO_ASE)',
  'Software Development Engineer - I (Software Development Engineer - I_NWD_TEC_CTT_SDE-I)',
  'Software Development Engineer - I (Software Development Engineer - I_NWD_TEC_PSAP)',
  'Software Development Engineer - I (Software Development Engineer - I_NWD_TEC_SA_SDE-I)',
  'Software Development Engineer - I (Software Development Engineer - I_NWD_TEC_NSSP)',
  'AI Specialist Developer (AI Specialist Developer_NWD_TEC_CTT)',
  'Motion Graphic Designer (Motion Graphic Designer_NWD_VH_NWS)',
  'PowerPoint Specialist (PowerPoint Specialist_NWD_CD_DSA)',
  'Product Designer (Product Designer_NWD_DS_PD_PD)',
  'Software Development Engineer - I (Software Development Engineer - I_NWD_TEC_ASSP)',
  'Associate Growth Manager (Associate Growth Manager_NWD_PS_IM&DA)',
  'Senior HR Manager (Senior HR Manager_NWD_HR)',
  'Product Manager (Product Manager_NWD_P_S)',
  'SEO Content Writer  (SEO Content Writer_NWD_WEBS)',
  'General Manager - HR Operations (General Manager - HR Operations_NWD_HR_OPS_GM)',
  'Social Media Manager (Social Media Manager_NWD_GAISM)',
  'Head of Department - Aptitude (Head of Department - Aptitude_NWD_CCD_CDA)',
  'Senior Sourcing Associate (Senior Sourcing Associate_NWD_HR_TA)',
  'Senior Business Operations Associate (Senior Business Operations Associate_NWD_BO_SRBOA)',
  'Senior Business Development Associate (Senior Business Development Associate_NWD_SA_NIAT_CGE_SBDM)',
  'Quality Assurance Associate (Quality Assurance Associate_NWD_ASS_AC_CS)',
  'Campus Success Manager (Campus Success Manager_NWD_NEC)',
  'Junior Data Analyst (Junior Data Analyst_NWD_ASS_CS_JDA)',
  'Junior Graphic Designer (Junior Graphic Designer_NWD_DS_GD_JGDR)',
  'VP-Finance (VP-Finance_NWD_F&L_FIN_VP)',
  'Software Development Engineer - II (Software Development Engineer - II_NWD_TEC_SA_SDE-II)',
  'Software Development Engineer 1 & Technical Curriculum Developer 2 (Software Development Engineer 1 & Technical Curriculum Developer 2_NWD_TEC_CUD)',
  'Software Development Engineer and Full Stack Content Lead (Software Development Engineer and Full Stack Content Lead_NWD_CD_CD)',
  'Software Development Engineer 1 and Technical Curriculum Developer (Software Development Engineer 1 and Technical Curriculum Developer_NWD_TEC_CUD)',
  'Data Lead - II (Data Lead - II_NWD_TEC_ASSP)',
  'Data Lead (Data Lead_NWD_TEC_NSSP)',
  'GenAI Content Lead (GenAI Content Lead_NWD_CDCD)',
  'Procurement Assistant (Procurement Assistant_NWD_HR_PO)',
  'Software Development Engineer - I (Software Development Engineer - I_NWD_NIAT_AC_I)',
  'Graphic Designer (Graphic Designer_NWD_DS_GD_GDR)',
  'Video Editor (Video Editor_NWD_VH_WS_VE)',
  'Business Operations Associate (Business Operations Associate_NWD_BO_BOA)',
  'Associate Program Manager (Associate Program Manager_NWD_PS_LG_NA_APM)',
  'Business Operations Associate (Business Operations Associate_NWD_SE)',
  'Facilities Manager (Facilities Manager_NWD_HR_ADM)',
  'Assistant Manager Business Finance (Assistant Manager Business Finance_NWD_F&L_FP&A)',
  'Webflow Developer (Webflow Developer_NWD_TEC_WT_WD)',
  'Technical Support Engineer (Technical Support Engineer_NWD_ISS_TSE)',
  'Sourcing Associate (Sourcing Associate_NWD_HR_TA)',
  'Talent Acquisition Associate (Talent Acquisition Associate_NWD_HR_TA)',
  'Onboarding Associate (Onboarding Associate_NWD_HR_TA)',
  'Senior Community Manager (Senior Community Manager_NWD_SE)',
  'Brand Strategist (Brand Strategist_NWD_FO_BS)',
  'Soft Skills Trainer (Soft Skills Trainer_NWD_QR)',
  'Junior Data Analyst (Junior Data Analyst_NWD_NIAT_AC_PO)',
  'Digital Marketing Associate (Digital Marketing Associate_NWD_PS_DM)',
  'Student Engagement Associate (Student Engagement Associate_NWD_PS_LG_AC-4.0T&NET)',
  'Content Writer (Content Writer_NWD_PS_CD&SEO)',
  'Success Coach (Success Coach_NWD_ISS_SC)',
  'Student Mentor (Student Mentor_NWD_ISS_SM)',
  'Senior Corporate Relations Manager (Senior Corporate Relations Manager_NWD_PST_CR_SCRM)',
  'Senior Marketing Manager (Senior Marketing Manager_NWD_PST_LA)',
  'Senior Business Development Associate - III (Senior Business Development Associate - III_NWD_SA_NIAT_CGE_SBDA)',
  'Student Engagement Associate (Student Engagement Associate_NWD_PS_LG)',
  'Senior Student Engagement Associate (Senior Student Engagement Associate_NWD_PS_LG_AC-4.0T&NET)',
  'Talent Acquisition Specialist (Talent Acquisition Specialist_NWD_HR_TA)',
  'Technical Content Developer (Technical Content Developer_NWD_CD_DSA)',
  'Senior Copy Writer (Senior Copy Writer_NWD_PST_PCT_SCW)',
  'Talent Acquisition Lead (Talent Acquisition Lead_NWD_HR_TA)',
  'Technical Content Developer (Technical Content Developer_NWD_CCD_ACO)',
  'Data Analyst (Data Analyst_NWD_GAI_SM)',
  'Junior Video Editor (Junior Video Editor_NWD_GAI_SM)',
  'Program Manager (Program Manager_NWD_B2B)',
  'Program Manager (Program Manager_NWD_PS_AAC)',
  'Associate HR Business Partner (Associate HR Business Partner_NWD_HR_HRBP)',
  'State Business Head (State Business Head_NWD_PS_NIAT_OLG)',
  'Associate Area Business Head (Associate Area Business Head_NWD_PS_NIAT_OLG)',
  'Senior Success Coach (Senior Success Coach_NWD_ASS_AC_SC)',
  'Senior Student Engagement Associate (Senior Student Engagement Associate_NWD_PS_LG)',
  'Social Media Content Creator (Social Media Content Creator_NWD_BM_SMCC)',
  'HR Operations Associate (HR Operations Associate_NWD_HR_OPS)',
  'Software Engineer (Software Engineer_NWD_PSM)',
  'Sr. Facilities Executive (Sr. Facilities Executive_NWD_HR_ADM)',
  'Associate Project Manager (Associate Project Manager_NWD_NIAT_AC_I&M)',
  'Associate Project Manager (Associate Project Manager_NWD_TEC_PSM)',
  'Senior Business Development Manager (Senior Business Development Manager_NWD_SA_AC_CGE_SBDM)',
  'VP - Learning & Development (VP - Learning & Development_NWD_HR_L&D)',
  'Associate Software Engineer (Associate Software Engineer_NWD_TEC_PSM)',
  'Data Analyst (Data Analyst_NWD_TEC_CO&LO_DA)',
  'Area Business Head (Area Business Head_NWD_PS_AAC)',
  'Public Relations & Online Reputation Specialist (Public Relations & Online Reputation Specialist_NWD_BM)',
  'Associate Program Mentor (Associate Program Mentor_NWD_QR)',
  'Instructional designer - English & Soft Skills (Instructional designer - English & Soft Skills_NWD_NIAT_AC_I_A&E)',
  'L&D Specialist (L&D Specialist_NWD_ASS_AC_SC)',
  'Senior Success Coach (Senior Success Coach_NWD_ASS_PP)',
  'Pre On-boarding Manager (Pre On-boarding Manager_NWD_ASS_PO)',
  'Data Analyst (Data Analyst_NWD_TEC_SA_DA)',
  'Data Analyst (Data Analyst_NWD_TEC_PSAP)',
  'Ad director (Ad Director_NWD_VH_AD)',
  'Performance Management Specialist (Performance Management Specialist_NWD_HR_L&D_PMS)',
  'Growth Manager (Growth Manager_NWD_10XIIT)',
  'Success Coach Manager (Success Coach Manager_NWD_ASS_AC_SC)',
  'Growth Manager (Growth Manager_NWD_PS_CD&SEO)',
  'Product Owner Curriculum Development (Product Owner Curriculum Development_NWD_TEC_CUD_POCD)',
  'General Manager (General Manager_NWD_PS_LG)',
  'Growth Product Manager (Growth Product Manager_NWD_P_S)',
  'Business Operations Associate (Business Operations Associate_NWD_VH_NWS)',
  'Associate Technical Content Developer (Associate Technical Content Developer_NWD_DSML_CD)',
  'Chief of staff - Program Operations-1 (Chief of Staff - Program Operations-1_NWD_NIAT_AC_PO)',
  'Business Operations Associate (Business Operations Associate_NWD_CCD_ACO)',
  'Associate Product Manager (Associate Product Manager_NWD_BO_APM)',
  'Senior Business Operations Associate (Senior Business Operations Associate_NWD_AS_PRE_SBOA)',
  'Creative Director (HOD - Video House) (Creative Director (HOD - Video House)_NWD_VH_NWS)',
  'Business Operations Associate (Business Operations Associate_NWD_BU_AS_PRE_BO)',
  'Lead Corporate Relations (Lead Corporate Relations_NWD_PST_CR)',
  'Influencer Marketing Associate (Influencer Marketing Associate_NWD_PS_IM&DA)',
  'Control Tower Specialist (Control Tower Specialist_NWD_FO)',
  'Business Operation Associate (Business Operation Associate_NWD_NIAT_AC_PO)',
  'Business Finance Manager (Business Finance Manager_NWD_F&L_FP&A)',
  'Assistant Manager - Marketing & Communications (Assistant Manager - Marketing & Communications_NWD_ISS_Int_SS)',
  'Senior Success Coach (Senior Success Coach_NWD_Int_SS_SSC)',
  'Senior Associate (Senior Associate_NWD_F&L_L)',
  'Data Analyst (Data Analyst_NWD_TEC_NSSP)',
  'Business Operations Associate (Business Operations Associate_NWD_NIAT_AC_PO)',
  'Software Development Mentor (Software Development Mentor_NWD_NIAT_AC_I&M)',
  'Business Development Associate - II (Business Development Associate - II_NWD_BU_AS_PRE_BDA - II)',
  'Academic Mentor (Academic Mentor_NWD_NIAT_AC_I&M)',
  'Senior CopyWriter (Senior Copywriter_NWD_BM_CM_CSW)',
  'Senior Success Coach Manager (Senior Success Coach Manager_NWD_NIAT_AC_SE)',
  'Associate Video Producer (Associate Video Producer_NWD_VH_NIAT_S)',
  'Business Operation Associate (Business Operation Associate_NWD_VH_WS_BOA)',
  'Learning & Development Specialist (Learning & Development Specialist_NWD_HR_L&D)',
  'Junior Data Analyst (Junior Data Analyst_NWD_ASS_PYRT_JDA)',
  'Legal and Compliance Manager (Legal and Compliance Manager_NWD_F&L_L)',
  'Junior Data Analyst (Junior Data Analyst_NWD_BO_JRDA)',
  'Project Coordinator (Project Coordinator_NWD_VH_PC)',
  'Project Manager (Project Manager_NWD_CCD_CDA_PM)',
  'Aptitude Content Developer (Aptitude Content Developer_NWD_CCD_CDA)',
  'Associate Technical Content Developer (Associate Technical Content Developer_NWD_CCD_ACO)',
  'Senior Market Research Associate (Senior Market Research Associate_NWD_PST_LA_SMRA)',
  'Community Manager (Community Manager_NWD_PST_CR_CM)',
  'Senior Video Editor (Senior Video Editor_NWD_VH_SVE)',
  'Senior Manager - Digital Marketing (Senior Manager - Digital Marketing_NWD_PS_LG_SM-DM)',
  'CRM Associate Product Manager (CRM Associate Product Manager_NWD_BO_APM)',
  'Payments Retention Manager (Payments Retention Manager_NWD_ASS_PRT)',
  'Senior Video Editor (Senior Video Editor_NWD_VH_NIAT_S)',
  'Senior Marketing Manager (Senior Marketing Manager_NWD_BM_SMM)',
  'Associate Product Manager (Associate Product Manager_NWD_PST_TT)',
  'Senior Payroll Executive (Senior Payroll Executive_NWD_HR_P&C_SPE)',
  'Program Manager (Program Manager_NWD_HR)',
  'Business Operations Manager (Business Operations Manager_NWD_PS_OLG_BOM)',
  'Business Development Training Manager (Business Development Training Manager_NWD_PS_NIAT_LQ)',
  'Head of Product Design (Head of Product Design_NWD_DS_PD_HPD)',
  'Facilities Executive (Facilities Executive_NWD_HR_ADM)',
  'Social Media Content Creator (Social Media Content Creator_NWD_GAI_SM)',
  'Technical Curriculum Developer (Technical Curriculum Developer_NWD_TEC_CUD)',
  'Associate Technical Content Developer (Associate Technical Content Developer_NWD_CD)',
  'Aptitude Instructor (Aptitude Instructor_NWD_NIAT_AC_I_A&E_AI)',
  'Social & Content Marketing Manager (Social & Content Marketing Manager_NWD_BM_SCMM)',
  'Business Development Manager (Business Development Manager_NWD_PS_CD&SEO)',
  'Senior Video Producer (Senior Video Producer_NWD_VH_NIAT_S)',
  'Associate Video Editor (Associate Video Editor_NWD_VH_WS_AVE)',
  'Lead Graphic Designer (Lead Graphic Designer_NWD_DS_GD_LGD)',
  'Center Head (Center Head_NWD_ISS_CPSS)',
  'Quality Analyst (Quality Analyst_NWD_BU_PRE_QA)',
  'Operations Associate (Operations Associate_NWD_GAI_SM)',
  'Customer Support Executive (Customer Support Executive_NWD_PST_CS_CSE)',
  'Junior Facilities Executive (Junior Facilities Executive_NWD_HR_ADM_JFE)',
  'Placement coordinator (Placement coordinator_NWD_PST_PC)',
  'Senior Business Analyst (Senior Business Analyst_NWD_PST_PC)',
  'Sales Operations Executive (Sales Operations Executive_NWD_SA_AC_CGE_SOE)',
  'PowerPoint Specialist (PowerPoint Specialist_NWD_DS_GD_PPS)',
  'Associate Content Developer (English) (Associate Content Developer (English)_NWD)',
  'Associate Aptitude Instructor (Associate Aptitude Instructor_NWD_NIAT_AC_I_A&E_AAI)',
  'Information Security Engineer (Information Security Engineer_NWD_TEC_CTT_ISE)',
  'Talent Acquisition Operations Associate (Talent Acquisition Operations Associate_NWD_HR_TA)',
  'CRM Administrator (CRM Administrator_NWD_BO_CRMA)',
  'Manager – NIAT Facilities (Manager – NIAT Facilities_NWD_HR_ADM_MNF)',
  'Corporate Relations Manager (Corporate Relations Manager_NWD_PST_CR)',
  'Associate Aptitude Content Developer (Associate Aptitude Content Developer_NWD_CCD_CDA)',
  'Corporate Relations Manager (Corporate Relations Manager_NWD_PST_PC_CRM)',
  'Technical Operations Associate (Technical Operations Associate_NWD_TEC_SP_TOA)',
  'Chief Warden (Chief Warden_NWD_SA_NIAT_HFT_CW)',
  'Facilities Executive (Facilities Executive_NWD_SA_NIAT_HFT_FE)',
  'Senior Counsellor (Senior Counsellor_NWD_PS_LG_NA_SC)',
  "Founder's Office (Founder's Office_NWD_BU_FO)",
  'Software Development Mentor (Software Development Mentor_NWD_QR_SDM)',
  'Business Operations Associate (Business Operations Associate_NWD_PS_NIAT_OLG)',
  'Business Development Associate (Business Development Associate_NWD_SA_AC_HI_BDA)',
  'HR Business Partner (HR Business Partner_NWD_HR_HRBP)',
  'Software Developer and Instructor (Software Developer and Instructor_NWD_NIAT_AC_IN)',
  'English Instructor (English Instructor_NWD_NIAT_AC_I_A&E_EI)',
  'Business Development Associate (Business Development Associate_NWD_BU_AS_PRE)',
  'Technical Content Developer -I (Technical Content Developer -I_NWD_CD_DSA)',
  'Counsellor (Counsellor_NWD_PS_NA)',
  'Senior Relationship Manager (Senior Relationship Manager_NWD_PS_AC_4.0_T)',
  'Senior Video Editor (Senior Video Editor_NWD_VH_NWS)',
  'Senior Business Development Manager (Senior Business Development Manager_NWD_S_NIAT_CGE)',
  'Academic Mentor (Academic Mentor_NWD_ISS_Int_SS)',
  'Relationship Manager (Relationship Manager_NWD_BM)',
  'Senior Finance Manager (Senior Finance Manager_NWD_F&L_FIN_SFM)',
  'Demo Speaker (Demo Speaker_NWD_S_NIAT_CGE)',
  'Robotics ROS 2 Developer (Robotics ROS 2 Developer_NWD_NIAT_AC_R_RR)',
  'Associate Aptitude Trainer (Associate Aptitude Trainer_NWD_NIAT_AC_I_A&E)',
  'Team Lead - Instructors & Mentors (Team Lead - Instructors & Mentors_NWD_NIAT_AC_I&M)',
  'Academic Content Writer (Academic Content Writer_NWD_BM_CM_ACW)',
  'Content Marketing Manager (Content Marketing Manager_NWD_PS_CD&SEO)',
  'Software Development Mentor (Software Development Mentor_NWD_PSM_SDM)',
  'B2B Partnership Manager (B2B Partnership Manager_NWD_BU_AS_PRE_PM)',
  'Software Developer and Instructor (Software Developer and Instructor_NWD_NIAT_AC_DSA)',
  'Business Operations Associate (Business Operations Associate_NWD_ISS_BOA)',
  'Associate (Associate_NWD_F&L_L)',
  'Associate Project Manager (Associate Project Manager_NWD_DS_PD)',
  'Vice President-Sales (Vice President-Sales_NWD_SA_AC_CGE_VP-SA)',
  'Aptitude Trainer (Aptitude Trainer_NWD_NIAT_AC_I_A&E)',
  'Video Producer (Video Producer_NWD_VH_NIAT_S)',
  'Associate Technical Curriculum Developer (Associate Technical Curriculum Developer_NWD_TEC_CUD_ATCUD)',
  'Success Coach (Success Coach_NWD_ISS_CPSS)',
  'Research Associate (Research Associate_NWD_FO)',
  'Mathematics and Statistics Instructor (Mathematics and Statistics Instructor_NWD_NIAT_AC_IN)',
  'Strategic Partnership Manager (Strategic Partnership Manager_NWD_PST_CR)',
  'Growth Associate (Growth Associate_NWD_PS_AAC)',
  'PPT Design Specialist (PPT Design Specialist_NWD_NIAT_AC_PO)',
  'Associate Video Editor (Associate Video Editor_NWD_VH_NIAT_S)',
  'Video Quality Assurance Editor (Video Quality Assurance Editor_NWD_VH_WS)',
  'Business Operations Associate (Business Operations Associate_NWD_QR)',
  'Social Media Executive (Social Media Executive_NWD_GAI_SM)',
  'Solution Engineer (Solution Engineer_NWD_PSM_SE)',
  'Community Manager (Community Manager_NWD_BM_CM)',
  'Software Development Faculty Trainee (Software Development Faculty Trainee_NWD_NIAT_AC_I&M)',
  'Software Development Instructor (Software Development Instructor_NWD_NIAT_AC_I&M)',
  'Software Developer and Instructor (Software Developer and Instructor_NWD_NIAT_AC_I&M)',
  'Business Operations Associate (Business Operations Associate_NWD_HR_TA_BO)',
  'Network Administrator (Network Administrator_NWD_TT_CTT)',
  'Production Coordinator (Production Coordinator_NWD_VH_NIAT_S_PC)',
  'Associate Instructor - English and Communication Skills (Associate Instructor - English and Communication Skills_NWD_NIAT_AC_I_A&E)',
  'Corporate Relations Manager (Corporate Relations Manager_NWD_PST_CR_CRM)',
  'Market Research Associate (Market Research Associate_NWD_PST_LA_MRA)',
  'Manager - Compliance and Process Excellence (Manager - Compliance and Process Excellence_NWD_IA_SQ&CA)',
  'Associate Instructor Aptitude (Associate Instructor Aptitude_NWD_NIAT_AC_I_A&E)',
  'Internal Product Manager (Internal Product Manager_NWD_BO_IPM)',
  'Social Media Admin (Social Media Admin_NWD_GAI_SM)',
  'Business Operations Associate (Business Operations Associate_NWD_BM_BOA)',
  'Video Editor (Video Editor_NWD_ISS_Int_SS_VE)',
  'Motion Graphic Designer (Motion Graphic Designer_NWD_VH_WS)',
  'Business Operation Associate (Business Operation Associate_NWD_NIAT_AC_I_A&E_BOA)',
  'Sound Engineer (Sound Engineer_NWD_VH_NIAT_S)',
  'Senior Talent Acquisition Associate (Senior Talent Acquisition Associate_NWD_HR_TA)',
  'Tech Instructor - DSA (Tech Instructor - DSA_NWD_NIAT_AC_DSA)',
  'Assistant Finance Manager (Assistant Finance Manager_NWD_F&L_F)',
  'Brand Marketing Manager (Brand Marketing Manager_NWD_BM_BMM)',
  'Motion Graphic Designer (Motion Graphic Designer_NWD_VH_NIAT_S)',
  'Senior Graphic Designer (Senior Graphic Designer_NWD_BM_SGD)',
  'Community Management Associate (Community Management Associate_NWD_NIAT_AC_SE)',
  'Software Development Mentor (Software Development Mentor_NWD_ISS_SDM)',
  'SEO Analyst (SEO Analyst_NWD_PS_CD&SEO)',
  'Strategic Partnerships Manager (Strategic Partnerships Manager_NWD_PST_PCT_SPM)',
  'Lead XR Developer (Lead XR Developer_NWD_TT_CTT)',
  'Placement Coordinator (Placement Coordinator_NWD_PST_PC_PC)',
  'GenAI Content Creator (GenAI Content Creator_NWD_GAI_SM)',
  'Mathematics Faculty Trainee (Mathematics Faculty Trainee_NWD_NIAT_AC_MI&M)',
  'Senior Maths Instructors (Senior Maths Instructors_NWD_NIAT_AC_MI&M)',
  'Mathematics Instructor (Mathematics Instructor_NWD_NIAT_AC_MI&M_MI)',
  'Data Analyst (Data Analyst_NWD_FO_DA)',
  'Curriculum Operation Lead (Curriculum Operation Lead_NWD_TEC_CUD_COL)',
  'Marketing Intelligence Lead (Marketing Intelligence Lead_NWD_FO)',
  'Business Operations Associate-I (Business Operations Associate-I_NWD_NIAT_AC_PO)',
  'Business Operations Associate-II (Business Operations Associate-II_NWD_NIAT_AC_PO)',
  'Associate Technical Content Developer (Associate Technical Content Developer_NWD_CD_DSA)',
  'Technical Support Engineer (Technical Support Engineer_NWD_CD_DSA)',
  'Operations Associate (Operations Associate_NWD_NIAT_AC_MI&M)',
  'RUST Trainer (RUST Trainer_NWD_TEC_PSM)',
  'Business Development Associate - I (Business Development Associate - I_NWD_SA_NIAT_CGE)',
  'IC Business Development Manager (IC Business Development Manager_NWD_S_A_CGE)',
  'Software Development Trainer (Software Development Trainer_NWD_PSM)',
  'Associate Product Manager (Associate Product Manager_NWD_P_S)',
  'Nest.js Trainer (Nest.js Trainer_NWD_PSM)',
  'Senior Success Coach Manager (Senior Success Coach Manager_NWD_NIAT_AC_SS)',
  'Swift UI Trainer (Swift UI Trainer_NWD_PSM)',
  'Software Developent Trainer-Angular (Software Developent Trainer-Angular_NWD_PSM)',
  'Angular Trainer (Angular Trainer_NWD_PSM)',
  'Next Js Trainer (Next Js Trainer_NWD_PSM)',
  'Motion Graphic Designer (Motion Graphic Designer_NWD_VH_MGD)',
  'Senior Motion Graphics Designer (Senior Motion Graphics Designer_NWD_VH_NWS)',
  'Operations Specialist (Operations Specialist_NWD_CCD_ACO)',
  'Procurement Manager (Procurement Manager_NWD_HR_PO)',
  'Site Engineer (Site Engineer_NWD_NIAT_AC_SS)',
  'Warden (Warden_NWD_NIAT_HFT_W)',
  'Accounts Executive (Accounts Executive_NWD_HR_ADM)',
  'Block Chain Trainer (Block Chain Trainer_NWD_PSM)',
  'Robotics Software Engineer (Robotics Software Engineer_NWD_NIAT_AC_R_RSE)',
  'Accounts Associate (Accounts Associate_NWD_HR_ADM)',
  'Business Operations Associate (Business Operations Associate_NWD_NIAT_AC_IA&E)',
  'Program Manager (Program Manager_NWD_10xIIT)',
  'Graphic Designer (Graphic Designer_NWD_DS_PD_GD)',
  'Colorist (Colorist_NWD_VH_NIAT_S)',
  'Creative Project Manager (Creative Project Manager_NWD_VH_NIAT_S)',
  'Associate Project Manager (Associate Project Manager_NWD_TEC_CUD_APM)',
  'Business Operation Associate-II (Business Operation Associate-II_NWD_NIAT_AC_PO)',
  'Operations Associate (Operations Associate_NWD_B2B)',
  'Client Relations Associate (Client Relations Associate_NWD_DSML_NIAT_MC)',
  'Senior Manager - B2B Partnerships (Senior Manager - B2B Partnerships_NWD_B2BP_SM)',
  'Mathematics Mentor (Mathematics Mentor_NWD_NIAT_AC_MI&M_MM)',
  'Hair & Makeup Artist (Hair & Makeup Artist_NWD_VH_NIAT_S)',
  'Associate HR-System (Associate HR-System_NWD_HR_AS)',
  'Zoho Trainer (Zoho Trainer_NWD_PSM_ZT)',
  'Assistant Legal Manager (Assistant Legal Manager_NWD_F&L_L)',
  'Associate Product Manager-Process Optimization (Associate Product Manager-Process Optimization_NWD_FO_CT_APM)',
  'Business Operation Associate (Business Operation Associate_NWD_CCD_ACO)',
  'Business Operations Associate (Business Operations Associate_NWD_ASS_PP)',
  'Associate Project Manager (Associate Project Manager_NWD_CCD_ACO)',
  'Business Operations Associate-II (Business Operations Associate-II_NWD_NIAT_AC_I)',
  'Associate - Compliance and Process Excellence (Associate - Compliance and Process Excellence_NWD_IA_SQ&CA)',
  'Business Operations Associate (Business Operations Associate_NWD_TEC_CUD_BOA)',
  'Business Analyst (Business Analyst_NWD_PST_PC_BA)',
  'Mathematics Instructor (Mathematics Instructor_NWD_NIAT_AC_I_MI)',
  'Project Manager (Project Manager_NWD_NIAT_AC_IN_PM)',
  'Assistant Cinematographer (Assistant Cinematographer_NWD_VH_NIAT_S)',
  'Transport Executive (Transport Executive_NWD_HR_ADM_TE)',
  'Site Engineer (Site Engineer_NWD_HR_ADM_SE)',
  'Head of Maths Dept - NIAT (Head of Maths Dept - NIAT_NWD_NIAT_AC_MI&M)',
  'Program Associate (Program Associate_NWD_HR_L&D_PA)',
  'Curriculum Operation Associate (Curriculum Operation Associate_NWD_TEC_CUD_COA)',
  'Research & Strategy Specilaist (Research & Strategy Specilaist_NWD_HR_RSS)',
  'AVP - Lead Qualification (AVP - Lead Qualification_NWD_PS_LQ_AVP)',
  'Copy Writer - B2B (Copy Writer - B2B_NWD_B2BP_CW)',
  'Graphic Designer - Presentation Design (Graphic Designer - Presentation Design_NWD_TEC_CUD_CGD)',
  'Product Designer (Product Designer_NWD_DS_PD)',
  'Associate Technical Content Developer (MERN) (Associate Technical Content Developer (MERN)_NWD_PST_PCT_ATCD)',
  'Growth Associate (Growth Associate_NWD_PS_LG-CD&SEO)',
  'Area Business Head (Area Business Head_NWD_PS_ABH)',
  'Video Art Director (Video Art Director_NWD_VH_VAD)',
  'Meme & Content Creator (Meme & Content Creator_NWD_BM_MCC)',
  'Social Media Executive (Social Media Executive_NWD_ISS_Int_SS_SME)',
  'Program Manager (Program Manager_NWD_NIAT_AC_R_PM)',
  'Project Manager (Project Manager_NWD_NIAT_AC_I_A&E_PM)',
  'Social Media Strategist (Social Media Strategist_NWD_BM_SMS)',
  'Associate Mathematics Instructor (Associate Mathematics Instructor_NWD_NIAT_AC_MI&M)',
  'Associate Product Marketing Manager (Associate Product Marketing Manager_NWD_PS_LG)',
  'Key Project Manager (Key Project Manager_NWD_HR_ADM_KPM)',
  'Salesforce Developer (Salesforce Developer_NWD_BU_AS_PRE_SD)',
  'Associate Video Editor (Associate Video Editor_NWD_VH_AVE)',
  'Senior Success Coach (Senior Success Coach_NWD_NIAT_AC_SS_SC)',
  'Facilities Front Office Executive (Facilities Front Office Executive_NWD_HR_ADM)',
  'Business Operations Associate (Business Operations Associate_NWD_B2BP_BOA)',
  'Growth Associate (Growth Associate_NWD_PS_NIAT_LQ)',
  'Educational Researcher (Educational Researcher_NWD_FO)',
  'Senior Aptitude Instructor (Senior Aptitude Instructor_NWD_NIAT_AC_I_A&E_SAI)',
  'Architect (Architect_NWD_DS_PS_A)',
  'Webflow Developer (Webflow Developer_NWD_WEBS_WFD)',
  'Junior Project Manager (Junior Project Manager_NWD_BM)',
  'Front Office Receptionist (Front Office Receptionist_NWD_HR_FOR)',
  'Content and Growth Lead (Content and Growth Lead_NWD_BM)',
  'Associate Instructor - English and Communication Skills (Associate Instructor - English and Communication Skills_NWD_NIAT_AC_I_A&E_AIEC)',
  'Associate Product Manager (Associate Product Manager_NWD_NIAT_AC_PRO)',
  'Associate Technical Content Developer (MERN) (Associate Technical Content Developer (MERN)_NWD_CCD_ACO_ATCD)',
  'Community Lead (Community Lead_NWD_BM_CL)',
  'Growth Manager (Growth Manager_NWD_10xIIT_GM)',
  'Business Operations Strategist (Business Operations Strategist_NWD_FO_BOS)',
  'Business Operations Associate (Business Operations Associate_NWD_NIAT_AC_CRM&D_BOA)',
  'CRM Developer (CRM Developer_NWD_ASS_CT)',
  'Success Coach (Success coach_NWD_Int_SS_SC)',
  'Operations Associate (Operations Associate_NWD_TT_CTT_OA)',
  'Product Designer (Product Designer_NWD_DS)',
  'Strategic Partnerships Manager (Strategic Partnerships Manager_NWD_PST_CR_SPM)',
  'Associate Video Producer (Associate Video Producer_NWD_BM_AVP)',
  'Business Operations Associate (Business Operations Associate_NWD_NIAT_SS_AC_BOA)',
  'Salesforce Administrator (Salesforce Administrator_NWD_BO_SA)',
  'Lead Content Developer – DSML (Lead Content Developer – DSML_NWD_DSML_CD_CD)',
  'Associate Software Engineer (Associate Software Engineer_NWD_PSM)',
  'Graphic Designer - Presentation Design (Graphic Designer - Presentation Design_NWD_CD)',
  'Colorist (Colorist_NWD_VH_C)',
  'Technical Instructors – Digital Content (Technical Instructors – Digital Content_NWD_CD)',
  'Cinematographer (Cinematographer_NWD_VH_CG)',
  'Corporate Relations Manager (Corporate Relations Manager_NWD_PST_CRM)',
  'Production Coordinator (Production Coordinator_NWD_VH_PC)',
  'Product Marketing Manager (Product Marketing Manager_NWD_SS_AC_SE)',
  'Associate English Content Developer (Associate English Content Developer_NWD_NIAT_AC_SS)',
  'Cinematographer (Cinematographer_NWD_VH_NIAT_S_C)',
  'Robotics Trainer (Robotics Trainer_NWD_NIAT_AC_R)',
  'Physics Trainer (Physics Trainer_NWD_NIAT_AC_I&M)',
  'Project Associate (Project Associate_NWD_HR_ADM_PA)',
  'Finance Associate (Finance Associate_NWD_F&LF_FA)',
  'Receptionist (Receptionist_NWD_HR_ADM)',
  'Technical Instructor_Digital Content (Technical Instructor_Digital Content_NWD_CD_TIDC)',
  'Assistant Manager - Business Finance (Assistant Manager - Business Finance_NWD_F&L_F_AM)',
  'Business Operations Associate (Business Operations Associate_NWD_NIAT_AC_I&M_BOA)',
  'Associate Finance (Associate Finance_NWD_F&L_F)',
  'Software Development Instructor (Software Development Instructor_NWD_ISS_SDI)',
  'Success Coach (Success Coach_NWD_SS_AC_SC)',
  'Technical Support Engineer (Technical Support Engineer_NWD_NIAT_AC_DSA_TSE)',
  "Associate - Founder’s Office (Associate - Founder’s Office_NWD_NIFA_FO)",
  'Sound Engineer (Sound Engineer_NWD_VH_SE)',
  'Marketing Automation Specialist (Marketing Automation Specialist_NWD_TEC_WT_ASE)',
  'Community Manager (Community Manager_NWD_NIAT_AC_SE)',
  'Academic Mentor (Academic Mentor_NWD_ASS_PP_AM)',
  'Marketing Communication Manager - B2B (Marketing Communication Manager - B2B_NWD_B2BP_MCM)',
  'Creative Operations Lead (Creative Operations Lead_NWD_VH_COL)',
  'Business Operation Associate (Business Operation Associate_NWD_PST_BOA)',
  'Junior Data Analyst (Junior Data Analyst_NWD_10xIIT_JDA)',
  'Business Process Excellence & Assurance Specialist (Business Process Excellence & Assurance Specialist_NWD_IA_BPE&A)',
  'Business Operation Associate-II (Business Operation Associate-II_NWD_NIAT_SS_BOA)',
  'Business Development Associate (Business Development Associate_NWD_AS_PRE_BDA)',
  'Senior Financial Analyst (Senior Financial Analyst_NWD_F&L_FIN_SFA)',
  'Internal Audit Associate (Internal Audit Associate_NWD_IA_FA)',
  'Solutions Architect Associate (Solutions Architect Associate_NWD_NIAT_AC_P&O)',
  'Product Manager (Product Manager_NWD_NIAT_AC_I_A&E_PM)',
  'Lead Presentation Designer (Lead Presentation Designer_NWD_DS_LPD)',
  'Social Media Executive (Social Media Executive_NWD_BM_SME)',
  'Video Production Assistant (Video Production Assistant_NWD_VH)',
  'Technical Content Developer (Technical Content Developer_NWD_NIAT_AC_DSA)',
  'Business Operations Associate (Business Operations Associate_NWD_NWEC_BOA)',
  'Presentation Designer Associate (Presentation Designer Associate_NWD_TEC_CUD_PDA)',
  'Associate Solution Engineer (Associate Solution Engineer_NWD_PSM)',
  'Business Operation Associate (Business Operation Associate_NWD_SS_AC_CS_BOA)',
  'Associate Project Manager (Associate Project Manager_NWD_NIAT_AC_SS_APM)',
  'Motion Graphic Artist (Motion Graphic Artist_NWD_NIAT_S_MGA)',
  'APM (Process Optimisation) (APM (Process Optimisation)_NWD_FO_CT)',
  'Sales Quality Analyst (Sales Quality Analyst_NWD_IA_SQ&CA)',
  'Program Manager (Program Manager_NWD_NIAT_AC_I&M_PM)',
  'Senior Video Producer (Senior Video Producer_NWD_VH_SVP)',
  'Business Operations Associate (Business Operations Associate_NWD_10xIIT_BOA)',
  'Assistant Manager (Assistant Manager_NWD_F&L_F_AM)',
  'Pre-Onboarding Executive (Pre-Onboarding Executive_NWD_ASS_PO_POE)',
  'Associate Product Manager (Associate Product Manager_NWD_NIAT_AC_IA&E_APM)',
  'Technical Content Developer - II (Technical Content Developer - II_NWD_NIAT_AC_I_DSA)',
  'Technical Content Developer - I (Technical Content Developer - I_NWD_NIAT_AC_I_DSA)',
  'Senior Technical Content Developer (Senior Technical Content Developer_NWD_NIAT_AC_I_DSA)',
  'Campus Success Manager (Campus Success Manager_NWD_NWEC_CSM)',
  'Associate Manager – Sales Audit (Associate Manager – Sales Audit_NWD_IA_SQ&CA)',
  'Salesforce CRM Developer (Salesforce CRM Developer_NWD_BO)',
  'Content Writer (Content Writer_NWD_PS_CW)',
  'Business Operations Associate (Business Operations Associate_NWD_VH_BOA)',
  'Data Analyst (Data Analyst_NWD_TEC_ASSP_DA)',
  'English Curriculum Developer (English Curriculum Developer_NWD_C&CD_E)',
  'Graphics Designer - Presentation Design (Graphics Designer - Presentation Design_NWD_VH_GD)',
  'Associate Project Manager (Associate Project Manager_NIAT_AC_R_APM)',
  'Data Analyst (Data Analyst_PST_TT_DA)',
  'Project Management Associate (Project Management Associate_NWD_ISS_PMA)',
  'Marketing Communications Associate (Marketing Communications Associate_NWD_PS_DM_MCA)',
  'Manager - Bank Operations (Manager - Bank Operations_NWD_F&L_F)',
  'Senior CopyWriter (Senior Copywriter_NWD_BM_CM_SCW)',
  'Content Writer - Telugu (Content Writer - Telugu_NWD_GAISM)',
  'AI Graphic Designer (AI Graphic Designer_NWD_GAISM_AIGD)',
  'AI Video Editor -Telugu (AI Video Editor -Telugu_NWD_GAISM)',
  'Graphics Designer (Graphics Designer_NWD_DS_GD)',
  'Associate Program Manager (Associate Program Manager_NWD_NIAT_HFT)',
  'Central Facility Executive (Central Facility Executive_NWD_HR_AD_CFE)',
  'Business Operation Associate (Business Operation Associate_NWD_NIAT_HFT)',
  'AI Video Editor - Kannda (AI Video Editor - Kannda_NWD_GAISM)',
  'Content Writer - Marathi (Content Writer - Marathi_NWD_GAISM)',
  'Business Analytics (Business Analytics_NWD_BM)',
  'Community Associate (Community Associate_NWD_BM_CA)',
  'Business Operations Associate (Business Operations Associate_NWD_PS_NIAT_BOA)',
  'Influencer Marketing Manager (Influencer Marketing Manager_NWD_BM)',
  'Associate Project Manager (Associate Project Manager_NWD_CD_DSA_APM)',
  'Graphic Designer - Presentation Design (Graphic Designer - Presentation Design_NWD_DS_GD_GDPD)',
  'Program Manager (Program Manager_NWD_NIAT_HFT)',
  'Front Office Executive (Front Office Executive_NWD_HR_ADM_FOE)',
  'Procurement Executive (Procurement Executive_NWD_HR_ADM_PE)',
  'Advisor for Higher Education (Advisor for Higher Education_NWD_UP)',
  'Housekeeping Assistant (Housekeeping Assistant_NWD_HR_ADM)',
  'Higher Education Collaborations (Higher Education Collaborations_NWD_UP)',
  ' Senior Growth Manager (Senior Growth Manager_NWD_10xIIT_SGM)',
  'Digital Academic Instructor (Digital Academic Instructor_NWD_CD_DAI)',
  'Onboarding Manager (Onboarding Manager_NWD_HR_TA_OM)',
]

const TOP_DEPARTMENT_OPTIONS = [
  'CT',
  'Sales',
  'Pre Sales',
  'Placement Support Team',
  'Tech Team',
  'Academy Student Success',
  'Intensive Student Success',
  'NIAT_Academics',
  'QR - Query Resolution',
  'Placement Success Management',
  'Video House',
  'AS - Program Registration Expert',
  'Data Science and Machine Learning',
  'University Partnerships',
  'NxtWave Abroad',
  'Brand Marketing',
  'HR - Talent Acquisition',
  'Product',
  'Business Operations',
  'Content and Curriculum Development: Aptitude, English and Assessments',
  'Content Development',
  'HR - Human Resources',
  'NIFA',
  'Design Studio',
  '10xIIT',
  "Founder's Office",
  'Internal Audit',
  'Finance & Legal',
  'GenAI Social Media',
  'NxtWave Edge - Colleges',
  'CD - Curriculum Development',
  'B2B Partnership',
  'NIAT Hostel Facilities Team',
  'Student Success',
]

const SOURCE_BENEFICIARY_DEPARTMENT_OPTIONS = [
  'Management',
  'Sales',
  'Pre-Sales',
  'Sales - Intensive',
  'Content Marketing',
  'Placement - Corporate Relations',
  'Technology',
  'Student Success - Academy',
  'Student Success - Intensive',
  'Placement Success Manager',
  'Query Resolution',
  'NIAT - Academics',
  'Video House',
  'PRE',
  'Content - DS&ML',
  'University Partnership',
  'Talent Acquisition',
  'Product',
  'Business Ops',
  'Placement - Content',
  'NIAT Masterclass',
  'NIAT - Robotics',
  'Content - DS&Algo',
  'Student Success - NIAT',
  'Human Resource',
  'NIAT - Program Ops',
  'Abroad',
  'Founders Office',
  'Product Design',
  'Graphic Design',
  '10xIIT',
  'Internal Audit',
  'Finance',
  'GenAI Social Media',
  'AI&Beyond',
  'Content - MERN',
  'HR - Admin/Facilities',
  'Branding',
  'HR - Learning & Development',
  'Policy & Strategic Partnerships',
  'NIFA',
]

const HOD_OPTIONS = [
  'Rahul Attuluri',
  'G Sumanth Reddy',
  'Shiva Shanker Reddy Devasani',
  'Aniketh Reddy Mustoor',
  'Sai Sampreeth Sambaraju',
  'Girish Akash',
  'Revanth Gopi Chowdary Konakanchi',
  'Vamshi Gadagoju',
  'Vamsi Tallam',
  'Joiet Joseph',
  'Anil Kumar Ganguri',
  'Akhil Jogiparthi',
  'Karthik Reddy V',
  'Hari Haran Gorijavola',
  'Shivam Singh',
  'Sai Teja Manchukanti',
  'Sashank Reddy Gujjula',
  'Radha Alekhya Kommanaboina',
  'Pavan Reddy Dharma',
  'Aman Maheshwari',
  'Shivaji Babu Velpula',
  'Srikar',
  'Akhilesh Jhawar',
  'Rahul Yenninti',
  'Pavan Gangireddy',
  'Bala Bhaskar Reddy Dodda',
  'Nikita Aggarwal',
  'Munagala Varun Reddy',
]

const TYPE_OPTIONS = ['Existing', 'Exit']

const EMPLOYEE_TYPE_OPTIONS = ['On-Roll', 'Consultant', 'Intern']

const SOURCE_DEPARTMENT_TO_HOD = {
  Management: 'Rahul Attuluri',
  'Sales': 'G Sumanth Reddy',
  'Pre-Sales': 'Shiva Shanker Reddy Devasani',
  'Sales - Intensive': 'Aniketh Reddy Mustoor',
  'Content Marketing': 'Sai Sampreeth Sambaraju',
  'Placement - Corporate Relations': 'Girish Akash',
  'Technology': 'Revanth Gopi Chowdary Konakanchi',
  'Student Success - Academy': 'Vamshi Gadagoju',
  'Student Success - Intensive': 'Aniketh Reddy Mustoor',
  'Placement Success Manager': 'Vamsi Tallam',
  'Query Resolution': 'Vamsi Tallam',
  'NIAT - Academics': 'Vamsi Tallam',
  'Video House': 'Joiet Joseph',
  'PRE': 'Anil Kumar Ganguri',
  'Content - DS&ML': 'Akhil Jogiparthi',
  'University Partnership': 'Karthik Reddy V',
  'Talent Acquisition': 'Hari Haran Gorijavola',
  'Product': 'Revanth Gopi Chowdary Konakanchi',
  'Business Ops': 'Shivam Singh',
  'Placement - Content': 'Sai Teja Manchukanti',
  'NIAT Masterclass': 'Akhil Jogiparthi',
  'NIAT - Robotics': 'Sai Teja Manchukanti',
  'Content - DS&Algo': 'Sashank Reddy Gujjula',
  'Student Success - NIAT': 'Aniketh Reddy Mustoor',
  'Human Resource': 'Radha Alekhya Kommanaboina',
  'NIAT - Program Ops': 'Pavan Reddy Dharma',
  'Abroad': 'Anil Kumar Ganguri',
  'Founders Office': 'Rahul Attuluri',
  'Product Design': 'Aman Maheshwari',
  'Graphic Design': 'Shivaji Babu Velpula',
  '10xIIT': 'Srikar',
  'NxtWave Edge - Colleges': 'Sashank Reddy Gujjula',
  'Intensive Offline': 'Aniketh Reddy Mustoor',
  'Assessments POD': 'Sashank Reddy Gujjula',
  'Internal Audit': 'Radha Alekhya Kommanaboina',
  'Finance': 'Akhilesh Jhawar',
  'GenAI Social Media': 'Rahul Yenninti',
  'AI&Beyond': 'Srikar',
  'Content - MERN': 'Pavan Gangireddy',
  'HR - Admin/Facilities': 'Bala Bhaskar Reddy Dodda',
  'Branding': 'Nikita Aggarwal',
  'HR - Learning & Development': 'Munagala Varun Reddy',
  'Policy & Strategic Partnerships': 'Radha Alekhya Kommanaboina',
  'NIFA': 'Akhil Jogiparthi',
  'Pre-Sales - Intensive': 'Aniketh Reddy Mustoor',
  'NIAT - Hiring team': 'Vamsi Tallam',
  'Masterclass': 'Akhil Jogiparthi',
  'NxtGen LP': 'Revanth Gopi Chowdary Konakanchi',
}

const PERCENTAGE_FIELDS = [
  'academy',
  'intensive',
  'niatBatch12',
  'niatBatch3',
  'niatBatch4',
  'others',
  'common',
]

const SALES_KEY = 'sales'

const parsePercentageValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  // Only allow whole numbers (no text, no decimals)
  const normalized = value.toString().trim()
  if (!/^\d+$/.test(normalized)) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const buildSearchableText = (row) => {
  const fieldsToIndex = [
    'empId',
    'empName',
    'designation',
    'departmentLabel',
    'topDepartment',
    'type',
    'sourceDepartment',
    'beneficiaryDepartment',
    'sourceHod',
    'beneficiaryHod',
    'location',
    'employeeType',
    'academy',
    'intensive',
    'others',
    'common',
  ]

  return fieldsToIndex
    .map((field) => row[field])
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const validatePercentageRow = (row) => {
  const values = PERCENTAGE_FIELDS.map((field) =>
    parsePercentageValue(row[field])
  ).filter((value) => value !== null)

  if (values.length === 0) {
    return null
  }

  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round(total * 100) / 100 === 100
    ? null
    : 'Allocation percentages must equal 100%.'
}

const normalizeDepartment = (value) =>
  (value ?? '').toString().trim().toLowerCase()

const getDateValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const createRowId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const normalizeRow = (record) => {
  const row = {
    _id: record?._id ?? `temp-${createRowId()}`,
    departmentKey: record?.departmentKey ?? '',
    departmentId: record?.department ?? null,
  }

  COLUMN_DEFINITIONS.forEach(({ key }) => {
    if (key === 'doj' || key === 'doe') {
      row[key] = getDateValue(record?.[key])
    } else {
      row[key] = record?.[key] ?? ''
    }
  })

  // Preserve sign-off related fields (not in COLUMN_DEFINITIONS)
  row.signoffStatus = record?.signoffStatus ?? null
  row.signoffTargetDepartment = record?.signoffTargetDepartment ?? null
  row.signoffRemark = record?.signoffRemark ?? null
  row.signoffRequestedBy = record?.signoffRequestedBy ?? null

  return row
}

const createEmptyRow = (role, departmentKey = '') =>
  normalizeRow({
    _id: `temp-${createRowId()}`,
    departmentKey: role === 'Admin' ? departmentKey : '',
  })

export default function ExistingEmployeesSheet() {
  const { token, user } = useAuth()
  const { mode } = useViewMode()
  const role = user?.role ?? 'Member'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [rowErrors, setRowErrors] = useState({})
  const [exporting, setExporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [activeDepartment, setActiveDepartment] = useState(
    role === 'Admin' ? 'all' : 'hod'
  )
  const [search, setSearch] = useState('')
  const [actionToast, setActionToast] = useState(null)
  const isMountedRef = useRef(true)
  const fileInputRef = useRef(null)

  const isAdmin = role === 'Admin'

  const applyRowValidation = (row) => {
    const message = validatePercentageRow(row)
    setRowErrors((prev) => {
      if (message) {
        return { ...prev, [row._id]: message }
      }
      if (!prev[row._id]) {
        return prev
      }
      const next = { ...prev }
      delete next[row._id]
      return next
    })
  }

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadRows = useCallback(async () => {
    if (!isMountedRef.current) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? { department: activeDepartment }
          : undefined
      const response = await ExistingEmployeePayrollAPI.fetchList(token, params)
      if (!isMountedRef.current) {
        return
      }
      setRows((response.data ?? []).map((item) => normalizeRow(item)))
      setRowErrors({})
    } catch (err) {
      if (!isMountedRef.current) {
        return
      }
      console.error('Failed to load existing employee payroll entries', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to load the existing employees sheet.'
      setError(message)
      setRows([])
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [activeDepartment, isAdmin, token])

  useEffect(() => {
    if (!token) {
      return
    }
    loadRows()
  }, [loadRows, token])

  const handleDepartmentChange = (value) => {
    setActiveDepartment(value)
  }

  const handleFieldChange = (rowId, field, value) => {
    if (!editMode || (role !== 'Admin' && role !== 'HOD')) return
    let updatedRow = null
    setRows((prev) =>
      prev.map((row) => {
        if (row._id !== rowId) return row
        const nextRow = {
          ...row,
          [field]: value,
        }

        if (field === 'sourceDepartment' || field === 'beneficiaryDepartment') {
          const mappedHod = SOURCE_DEPARTMENT_TO_HOD[value]
          if (mappedHod) {
            if (field === 'sourceDepartment') {
              nextRow.sourceHod = mappedHod
            } else {
              nextRow.beneficiaryHod = mappedHod
            }
          }
        }

        updatedRow = nextRow
        return updatedRow
      })
    )
    if (updatedRow) {
      applyRowValidation(updatedRow)
    }
  }

  const buildPayload = (row) => {
    const payload = {}

    COLUMN_DEFINITIONS.forEach(({ key }) => {
      if (row[key] !== undefined && row[key] !== null) {
        if ((key === 'doj' || key === 'doe') && row[key] === '') {
          return
        }
        payload[key] = row[key]
      }
    })

    if (isAdmin) {
      if (row.departmentId) {
        payload.departmentId = row.departmentId
      }
      if (row.departmentKey || activeDepartment !== 'all') {
        payload.departmentKey = row.departmentKey || activeDepartment
      }
      if (row.departmentLabel) {
        payload.departmentLabel = row.departmentLabel
      }
    }

    return payload
  }

  const handleSaveRow = async (row) => {
    if (!editMode || (role !== 'Admin' && role !== 'HOD')) return
    if (!row.empName?.trim()) {
      setError('Employee name is required before saving.')
      return
    }

    const validationMessage = validatePercentageRow(row)
    if (validationMessage) {
      applyRowValidation(row)
      setError(validationMessage)
      return
    }

    setSavingId(row._id)
    setError(null)
    try {
      const payload = buildPayload(row)
      const response = row._id.startsWith('temp-')
        ? await ExistingEmployeePayrollAPI.create(token, payload)
        : await ExistingEmployeePayrollAPI.update(token, row._id, payload)

      setRows((prev) =>
        prev.map((existing) =>
          existing._id === row._id ? normalizeRow(response.data) : existing
        )
      )
      setRowErrors((prev) => {
        if (!prev[row._id]) {
          return prev
        }
        const next = { ...prev }
        delete next[row._id]
        return next
      })
      setActionToast(
        row._id.startsWith('temp-')
          ? 'Row created successfully.'
          : 'Row updated successfully.'
      )
    } catch (err) {
      console.error('Failed to save entry', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to save the selected row.'
      setError(message)
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteRow = async (row) => {
    if (!editMode || (role !== 'Admin' && role !== 'HOD')) return
    if (!row?._id || row._id.startsWith('temp-')) {
      setRows((prev) => prev.filter((item) => item._id !== row._id))
      setRowErrors((prev) => {
        if (!prev[row._id]) return prev
        const next = { ...prev }
        delete next[row._id]
        return next
      })
      return
    }

    try {
      await ExistingEmployeePayrollAPI.remove(token, row._id)
      setRows((prev) => prev.filter((item) => item._id !== row._id))
      setRowErrors((prev) => {
        if (!prev[row._id]) return prev
        const next = { ...prev }
        delete next[row._id]
        return next
      })
      setActionToast('Row deleted successfully.')
    } catch (err) {
      console.error('Failed to delete entry', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to delete the selected row.'
      setError(message)
    }
  }

  const handleRequestSignOff = async (row) => {
    if (!row?._id || row._id.startsWith('temp-')) {
      setError('Please save the row before requesting sign-off.')
      return
    }

    if (!row.sourceDepartment?.trim()) {
      setError('Source Department is required to request sign-off.')
      return
    }

    try {
      const response = await ExistingEmployeePayrollAPI.requestSignOff(token, row._id)
      setRows((prev) =>
        prev.map((existing) =>
          existing._id === row._id ? normalizeRow(response.data) : existing
        )
      )
      setActionToast('Sign-off request sent successfully.')
    } catch (err) {
      console.error('Failed to request sign-off', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to request sign-off.'
      setError(message)
    }
  }

  const handleSignOffDecision = async (row, decision, remark = '') => {
    if (!row?._id) return

    try {
      const response = await ExistingEmployeePayrollAPI.decideSignOff(
        token,
        row._id,
        decision,
        remark
      )
      setRows((prev) =>
        prev.map((existing) =>
          existing._id === row._id ? normalizeRow(response.data) : existing
        )
      )
      setActionToast(
        decision === 'accepted'
          ? 'Sign-off request accepted successfully.'
          : 'Sign-off request rejected.'
      )
      loadRows()
    } catch (err) {
      console.error('Failed to process sign-off decision', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to process sign-off decision.'
      setError(message)
    }
  }

  const handleAddRow = () => {
    // Automatically enable edit mode when adding a row (if user has permission)
    if ((role === 'Admin' || role === 'HOD') && !editMode) {
      setEditMode(true)
    }
    const departmentKey =
      isAdmin && activeDepartment !== 'all' ? activeDepartment : ''
    const newRow = createEmptyRow(role, departmentKey)
    if (departmentKey && !newRow.departmentLabel) {
      newRow.departmentLabel =
        departmentKey.charAt(0).toUpperCase() + departmentKey.slice(1)
    }
    setRows((prev) => [newRow, ...prev])
  }

  const handleGenerateSheet = async () => {
    if (!token || exporting) {
      return
    }
    setExporting(true)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? { department: activeDepartment }
          : undefined
      await ExistingEmployeePayrollAPI.exportSheet(token, params)
    } catch (err) {
      console.error('Failed to export existing employee sheet', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to generate the existing employee sheet.'
      setError(message)
    } finally {
      setExporting(false)
    }
  }

  const handleUploadSheet = async (file) => {
    if (!token || uploading || !file) {
      return
    }
    setUploading(true)
    setError(null)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? { department: activeDepartment }
          : undefined
      await ExistingEmployeePayrollAPI.uploadSheet(token, file, params)
      await loadRows()
    } catch (err) {
      console.error('Failed to upload existing employee sheet', err)
      const payload = err instanceof ApiError ? err.details : null
      if (payload?.errors?.length) {
        setError(payload.errors.join('\n'))
      } else {
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to upload the existing employee sheet.'
      setError(message)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleUploadButton = () => {
    if (uploading) return
    fileInputRef.current?.click()
  }

  const handleUploadChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    await handleUploadSheet(file)
    event.target.value = ''
  }

  const isSalesListingMode =
    isAdmin && (mode === 'source' || mode === 'beneficiary')

  const salesScopedRows = useMemo(() => {
    if (!isAdmin || !isSalesListingMode) {
      return rows
    }
    if (mode === 'source') {
      return rows.filter(
        (row) => normalizeDepartment(row.sourceDepartment) === SALES_KEY
      )
    }
      return rows.filter(
        (row) => normalizeDepartment(row.beneficiaryDepartment) === SALES_KEY
      )
  }, [isAdmin, isSalesListingMode, mode, rows])

  const salesFilterActive = isAdmin && isSalesListingMode && salesScopedRows.length > 0
  const visibleRows =
    isAdmin && (salesFilterActive || !isSalesListingMode)
      ? salesScopedRows
      : rows

  const searchableRows = useMemo(() => {
    if (!search.trim()) {
      return visibleRows
    }
    const query = search.trim().toLowerCase()
    return visibleRows.filter((row) => buildSearchableText(row).includes(query))
  }, [search, visibleRows])

  const sheetDescription = useMemo(() => {
    const baseDescription = isAdmin
      ? activeDepartment === 'all'
        ? 'Viewing all departments.'
        : `Filtering existing employees for ${activeDepartment.toUpperCase()}.`
      : 'HOD view always scopes to your department.'
    if (isAdmin && salesFilterActive) {
      const listingLabel =
        mode === 'source' ? 'Source: Sales listing' : 'Beneficiary: Sales listing'
      return `${baseDescription} Showing ${listingLabel}.`
    }
    return baseDescription
  }, [activeDepartment, isAdmin, mode, salesFilterActive])

  return (
    <section className="space-y-6">
      <ExistingEmployeeToolbar
        role={role}
        activeDepartment={activeDepartment}
        onDepartmentChange={handleDepartmentChange}
        onAddRow={handleAddRow}
        onGenerateSheet={handleGenerateSheet}
        onUploadSheet={handleUploadButton}
        exporting={exporting}
        uploading={uploading}
        loading={loading}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleUploadChange}
      />

      <div className="flex items-center justify-between rounded-3xl border border-slate-900/60 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
        <p>{sheetDescription}</p>
        <div className="flex items-center gap-3">
          {(role === 'Admin' || role === 'HOD') && (
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-400/50 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/20 hover:text-blue-100"
            >
              {editMode ? 'View Mode' : 'Edit'}
            </button>
          )}
        <button
          type="button"
          onClick={loadRows}
          className="text-xs uppercase tracking-[0.4em] text-emerald-300 underline decoration-dotted underline-offset-4"
        >
          Refresh
        </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-3xl border border-slate-900/70 bg-slate-950/60 px-4 py-4 text-sm text-slate-300">
        <label className="text-xs uppercase tracking-[0.4em] text-slate-500" htmlFor="existing-employees-search">
          Search
        </label>
        <input
          id="existing-employees-search"
          type="search"
          placeholder="Search by name, ID, department,HOD or EMP ID"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 whitespace-pre-line">
          {error}
        </div>
      ) : null}

      <ExistingEmployeeTable
        columns={COLUMN_DEFINITIONS}
        rows={searchableRows}
        loading={loading}
        role={role}
        isEditMode={editMode}
        savingId={savingId}
        rowErrors={rowErrors}
        onFieldChange={handleFieldChange}
        onSaveRow={handleSaveRow}
        onDeleteRow={handleDeleteRow}
        onRequestSignOff={handleRequestSignOff}
        onSignOffDecision={handleSignOffDecision}
        monthOptions={MONTH_OPTIONS}
        departmentOptions={DEPARTMENT_OPTIONS}
        topDepartmentOptions={TOP_DEPARTMENT_OPTIONS}
        sourceBeneficiaryDepartmentOptions={SOURCE_BENEFICIARY_DEPARTMENT_OPTIONS}
        hodOptions={HOD_OPTIONS}
        typeOptions={TYPE_OPTIONS}
        employeeTypeOptions={EMPLOYEE_TYPE_OPTIONS}
        designationOptions={DESIGNATION_OPTIONS}
      />

      {actionToast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between gap-4">
            <span>{actionToast}</span>
            <button
              type="button"
              onClick={() => setActionToast(null)}
              className="text-xs uppercase tracking-[0.25em] text-emerald-300 hover:text-emerald-100"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}


