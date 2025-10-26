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
	const [isLoading, setIsLoading] = useState(false)
	const navigate = useNavigate()

	const handleURLChange = (event) => setURL(event.target.value)

	const parseDirectory = (event) => {
		event.preventDefault()
		setIsLoading(true)
		const repoName = getRepoName(URL)
		axios.get(`https://api.github.com/repos/${repoName}/commits`)
			.then(response => {
				console.log(response.data);
				navigate('analyzing', { state: { repo: repoName, data:response.data} })
			})
			.catch(error => {
				console.log('request error')
				console.log(error)
				setIsLoading(false)
			})
	}

	return (
		<div className="page-root">
			<div className="bg-gradient"></div>
			<div className="bg-orbs"></div>

			<header className="topbar">
				<div className="brand">
					<span className="brand-git">Git</span>
					<span className="brand-genie">Scribe</span>
					<div className="brand-sparkle">✨</div>
				</div>
			</header>

			<div className="center-wrap">
				<div className="content-container">
					<div className="card">
						<h1 className="card-title">Analyze repository contributions</h1>
						<div className="subtitle">Paste a GitHub repository URL to rank user involvement.</div>

						<form className="search-form" onSubmit={parseDirectory}>
							<div className="input-wrapper">
								<input
									className="url-input"
									type="text"
									value={URL}
									onChange={handleURLChange}
									placeholder="https://github.com/owner/repository"
									aria-label="GitHub repository URL"
								/>
								<div className="input-focus-border"></div>
							</div>
							<button className={`btn-card ${isLoading ? 'loading' : ''}`} type="submit" disabled={isLoading}>
								{isLoading ? (
									<>
										<span className="btn-spinner"></span>
										<span>Analyzing...</span>
									</>
								) : (
									<>
										<span>Analyze</span>
										<span className="btn-arrow">→</span>
									</>
								)}
							</button>
						</form>

						<div className="subtitle">No sign-in required. Data is fetched from the public GitHub API (rate-limited).</div>
					</div>

					<div className="info-cards">
						<div className="info-card">
							<div className="info-icon">📊</div>
							<h3 className="info-title">Contribution Analysis</h3>
							<p className="info-text">Get detailed insights into commit frequency, code changes, and developer activity across your repository.</p>
						</div>

						<div className="info-card">
							<div className="info-icon">👥</div>
							<h3 className="info-title">Team Insights</h3>
							<p className="info-text">Identify top contributors, track collaboration patterns, and understand team dynamics at a glance.</p>
						</div>

						<div className="info-card">
							<div className="info-icon">⚡</div>
							<h3 className="info-title">Real-time Data</h3>
							<p className="info-text">Powered by GitHub's API to fetch live repository data with no authentication required.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Search
