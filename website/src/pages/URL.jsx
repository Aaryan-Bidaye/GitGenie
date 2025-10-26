import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const baseUrl = '/api'

function getRepoName(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  return null;
}

function Search() {
  const [URL, setURL] = useState('')
  const navigate = useNavigate()

  const handleURLChange = (event) => setURL(event.target.value)

  const parseDirectory = (event) => {
    event.preventDefault()
    const repoName = getRepoName(URL)
    axios.get(`https://api.github.com/repos/${repoName}/commits`)
      .then(response => {
        console.log(response.data);
        navigate('dashboard', {state: {repo: repoName}})
      })
      .catch(error => {
        console.log('request error')
        console.log(error)
      })
  }

  return (
    <div className="page-root">
      <header className="topbar">
        <div className="brand" onClick={()=>console.log("Home")}>GitGenie</div>
      </header>

      <div className="center-wrap">
        <div className="card">
          <h1>Analyze repository contributions</h1>
          <div className="subtitle">Paste a GitHub repository URL to rank user involvement.</div>

          <form className="search-form" onSubmit={parseDirectory}>
            <input
              className="url-input"
              type="text"
              value={URL}
              onChange={handleURLChange}
              placeholder="https://github.com/owner/repository"
              aria-label="GitHub repository URL"
            />
            <button className="btn-card" type="submit">Analyze</button>
          </form>

          <div className="subtitle">No sign-in required. Data is fetched from the public GitHub API (rate-limited).</div>
        </div>
      </div>
    </div>
  )
}

export default Search
