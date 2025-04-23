import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

console.log('[TELEGRAM DETECTED]', window.Telegram?.WebApp?.initDataUnsafe);

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const getIcon = (e) => {
  if (e >= 50) return '🚀';
  if (e >= 25) return '⚙️';
  if (e >= 10) return '💡';
  return '🔋';
};

function App() {
  const [tgUser, setTgUser] = useState(null);
  const [energy, setEnergy] = useState(0);
  const [loading, setLoading] = useState(true);
  const [batteryAnim, setBatteryAnim] = useState(''); // ⬅️ New
  const [cooldown, setCooldown] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [leaderboard, setLeaderboard] = useState([]);

useEffect(() => {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    setTheme(stored);
  }
}, []);

useEffect(() => {
  axios.get(`${BACKEND}/energy/leaderboard`)
    .then(res => {
      const serverData = res.data;
      const guestBoard = localStorage.getItem('leaderboard_guest');
      const guestData = guestBoard ? JSON.parse(guestBoard) : [];

      const combined = [...serverData, ...guestData]
        .filter(entry => entry && typeof entry.energy === 'number') // sanitize
        .sort((a, b) => b.energy - a.energy);

      setLeaderboard(combined);
    })
    .catch(err => console.error('[Leaderboard Error]', err));
}, [energy]);

useEffect(() => {
  document.documentElement.className = theme === 'light' ? 'theme-light' : 'theme-dark';
  localStorage.setItem('theme', theme);
}, [theme]);


  useEffect(() => {
    const init = async () => {
      try {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          const user = window.Telegram.WebApp.initDataUnsafe?.user;
          console.log('[DEBUG] Telegram user:', user);

          if (user?.id) {
            setTgUser(user);
            const res = await axios.get(`${BACKEND}/energy/load/${user.id}`);
            console.log('[DEBUG] Loaded energy:', res.data);
            setEnergy(res.data.energy ?? 0);
          } else {
            throw new Error('Telegram user not found');
          }
        } else {
          throw new Error('WebApp not detected');
        }
      } catch (err) {
        console.warn('[Guest Fallback]', err.message);
        console.error('[FULL ERROR]', err);
        setTgUser(null);
        const stored = localStorage.getItem('energy_guest');
        setEnergy(stored ? parseInt(stored) : 0);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);  

  const tapSound = new Audio('/tap-hit.wav');

  const handleTap = async () => {
    if (cooldown > 0) return;
  
    setCooldown(2);
    tapSound.currentTime = 0;
    tapSound.play();
  
    const animations = ['animate-ping-once', 'animate-glow', 'animate-shake', 'animate-bounce'];
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    setBatteryAnim(randomAnim);
    setTimeout(() => setBatteryAnim(''), 400);
  
    const updated = energy + 1;
    setEnergy(updated);  

    if (tgUser) {
      console.log('[DEBUG] Saving to backend:', tgUser.id, updated);
      try {
        const res = await axios.post(`${BACKEND}/energy/save`, {
          userId: tgUser.id,
          name: tgUser.first_name,
          energy: updated,
        });
        console.log('[✔️ Saved]', res.data);
      } catch (err) {
        console.error('[❌ Save Error]', err.message);
      }
    } else {
      localStorage.setItem('energy_guest', updated);

    // Save guest info to a simple local leaderboard array
  const guestName = 'Guest';
  const guestEntry = { id: 'guest', name: guestName, energy: updated };

  const existing = localStorage.getItem('leaderboard_guest');
  const leaderboardGuest = existing ? JSON.parse(existing) : [];

  const updatedLeaderboard = [
    ...leaderboardGuest.filter(entry => entry.id !== 'guest'),
    guestEntry
  ];

  localStorage.setItem('leaderboard_guest', JSON.stringify(updatedLeaderboard));
}
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center transition-all duration-300">
      {loading ? (
        <p className="text-lg">Loading...</p>
      ) : (
        <>
          {!tgUser && (
            <p className="text-red-400 text-sm mb-4">
              Telegram user not detected. This session is running as a guest.
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">⚡ Energy Reactor</h1>
          <h2 className="text-md mb-4">
            {tgUser ? `Welcome, ${tgUser.first_name}` : 'Guest Mode'}
          </h2>

          <div className="text-5xl sm:text-6xl font-extrabold flex items-center gap-3 mb-6">
  <span
    role="img"
    aria-label="energy-icon"
    className={`${batteryAnim} transition-transform`}
  >
    {getIcon(energy)}
  </span>
  {energy} Energy
</div>

<button
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
  className="absolute top-4 right-4 text-sm px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
>
  {theme === 'dark' ? '🌞 Light Mode' : '🌙 Dark Mode'}
</button>


<button
  onClick={handleTap}
  disabled={cooldown > 0}
  className={`${
    cooldown > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500'
  } text-black font-bold py-4 px-10 rounded-full text-lg transition-all shadow-md`}
>
  ⚡ TAP TO CHARGE
</button>

          {cooldown > 0 && (
  <p className="text-sm text-red-400 mt-2">⏳ Wait {cooldown}s to tap again</p>
)}


          <p className="text-sm text-slate-300 mt-8 max-w-sm">
            Tap the button to generate energy!<br />
            Your score is saved even if you refresh.
          </p>
          {/* 👇 Leaderboard Section 👇 */}
<div className="mt-10 w-full max-w-md bg-white dark:bg-slate-800 p-4 rounded shadow text-left">
  <h3 className="text-lg font-bold mb-2 text-center text-slate-800 dark:text-white">🏆 Top Players</h3>
  <ul className="space-y-1 text-sm">
    {leaderboard.map((user, index) => (
      <li
        key={user.id}
        className={`flex justify-between ${
          tgUser?.id === user.id
            ? 'font-bold text-yellow-400'
            : user.id === 'guest'
            ? 'text-gray-400 italic'
            : 'text-slate-700 dark:text-slate-300'
        }`}        
      >
        <span>{index + 1}. {user.name || `User ${user.id}`}</span>
        <span>{user.energy}</span>
      </li>
    ))}
  </ul>
</div>

        </>
      )}
    </div>
  );
}

export default App;
