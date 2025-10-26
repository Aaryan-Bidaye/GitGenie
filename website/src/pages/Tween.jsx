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
        const existsResponse = await axios.get(`${baseURL}/${repo.split("/").join("@")}/${commit.sha}`);
        if (existsResponse.status === 200) {
          console.log("already exists");
          continue;
        }
        try {
          console.log('Processing commit:', commit.sha)
          /*const commitData = await axios.get(
            `https://api.github.com/repos/${repo}/commits/${commit.sha}`,
            { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
          )*/
          const commitData = await axios.post(`${baseURL}/api/github`, {repo: repo,sha: commit.sha});
          const commitChanges = commitData.data.files
          const analysis = await axios.post('/api/analyzeCommit', { commitChanges })
          const { impact, summary, body } = analysis.data
          const data = {
            repository: repo.split("/").join("@"),
            username: commit.author.login,
            date: commit.author.date,
            sha: commit.sha,
            summary: summary,
            body: body,
            impact: impact
          };          
          axios.post(baseURL, data)
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
    }

    analyzeCommits()
    navigate('/dashboard', {state: {repo: repo}})
  }, [repo, data, navigate])

  return <>{loading ? <p>Analyzing repository...</p> : <p>Analysis complete!</p>}</>
}

export default Tween