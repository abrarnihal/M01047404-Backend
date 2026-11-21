function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error)
  }

  const status = error.status || 500
  console.error(`${request.method} ${request.originalUrl}:`, error.message)
  response.status(status).json({
    message: status === 500 ? 'The server could not complete the request.' : error.message,
  })
}

module.exports = errorHandler
