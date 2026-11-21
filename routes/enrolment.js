const express = require('express')
const { ObjectId } = require('mongodb')
const { getDatabase } = require('../db')

const router = express.Router()

// GET /enrolment/:lessonid counts the reserved places for one lesson.
router.get('/:lessonid', async (request, response) => {
  const { lessonid } = request.params

  if (!ObjectId.isValid(lessonid)) {
    const error = new Error('The lesson id must be a valid MongoDB id.')
    error.status = 400
    throw error
  }

  const database = getDatabase()
  const lessonId = new ObjectId(lessonid)
  const lesson = await database.collection('lessons').findOne({ _id: lessonId })

  if (!lesson) {
    const error = new Error('No lesson was found with that id.')
    error.status = 404
    throw error
  }

  const orders = await database.collection('orders')
    .find({ lessonIDs: lessonId }, { projection: { lessonIDs: 1 } })
    .toArray()
  const enrolmentCount = orders.reduce((total, order) => (
    total + order.lessonIDs.filter((selectedId) => selectedId.equals(lessonId)).length
  ), 0)

  response.json({ lessonId, lessonTitle: lesson.title, enrolmentCount })
})

module.exports = router

