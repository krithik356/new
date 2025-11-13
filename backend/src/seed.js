import 'dotenv/config'
import bcrypt from 'bcrypt'
import { connectDB, disconnectDB } from './config/db.js'
import { Department } from './models/Department.js'
import { User } from './models/User.js'
import { Employee } from './models/Employee.js'
import { Contribution } from './models/Contribution.js'

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10)

const departmentsSeed = [
  { name: 'Engineering', code: 'ENG' },
  { name: 'Marketing', code: 'MKT' },
  { name: 'Finance', code: 'FIN' },
]

async function run() {
  await connectDB()

  console.log('Clearing existing collections...')
  await Promise.all([
    Contribution.deleteMany({}),
    Employee.deleteMany({}),
    User.deleteMany({}),
    Department.deleteMany({}),
  ])

  console.log('Seeding departments...')
  const departments = await Department.insertMany(departmentsSeed)

  console.log('Creating users...')
  const adminPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS)
  const adminUser = await User.create({
    name: 'System Admin',
    email: 'admin@organization.com',
    passwordHash: adminPassword,
    role: 'Admin',
    department: null,
  })

  const hodUsers = []
  for (const department of departments) {
    const passwordHash = await bcrypt.hash(`${department.code ?? 'dept'}@123`, SALT_ROUNDS)
    const hod = await User.create({
      name: `${department.name} HOD`,
      email: `${department.code?.toLowerCase() ?? department.name.toLowerCase()}_hod@organization.com`,
      passwordHash,
      role: 'HOD',
      department: department._id,
    })
    department.hod = hod._id
    await department.save()
    hodUsers.push(hod)
  }

  console.log('Seeding employees...')
  const employeeDocs = []
  hodUsers.forEach((hod, index) => {
    const dept = departments[index]
    for (let i = 1; i <= 3; i += 1) {
      employeeDocs.push({
        empId: `${dept.code ?? 'DEPT'}-${i}`,
        name: `${dept.name} Employee ${i}`,
        department: dept._id,
        designation: 'Team Member',
        email: `${dept.code?.toLowerCase() ?? dept.name.toLowerCase()}${i}@organization.com`,
      })
    }
  })
  await Employee.insertMany(employeeDocs)

  console.log('Seeding starter contributions...')
  await Contribution.insertMany(
    departments.map((dept, index) => ({
      department: dept._id,
      academy: 40,
      intensive: 30,
      niat: 30,
      cycle: '2025-Q4',
      remarks: 'Initial allocation',
      submittedBy: hodUsers[index]._id,
      submittedAt: new Date(),
    }))
  )

  console.log('Seed data created successfully.')
  console.log({
    admin: {
      email: adminUser.email,
      password: 'Admin@123',
    },
    hods: hodUsers.map((hod, idx) => ({
      email: hod.email,
      password: `${departments[idx].code ?? 'dept'}@123`,
    })),
  })

  await disconnectDB()
}

run()
  .then(() => {
    console.log('Seeding complete.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })

