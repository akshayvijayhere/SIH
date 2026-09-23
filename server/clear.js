require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Alert = require('./models/Alert');
const SCurve = require('./models/SCurve');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nirmaan_ai';

async function clear() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Wiping database collections...');

    const pRes = await Project.deleteMany({});
    const aRes = await Alert.deleteMany({});
    const sRes = await SCurve.deleteMany({});

    console.log(`\n✅ Database Cleared Successfully:`);
    console.log(`🗑️ Projects Deleted: ${pRes.deletedCount}`);
    console.log(`🗑️ Alerts Deleted: ${aRes.deletedCount}`);
    console.log(`🗑️ S-Curves Deleted: ${sRes.deletedCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
}

clear();
