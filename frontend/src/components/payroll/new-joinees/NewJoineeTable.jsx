import { useEffect, useRef } from 'react'

const DATE_FIELDS = new Set(['doj', 'doe'])
const DEFAULT_COLUMN_WIDTH = 160
const MAX_INPUT_WIDTH = 640
const CHAR_PIXEL_WIDTH = 9
const EXTRA_PADDING = 32

// Top Department dropdown options for New Joinee sheet
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
  'Founder\'s Office',
  'Internal Audit',
  'Finance & Legal',
  'GenAI Social Media',
  'NxtWave Edge - Colleges',
  'CD - Curriculum Development',
  'B2B Partnership',
  'NIAT Hostel Facilities Team',
  'Student Success',
]

// Department dropdown options for New Joinee sheet
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
  // Generic department labels without codes
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

// Source Department dropdown options for New Joinee sheet
const SOURCE_DEPARTMENT_OPTIONS = [
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

// HOD dropdown options for Source HOD and Beneficiary HOD
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

// Mapping based on Department column in the reference sheet (kept for backward compatibility)
const HOD_BY_DEPARTMENT = {
  '10xIIT (NWD_10XIIT)': 'Srikar Naidu Edumudi (NW0001283)',
  'AC_Customer Support (NWD_ASS_ACCS)': 'Vamshi Gadagoju (NW0001169)',
  'Central Team- Academy Student Success (NWD_ASS_CT)': 'Vamshi Gadagoju (NW0001169)',
  'IN_Customer Support (NWD_ASS_IN_CS)': 'Vamshi Gadagoju (NW0001169)',
  'Payments Retention Team (NWD_ASS_PYRT)': 'Vamshi Gadagoju (NW0001169)',
  'Placement Preparation (NWD_ASS_PP)': 'Vamshi Gadagoju (NW0001169)',
  'Pre-Onboarding (Pre-Onboarding_NWD_ASS_PO)': 'Vamshi Gadagoju (NW0001169)',
  'Student Engagement (NWD_ASS_SE)': 'Vamshi Gadagoju (NW0001169)',
  'Success Coach (NWD_ASS_SC)': 'Vamshi Gadagoju (NW0001169)',
  'AS - Program Registration Expert (NWD_BU_AS_PRE)': 'Anil Kumar Ganguri (NW0000311)',
  'NIAT_Offline Lead Generation (NWD_AS_PRE_NIAT_OLG)': 'Mansoor Valli Gangupalli (NW0000320)',
  'B2B Partnership (NWD_B2BP)': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'Brand Marketing (NWD_BM)': 'Nikita Aggarwal (NW0001916)',
  'Content Marketing (NWD__BM_CM)': 'Nikita Aggarwal (NW0001916)',
  'Business Operations (NWD_BO)': 'Shivam Singh (NW0001089)',
  'Pre Sales (NWD_BO_PS)': 'Shivam Singh (NW0001089)',
  'CD - Curriculum Development (NWD_CD_CD)': 'Pavan Gangireddy (NW0002526)',
  'CD - Curriculum Development (NWD_TEC_CUD)': 'Pavan Gangireddy (NW0002526)',
  'Assessment Content and Ops (NWD_CCD_AC_Ops)': 'Sai teja Manchukanti',
  'Curriculum Development: Aptitude (NWD_CCD_CD_A)': 'Sai teja Manchukanti',
  'Curriculum Development: English (NWD_CCD_CD_E)': 'Sai teja Manchukanti',
  'Content Development (NWD_CD)': 'Sashank Reddy Gujjula (NW0000002)',
  'DSA (NWD_CD_DSA)': 'Sashank Reddy Gujjula (NW0000002)',
  'CT (NWD_CT)': 'Rahul Attuluri (NW0000001)',
  'CD - Content Development (NWD_DSML_CDCD)': 'Rushikesh Konapure (NW0005433)',
  'Content Development- DSML (NWD_CD_DSML)': 'Sashank Reddy Gujjula (NW0000002)',
  'Data Science and Machine Learning (NWD_DSML)': 'Akhil Jogiparthi (NW0000305)',
  'NIAT_Master Class (NWD_DSML_NIAT_MC)': 'Akhil Jogiparthi (NW0000305)',
  'Design Studio (NWD_DS)': 'Aman Maheshwari (NW0003000)',
  'Graphic Design (NWD_DS_GD)': 'Aman Maheshwari (NW0003000)',
  'Product Design (NWD_DS_PD)': 'Aman Maheshwari (NW0003000)',
  'Finance (NWD_F&L_FIN)': 'Penmetsa Anirudh Varma (NW0003518)',
  'FP&A (NWD_F&L_FP&A)': 'Devansh Mohata (NW0002722)',
  'Legal (NWD_F&L_LE)': 'Megha Ahuja (NW0002812)',
  'Legal (NWD_L)': 'Megha Ahuja (NW0002812)',
  'Control Tower (NWD_FO_CT)': 'Rahul Attuluri (NW0000001)',
  "Founder's Office (NWD_FO)": 'Rahul Attuluri (NW0000001)',
  'GenAI Social Media (NWD_GAISM)': 'Rahul Yenninti (NW0001673)',
  'HR - Admin (NWD_HR_ADM)': 'Bala Bhaskar Reddy Dodda (NW0001170)',
  'HR - HRBP (NWD_HRBP)': 'Radha Alekhya Kommanaboina (NW0001565)',
  'HR - Human Resources (NWD_HR)': 'Radha Alekhya Kommanaboina (NW0001565)',
  'HR - Learning & Development (NWD_HR_L&D)': 'Munagala Varun Reddy (NW0002247)',
  'HR - Operations (NWD_HR_OPS)': 'Divya Sri Nandigam (NW0001670)',
  'HR - Payroll And Compliance (NWD_HR_P&C)': 'Brahma Reddy Karumuru (NW0001637)',
  'HR - Systems (NWD_HR_HRS)': 'Divya Sri Nandigam (NW0001670)',
  'PO - Procurement (NWD_HR_PO)': 'Bala Bhaskar Reddy Dodda (NW0001170)',
  'HR - Talent Acquisition (NWD_HR_TA)': 'Hari Haran Gorijavola (NW0000390)',
  'College Plus Student Success (NWD_ISS_CPSS)': 'Aniketh Mustoor (NW0000307)',
  'Intensive Student Success (Intensive Student Success_NWD_ISS_Int_SS)': 'Aniketh Mustoor (NW0000307)',
  'Intensive Student Success (NWD_ISS_Int_SS)': 'Rahul Attuluri (NW0000001)',
  'Intensive Student Success (NWD_ISS)': 'Aniketh Mustoor (NW0000307)',
  'PC - Positive Community Building (NWD_PC_PCB)': 'Sashank K (NW0002724)',
  'Business Process Excellence & Assurance (NWD_IA_BPE&A)': 'Radha Alekhya Kommanaboina (NW0001565)',
  'Financial Audit (NWD_IA_FA)': 'Radha Alekhya Kommanaboina (NW0001565)',
  'Internal Audit (NWD_IA)': 'Radha Alekhya Kommanaboina (NW0001565)',
  'Sales Quality & Compliance Audit (NWD_IA_SQ&CA)': 'Radha Alekhya Kommanaboina (NW0001565)',
  'NIAT Hostel Facilities Team (NWD_NIAT_HFT)': 'Anil Kumar Ganguri (NW0000311)',
  'NIAT_CRM & Data (NWD_NIAT_AC_CRM&D)': 'Aniketh Mustoor (NW0000307)',
  'NIAT_Instructors (NWD_NIAT_AC_IN)': 'Venkata Abhinav Devaguptapu (NW0000351)',
  'NIAT_Instructors & Mentors (NWD_NIAT_AC_I&M)': 'Rahul Attuluri (NW0000001)',
  'NIAT_Instructors_Aptitude & English (NWD_NIAT_AC_I_A&E)': 'Sai Teja Manchukanti (NW0000352)',
  'NIAT_Instructors_DSA (NWD_NIAT_AC_DSA)': 'Rahul Attuluri (NW0000001)',
  'NIAT_Maths Instructors and Mentors (NWD_NIAT_MIM)': 'Kompella Sai Manvish (NW0005113)',
  'NIAT_Product (NWD_NIAT_AC_PRO)': 'Rahul Attuluri (NW0000001)',
  'NIAT_Program Operations (NWD_NIAT_AC_PO)': 'Pavan Reddy Dharma (NW0001171)',
  'NIAT_Robotics (NWD_NIAT_AC_R)': 'Sai Teja Manchukanti (NW0000352)',
  'NIAT_Student Engagement (NWD_NIAT_AC_SE)': 'Pavan Reddy Dharma (NW0001171)',
  'NIAT_Student Success (NWD_NIAT_AC_SS)': 'Pavan Reddy Dharma (NW0001171)',
  'NIFA (NWD_NIFA)': 'Akhil Jogiparthi (NW0000305)',
  'NxtWave Abroad (NWD_NA)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'NxtWave Edge - Colleges (NWD_NWEC)': 'Srikar Naidu Edumudi (NW0001283)',
  'Placement Success Management (NWD_PSM)': 'Vishnu Vamsi Vardhan Tallam (NW0000088)',
  'B2B Marketing (NWD_PST_B2B)': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'Placement Support Team (NWD_PST)': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'PST - Corporate Relations (NWD_PST_CR)': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'PST - Customer Support (NWD_PST_CS)': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'PST - Lead Acquisition (NWD_PST_LA)': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'PST - Placement Content Team (NWD_PST_PCT)': 'Sai Teja Manchukanti (NW0000352)',
  'PST - Placement Coordinator (NWD_PST_PC)': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'Topin Tech (NWD_PST_TT)': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'AC_4.0 Tribe (NWD_PS_LG_AC-4.0T&NET)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'AC_Digital Marketing (NWD_PS_AC_DM)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'AC_Lead Qualification (NWD_PS_AC-LQ)': 'Kadari Hari Krishna (NW0005153)',
  'Affiliate Admission Consultant (NWD_PS_AAC)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'College Dost & SEO (NWD_CDSEO)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'College Dost & SEO (NWD_PS_LG_CD&SEO)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'Digital Marketing (NWD_PS_DM)': 'Shivam Singh (NW0001089)',
  'Influencer Marketing & Digital Affiliate (NWD_IMDA)': 'N.A.',
  'Influencer Marketing & Digital Affiliate (NWD_PS_LG_IM&DA)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'L&D - Presales (NWD_PS_LD)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'Lead Generation (NWD_PS_LG)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'Lead Qualification (NWD_PS_LQ)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'NIAT (NWD_PSS_NIAT)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'NIAT_Lead Qualification (NWD_PS_LQ_NIAT-LQ)': 'Kadari Hari Krishna (NW0005153)',
  'NIAT_Offline Lead Generation (NWD_PS_NIAT_OLG)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'PC - Positive Community Building (NWD_PS_PC_PCB)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'Pre Sales (NWD_PS)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'Product - NxtGig AI Accelerator (NWD_P_NXTGIG)': 'Revanth Gopi Konakanchi (NW0000075)',
  'Product (NWD_P)': 'Revanth Gopi Konakanchi (NW0000075)',
  'Product-Learning (NW_P_PDL)': 'Revanth Gopi Konakanchi (NW0000075)',
  'Product-Sales (NW_P_PRS)': 'Revanth Gopi Konakanchi (NW0000075)',
  'QR - Query Resolution (NWD_QR)': 'Vishnu Vamsi Vardhan Tallam (NW0000088)',
  'Academy_CGE (NWD_SA_AC_CGE)': 'Tathagat Bisoyi (NW0003607)',
  'Academy_Hiring (NWD_SA_AC_HI)': 'Kumar Verma (NW0001266)',
  'Academy_QA (NWD_SA_AC_QA)': 'Tathagat Bisoyi (NW0003607)',
  'Academy_Training (NWD_SA_AC_TR)': 'Kumar Verma (NW0001266)',
  'Intensive_CGE (NWD_SA_IN_CGE)': 'Aniketh Mustoor (NW0000307)',
  'NIAT_CGE (NWD_SA_NIAT_CGE)': 'Sai Sumanth Reddy Gattikoppula (NW0000301)',
  'Sales (NWD_SA)': 'Sai Sumanth Reddy Gattikoppula (NW0000301)',
  'AC_Customer Support (NWD_SS_AC_CS)': 'Aniketh Mustoor (NW0000307)',
  'AC_Success Coach (NWD_SS_AC_SC)': 'Aniketh Mustoor (NW0000307)',
  'Student Engagement (NWD_SS_AC_SE)': 'Aniketh Mustoor (NW0000307)',
  'Academy Student Success POD (NWD_TEC_ASSP)': 'Revanth Gopi Konakanchi (NW0000075)',
  'Central Tech Team (NWD_TEC_CTT)': 'Revanth Gopi Konakanchi (NW0000075)',
  'Content & Learning Outcomes POD (NWD_TEC_CO&LO)': 'Pavan Gangireddy (NW0002526)',
  'DSA POD (NWD_TEC_DSAP)': 'Sashank Reddy Gujjula (NW0000002)',
  'NIAT Student Success POD (NWD_TEC_NSSP)': 'Aniketh Mustoor (NW0000307)',
  'Placement Support POD (NWD_TEC_PSP)': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'Pre Sales POD (NWD_TEC_PSAP)': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'Sales POD (NWD_TEC_SA)': 'Sai Sumanth Reddy Gattikoppula (NW0000301)',
  'Website Team (NWD_TEC_WT)': 'Revanth Gopi Konakanchi (NW0000075)',
  'University Partnerships (NWD_UP)': 'Karthik Reddy Vummadi (NW0000308)',
  'University Partnerships (NWD_UPS)': 'Karthik Reddy Vummadi (NW0000308)',
  'NIAT Studio (NWD_NIAT_S)': 'Joiet Joseph (NW0002644)',
  'NxtWave Studio (NW_NXT_ST)': 'Joiet Joseph (NW0002644)',
  'Pre-Sales Studio (NWD_PS_ST)': 'Joiet Joseph (NW0002644)',
  'Video House (NWD_VH)': 'Joiet Joseph (NW0002644)',
  'Webinar Studio (NWD_VH_WS)': 'Joiet Joseph (NW0002644)',
}

// Primary mapping: Top Department -> HOD (derived from the sheet)
const HOD_BY_TOP_DEPARTMENT = {
  '10xIIT': 'Srikar Naidu Edumudi (NW0001283)',
  'Academy Student Success': 'Vamshi Gadagoju (NW0001169)',
  'AS - Program Registration Expert': 'Anil Kumar Ganguri (NW0000311)',
  'B2B Partnership': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'Brand Marketing': 'Nikita Aggarwal (NW0001916)',
  'Business Operations': 'Shivam Singh (NW0001089)',
  'CD - Curriculum Development': 'Pavan Gangireddy (NW0002526)',
  'Content and Curriculum Development: Aptitude, English and Assessments':
    'Sai teja Manchukanti',
  'Content Development': 'Sashank Reddy Gujjula (NW0000002)',
  CT: 'Rahul Attuluri (NW0000001)',
  'Data Science and Machine Learning': 'Akhil Jogiparthi (NW0000305)', // primary owner
  'Design Studio': 'Aman Maheshwari (NW0003000)',
  'Finance & Legal': 'Penmetsa Anirudh Varma (NW0003518)', // top-level finance owner
  "Founder's Office": 'Rahul Attuluri (NW0000001)',
  'GenAI Social Media': 'Rahul Yenninti (NW0001673)',
  'HR - Human Resources': 'Radha Alekhya Kommanaboina (NW0001565)', // core HR owner
  'HR - Talent Acquisition': 'Hari Haran Gorijavola (NW0000390)',
  'Intensive Student Success': 'Aniketh Mustoor (NW0000307)',
  'Internal Audit': 'Radha Alekhya Kommanaboina (NW0001565)',
  'NIAT Hostel Facilities Team': 'Anil Kumar Ganguri (NW0000311)',
  NIAT_Academics: 'Aniketh Mustoor (NW0000307)', // academic lead
  NIFA: 'Akhil Jogiparthi (NW0000305)',
  'NxtWave Abroad': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'NxtWave Edge - Colleges': 'Srikar Naidu Edumudi (NW0001283)',
  'Placement Success Management': 'Vishnu Vamsi Vardhan Tallam (NW0000088)',
  'Placement Support Team': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'Pre Sales': 'Shiva Shanker Reddy Devasani (NW0000302)',
  Product: 'Revanth Gopi Konakanchi (NW0000075)',
  'QR - Query Resolution': 'Vishnu Vamsi Vardhan Tallam (NW0000088)',
  Sales: 'Sai Sumanth Reddy Gattikoppula (NW0000301)',
  'Student Success': 'Aniketh Mustoor (NW0000307)',
  'Tech Team': 'Revanth Gopi Konakanchi (NW0000075)',
  'University Partnerships': 'Karthik Reddy Vummadi (NW0000308)',
  'Video House': 'Joiet Joseph (NW0002644)',
}

import { WORK_LOCATION_OPTIONS } from '../../../constants/workLocationOptions.js'

const EMPLOYMENT_TYPE_OPTIONS = [
  'Employee',
  'Freelancer',
  'Internship',
  'Intern + Employee',
  'Consultant',
  'Consultant + Employee',
]

// New joinee designations dropdown options
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
  'Founder\'s Office (Founder\'s Office_NWD_UPS)',
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
  'Founder\'s Office (Founder\'s Office_NWD_BO)',
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
  // Generic / intern and additional roles without explicit codes
  'Business Operations Associate',
  'Associate Product Manager Intern',
  'Business Development Associate',
  'Associate Technical Curriculum Developer Intern',
  'Frontend Intern',
  'Presentation Designer Associate Intern',
  'Technical Support Engineer',
  'Software Development Faculty Trainee',
  'Marketing Technology Intern',
  'Backend Intern',
  'Associate Technical Content Developer',
  'Strategic Partnership Manager-Intern',
  'Student Relationship Officer',
  'Growth Associate Intern',
  'Data Analytics Intern',
  'Associate Solution Engineer',
  'Associate Product Management Intern',
  'Problem Setter',
  'Operations Associate',
  'Business Operations intern',
  'PowerPoint Specialist',
  'Robotics Trainer',
  'Business Operation Associate',
  'Associate Video Editor',
  'Placement coordinator',
  'Performance marketing Intern',
  'Teaching Assistant',
  'Software Engineering Intern',
  'PPT Designer Intern',
]

