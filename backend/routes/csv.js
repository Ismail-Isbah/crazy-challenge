const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      try {
        for (const q of results) {
          await prisma.question.create({
            data: {
              text: q.question,
              category: q.category || 'General',
              points: parseInt(q.points) || 10,
              type: q.type || 'qcm',
              options: q.options ? JSON.parse(q.options) : null,
              correctAnswer: q.correct_answer
            }
          });
        }
        fs.unlinkSync(req.file.path);
        res.json({ message: results.length + ' questions importees', count: results.length });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erreur import' });
      }
    });
});
module.exports = router;
