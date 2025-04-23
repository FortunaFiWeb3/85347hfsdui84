const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

const allowedOrigins = [
  'https://85347hfsdui84.vercel.app',
  '85347hfsdui84-3tr2ld79r-web3s-projects-10cbd562.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('❌ Blocked CORS origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(bodyParser.json());

const fs = require('fs');
const ENERGY_FILE = './energy-store.json';

let energyStore = {};
if (fs.existsSync(ENERGY_FILE)) {
  energyStore = JSON.parse(fs.readFileSync(ENERGY_FILE));
}

function saveEnergyStore() {
  fs.writeFileSync(ENERGY_FILE, JSON.stringify(energyStore));
}

app.post('/energy/save', (req, res) => {
  const { userId, energy, name } = req.body;
  if (!userId || energy === undefined) {
    return res.status(400).json({ error: 'Missing userId or energy' });
  }

  energyStore[userId] = {
    id: userId,
    name: name || `User ${userId}`,
    energy: energy,
  };

  saveEnergyStore();
  console.log(`✅ Saved ${energy} energy for ${userId}`);
  res.json({ success: true });
});

app.get('/energy/load/:userId', (req, res) => {
  const { userId } = req.params;
  const user = energyStore[userId];
if (user) {
  console.log(`[GET] Loaded user:`, user);
  res.json(user);
} else {
  console.log(`[GET] No data for ${userId}`);
  res.json({ id: userId, name: `User ${userId}`, energy: 0 });
}
});

// Leaderboard route
app.get('/energy/leaderboard', (req, res) => {
  console.log('🔥 /energy/leaderboard HIT');
  const data = Object.values(energyStore || {}) // energyStore must be the backend's saved user energy object
    .map(user => ({
      id: user.id,
      name: user.name || `User ${user.id}`,
      energy: user.energy || 0,
    }))
    .sort((a, b) => b.energy - a.energy)
    .slice(0, 10); // Top 10 only

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

console.log('✅ CORS configured for:', allowedOrigins.join(', '));


