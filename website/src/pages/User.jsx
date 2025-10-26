import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import pfp from '../assets/pfp.png'

function User(){
    const [currentSlide, setCurrentSlide] = useState(0)

    // temporary mock data for carousel
    const mockUsers = [
        { name: 'alice', score: 128 },
        { name: 'bob', score: 97 },
        { name: 'charlie', score: 75 },
        { name: 'dave', score: 60 },
        { name: 'eve', score: 55 },
    ]

    const totalSlides = mockUsers.length
    const nextSlide = () => setCurrentSlide((s) => (s + 1) % Math.max(totalSlides, 1))
    const prevSlide = () => setCurrentSlide((s) => (s - 1 + Math.max(totalSlides, 1)) % Math.max(totalSlides, 1))
    const goTo = (idx) => setCurrentSlide(idx)

    const barChartSrc = 'https://placehold.co/640x220/111214/7b52ff?text=Bar+Chart'
    const gaugeSrc = 'https://placehold.co/280x160/111214/7b52ff?text=Gauge'

    return(
        <div className="page-root">
            <header className="topbar">
                <div className="brand" onClick={()=>console.log("Home")}>GitGenie</div>
            </header>
            <h1>User</h1>

            {totalSlides > 0 && (
                <div className="carousel">
                    <div className="carousel-card">
                        <div className="carousel-header">
                            <img className="pfp" src={pfp} alt={mockUsers[currentSlide].name} />
                            <div className="carousel-meta">
                                <div className="carousel-name">{mockUsers[currentSlide].name}</div>
                                <div className="carousel-commits">Commits: {mockUsers[currentSlide].score}</div>
                            </div>
                            <img className="carousel-gauge" src={gaugeSrc} alt="gauge" />
                        </div>
                        <div className="carousel-graphs">
                            <img className="carousel-bar" src={barChartSrc} alt="bar chart" />
                        </div>
                    </div>
                    <div className="carousel-controls">
                        <button className="carousel-btn" onClick={prevSlide} aria-label="Previous">‹</button>
                        <div className="carousel-dots">
                            {mockUsers.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`dot ${idx === currentSlide ? 'active' : ''}`}
                                    onClick={() => goTo(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                        <button className="carousel-btn" onClick={nextSlide} aria-label="Next">›</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default User