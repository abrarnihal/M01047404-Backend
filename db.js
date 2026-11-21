const { MongoClient } = require('mongodb')

let client
let database

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add your Atlas connection string to the local .env file or Render environment.')
  }

  client = new MongoClient(uri)
  await client.connect()
  database = client.db(process.env.DB_NAME || 'brightsteps')

  return database
}

function getDatabase() {
  if (!database) {
    throw new Error('The database is not connected yet.')
  }

  return database
}

async function closeDatabase() {
  if (client) {
    await client.close()
    client = undefined
    database = undefined
  }
}

module.exports = { connectToDatabase, getDatabase, closeDatabase }
