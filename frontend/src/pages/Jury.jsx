import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000');

export default function Jury() {
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(null);
  const [points, setPoints] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    socket.emit('join', { room: 'jury-room', role: 'jury' });
    socket.on('jury:new_submission', (data) => setPending(prev => [...prev, data]));
    return () => socket.off('jury:new_submission');
  }, []);

  const validate = (accepted) => {
    if (!selected) return;
    socket.emit('jury:validate', { 
      answerId: selected.id, 
      teamId: selected.teamId, 
      accepted, 
      points: accepted ? points : 0, 
      comment 
    });
    setPending(prev => prev.filter(p => p.id !== selected.id));
    setSelected(null); setPoints(0); setComment('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4">
      <header className="mb-6 pb-4 border-b border-white/20">
        <h1 className="text-2xl font-bold">⚖️ Espace Jury</h1>
        <p className="text-white/60 text-sm">Validation des réponses complexes</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
          <h2 className="font-semibold mb-3">📥 En attente ({pending.length})</h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {pending.length === 0 ? <p className="text-white/50 text-center py-8">Aucune soumission</p> :
              pending.map(p => (
                <div key={p.id} onClick={()=>setSelected(p)} className={`p-3 rounded-xl border cursor-pointer transition ${selected?.id === p.id ? 'bg-indigo-600/30 border-indigo-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-indigo-300">Équipe {p.teamName}</span>
                    <span className="text-white/50">{new Date(p.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm truncate">{p.answer}</p>
                </div>
              ))
            }
          </div>
        </div>
        <div className="bg-white/10 rounded-2xl p-5 border border-white/20">
          <h2 className="font-semibold mb-4">🔍 Analyse & Validation</h2>
          {selected ? (
            <div className="space-y-4">
              <div className="p-4 bg-black/30 rounded-xl">
                <p className="text-xs text-white/50 mb-1">Réponse :</p>
                <p className="font-mono text-lg break-words">{selected.answer}</p>
                <p className="text-xs text-white/50 mt-2">Question : {selected.questionText}</p>
              </div>
              <div>
                <label className="text-sm text-white/70 block mb-2">Points</label>
                <input type="number" value={points} onChange={e=>setPoints(Number(e.target.value))} className="w-full min-h-[48px] bg-white/10 rounded-lg px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm text-white/70 block mb-2">Commentaire</label>
                <textarea value={comment} onChange={e=>setComment(e.target.value)} rows="3" className="w-full bg-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Raison..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={()=>validate(true)} className="min-h-[48px] bg-green-600 hover:bg-green-500 active:scale-95 rounded-xl font-bold transition">✅ Valider</button>
                <button onClick={()=>validate(false)} className="min-h-[48px] bg-red-600 hover:bg-red-500 active:scale-95 rounded-xl font-bold transition">❌ Refuser</button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40">
              <p>Sélectionne une réponse</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
