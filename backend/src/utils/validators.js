export function validateContributionPayload(body) {
  const errors = []
  const fields = ['academy', 'intensive', 'niat']

  fields.forEach((field) => {
    const value = Number(body[field])
    if (Number.isNaN(value)) {
      errors.push({ field, message: `${field} must be a number.` })
      return
    }

    if (value < 0 || value > 100) {
      errors.push({
        field,
        message: `${field} must be between 0 and 100.`,
      })
    }
  })

  const sum =
    Number(body.academy ?? 0) +
    Number(body.intensive ?? 0) +
    Number(body.niat ?? 0)

  if (Math.abs(sum - 100) > 1e-6) {
    errors.push({
      field: 'total',
      message: 'Contribution totals must equal 100.',
    })
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

