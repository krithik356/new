/* eslint-disable no-console */

const { connectDB, disconnectDB } = require('../src/config/db');
const { Department } = require('../src/models/Department');

const DEPARTMENT_NAMES = [
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
];

async function resetDepartments() {
  await connectDB();

  console.log('Clearing existing departments…');
  await Department.deleteMany({});

  console.log('Inserting new departments…');
  const docs = DEPARTMENT_NAMES.map((name) => ({
    name,
    code: name,
  }));

  await Department.insertMany(docs);

  console.log(`Inserted ${docs.length} departments.`);
  await disconnectDB();
}

resetDepartments()
  .then(() => {
    console.log('Department reset complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to reset departments:', error);
    disconnectDB().finally(() => process.exit(1));
  });


