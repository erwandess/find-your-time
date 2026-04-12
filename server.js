const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Find Your Time API is running 🚀' });
});

app.post('/generate-planning', async (req, res) => {
  const { tasks, dates } = req.body;
  if (!tasks || tasks.length === 0) {
    return res.status(400).json({ error: 'Aucune tâche fournie' });
  }
  const tasksList = tasks.map(t =>
    `- ${t.title} | Type: ${t.type} | Priorité: ${t.priority} | Durée: ${t.duration} | Jour: ${t.day}`
  ).join('\n');
  const systemPrompt = `Tu es l'IA de Find Your Time. Génère un planning 7 jours en JSON UNIQUEMENT sans texte avant ou après:
{"message":"string","score_equilibre":{"scolaire":number,"perso":number,"repos":number},"planning":[{"jour":"Lundi","taches":[{"heure":"09:00","duree":"1h","titre":"...","type":"scolaire","emoji":"..."}]}],"conseil":"string"}
Règles: max 5 taches/jour, scores somment 100, couvre les 7 jours même vides.`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Tâches:\n${tasksList}\n\nSemaine du ${dates[0]} au ${dates[6]}.` }]
      })
    });
    const data = await response.json();
    const raw = data.content?.map(b => b.text || '').join('') || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json(parsed);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur génération planning' });
  }
});

app.listen(PORT, () => console.log(`✅ Serveur démarré port ${PORT}`));
