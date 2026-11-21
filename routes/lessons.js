const express = require('express')
const { ObjectId } = require('mongodb')
const { getDatabase } = require('../db')

const router = express.Router()

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET /lessons/search supports text, price range, and availability filters.
router.get('/search', async (request, response) => {
  const filter = {}
  const conditions = []
  const searchText = String(request.query.q || '').trim()
  const title = String(request.query.title || '').trim()
  const location = String(request.query.location || '').trim()

  if (searchText) {
    const safeText = escapeRegularExpression(searchText)
    conditions.push({
      $or: [
        { title: { $regex: safeText, $options: 'i' } },
        { subject: { $regex: safeText, $options: 'i' } },
        { location: { $regex: safeText, $options: 'i' } },
      ],
    })
  }

  if (title) {
    conditions.push({ title: { $regex: escapeRegularExpression(title), $options: 'i' } })
  }

  if (location) {
    conditions.push({ location: { $regex: escapeRegularExpression(location), $options: 'i' } })
  }

  const minPrice = request.query.minPrice === undefined ? undefined : Number(request.query.minPrice)
  const maxPrice = request.query.maxPrice === undefined ? undefined : Number(request.query.maxPrice)

  if ((minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0))) {
    const error = new Error('minPrice and maxPrice must be non-negative numbers.')
    error.status = 400
    throw error
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {}
    if (minPrice !== undefined) filter.price.$gte = minPrice
    if (maxPrice !== undefined) filter.price.$lte = maxPrice
  }

  if (request.query.available === 'true' || request.query.available === '1') {
    filter.spaces = { $gt: 0 }
  } else if (request.query.available === 'false' || request.query.available === '0') {
    filter.spaces = 0
  }

  if (conditions.length > 0) filter.$and = conditions

  const lessons = await getDatabase()
    .collection('lessons')
    .find(filter)
    .toArray()

  response.json(lessons)
})

// GET /lessons returns the complete catalogue from Atlas.
router.get('/', async (request, response) => {
  const lessons = await getDatabase()
    .collection('lessons')
    .find({})
    .toArray()

  response.json(lessons)
})

// PUT /lessons/:id applies one or more supplied lesson attributes.
router.put('/:id', async (request, response) => {
  const { id } = request.params
  const updates = request.body
  const editableFields = new Set([
    'title', 'subject', 'location', 'price', 'spaces', 'icon', 'tone', 'label', 'time', 'image', 'teacherId',
  ])

  if (!ObjectId.isValid(id)) {
    const error = new Error('The lesson id must be a valid MongoDB id.')
    error.status = 400
    throw error
  }

  if (!updates || typeof updates !== 'object' || Array.isArray(updates) || Object.keys(updates).length === 0) {
    const error = new Error('Provide one or more lesson attributes to update.')
    error.status = 400
    throw error
  }

  for (const [field, value] of Object.entries(updates)) {
    if (!editableFields.has(field)) {
      const error = new Error(`The ${field} attribute cannot be updated.`)
      error.status = 400
      throw error
    }

    if (field === 'price' || field === 'spaces') {
      const isValidNumber = Number.isFinite(value) && value >= 0
      const isValidSpaces = field !== 'spaces' || Number.isInteger(value)
      if (!isValidNumber || !isValidSpaces) {
        const error = new Error(`${field} must be a non-negative ${field === 'spaces' ? 'whole number' : 'number'}.`)
        error.status = 400
        throw error
      }
    } else if (typeof value !== 'string' || value.trim() === '') {
      const error = new Error(`${field} must be a non-empty string.`)
      error.status = 400
      throw error
    }
  }

  const lessons = getDatabase().collection('lessons')
  const result = await lessons.updateOne({ _id: new ObjectId(id) }, { $set: updates })

  if (result.matchedCount === 0) {
    const error = new Error('No lesson was found with that id.')
    error.status = 404
    throw error
  }

  const lesson = await lessons.findOne({ _id: new ObjectId(id) })
  response.json({ message: 'Lesson updated.', lesson })
})

module.exports = router
