const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const csvRoutes = require('./routes/csv');

const prisma = new PrismaClient();

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);
const SAFE_ORIGINS = [
  'http://localhost:5174',
  'http://localhost:5173', 
  'http://127.0.0.1:5174',
  // Ajoute ton URL de production ici UNE FOIS qu'elle est validée manuellement:
  'https://crazy-challenge.vercel.app'
];


const io = new Server(server, { cors: { origin: SAFE_ORIGINS, methods: ['GET', 'POST'] } });

app.use(cors({ origin: SAFE_ORIGINS, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], credentials: true }));
app.use(express.json());

app.get('/debug/ping', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'X-Debug': 'server-alive' });
  res.end(JSON.stringify({ ok: true, time: Date.now(), port: process.env.PORT || 10000 }));
});

app.use('/api/csv', csvRoutes);



// AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role, teamName } = req.body;
    if (await prisma.user.findUnique({ where: { username } })) return res.status(400).json({ error: 'Utilisateur existe deja' });
    const hashed = await bcrypt.hash(password, 10);
    let teamId = null;
    if (role === 'team' && teamName) {
      let team = await prisma.team.findUnique({ where: { name: teamName } });
      if (!team) team = await prisma.team.create({ data: { name: teamName, score: 0 } });
      teamId = team.id;
    }
    const user = await prisma.user.create({ data: { username, password: hashed, role, teamId } });
    res.status(201).json({ message: 'Inscription reussie', user: { id: user.id, username: user.username, role } });
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Identifiants incorrects' });
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role, teamId: user.teamId });
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// SOCKET.IO
io.on('connection', (socket) => {
  console.log('Connecte:', socket.id);
  socket.on('join', ({ room, role }) => { socket.join(room); console.log(socket.id + ' -> ' + room + ' (' + role + ')'); });
  socket.on('moderator:send_question', (data) => io.to('session-1').emit('game:new_question', data));
  socket.on('team:answer', (data) => io.to('moderator-session').emit('game:answer_received', data));
  socket.on('disconnect', () => console.log('Deconnecte:', socket.id));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log('Serveur sur http://localhost:' + PORT));

// API: Recuperer toutes les questions
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      select: { 
        id: true, 
        text: true, 
        category: true, 
        points: true, 
        type: true, 
        options: true,
        correctAnswer: true
      }
    });
    res.json(questions);
  } catch (e) {
    console.error('Erreur API questions:', e);
    res.status(500).json({ error: 'Erreur recuperation questions' });
  }
});

// --- GESTION DES BUZZ, JURY & HEATMAP ---
// Stockage temporaire en mémoire pour le buzz (reset à chaque question)
let buzzQueue = [];
let heatmapData = {}; // { questionId: { correct: 0, wrong: 0, teams: [] } }

io.on('connection', (socket) => {
  // ... (tes handlers existants restent ici) ...

  // ⚡ INNOVATION 1 : Système de Buzz Temps Réel
  socket.on('team:buzz', ({ teamId, teamName }) => {
    buzzQueue.push({ teamId, teamName, timestamp: Date.now() });
    // Trier par ordre d'arrivée
    buzzQueue.sort((a, b) => a.timestamp - b.timestamp);
    // Notifier tout le monde du premier buzz
    io.to('session-1').emit('buzz:first', buzzQueue[0]);
    // Notifier le modérateur de la file d'attente
    io.to('moderator-session').emit('buzz:queue', buzzQueue);
  });

  // 📝 Validation Jury (Section 4.4)
  socket.on('jury:validate', ({ answerId, teamId, accepted, points, comment }) => {
    io.to('moderator-session').emit('jury:decision', { answerId, accepted, points, comment });
    if (accepted) {
      // Mettre à jour le score (simulation, à lier à Prisma en prod)
      io.to('session-1').emit('score:update', { teamId, points });
    }
  });

  // 📊 Heatmap des réponses (Section 8)
  socket.on('answer:submit', ({ questionId, teamId, isCorrect }) => {
    if (!heatmapData[questionId]) heatmapData[questionId] = { correct: 0, wrong: 0 };
    if (isCorrect) heatmapData[questionId].correct++;
    else heatmapData[questionId].wrong++;
    
    // Diffuser les stats en temps réel pour le dashboard public
    io.to('public-room').emit('heatmap:update', { questionId, stats: heatmapData[questionId] });
  });
});

// API: Récupérer les données heatmap pour le dashboard
app.get('/api/heatmap', (req, res) => {
  res.json(heatmapData);
});
