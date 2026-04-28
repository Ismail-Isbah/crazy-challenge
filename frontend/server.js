app.get('/api/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      select: { id: true, text: true, category: true, points: true, type: true, options: true }
    });
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de la récupération des questions' });
  }
});
