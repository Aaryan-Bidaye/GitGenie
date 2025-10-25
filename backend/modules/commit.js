require('dotenv').config()
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI

console.log('connecting to', url)
mongoose.connect(url)
  .then(result =>{
    console.log('connected to MongoDB')
  })
  .catch(error =>{
    console.log('error connecting to MongoDB:', error.message)
  })

mongoose.set('strictQuery',false)

const commitSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  sha: {
    type: String,
  },
  date: {
    type:String
  },
  body:{
    type:String,
  },
  summary: {
    type:String,
  },
  impact:{
    type:Number,
  }

})

commitSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

// Helper function to get a model for a specific collection
function getCommitModel(collectionName) {
  // reuse existing model if already compiled
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName]
  }
  // otherwise, create a new one bound to that collection
  return mongoose.model('Commit', commitSchema, collectionName)
}

module.exports = { getCommitModel }
//mongoDB setup
