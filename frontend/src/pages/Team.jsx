import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');

  .team-root {
    min-height: 100vh;
    background: #030712;
    font-family: 'DM Sans', sans-serif;
    padding: 1.25rem;
    position: relative;
    overflow: hidden;
  }

  .team-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 45% at 15% 15%, rgba(6,182,212,0.1) 0%, transparent 60%),
      radial-gradient(ellipse 50% 55% at 85% 85%, rgba(99,102,241,0.09) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 50% 50%, rgba(239,68,68,0.04) 0%, transparent 70%);
    pointer-events: none;
  }

  .team-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(6,182,212,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,182,212,0.035) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  .team-inner {
    position: relative;
    z-index: 10;
    max-width: 860px;
    margin: 0 auto;
  }

  /* ---------- Glass cards ---------- */
  .g-card {
    background: rgba(10,16,30,0.75);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
  }

  .g-card-cyan  { border-color: rgba(6,182,212,0.2); }
  .g-card-gold  { border-color: rgba(251,191,36,0.2); }
  .g-card-blue  { border-color: rgba(99,102,241,0.2); }
  .g-card-green { border-color: rgba(34,197,94,0.2); }

  /* ---------- Header ---------- */
  .team-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 1.25rem;
    animation: fadeDown 0.5s cubic-bezier(.22,1,.36,1) both;
  }

  .team-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #0891b2, #6366f1);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
  }

  .brand-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.3rem;
    font-weight: 800;
    color: #f0f9ff;
    margin: 0;
  }

  .conn-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(148,163,184,0.9);
  }

  .conn-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .conn-dot.on  { background: #4ade80; box-shadow: 0 0 6px #4ade80; animation: pulse-dot 2s infinite; }
  .conn-dot.off { background: #f87171; }

  @keyframes pulse-dot {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.4; }
  }

  /* ---------- Stats grid ---------- */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: 1fr; }
    .buzz-wrap  { padding: 2rem 1rem; }
  }

  .stat-card {
    padding: 1.25rem;
    text-align: center;
    border-radius: 16px;
    transition: transform 0.25s, box-shadow 0.25s;
    animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) both;
  }

  .stat-card:hover { transform: translateY(-3px); }
  .stat-card:nth-child(1) { animation-delay: 0.05s; }
  .stat-card:nth-child(2) { animation-delay: 0.1s; }
  .stat-card:nth-child(3) { animation-delay: 0.15s; }

  .stat-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 0.75rem;
  }

  .stat-label {
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(148,163,184,0.6);
    margin-bottom: 0.35rem;
  }

  .stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 2.25rem;
    font-weight: 800;
    color: #f0f9ff;
    line-height: 1;
  }

  .stat-value.danger { color: #f87171; animation: tick 0.4s ease; }

  .stat-sub {
    font-size: 0.7rem;
    color: rgba(100,116,139,0.6);
    margin-top: 0.25rem;
  }

  .score-bump { animation: scorePop 0.35s cubic-bezier(.22,1,.36,1); }

  @keyframes scorePop {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  @keyframes tick {
    0%,100% { transform: scale(1); }
    50%     { transform: scale(1.08); }
  }

  /* ---------- Question card ---------- */
  .question-card {
    padding: 1.75rem 2rem;
    margin-bottom: 1.25rem;
    border-radius: 20px;
    animation: slideUp 0.45s cubic-bezier(.22,1,.36,1) both;
  }

  .q-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 1rem; }

  .q-tag {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .q-tag-cat  { background: linear-gradient(135deg, #0891b2, #6366f1); color: #fff; }
  .q-tag-pts  { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
  .q-tag-easy { background: rgba(34,197,94,0.1);  color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
  .q-tag-med  { background: rgba(251,191,36,0.1);  color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
  .q-tag-hard { background: rgba(239,68,68,0.1);   color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

  .q-text {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.2rem, 2.5vw, 1.6rem);
    font-weight: 700;
    color: #f0f9ff;
    line-height: 1.4;
    margin: 0;
  }

  .q-img {
    width: 100%;
    max-height: 220px;
    object-fit: cover;
    border-radius: 12px;
    margin-top: 1.25rem;
    border: 1px solid rgba(255,255,255,0.07);
  }

  /* ---------- Buzz section ---------- */
  .buzz-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2.5rem 1.5rem;
    border-radius: 20px;
    margin-bottom: 1.25rem;
    animation: fadeUp 0.5s 0.2s cubic-bezier(.22,1,.36,1) both;
  }

  .buzz-hint {
    font-size: 0.78rem;
    color: rgba(148,163,184,0.5);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .buzz-btn-outer {
    position: relative;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    outline: none;
    transition: transform 0.2s;
  }

  .buzz-btn-outer:disabled { cursor: not-allowed; opacity: 0.45; }
  .buzz-btn-outer:not(:disabled):hover { transform: scale(1.06); }
  .buzz-btn-outer:not(:disabled):active { transform: scale(0.96); }

  .buzz-glow {
    position: absolute;
    inset: -12px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 70%);
    filter: blur(16px);
    transition: opacity 0.3s;
    opacity: 0.7;
  }

  .buzz-btn-outer:not(:disabled):hover .buzz-glow { opacity: 1; }
  .buzz-btn-outer:disabled .buzz-glow { opacity: 0.2; }
  .buzz-btn-outer.buzzed .buzz-glow { opacity: 0; }

  .buzz-ring {
    position: absolute;
    inset: -8px;
    border: 2px solid rgba(239,68,68,0.4);
    border-radius: 999px;
    animation: ringPulse 2s ease-in-out infinite;
  }

  .buzz-btn-outer:disabled .buzz-ring,
  .buzz-btn-outer.buzzed .buzz-ring { display: none; }

  @keyframes ringPulse {
    0%,100% { transform: scale(1);   opacity: 0.4; }
    50%     { transform: scale(1.12); opacity: 0; }
  }

  .buzz-inner {
    position: relative;
    width: 160px; height: 160px;
    border-radius: 50%;
    background: linear-gradient(145deg, #ef4444, #be123c);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    box-shadow:
      0 0 0 4px rgba(239,68,68,0.15),
      0 12px 40px rgba(239,68,68,0.4),
      inset 0 1px 0 rgba(255,255,255,0.15);
    transition: box-shadow 0.3s;
  }

  .buzz-btn-outer.buzzed .buzz-inner {
    background: linear-gradient(145deg, #4ade80, #16a34a);
    box-shadow:
      0 0 0 4px rgba(74,222,128,0.15),
      0 12px 40px rgba(74,222,128,0.4),
      inset 0 1px 0 rgba(255,255,255,0.15);
    animation: buzzSuccess 0.5s cubic-bezier(.22,1,.36,1);
  }

  @keyframes buzzSuccess {
    0%   { transform: scale(1) rotate(0deg); }
    25%  { transform: scale(0.92) rotate(-6deg); }
    75%  { transform: scale(1.08) rotate(4deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  .buzz-label {
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .buzz-sublabel {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.65);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .waiting-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 999px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 0.78rem;
    color: rgba(148,163,184,0.6);
    animation: breathe 2.5s ease-in-out infinite;
  }

  @keyframes breathe {
    0%,100% { opacity: 0.6; }
    50%     { opacity: 1; }
  }

  /* ---------- User card ---------- */
  .user-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem 1.5rem;
    border-radius: 16px;
    animation: fadeUp 0.5s 0.3s cubic-bezier(.22,1,.36,1) both;
  }

  .user-avatar {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0891b2, #6366f1);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1rem;
    color: #fff;
    flex-shrink: 0;
    margin-right: 12px;
  }

  .user-name {
    font-weight: 600;
    color: #e2e8f0;
    font-size: 0.9rem;
  }

  .user-role {
    font-size: 0.72rem;
    color: rgba(100,116,139,0.7);
  }

  /* ---------- Keyframes ---------- */
  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default function Team() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────
  const [username, setUsername]           = useState('');
  const [score, setScore]                 = useState(0);
  const [timer, setTimer]                 = useState(0);
  const [question, setQuestion]           = useState(null);
  const [hasBuzzed, setHasBuzzed]         = useState(false);
  const [isConnected, setIsConnected]     = useState(false);
  const [buzzed, setBuzzed]               = useState(false);   // animation state

  // ── Refs ───────────────────────────────────────────────────────────────
  const socketRef   = useRef(null);
  const scoreRef    = useRef(null);
  const buzzBtnRef  = useRef(null);

  // ── BUG FIX 1 : socket + listeners dans un seul effect sans `timer` ───
  useEffect(() => {
    const token = localStorage.getItem('token');
    setUsername(localStorage.getItem('username') || 'Joueur');

    if (!token) { navigate('/'); return; }

    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000', {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', { room: 'session-1', role: 'team' });
    });

    socket.on('game:new_question', (data) => {
      setQuestion(data);
      setTimer(data.timeLimit || 30);
      setHasBuzzed(false);
      setBuzzed(false);
    });

    // BUG FIX 2 : le timer serveur est autoritaire, on sync simplement
    socket.on('game:timer', (time) => setTimer(time));

    socket.on('game:score_update', (newScore) => {
      setScore(newScore);
      // BUG FIX 3 : animation via ref, pas document.querySelector
      scoreRef.current?.classList.add('score-bump');
      setTimeout(() => scoreRef.current?.classList.remove('score-bump'), 350);
    });

    socket.on('disconnect', () => setIsConnected(false));

    return () => socket.disconnect();
  }, [navigate]); // BUG FIX 4 : timer retiré des dépendances → plus de reconnexion à chaque tick

  // ── BUG FIX 5 : intervalle local séparé, ne recrée pas le socket ──────
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [timer]); // OK ici car c'est le seul effect qui utilise timer

  // ── Buzz ───────────────────────────────────────────────────────────────
  const handleBuzz = useCallback(async () => {
    if (hasBuzzed || !question || timer === 0) return;
    setHasBuzzed(true);
    setBuzzed(true);

    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/game/buzz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionId: question.id, buzzTime: timer })
      });
    } catch (err) {
      console.error('Erreur buzz:', err);
      setHasBuzzed(false);
      setBuzzed(false);
    }
  }, [hasBuzzed, question, timer]);

  // ── Derived UI values ──────────────────────────────────────────────────
  const diffTag = { easy: 'q-tag-easy', medium: 'q-tag-med', hard: 'q-tag-hard' };
  const diffLabel = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
  const timerDanger = timer <= 5 && timer > 0;
  const btnDisabled = hasBuzzed || !question || timer === 0;

  return (
    <>
      <style>{styles}</style>
      <div className="team-root">
        <div className="team-grid" />

        <div className="team-inner">

          {/* ── Header ── */}
          <div className="g-card g-card-cyan team-header">
            <div className="team-brand">
              <div className="brand-icon">
                <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h1 className="brand-title">Espace Équipe</h1>
            </div>
            <div className="conn-pill">
              <span className={`conn-dot ${isConnected ? 'on' : 'off'}`} />
              {isConnected ? 'En ligne' : 'Déconnecté'}
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="stats-grid">

            {/* Score */}
            <div className="g-card g-card-gold stat-card" ref={scoreRef}>
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
              </div>
              <p className="stat-label">Score</p>
              <p className="stat-value">{score}</p>
              <p className="stat-sub">points</p>
            </div>

            {/* Timer */}
            <div className="g-card g-card-blue stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#0891b2)' }}>
                <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <p className="stat-label">Temps restant</p>
              <p className={`stat-value ${timerDanger ? 'danger' : ''}`}>{timer}<span style={{ fontSize:'1rem', fontWeight:500 }}>s</span></p>
              <p className="stat-sub">secondes</p>
            </div>

            {/* Status */}
            <div className="g-card g-card-green stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#22c55e,#0891b2)' }}>
                <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p className="stat-label">Statut</p>
              <p className="stat-value" style={{ fontSize:'1.1rem', paddingTop:'0.4rem' }}>
                {hasBuzzed ? '🎯 Buzzé' : question ? '⚡ Prêt' : '⏳ Veille'}
              </p>
              <p className="stat-sub">{hasBuzzed ? 'Premier !' : question ? 'Appuyez vite' : 'En attente'}</p>
            </div>

          </div>

          {/* ── Question ── */}
          {question && (
            <div className="g-card question-card" key={question.id}>
              <div className="q-tags">
                <span className="q-tag q-tag-cat">{question.category}</span>
                <span className="q-tag q-tag-pts">{question.points} pts</span>
                <span className={`q-tag ${diffTag[question.difficulty] ?? 'q-tag-med'}`}>
                  {diffLabel[question.difficulty] ?? question.difficulty}
                </span>
              </div>
              <p className="q-text">{question.question}</p>
              {question.imageUrl && (
                <img src={question.imageUrl} alt="Illustration question" className="q-img" />
              )}
            </div>
          )}

          {/* ── Buzz Button ── */}
          <div className="g-card buzz-wrap">
            {!question ? (
              <div className="waiting-pill">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/>
                </svg>
                En attente du modérateur...
              </div>
            ) : (
              <p className="buzz-hint">{hasBuzzed ? 'Tu as buzzé !' : 'Appuyez pour buzzer'}</p>
            )}

            <button
              ref={buzzBtnRef}
              className={`buzz-btn-outer ${buzzed ? 'buzzed' : ''}`}
              onClick={handleBuzz}
              disabled={btnDisabled}
              aria-label="Buzzer"
            >
              <div className="buzz-glow" />
              {!btnDisabled && <div className="buzz-ring" />}
              <div className="buzz-inner">
                <svg width="36" height="36" fill={buzzed ? '#fff' : '#fff'} viewBox="0 0 24 24">
                  {buzzed
                    ? <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    : <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  }
                </svg>
                <span className="buzz-label">{buzzed ? 'BUZZÉ !' : 'BUZZ'}</span>
                {!buzzed && <span className="buzz-sublabel">Appuyez</span>}
              </div>
            </button>
          </div>

          {/* ── User bar ── */}
          <div className="g-card user-bar">
            <div className="user-avatar">{username.charAt(0).toUpperCase()}</div>
            <div>
              <p className="user-name">{username}</p>
              <p className="user-role">Membre de l'équipe</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}