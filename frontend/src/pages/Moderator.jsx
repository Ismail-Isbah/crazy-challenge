import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000');

export default function Moderator() {
  const [sessionActive, setSessionActive] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    socket.emit('join', { room: 'session-1', role: 'moderator' });
    socket.emit('join', { room: 'moderator-session', role: 'moderator' });
    
    socket.on('game:answer_received', (data) => {
      setAnswers((prev) => [...prev, data]);
    });
    
    socket.on('score:refresh', (data) => {
      setTeams(data.teams || []);
    });

    // Charger les questions depuis l'API
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/questions`)
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch(() => console.log('API questions non disponible'));

    return () => {
      socket.off('game:answer_received');
      socket.off('score:refresh');
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!sessionActive || timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [sessionActive, timer]);

  const startSession = () => {
    setSessionActive(true);
    socket.emit('game:start', { sessionId: 'session-1' });
  };

  const stopSession = () => {
    setSessionActive(false);
    setTimer(30);
    socket.emit('game:stop', { sessionId: 'session-1' });
  };

  const sendQuestion = (q) => {
    setCurrentQuestion(q);
    socket.emit('moderator:send_question', {
      question: q.text,
      options: q.options,
      type: q.type,
      points: q.points,
      timer: 30
    });
    setAnswers([]);
    setTimer(30);
  };

  const validateAnswer = (answer, accepted) => {
    socket.emit('answer:validate', {
      answerId: answer.id,
      teamId: answer.teamId,
      accepted,
      points: accepted ? answer.points : 0
    });
    setAnswers((prev) => prev.filter((a) => a.id !== answer.id));
  };

  const resetTimer = () => setTimer(30);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-white/20">
        <h1 className="text-2xl font-bold">🎮 Modérateur - Crazy Challenge</h1>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${sessionActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {sessionActive ? '● Session active' : '○ Session arrêtée'}
          </span>
          <div className="text-2xl font-mono font-bold bg-white/10 px-4 py-2 rounded-lg min-w-[80px] text-center">
            {timer}s
          </div>
        </div>
      </header>

      {/* Contrôles principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button onClick={startSession} disabled={sessionActive} className="min-h-[48px] bg-green-600 hover:bg-green-500 disabled:opacity-50 active:scale-95 rounded-xl font-semibold transition">
          ▶️ Lancer
        </button>
        <button onClick={stopSession} disabled={!sessionActive} className="min-h-[48px] bg-red-600 hover:bg-red-500 disabled:opacity-50 active:scale-95 rounded-xl font-semibold transition">
          ⏹️ Arrêter
        </button>
        <button onClick={resetTimer} className="min-h-[48px] bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl font-semibold transition">
          🔄 Reset Timer
        </button>
        <button onClick={() => setTimer(60)} className="min-h-[48px] bg-purple-600 hover:bg-purple-500 active:scale-95 rounded-xl font-semibold transition">
          ⏱️ +30s
        </button>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des questions */}
        <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
          <h2 className="text-lg font-semibold mb-3">📚 Questions ({questions.length})</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => sendQuestion(q)}
                disabled={!sessionActive}
                className="w-full text-left p-3 bg-white/5 hover:bg-white/10 active:scale-98 rounded-lg border border-white/10 disabled:opacity-50 transition min-h-[48px]"
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium truncate">{q.text}</span>
                  <span className="text-xs bg-purple-500/30 px-2 py-1 rounded">{q.points}pts</span>
                </div>
                <div className="text-xs text-white/60 mt-1">{q.category} • {q.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Réponses reçues */}
        <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
          <h2 className="text-lg font-semibold mb-3">✅ Réponses en attente ({answers.length})</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {answers.length === 0 ? (
              <p className="text-white/60 text-center py-8">En attente de réponses...</p>
            ) : (
              answers.map((a, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">Équipe #{a.teamId}</span>
                    <span className="text-xs bg-blue-500/30 px-2 py-1 rounded">{a.type}</span>
                  </div>
                  <p className="text-sm mb-3">{a.answer}</p>
                  <div className="flex gap-2">
                    <button onClick={() => validateAnswer(a, true)} className="flex-1 min-h-[40px] bg-green-600 hover:bg-green-500 active:scale-95 rounded-lg font-medium transition">
                      ✓ Valider
                    </button>
                    <button onClick={() => validateAnswer(a, false)} className="flex-1 min-h-[40px] bg-red-600 hover:bg-red-500 active:scale-95 rounded-lg font-medium transition">
                      ✗ Refuser
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Classement équipes */}
      <div className="mt-6 bg-white/10 rounded-2xl p-4 border border-white/20">
        <h2 className="text-lg font-semibold mb-3">📊 Classement en direct</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {teams.length > 0 ? teams.map((team) => (
            <div key={team.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="font-semibold">{team.name}</div>
              <div className="text-2xl font-bold text-yellow-400">{team.score}</div>
              <div className="text-xs text-white/60">points</div>
            </div>
          )) : (
            <p className="text-white/60 col-span-full text-center py-4">En attente des équipes...</p>
          )}
        </div>
      </div>
    </div>
  );
}
