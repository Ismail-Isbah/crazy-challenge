import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000');

export default function PublicDashboard() {
  const [teams, setTeams] = useState([]);
  const [currentQ, setCurrentQ] = useState(null);
  const [heatmap, setHeatmap] = useState({});
  const [votes, setVotes] = useState({ good: 0, bad: 0 });

  useEffect(() => {
    socket.emit('join', { room: 'public-room', role: 'public' });
    
    socket.on('game:new_question', (q) => { setCurrentQ(q); setHeatmap({}); });
    socket.on('score:refresh', (d) => setTeams(d.teams || []));
    socket.on('heatmap:update', ({ questionId, stats }) => setHeatmap(prev => ({...prev, [questionId]: stats})));
    
    // 🎮 INNOVATION 2 : Votes spectateurs
    socket.on('public:vote', (type) => setVotes(v => ({...v, [type]: v[type] + 1})));

    return () => {
      socket.off('game:new_question');
      socket.off('score:refresh');
      socket.off('heatmap:update');
    };
  }, []);

  const castVote = (type) => socket.emit('public:vote', type);

  const successRate = heatmap[currentQ?.id]?.correct / (heatmap[currentQ?.id]?.correct + heatmap[currentQ?.id]?.wrong || 1) * 100;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">🏆 CRAZY CHALLENGE</h1>
        <div className="text-right">
          <div className="text-sm text-gray-400">Session en direct</div>
          <div className="text-2xl font-mono font-bold text-green-400">● LIVE</div>
        </div>
      </header>

      {/* Question Actuelle */}
      <div className="w-full max-w-4xl bg-gray-900/50 rounded-3xl p-6 md:p-10 mb-8 border border-gray-800 text-center">
        {currentQ ? (
          <>
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm mb-4">{currentQ.category} • {currentQ.type.toUpperCase()}</span>
            <h2 className="text-2xl md:text-4xl font-bold mb-6 leading-tight">{currentQ.text}</h2>
            {currentQ.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {currentQ.options.map((opt, i) => (
                  <div key={i} className="p-4 bg-gray-800 rounded-xl border border-gray-700 text-lg font-medium">{String.fromCharCode(65+i)}. {opt}</div>
                ))}
              </div>
            )}
          </>
        ) : <p className="text-gray-500 text-xl animate-pulse">En attente de la prochaine question...</p>}
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Classement */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">📊 Classement Temps Réel</h3>
          <div className="space-y-3">
            {teams.length > 0 ? teams.sort((a,b)=>b.score-a.score).map((t, i) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border-l-4" style={{borderColor: i===0?'#fbbf24':i===1?'#94a3b8':'#cd7f32'}}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black w-8">{i+1}</span>
                  <span className="font-semibold text-lg">{t.name}</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{t.score}</span>
              </div>
            )) : <p className="text-gray-500 text-center py-8">En attente des scores...</p>}
          </div>
        </div>

        {/* Heatmap & Votes Spectateurs */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold mb-4">📈 Taux de Réussite (Heatmap)</h3>
            {currentQ ? (
              <div className="space-y-4">
                <div className="h-6 bg-gray-800 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full transition-all duration-500" style={{width: `${successRate || 0}%`}}></div>
                  <div className="bg-red-500 h-full transition-all duration-500" style={{width: `${100 - (successRate || 0)}%`}}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">✅ {Math.round(successRate || 0)}% Correct</span>
                  <span className="text-red-400">❌ {Math.round(100 - (successRate || 0))}% Échec</span>
                </div>
              </div>
            ) : <p className="text-gray-500">Aucune donnée</p>}
          </div>

          <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 text-center">
            <h3 className="text-xl font-bold mb-4">🎮 Votez pour cette question !</h3>
            <div className="flex gap-4 justify-center">
              <button onClick={()=>castVote('good')} className="flex-1 min-h-[56px] bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl font-bold text-lg transition">👍 Fun</button>
              <button onClick={()=>castVote('bad')} className="flex-1 min-h-[56px] bg-gray-700 hover:bg-gray-600 active:scale-95 rounded-xl font-bold text-lg transition">👎 Difficile</button>
            </div>
            <div className="mt-3 text-sm text-gray-400">{votes.good} 👍 vs {votes.bad} 👎</div>
          </div>
        </div>
      </div>
    </div>
  );
}
