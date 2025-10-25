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

mongoose.connect(url)

const commitInfo = new mongoose.Schema({
  username: {
    type: String,
  },
  commit_id: {
    type: String,
  },
  summary: {
    type:String,
  },
  impact:{
    type:Number,
  }

})

commitInfo.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Person', phoneBookEntry)
//mongoDB setup
