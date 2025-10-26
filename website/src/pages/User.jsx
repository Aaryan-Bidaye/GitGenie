import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import pfp from '../assets/pfp.png'

function UserData(){
    const navigate = useNavigate();
    const {user} = useLocation().state;
    const barChartSrc = 'https://placehold.co/640x220/111214/7b52ff?text=Bar+Chart'
    const gaugeSrc = 'https://placehold.co/280x160/111214/7b52ff?text=Gauge'

    return(
        <div className="page-root">
            <header className="topbar">
                <div className="brand" onClick={()=>navigate('/')}>GitGenie</div>
            </header>
            <h1>{user}</h1>

            <div className="center-wrap">
                <div className="card">
                    <div className="left-box">
                        <img className="pfp" src={pfp} alt={user} />
                        <h2>{user}</h2>
                        <p>Score: {user.score}</p>
                    </div>
                </div>
            </div>
                        
        </div>
    )
}

export default UserData