// Product / Working Domain dropdown options for New Joinee sheet
const PRODUCT_DOMAIN_OPTIONS = [
  'Academy',
  'Intensive',
  'NIAT Batch 1&2',
  'NIAT Batch 3',
  'NIAT Batch 4',
  'NxtWave - Edge',
  'Assessment POD',
  'Common/All Products',
]

const ASSET_REQUIREMENT_OPTIONS = [
  'Windows Laptop',
  'MacBook',
  'Monitor 24"',
  'iPad',
  'Android Tablet',
  'Mobile Phone',
  'Desktop',
  'Accessories',
  'NA',
  'Other',
]

const PROCESSOR_OPTIONS = [
  'Intel i5',
  'Intel i7',
  'Intel i9',
  'AMD Ryzen 5',
  'AMD Ryzen 7',
  'Apple M2',
  'Apple M3',
  'Apple M4',
  'NA',
]

const OPERATING_SYSTEM_OPTIONS = [
  'Windows 10',
  'Windows 11',
  'Ubuntu',
  'macOS',
  'ChromeOS',
  'NA',
]

const STORAGE_OPTIONS = ['256 GB', '512 GB', '1 TB', '2 TB', 'NA']
const RAM_OPTIONS = ['8 GB', '12 GB', '16 GB', '32 GB', '64 GB', 'NA']
const DISPLAY_SIZE_OPTIONS = ['13 inch', '14 inch', '15 inch', '16 inch', '24" Monitor', '27" Monitor', 'NA']
const GPU_OPTIONS = ['Integrated', 'NVIDIA GTX 1650', 'NVIDIA RTX 3060', 'NVIDIA RTX 4060', 'Apple GPU', 'NA']
const PERIPHERAL_OPTIONS = ['Mouse', 'Keyboard', 'Headset', 'Docking Station', 'HDMI Adapter', 'NA', 'Other']
const HEADPHONE_OPTIONS = ['NA', 'Jabra', 'Sony', 'Bose', 'Apple AirPods', 'Logitech', 'Other']
const MOBILE_PHONE_OPTIONS = ['NA', 'iPhone', 'Android', 'Samsung', 'OnePlus', 'Pixel', 'Other']
const HIRING_STATUS_OPTIONS = ['Active', 'Closed', 'Hold', 'NA']

