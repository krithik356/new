import mongoose from 'mongoose'
import { Contribution } from '../models/Contribution.js'
import { Department } from '../models/Department.js'
import { validateContributionPayload } from '../utils/validators.js'

export async function listContributions(req, res, next) {
  try {
    const { cycle } = req.query
    const filter = {}

    if (cycle) {
      filter.cycle = cycle
    }
    const contributions = await Contribution.find(filter)
      .populate({
        path: 'department',
        select: 'name code hod',
        populate: {
          path: 'hod',
          select: 'name email',
        },
      })
      .populate('submittedBy', 'name email role')
      .sort({ submittedAt: -1 })

    return res.json({
      success: true,
      data: contributions,
    })
  } catch (error) {
    return next(error)
  }
}

export async function getContributionByDepartment(req, res, next) {
  try {
    const { departmentId } = req.params

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
        message: 'You can only view your own department contribution.',
      })
    }

    const contribution = await Contribution.findOne({ department: departmentId })
      .populate('department', 'name code')
      .populate('submittedBy', 'name email role')

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found for this department.',
      })
    }

    return res.json({
      success: true,
      data: contribution,
    })
  } catch (error) {
    return next(error)
  }
}

export async function createContribution(req, res, next) {
  try {
    const { department, academy, intensive, niat, remarks, cycle } = req.body

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department is required.',
      })
    }

    if (req.user.role === 'HOD' && String(req.user.department) !== department) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit contributions for your department.',
      })
    }

    if (!mongoose.isValidObjectId(department)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department id.',
      })
    }

    const departmentExists = await Department.findById(department)
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      })
    }

    const { ok, errors } = validateContributionPayload({
      academy,
      intensive,
      niat,
    })

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: 'Contribution validation failed.',
        errors,
      })
    }

    const cycleKey = cycle ?? 'default'

    const existing = await Contribution.findOne({
      department,
      cycle: cycleKey,
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          'Contribution for this department and cycle already exists. Use the update endpoint instead.',
        data: existing,
      })
    }

    const contribution = await Contribution.create({
      department,
      academy,
      intensive,
      niat,
      remarks,
      cycle: cycleKey,
      submittedBy: req.user.id,
      submittedAt: new Date(),
    })

    const populated = await contribution
      .populate('department', 'name code')
      .populate('submittedBy', 'name email role')

    return res.status(201).json({
      success: true,
      data: populated,
    })
  } catch (error) {
    return next(error)
  }
}

export async function updateContribution(req, res, next) {
  try {
    const { id } = req.params
    const { academy, intensive, niat, remarks, cycle } = req.body

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contribution id.',
      })
    }

    const contribution = await Contribution.findById(id)

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found.',
      })
    }

    if (
      req.user.role === 'HOD' &&
      String(req.user.department) !== String(contribution.department)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only update contributions for your department.',
      })
    }

    const payload = {
      academy: academy ?? contribution.academy,
      intensive: intensive ?? contribution.intensive,
      niat: niat ?? contribution.niat,
    }

    const { ok, errors } = validateContributionPayload(payload)

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: 'Contribution validation failed.',
        errors,
      })
    }

    contribution.academy = payload.academy
    contribution.intensive = payload.intensive
    contribution.niat = payload.niat
    contribution.remarks = remarks ?? contribution.remarks
    contribution.cycle = cycle ?? contribution.cycle
    contribution.submittedBy = req.user.id
    contribution.submittedAt = new Date()

    await contribution.save()

    const populated = await contribution
      .populate('department', 'name code')
      .populate('submittedBy', 'name email role')

    return res.json({
      success: true,
      data: populated,
    })
  } catch (error) {
    return next(error)
  }
}

export async function deleteContribution(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contribution id.',
      })
    }

    const contribution = await Contribution.findById(id)

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found.',
      })
    }

    await Contribution.deleteOne({ _id: id })

    return res.json({
      success: true,
      message: 'Contribution deleted successfully.',
    })
  } catch (error) {
    return next(error)
  }
}

