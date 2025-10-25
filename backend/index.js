const express = require('express')
//const dayjs = require("dayjs")
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./modules/person')

require('dotenv').config()


morgan.token('body', (req) => {
  return req.method === 'POST' ? JSON.stringify(req.body) : ''
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  else if (error.name == 'ValidationError'){
    return response.status(400).json({error: error.message})
  } 

  next(error)
}


app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] :response-time ms :body'))
app.use(express.static('dist'))
app.use(cors())

console.log('hello world')
//api calls go here

//ex. app.get('/repository')








//api calls end here
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
