const DATE_FIELDS = new Set(['doj', 'doe'])
const DEFAULT_COLUMN_WIDTH = 160
const MAX_INPUT_WIDTH = 640
const CHAR_PIXEL_WIDTH = 9
const EXTRA_PADDING = 32

const TOP_DEPARTMENT_OPTIONS = [
  '10xIIT',
  'Academy Student Success',
  'AS - Program Registration Expert',
  'B2B Partnership',
  'Brand Marketing',
  'Business Operations',
  'CD - Curriculum Development',
  'Content and Curriculum Development: Aptitude, English and Assessments',
  'Content Development',
  'CT',
  'Data Science and Machine Learning',
  'Design Studio',
  'Finance & Legal',
  "Founder's Office",
  'GenAI Social Media',
  'HR - Human Resources',
  'HR - Talent Acquisition',
  'Intensive Student Success',
  'Internal Audit',
  'NIAT Hostel Facilities Team',
  'NIAT_Academics',
  'NIFA',
  'NxtWave Abroad',
  'NxtWave Edge - Colleges',
  'Placement Success Management',
  'Placement Support Team',
  'Pre Sales',
  'Product',
  'QR - Query Resolution',
  'Sales',
  'Student Success',
  'Tech Team',
  'University Partnerships',
  'Video House',
]

const DEPARTMENT_OPTIONS = TOP_DEPARTMENT_OPTIONS

const HOD_OPTIONS = [
  'Srikar Naidu Edumudi (NW0001283)',
  'Vamshi Gadagoju (NW0001169)',
  'Anil Kumar Ganguri (NW0000311)',
  'Mansoor Valli Gangupalli (NW0000320)',
  'Girish Akash Yeshwanth Karri (NW0000306)',
  'Nikita Aggarwal (NW0001916)',
  'Shivam Singh (NW0001089)',
  'Pavan Gangireddy (NW0002526)',
  'Sai teja Manchukanti',
  'Sashank Reddy Gujjula (NW0000002)',
  'Rahul Attuluri (NW0000001)',
  'Rushikesh Konapure (NW0005433)',
  'Akhil Jogiparthi (NW0000305)',
  'Aman Maheshwari (NW0003000)',
  'Penmetsa Anirudh Varma (NW0003518)',
  'Devansh Mohata (NW0002722)',
  'Megha Ahuja (NW0002812)',
  'Rahul Yenninti (NW0001673)',
  'Bala Bhaskar Reddy Dodda (NW0001170)',
  'Radha Alekhya Kommanaboina (NW0001565)',
  'Munagala Varun Reddy (NW0002247)',
  'Divya Sri Nandigam (NW0001670)',
  'Brahma Reddy Karumuru (NW0001637)',
  'Hari Haran Gorijavola (NW0000390)',
  'Aniketh Mustoor (NW0000307)',
  'Sashank K (NW0002724)',
  'Venkata Abhinav Devaguptapu (NW0000351)',
  'Sai Teja Manchukanti (NW0000352)',
  'Kompella Sai Manvish (NW0005113)',
  'Pavan Reddy Dharma (NW0001171)',
  'Shiva Shanker Reddy Devasani (NW0000302)',
  'Vishnu Vamsi Vardhan Tallam (NW0000088)',
  'Kadari Hari Krishna (NW0005153)',
  'Revanth Gopi Konakanchi (NW0000075)',
  'Tathagat Bisoyi (NW0003607)',
  'Kumar Verma (NW0001266)',
  'Sai Sumanth Reddy Gattikoppula (NW0000301)',
  'Karthik Reddy Vummadi (NW0000308)',
  'Joiet Joseph (NW0002644)',
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

const WORK_LOCATION_OPTIONS = [
  'Brigade Towers: Ground Floor - East Wing',
  'Brigade Towers: First Floor - East Wing',
  'Brigade Towers: Second Floor - East Wing',
  'Brigade Towers: Fourth Floor - East Wing',
  'Brigade Towers: Fourth Floor - West Wing',
  'Kapil Kavuri Hub - First Floor',
  'Kapil Kavuri Hub - Fifth Floor',
  'Kapil Kavuri Hub - Ninth Floor (ALT F)',
  'iSprout',
  'Sohini Techpark',
  'Pune - Experience Center',
  'Bangalore - NxtWave Office',
  'Chennai - NxtWave Office',
  'The Hive',
  'AMET',
  'Annamacharya University',
  'CIET & CITY - Chalapathi',
  'Delhi - NxtWave Office',
  'Jaipur - NxtWave Office',
  'Yenepoya',
  'Vijayawada - Experience Center',
  'Tirupati - Experience Center',
  'Kadapa - Experience Center',
  'Anantapur - Experience Center',
  'Noida International University',
  'Vivekananda Global University',
  'A Dy Patil University',
  'Sanjay Ghodawat University',
  'S-Vyasa University',
  'Crescent University',
  'Takshasila University',
  'NRI',
  'NSRIT',
  'Chaitanya Deemed University',
  'BITS',
  'Malla Reddy Vishwavidyapeeth',
  'Aurora University',
  'BITTS Bilani University',
  'KFinTech',
  'Office - We Work',
]

const EMPLOYMENT_TYPE_OPTIONS = [
  'Employee',
  'Freelancer',
  'Internship',
  'Intern + Employee',
  'Consultant',
  'Consultant + Employee',
]

const PRODUCT_DOMAIN_OPTIONS = [
  'Academy',
  'Intensive',
  'NIAT',
  'NAIT',
  'Operations',
  'Technology',
  'Other',
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

const FIELD_OPTIONS = {
  workMode: ['WFO', 'WFH', 'Hybrid'],
  type: ['New Hire', 'Replacement', 'Backfill'],
  topDepartment: TOP_DEPARTMENT_OPTIONS,
  departmentLabel: DEPARTMENT_OPTIONS,
  sourceDepartment: DEPARTMENT_OPTIONS,
  beneficiaryDepartment: DEPARTMENT_OPTIONS,
  workLocation: WORK_LOCATION_OPTIONS,
  employmentType: EMPLOYMENT_TYPE_OPTIONS,
  productOrDomain: PRODUCT_DOMAIN_OPTIONS,
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

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/80 shadow-2xl shadow-black/30">
      <div className="overflow-x-auto">
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

                        onFieldChange(row._id, column.key, newValue)
                      }

                      return (
                        <td key={column.key} className="px-4 py-3 align-top text-sm text-slate-200">
                          {showEditControls ? (
                            options ? (
                              <select
                                value={value}
                                onChange={handleChange}
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select {column.label}</option>
                                {options.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
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

