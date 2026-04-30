import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000');

export default function Team() {
  const [auth, setAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [currentQ, setCurrentQ] = useState(null);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [buzzed, setBuzzed] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const teamId = localStorage.getItem('teamId');
    const tName = localStorage.getItem('teamName');
    
    if (token && role === 'team') {
      setAuth(true);
      setUsername(localStorage.getItem('username') || 'Membre');
      setTeamName(tName || 'Équipe');
      socket.emit('join', { room: 'session-1', role: 'team' });
      socket.emit('join', { room: `team-${teamId}`, role: 'team' });
    }
  }, []);

  useEffect(() => {
    socket.on('game:new_question', (q) => {
      setCurrentQ(q);
      setAnswer('');
      setFeedback(null);
      setBuzzed(false);
      setTimer(q.timer || 30);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    });

    socket.on('score:update', ({ teamId, points }) => {
      if (teamId == localStorage.getItem('teamId')) setScore(s => s + points);
    });

    socket.on('answer:feedback', (data) => {
      setFeedback(data);
      socket.emit('answer:submit', { questionId: currentQ?.id, teamId: localStorage.getItem('teamId'), isCorrect: data.accepted });
      setHistory(prev => [...prev, { q: currentQ?.text, res: data.accepted ? '✓' : '✗', pts: data.points }]);
    });

    socket.on('game:stop', () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    });

    return () => {
      socket.off('game:new_question');
      socket.off('score:update');
      socket.off('answer:feedback');
      socket.off('game:stop');
    };
  }, [currentQ]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'team', teamName: teamName || username })
      });
      const data = await res.json();
      if (res.ok) {
        if (isRegister) { setIsRegister(false); alert('Compte créé ! Connecte-toi.'); }
        else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          localStorage.setItem('teamId', data.teamId);
          localStorage.setItem('teamName', teamName || data.username);
          localStorage.setItem('username', data.username);
          setAuth(true);
        }
      } else alert(data.error);
    } catch { alert('Erreur réseau'); }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !currentQ || buzzed === false) return;
    const teamId = localStorage.getItem('teamId');
    socket.emit('team:answer', { teamId, questionId: currentQ.id, answer: answer.trim(), type: currentQ.type, points: currentQ.points });
    setBuzzed(true); // Bloque après envoi
  };

  const sendBuzz = () => {
    socket.emit('team:buzz', { teamId: localStorage.getItem('teamId'), teamName: localStorage.getItem('teamName') });
    setBuzzed('waiting');
    setTimeout(() => setBuzzed(true), 5000); // Timeout auto si pas sélectionné
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 to-teal-800 p-4">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-sm border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">{isRegister ? 'Inscription Équipe' : 'Connexion'}</h2>
          <form onSubmit={handleAuth} className="space-y-3">
            <input className="w-full min-h-[48px] p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Nom d'utilisateur" value={username} onChange={e=>setUsername(e.target.value)} required />
            <input className="w-full min-h-[48px] p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500" type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} required />
            {isRegister && <input className="w-full min-h-[48px] p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Nom de l'équipe" value={teamName} onChange={e=>setTeamName(e.target.value)} />}
            <button type="submit" className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl transition">{isRegister ? "S'inscrire" : 'Se connecter'}</button>
          </form>
          <button onClick={()=>setIsRegister(!isRegister)} className="w-full mt-3 text-sm text-emerald-200 hover:text-white">{isRegister ? 'Déjà un compte ?' : "Créer un compte"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-4">
      <header className="flex justify-between items-center mb-6 pb-3 border-b border-white/20">
        <div>
          <h1 className="text-xl font-bold">👥 {teamName}</h1>
          <p className="text-xs text-white/60">Connecté</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">{score} pts</div>
          <div className={`text-lg font-mono ${timer <= 10 ? 'text-red-400 animate-pulse' : 'text-white/80'}`}>⏱️ {timer}s</div>
        </div>
      </header>

      {currentQ ? (
        <div className="bg-white/10 rounded-2xl p-5 mb-6 border border-white/20">
          <div className="flex justify-between mb-3">
            <span className="text-xs bg-purple-500/30 px-2 py-1 rounded">{currentQ.category}</span>
            <span className="text-xs bg-yellow-500/30 px-2 py-1 rounded">{currentQ.points} pts</span>
          </div>
          <h2 className="text-xl font-bold mb-5 leading-snug">{currentQ.text}</h2>
          
          {currentQ.type === 'qcm' && currentQ.options ? (
            <div className="grid gap-3">
              {currentQ.options.map((opt, i) => (
                <button key={i} onClick={()=>{setAnswer(opt); setTimeout(submitAnswer, 200);}} disabled={buzzed !== false}
                  className="min-h-[48px] w-full text-left p-4 bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-40 rounded-xl border border-white/10 transition font-medium">
                  {String.fromCharCode(65+i)}. {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Ta réponse..." disabled={buzzed !== false}
                className="w-full min-h-[48px] p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50" />
              <button onClick={submitAnswer} disabled={buzzed !== false || !answer.trim()}
                className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 rounded-xl font-bold transition">
                Valider
              </button>
            </div>
          )}

          {feedback && (
            <div className={`mt-4 p-3 rounded-xl text-center font-medium ${feedback.accepted ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {feedback.accepted ? `✅ Correct ! +${feedback.points}` : `❌ Raté. Réponse : ${feedback.correctAnswer}`}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/10 rounded-2xl p-8 mb-6 border border-white/20 text-center">
          <p className="text-white/60 mb-4">En attente du modérateur...</p>
          <button onClick={sendBuzz} disabled={buzzed !== false}
            className="min-h-[64px] w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 active:scale-95 disabled:opacity-30 disabled:grayscale rounded-2xl font-black text-xl tracking-wider transition shadow-lg shadow-red-900/50">
            🚨 BUZZER
          </button>
          {buzzed === 'waiting' && <p className="mt-2 text-orange-300 animate-pulse">En attente de sélection...</p>}
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="font-semibold mb-2 text-sm text-white/70">📜 Historique</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {history.slice().reverse().map((h, i) => (
              <div key={i} className="text-xs p-2 bg-black/20 rounded flex justify-between">
                <span className="truncate flex-1">{h.q}</span>
                <span className={h.res === '✓' ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>{h.res} {h.pts > 0 ? `+${h.pts}` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