const FIELD_OPTIONS = {
  workMode: ['WFO', 'WFH', 'Hybrid'],
  type: ['New Hire', 'Replacement', 'Backfill'],
  designation: DESIGNATION_OPTIONS,
  topDepartment: TOP_DEPARTMENT_OPTIONS,
  departmentLabel: DEPARTMENT_OPTIONS,
  sourceDepartment: SOURCE_DEPARTMENT_OPTIONS,
  beneficiaryDepartment: SOURCE_DEPARTMENT_OPTIONS,
  workLocation: WORK_LOCATION_OPTIONS,
  employmentType: EMPLOYMENT_TYPE_OPTIONS,
  productOrDomain: PRODUCT_DOMAIN_OPTIONS,
  hiringStatus: HIRING_STATUS_OPTIONS,
  assetRequirement: ASSET_REQUIREMENT_OPTIONS,
  processor: PROCESSOR_OPTIONS,
  operatingSystem: OPERATING_SYSTEM_OPTIONS,
  storage: STORAGE_OPTIONS,
  ram: RAM_OPTIONS,
  displaySize: DISPLAY_SIZE_OPTIONS,
  graphicCard: GPU_OPTIONS,
  peripherals: PERIPHERAL_OPTIONS,
  headPhone: HEADPHONE_OPTIONS,
  mobilePhone: MOBILE_PHONE_OPTIONS,
  sourceHod: HOD_OPTIONS,
  beneficiaryHod: HOD_OPTIONS,
}

