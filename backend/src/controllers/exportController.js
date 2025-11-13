import { Contribution } from '../models/Contribution.js'
import { buildContributionWorkbook } from '../utils/excelExporter.js'

export async function exportContributions(req, res, next) {
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
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: -1 })

    const workbook = await buildContributionWorkbook(contributions, {
      sheetName: cycle ? `Contributions ${cycle}` : 'Contributions',
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `contributions_${cycle ?? 'all'}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    return res.send(buffer)
  } catch (error) {
    return next(error)
  }
}

