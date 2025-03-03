// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://apploan_user:LEXsU6zUIwvNqZ3Hv1ZMXfKg5nUoGsoc@dpg-cv2pgjl6l47c7381o0fg-a.oregon-postgres.render.com/apploan',
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
