import mongoose from 'mongoose'
import { Employee } from '../models/Employee.js'
import { Department } from '../models/Department.js'

export async function listEmployees(req, res, next) {
  try {
    const { department: departmentId } = req.query
    const filter = {}

    if (departmentId) {
      if (!mongoose.isValidObjectId(departmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department id.',
        })
      }

      if (
        req.user.role === 'HOD' &&
        String(req.user.department) !== String(departmentId)
      ) {
        return res.status(403).json({
          success: false,
          message: 'You can only view employees in your department.',
        })
      }

      filter.department = departmentId
    } else if (req.user.role === 'HOD') {
      filter.department = req.user.department
    }

    const employees = await Employee.find(filter)
      .populate('department', 'name code')
      .lean()

    return res.json({
      success: true,
      data: employees,
    })
  } catch (error) {
    return next(error)
  }
}

export async function seedEmployees(req, res, next) {
  try {
    const { employees = [] } = req.body

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide an array of employees to seed.',
      })
    }

    const docs = []

    for (const employee of employees) {
      if (!employee.empId || !employee.name || !employee.department) {
        return res.status(400).json({
          success: false,
          message:
            'Each employee must include empId, name, and department identifiers.',
        })
      }

      if (!mongoose.isValidObjectId(employee.department)) {
        return res.status(400).json({
          success: false,
          message: `Invalid department id for employee ${employee.empId}.`,
        })
      }

      const departmentExists = await Department.exists({
        _id: employee.department,
      })
      if (!departmentExists) {
        return res.status(400).json({
          success: false,
          message: `Department not found for employee ${employee.empId}.`,
        })
      }

      docs.push({
        empId: employee.empId,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
        email: employee.email,
      })
    }

    const created = await Employee.insertMany(docs, { ordered: false })

    return res.status(201).json({
      success: true,
      data: created,
    })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate employee records detected.',
        details: error.keyValue,
      })
    }
    return next(error)
  }
}

