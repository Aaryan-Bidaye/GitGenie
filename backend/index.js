const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const {getCommitModel } = require('./modules/commit')

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

// GET endpoint for api/:repository/:sha
app.get('/api/:repository/:sha', async (req, res) => {
  try {
    const { repository, sha } = req.params
    const CommitModel = getCommitModel(repository)
    const commit = await CommitModel.findOne({ sha: sha })
    if (!commit) {
      return res.status(404).json({ error: 'Commit not found', repository, sha })
    }
    res.json({
      repository,
      sha,
      commit: {
        username: commit.username,
        sha: commit.sha,
        summary: commit.summary,
        impact: commit.impact,
      },
    })
  } catch (error) {
    console.error('Error fetching commit:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
})

app.post('/api', async (req, res) => {
  //const { repository } = req.params
  const repository = req.body.repository
  const CommitModel = getCommitModel(repository)
  const body = req.body
  const commit = new CommitModel({
    username: body.username,
    sha: body.sha,
    date: body.date,
    summary: body.summary,
    impact: body.impact,
  })
  commit.save() 
  .then(savedCommit => {
    res.status(201).json(savedCommit)
  })
  .catch(error => next(error))
})
//ex. app.get('/repository')








//api calls end here
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
