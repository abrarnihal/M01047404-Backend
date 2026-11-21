require('dotenv').config()

const { closeDatabase, connectToDatabase } = require('./db')
const lessonSeed = require('./data/lessons')
const teacherSeed = require('./data/teachers')

async function collectionExists(database, name) {
  return database.listCollections({ name }, { nameOnly: true }).hasNext()
}

async function migrateLegacyCollections(database) {
  const collectionNames = [
    ['lesson', 'lessons'],
    ['order', 'orders'],
    ['teacher', 'teachers'],
  ]

  for (const [legacyName, pluralName] of collectionNames) {
    const [hasLegacy, hasPlural] = await Promise.all([
      collectionExists(database, legacyName),
      collectionExists(database, pluralName),
    ])

    if (hasLegacy) {
      const legacyCollection = database.collection(legacyName)
      const pluralCollection = database.collection(pluralName)
      const records = await legacyCollection.find({}).toArray()

      if (records.length > 0) {
        const recordIds = records.map(({ _id }) => _id)
        const existingRecords = hasPlural
          ? await pluralCollection.find({ _id: { $in: recordIds } }, { projection: { _id: 1 } }).toArray()
          : []
        const existingIds = new Set(existingRecords.map(({ _id }) => _id.toString()))
        const missingRecords = records.filter(({ _id }) => !existingIds.has(_id.toString()))

        if (missingRecords.length > 0) await pluralCollection.insertMany(missingRecords)

        const migratedRecords = await pluralCollection
          .find({ _id: { $in: recordIds } }, { projection: { _id: 1 } })
          .toArray()
        if (migratedRecords.length !== records.length) {
          throw new Error(`Could not verify all ${legacyName} records in ${pluralName}.`)
        }

        await legacyCollection.deleteMany({})
        console.log(`Migrated ${records.length} records from ${legacyName} to ${pluralName}.`)
      }

      try {
        await legacyCollection.drop()
        console.log(`Removed empty legacy ${legacyName} collection.`)
      } catch (error) {
        if (error.codeName !== 'Unauthorized' && error.code !== 13) throw error
        console.log(`Legacy ${legacyName} collection is empty; Atlas kept its old name because the database user cannot drop collections.`)
      }
    }
  }
}

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
    await migrateLegacyCollections(database)
    await seedCollection(database.collection('teachers'), teacherSeed, 'teachers')
    await seedCollection(database.collection('lessons'), lessonSeed, 'lessons')
  } finally {
    await closeDatabase()
  }
}

seedDatabase().catch((error) => {
  console.error('Could not seed Atlas:', error.message)
  process.exitCode = 1
})

