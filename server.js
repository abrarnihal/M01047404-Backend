require('dotenv').config()

const express = require('express')
const path = require('node:path')
const { closeDatabase, connectToDatabase } = require('./db')
const errorHandler = require('./middleware/error-handler')
const enrolmentRoutes = require('./routes/enrolment')
const notFound = require('./middleware/not-found')
const requestLogger = require('./middleware/request-logger')
const lessonRoutes = require('./routes/lessons')
const orderRoutes = require('./routes/orders')
const teacherRoutes = require('./routes/teachers')

const app = express()

function addCorsHeaders(request, response, next) {
  const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://abrarnihal.github.io',
    ...configuredOrigins,
  ])
  const origin = request.headers.origin

  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
  }

  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    return response.sendStatus(204)
  }

  next()
}

app.use(requestLogger)
app.use(addCorsHeaders)
app.use(express.json())
app.use('/lesson-images', express.static(path.join(__dirname, 'public', 'lesson-images')))
app.use('/lesson-images', (request, response) => {
  response.status(404).json({ message: 'Lesson image not found.', path: request.originalUrl })
})

app.get('/health', (request, response) => {
  response.json({ status: 'ok', service: 'BrightSteps coursework API' })
})
app.use('/lessons', lessonRoutes)
app.use('/orders', orderRoutes)
app.use('/teachers', teacherRoutes)
app.use('/enrolment', enrolmentRoutes)
app.use(notFound)
app.use(errorHandler)

async function startServer() {
  await connectToDatabase()
  const port = Number(process.env.PORT) || 3000
  const server = app.listen(port, () => {
    console.log(`BrightSteps API listening on port ${port}`)
  })

  async function stopServer() {
    server.close(async () => {
      await closeDatabase()
      process.exit(0)
    })
  }

  process.once('SIGINT', stopServer)
  process.once('SIGTERM', stopServer)
}

if (require.main === module) {
  startServer().catch(async (error) => {
    console.error('Could not start the API:', error.message)
    await closeDatabase()
    process.exitCode = 1
  })
}

module.exports = app
