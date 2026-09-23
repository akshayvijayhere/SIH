require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Alert = require('./models/Alert');
const SCurve = require('./models/SCurve');
const seedData = require('./seedData');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nirmaan_ai';

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected for seeding.');

    // Clear existing collections
    await Project.deleteMany({});
    await Alert.deleteMany({});
    await SCurve.deleteMany({});

    // Insert Projects
    const projectsInserted = await Project.insertMany(seedData.projects);
    console.log(`Inserted ${projectsInserted.length} Projects.`);

    // Insert Alerts
    const alertsInserted = await Alert.insertMany(seedData.alerts);
    console.log(`Inserted ${alertsInserted.length} Alerts.`);

    // Insert S-Curve
    await SCurve.create(seedData.sCurveData);
    console.log('Inserted Portfolio S-Curve dataset.');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    if (err.name === 'MongooseServerSelectionError' || err.code === 'ECONNREFUSED') {
      console.warn('⚠️ MongoDB is not running locally. Skipped standalone seed script.');
      console.warn('💡 Tip: You can run "npm start" directly — the backend will run using the in-memory MoSPI dataset!');
      process.exit(0);
    }
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
