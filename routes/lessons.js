const express = require('express')
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

module.exports = router
