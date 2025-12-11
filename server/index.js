const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes Placeholder
app.get('/', (req, res) => {
  res.send('Pendientes Dashboard API is running');
});

// Import Routes (Future)
// const projectRoutes = require('./routes/projects');
// app.use('/api/projects', projectRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
