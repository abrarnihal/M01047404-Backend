function requestLogger(request, response, next) {
  const startedAt = new Date().toISOString()
  console.log(`${startedAt} ${request.method} ${request.originalUrl}`)
  next()
}

module.exports = requestLogger
