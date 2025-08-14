'use client'

import Link from 'next/link'
import '@/styles/landingPage.scss'

export default function LandingPage() {
  return (
    <div className="landing-container">
      <h1 className="main-title"> MC Haywai Games</h1>

      <div className="link-grid">
        <Link href="/play/name-race">
          <div className="card">🏃 Name Race (Play)</div>
        </Link>

        <Link href="/play">
          <div className="card">🎁 Wish Wall</div>
        </Link>
        <Link href="/play/graduation-wishes">
          <div className="card">🎓 Graduation Wish Wall</div>
        </Link>
        <Link href="/admin/graduation-wishes">
          <div className="card">🛠️ Admin – Graduation Wishes</div>
        </Link>


        <Link href="/admin/name-race-setup">
          <div className="card">🛠️ Admin Panel</div>
        </Link>

        <Link href="/play/puzzle">
          <div className="card">🧩 Puzzle Game</div>
        </Link>
      </div>

      <footer className="footer">
        Built with 💖 Gabekross
      </footer>
    </div>
  )
}
