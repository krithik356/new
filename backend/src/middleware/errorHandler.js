export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'Resource not found.',
    path: req.originalUrl,
  })
}

export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err)

  if (res.headersSent) {
    return next(err)
  }

  const statusCode = err.statusCode ?? err.status ?? 500

  return res.status(statusCode).json({
    success: false,
    message: err.message ?? 'Internal server error.',
    details: err.details ?? undefined,
  })
}

