function notFound(request, response) {
  response.status(404).json({
    message: 'Route or static file not found.',
    path: request.originalUrl,
  })
}

module.exports = notFound
