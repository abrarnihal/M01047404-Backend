const express = require('express')
const { getDatabase } = require('../db')

const router = express.Router()

// GET /lessons returns the complete catalogue from Atlas.
router.get('/', async (request, response) => {
  const lessons = await getDatabase()
    .collection('lessons')
    .find({})
    .toArray()

  response.json(lessons)
})

module.exports = router
