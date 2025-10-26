const express = require('express')
const axios = require('axios');
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const {getCommitModel } = require('./modules/commit')
const Anthropic = require('@anthropic-ai/sdk')
require('dotenv').config()
console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY)
console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length)
console.log('Anthropic SDK:', typeof Anthropic)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

console.log('Anthropic instance:', anthropic)
console.log('Has messages:', !!anthropic.messages)
console.log('Type of anthropic:', typeof anthropic)



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
app.post('/api/github', async (req, res) => {
  const repo = req.body.repo
  const sha = req.body.sha
  try {
    const response = await axios.get(`https://api.github.com/repos/${repo}/commits/${sha}`, {
       headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } 
    });
    res.json(response.data);
  }
  catch(error){
    console.log("couldn't fetch github")
    console.log(error)
  }
})
app.post('/api/analyzeCommit', async (req, res) => {
  const { commitChanges } = req.body
  
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are a commit ranking assistant. 
        Read the following commit message and rank its impact from 1–10. 
        return your answer in json format with fields for impact, and integer
        summary, a shorter string summary of the commits, and body, a more comprehensive 
        descriptions of changes under 45 words. Do not include any extraneous 
        characters that are NOT json
        commit changes here: ${JSON.stringify(commitChanges)}`
      }],
      tools: [{
        name: "CommitAnalysis",
        description: "Analyze a commit's impact",
        input_schema: {
          type: "object",
          properties: {
            impact: { 
              type: "integer",
              description: "Impact rating from 1-10"
            },
            summary: { 
              type: "string",
              description: "Brief summary of the commit"
            },
            body: { 
              type: "string",
              description: "Detailed analysis of the commit"
            },
          },
          required: ["impact", "summary", "body"]
        }
      }],
      tool_choice: { type: "tool", name: "CommitAnalysis" }
    })

    const toolUse = response.content.find(block => block.type === 'tool_use')
    res.json(toolUse.input)
  } catch (err) {
    console.error('Full error:', err)
    res.status(500).json({ error: "Anthropic API call failed", details: err.message })
  }
})

app.get('/api/:repository', async (req, res) => {
  try{
    const { repository } = req.params
    const CommitModel = getCommitModel(repository)
    const commits = await CommitModel.find({});
    res.json(commits);
  }
  catch (error) {
    console.error(`Error fetching commits for repo ${repository}`, error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
}) 

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
        pfp: commit.pfp,
        date: commit.date,
        summary: commit.summary,
        body: commit.body,
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
    pfp: body.pfp,
    sha: body.sha,
    date: body.date,
    body: body.body,
    summary: body.summary,
    impact: body.impact,
  })
  commit.save() 
  .then(savedCommit => {
    res.status(201).json(savedCommit)
  })
  .catch(error => next(error))
})


//api calls end here
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
