import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import pfp from '../assets/pfp.png'

function UserData(){
    const navigate = useNavigate();
    const {user} = useLocation().state;
    const score = 128;
    const commits = 400;
    const barChartSrc = ''

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
                        <img className="pfp-large" src={pfp} alt={user} />
                        <h2>Score: {score}<br/>Commits: {commits}</h2>
                    </div>
                    <div className="right-box">
                        <img className="bar-chart" src={barChartSrc} alt="Bar Chart" />
                    </div>
                </div>
            </div>
                        
        </div>
    )
}

export default UserData