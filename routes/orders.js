const express = require('express')
const { ObjectId } = require('mongodb')
const { getDatabase } = require('../db')

const router = express.Router()

// POST /orders stores the customer details and one lesson id per reserved place.
router.post('/', async (request, response) => {
  const { name, phone, lessons } = request.body || {}

  if (typeof name !== 'string' || !/^[A-Za-z ]+$/.test(name.trim())) {
    const error = new Error('Name must contain only letters and spaces.')
    error.status = 400
    throw error
  }

  if (typeof phone !== 'string' || !/^\d+$/.test(phone.trim())) {
    const error = new Error('Phone must contain digits only.')
    error.status = 400
    throw error
  }

  if (!Array.isArray(lessons) || lessons.length === 0 || lessons.some((id) => !ObjectId.isValid(String(id)))) {
    const error = new Error('Choose at least one valid lesson before booking.')
    error.status = 400
    throw error
  }

  const lessonIds = lessons.map((id) => new ObjectId(String(id)))
  const uniqueIds = [...new Map(lessonIds.map((id) => [id.toString(), id])).values()]
  const lessonRecords = await getDatabase()
    .collection('lessons')
    .find({ _id: { $in: uniqueIds } })
    .toArray()

  if (lessonRecords.length !== uniqueIds.length) {
    const error = new Error('One or more selected lessons could not be found.')
    error.status = 400
    throw error
  }

  const requestedPlaces = new Map()
  for (const id of lessonIds) {
    const key = id.toString()
    requestedPlaces.set(key, (requestedPlaces.get(key) || 0) + 1)
  }

  for (const lesson of lessonRecords) {
    const places = requestedPlaces.get(lesson._id.toString())
    if (places > lesson.spaces) {
      const error = new Error(`${lesson.title} does not have enough spaces for this booking.`)
      error.status = 409
      throw error
    }
  }

  const order = {
    name: name.trim(),
    phone: phone.trim(),
    lessons: lessonIds,
    createdAt: new Date(),
  }
  const result = await getDatabase().collection('orders').insertOne(order)

  response.status(201).json({
    message: 'Booking request saved.',
    orderId: result.insertedId,
    order: { ...order, _id: result.insertedId },
  })
})

module.exports = router