const renderValue = (value) => {
  if (value === null || value === undefined) {
    return '—'
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? '—' : value
  }
  const normalized = value.toString().trim()
  if (normalized.toLowerCase() === 'na') {
    return 'NA'
  }
  return normalized.length > 0 ? normalized : '—'
}

const getNumericWidth = (width) => {
  if (typeof width === 'number') {
    return width
  }
  if (typeof width === 'string') {
    const parsed = parseInt(width, 10)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return DEFAULT_COLUMN_WIDTH
}

const buildInputStyle = (column, value, isDateField) => {
  const baseWidth = getNumericWidth(column.width)
  if (isDateField) {
    return { minWidth: `${baseWidth}px` }
  }
  const dynamicWidth = Math.max(
    baseWidth,
    Math.min(
      (value?.length || 0) * CHAR_PIXEL_WIDTH + EXTRA_PADDING,
      MAX_INPUT_WIDTH
    )
  )
  return {
    minWidth: `${baseWidth}px`,
    width: `${dynamicWidth}px`,
  }
}

export default function NewJoineeTable({
  columns,
  rows,
  loading,
  savingId,
  role,
  isEditMode = false,
  onFieldChange,
  onSaveRow,
  onDeleteRow,
  rowErrors = {},
}) {
  const canDelete = role === 'Admin' || role === 'HOD'
  const canEdit = role === 'Admin' || role === 'HOD'
  const showEditControls = isEditMode && canEdit

  // Preserve horizontal scroll position when toggling between view and edit mode
  const scrollContainerRef = useRef(null)
  const scrollLeftRef = useRef(0)

  // Track scroll position as user scrolls
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      scrollLeftRef.current = container.scrollLeft
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // When switching between view and edit modes, restore previous scroll position
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    container.scrollLeft = scrollLeftRef.current
  }, [isEditMode])

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/80 shadow-2xl shadow-black/30">
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <table className="min-w-[1200px] table-auto border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ minWidth: column.width }}
                  className="px-4 py-3 text-left text-[0.65rem] uppercase tracking-[0.5em] text-slate-500"
                >
                  {column.label}
                </th>
              ))}
              {showEditControls && (
                <th className="w-40 px-4 py-3 text-right text-[0.65rem] uppercase tracking-[0.5em] text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (showEditControls ? 1 : 0)}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  Loading new joinee sheet…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showEditControls ? 1 : 0)}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  No entries yet. Use "Add Row" to begin planning.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rowError = rowErrors[row._id]
                return (
                  <tr
                    key={row._id}
                    className="border-t border-slate-900/60 hover:bg-slate-900/40"
                  >
                    {columns.map((column) => {
                      const isDateField = DATE_FIELDS.has(column.key)
                      let options = FIELD_OPTIONS[column.key]
                      const value = row[column.key] ?? ''

                      if (column.key === 'sourceHod') {
                        const mappedFromTop =
                          HOD_BY_TOP_DEPARTMENT[row.topDepartment]
                        const mappedFromDept =
                          HOD_BY_DEPARTMENT[row.sourceDepartment] ||
                          HOD_BY_DEPARTMENT[row.departmentLabel]
                        const mapped = mappedFromTop || mappedFromDept
                        if (mapped) {
                          options = [mapped]
                        }
                      }

                      if (column.key === 'beneficiaryHod') {
                        const mappedFromTop =
                          HOD_BY_TOP_DEPARTMENT[row.topDepartment]
                        const mappedFromDept =
                          HOD_BY_DEPARTMENT[row.beneficiaryDepartment] ||
                          HOD_BY_DEPARTMENT[row.departmentLabel]
                        const mapped = mappedFromTop || mappedFromDept
                        if (mapped) {
                          options = [mapped]
                        }
                      }

                      const handleChange = (event) => {
                        const newValue = event.target.value

                        // Keep all department-related fields in sync
                        if (
                          column.key === 'topDepartment' ||
                          column.key === 'departmentLabel' ||
                          column.key === 'sourceDepartment' ||
                          column.key === 'beneficiaryDepartment'
                        ) {
                          onFieldChange(row._id, 'topDepartment', newValue)
                          onFieldChange(row._id, 'departmentLabel', newValue)
                          onFieldChange(row._id, 'sourceDepartment', newValue)
                          onFieldChange(
                            row._id,
                            'beneficiaryDepartment',
                            newValue
                          )

                          const mappedHod =
                            HOD_BY_TOP_DEPARTMENT[newValue] ||
                            HOD_BY_DEPARTMENT[newValue]
                          if (mappedHod) {
                            onFieldChange(row._id, 'sourceHod', mappedHod)
                            onFieldChange(
                              row._id,
                              'beneficiaryHod',
                              mappedHod
                            )
                          }
                          return
                        }

                        // When asset requirement is not selected or NA, auto-set device fields to NA
                        if (column.key === 'assetRequirement') {
                          onFieldChange(row._id, 'assetRequirement', newValue)
                          if (!newValue || newValue === 'NA') {
                            const DEVICE_FIELDS = [
                              'processor',
                              'operatingSystem',
                              'storage',
                              'ram',
                              'displaySize',
                              'graphicCard',
                              'peripherals',
                              'headPhone',
                              'mobilePhone',
                              'scienceSbu',
                            ]
                            DEVICE_FIELDS.forEach((fieldKey) => {
                              onFieldChange(row._id, fieldKey, 'NA')
                            })
                          }
                          return
                        }

                        onFieldChange(row._id, column.key, newValue)
                      }

                      // Parsed peripherals array for checkbox-style multi-select
                      const peripheralValues =
                        column.key === 'peripherals'
                          ? (value || '')
                              .split(',')
                              .map((item) => item.trim())
                              .filter((item) => item.length > 0)
                              // Normalize any case-varied "na" to "NA"
                              .map((item) =>
                                item.toLowerCase() === 'na' ? 'NA' : item
                              )
                          : []

                      const togglePeripheral = (option) => {
                        let next = peripheralValues.slice()
                        const isNaOption = option === 'NA'

                        if (next.includes(option)) {
                          // Toggling off
                          next = next.filter((item) => item !== option)
                        } else {
                          // Toggling on
                          if (isNaOption) {
                            // Selecting NA clears all others
                            next = ['NA']
                          } else {
                            // Selecting a real peripheral removes NA if present
                            next = next.filter((item) => item !== 'NA')
                            next.push(option)
                          }
                        }

                        onFieldChange(row._id, 'peripherals', next.join(', '))
                      }

                      return (
                        <td key={column.key} className="px-4 py-3 align-top text-sm text-slate-200">
                          {showEditControls ? (
                            // Peripherals: checkbox-style multi-select
                            column.key === 'peripherals' ? (
                              <div
                                className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                                style={buildInputStyle(column, value, false)}
                              >
                                {PERIPHERAL_OPTIONS.map((option) => {
                                  const checked = peripheralValues.includes(option)
                                  return (
                                    <label
                                      key={option}
                                      className="flex items-center gap-1 text-xs text-slate-100"
                                    >
                                      <input
                                        type="checkbox"
                                        className="h-3 w-3 rounded border-slate-700 bg-slate-900 text-emerald-400 focus:ring-emerald-500"
                                        checked={checked}
                                        onChange={() => togglePeripheral(option)}
                                      />
                                      <span>{option}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            ) : options ? (
                              // Ensure the existing value remains selectable even if it's not in the static options list
                              (() => {
                                const uniqueOptions =
                                  Array.isArray(options) && options.length > 0
                                    ? options.slice()
                                    : []

                                if (
                                  value &&
                                  !uniqueOptions.includes(value)
                                ) {
                                  uniqueOptions.unshift(value)
                                }

                                return (
                              <select
                                value={value}
                                onChange={handleChange}
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select {column.label}</option>
                                {uniqueOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                                )
                              })()
                            ) : (
                              <input
                                type={isDateField ? 'date' : 'text'}
                                value={value}
                                onChange={handleChange}
                                style={buildInputStyle(column, value, isDateField)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              />
                            )
                          ) : (
                            renderValue(row[column.key])
                          )}
                        </td>
                      )
                    })}
                    {showEditControls && (
                      <td className="px-4 py-3 text-right">
                      <div className="flex flex-col gap-2 text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => onSaveRow(row)}
                          disabled={savingId === row._id || Boolean(rowError)}
                          className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {row._id.startsWith('temp-') ? 'Save' : 'Update'}
                        </button>
                        {canDelete && row._id && !row._id.startsWith('temp-') ? (
                          <button
                            type="button"
                            onClick={() => onDeleteRow(row)}
                            className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-300 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        ) : null}
                        {rowError ? (
                          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-red-400">
                            {rowError}
                          </p>
                        ) : null}
                      </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

