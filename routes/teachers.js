const express = require('express')
const { getDatabase } = require('../db')

const router = express.Router()

// GET /teachers lists the teacher names and the number of linked lessons.
router.get('/', async (request, response) => {
  const database = getDatabase()
  const [teachers, lessonCounts] = await Promise.all([
    database.collection('teachers').find({}).toArray(),
    database.collection('lessons').aggregate([
      { $group: { _id: '$teacherId', count: { $sum: 1 } } },
    ]).toArray(),
  ])
  const countsByTeacher = new Map(lessonCounts.map((item) => [item._id, item.count]))

  response.json(teachers.map((teacher) => ({
    ...teacher,
    lessonCount: countsByTeacher.get(teacher.id) || 0,
  })))
})

// GET /teachers/:id/lessons returns one teacher with their linked catalogue records.
router.get('/:id/lessons', async (request, response) => {
  const database = getDatabase()
  const teacher = await database.collection('teachers').findOne({ id: request.params.id })

  if (!teacher) {
    const error = new Error('No teacher was found with that id.')
    error.status = 404
    throw error
  }

  const lessons = await database.collection('lessons')
    .find({ teacherId: teacher.id })
    .toArray()

  response.json({ teacher, lessons })
})

module.exports = router

