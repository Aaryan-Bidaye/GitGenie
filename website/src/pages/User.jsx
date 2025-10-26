import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

function UserData(){
    const navigate = useNavigate();
    const location = useLocation()
    const { user, commits,pfp, score } = location.state || {}
    console.log(pfp)
    console.log(commits)

    return(
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
            <h1>{user}</h1>

            <div className="center-wrap">
                <div className="card card-row">
                    <div className="left-box">
                        <img className="pfp" src={pfp} alt={user} />
                        <h2>Score: {score}<br/></h2>
                    </div>
                <div className = "right-box">
                    <h3>Recent Commits</h3>
                    <ul className="commit-list">
							{commits && commits.length > 0 ? (
								commits.map((commit, index) => (
									<li key={commit.sha || index} className="commit-item">
										<h3 className="commit-msg">{commit.summary || 'No message'}</h3>
                                        <p className="commit-msg">{commit.body || 'No message'}</p>
										<p className="commit-sha">{commit.sha?.slice(0, 7)}</p>
									</li>
								))
							) : (
								<p>No commits available.</p>
							)}
						</ul>
                </div>
                </div>
                
            </div>
                        
        </div>
    )
}

export default UserData