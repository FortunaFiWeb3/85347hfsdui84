const axios = require('axios');

const base = 'http://localhost:5000';
const userId = 'test_user';
const energy = 42;

(async () => {
  try {
    const saveRes = await axios.post(`${base}/energy/save`, {
      userId,
      energy
    });
    console.log('✅ Saved energy!');

    const loadRes = await axios.get(`${base}/energy/load/${userId}`);
    console.log('🔋 Loaded energy:', loadRes.data.energy);
  } catch (err) {
    console.error('❌ API Test Failed:', err.message);
  }
})();
