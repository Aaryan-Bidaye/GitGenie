import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'


const baseURL = '/api'

function Tween() {
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const { repo, data } = location.state || {}

  useEffect(() => {
    const isMissingRepo =
      !repo ||
      (typeof repo === 'string' && repo.trim() === '') ||
      (typeof repo === 'object' && Object.keys(repo).length === 0)
    if (isMissingRepo) {
      navigate('/')
      return
    }

    const analyzeCommits = async () => {
      for (const commit of data) {
  let exists = false
  try {
    const existsResponse = await axios.get(`${baseURL}/${repo.split("/").join("@")}/${commit.sha}`)
    if (existsResponse.status === 200) exists = true
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log("Collection or document not found — creating new one.")
    } else {
      console.error("Error checking existence:", err)
      continue // skip or handle differently
    }
  }

  if (exists) {
    console.log("already exists")
    continue
  }
        try {
          console.log('Processing commit:', commit.sha)
          /*const commitData = await axios.get(
            `https://api.github.com/repos/${repo}/commits/${commit.sha}`,
            { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
          )*/
          const commitData = await axios.post(`${baseURL}/github`, {repo: repo,sha: commit.sha});
          const commitChanges = commitData.data.files
          const analysis = await axios.post(`${baseURL}/analyzeCommit`, { commitChanges })
          const { impact, summary, body } = analysis.data
          const data = {
            repository: repo.split("/").join("@"),
            username: commit.author.login,
            pfp: commit.author.avatar_url,
            date: commit.author.date,
            sha: commit.sha,
            summary: summary,
            body: body,
            impact: impact
          };          
          await axios.post(baseURL, data)
          .then(response => {
            console.log("success!")
            console.log(response)
          })
          .catch(error => {
            console.log("something went wrong posting")
            console.log(error)
          })
        } catch (err) {
          console.error('Something went wrong with the analysis:', err)
          break
        }
      }
      setLoading(false)
      navigate('/dashboard', {state: {repo: repo}})
    }
    analyzeCommits()
  }, [repo, data, navigate])

  return <>{loading ? <p>Analyzing repository...</p> : <p>Analysis complete!</p>}</>
}

export default Tween