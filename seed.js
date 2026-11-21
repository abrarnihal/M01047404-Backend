require('dotenv').config()

const { closeDatabase, connectToDatabase } = require('./db')
const lessonSeed = require('./data/lessons')
const teacherSeed = require('./data/teachers')

async function seedCollection(collection, records, collectionName) {
  const existingCount = await collection.countDocuments()

  if (existingCount > 0) {
    console.log(`${collectionName} already has ${existingCount} record(s); leaving it unchanged.`)
    return
  }

  await collection.insertMany(records)
  console.log(`Added ${records.length} ${collectionName} record(s).`)
}

async function seedDatabase() {
  try {
    const database = await connectToDatabase()
    await seedCollection(database.collection('teacher'), teacherSeed, 'teachers')
    await seedCollection(database.collection('lesson'), lessonSeed, 'lessons')
  } finally {
    await closeDatabase()
  }
}

seedDatabase().catch((error) => {
  console.error('Could not seed Atlas:', error.message)
  process.exitCode = 1
})
