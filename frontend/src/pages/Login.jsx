import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    try {
      const payload = { username, password, teamName };
      if (isRegister) payload.role = 'team';
      const res = await axios.post(`http://localhost:3000${endpoint}`, payload);
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('teamId', res.data.teamId);
        navigate('/dashboard');
      } else { alert('Inscription réussie ! Connectez-vous.'); setIsRegister(false); }
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-800 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-sm border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{isRegister ? 'Rejoindre le jeu 🚀' : 'Connexion 🎮'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Nom d'utilisateur" className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[48px]" value={username} onChange={(e)=>setUsername(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[48px]" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          {isRegister && <input type="text" placeholder="Nom de l'équipe" className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[48px]" value={teamName} onChange={(e)=>setTeamName(e.target.value)} required />}
          {error && <p className="text-red-300 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 active:scale-95 transition text-white font-bold py-3 rounded-xl min-h-[48px]">{isRegister ? "S'inscrire" : 'Se connecter'}</button>
        </form>
        <button onClick={()=>setIsRegister(!isRegister)} className="mt-4 text-sm text-indigo-200 hover:text-white w-full text-center">{isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}</button>
      </div>
    </div>
  );
}
