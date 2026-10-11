require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI is required. Copy .env.example to .env and configure it.');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => app.listen(port, () => console.log(`API listening on port ${port}`)))
  .catch(error => {
    console.error('Could not connect to MongoDB:', error.message);
    process.exit(1);
  });
