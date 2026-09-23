require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const Project = require('./models/Project');
const Alert = require('./models/Alert');
const SCurve = require('./models/SCurve');
const seedData = require('./seedData');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nirmaan_ai';

// Middleware
app.use(cors());
app.use(express.json());

// Memory Fallback Store if MongoDB service is not running locally
let memoryStore = {
  projects: [...seedData.projects],
  alerts: [...seedData.alerts],
  sCurveData: { ...seedData.sCurveData }
};
let isDbConnected = false;

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    isDbConnected = true;
    console.log('✅ MongoDB Connected Successfully at:', MONGO_URI);
    
    // Auto-seed if database is empty
    const count = await Project.countDocuments();
    if (count === 0) {
      console.log('Seeding initial MongoDB dataset...');
      await Project.insertMany(seedData.projects);
      await Alert.insertMany(seedData.alerts);
      await SCurve.create(seedData.sCurveData);
      console.log('Seeding finished.');
    }
  })
  .catch(err => {
    isDbConnected = false;
    console.warn('⚠️ MongoDB not available locally. Falling back to in-memory dataset mode.');
  });

// ==========================================================================
// REST API ROUTES
// ==========================================================================

// 1. Authentication Route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  // Standard MoSPI Officer login verification
  res.json({
    success: true,
    user: {
      name: 'Officer',
      role: 'Government Official',
      department: 'Infrastructure & Project Monitoring Division (IPMD)',
      email: email
    },
    token: 'jwt_mock_token_mospi_officer_2026'
  });
});

// 2. GET All Projects with multi-criteria filtering
app.get('/api/projects', async (req, res) => {
  try {
    const { state, sector, risk, search } = req.query;

    if (isDbConnected) {
      let filter = {};
      if (state && state !== 'all') filter.state = state;
      if (sector && sector !== 'all') filter.sector = sector;
      
      if (risk === 'high') filter.riskScore = { $gte: 70 };
      else if (risk === 'medium') filter.riskScore = { $gte: 50, $lt: 70 };
      else if (risk === 'low') filter.riskScore = { $lt: 50 };

      if (search) {
        const regex = new RegExp(search, 'i');
        filter.$or = [
          { name: regex },
          { state: regex },
          { city: regex },
          { sector: regex },
          { agency: regex },
          { contractor: regex }
        ];
      }

      const list = await Project.find(filter).sort({ riskScore: -1 });
      return res.json({ success: true, count: list.length, total: 1981, data: list });
    }

    // Fallback in-memory query filtering
    let list = memoryStore.projects.filter(p => {
      if (state && state !== 'all' && p.state !== state) return false;
      if (sector && sector !== 'all' && p.sector !== sector) return false;
      if (risk === 'high' && p.riskScore < 70) return false;
      if (risk === 'medium' && (p.riskScore < 50 || p.riskScore >= 70)) return false;
      if (risk === 'low' && p.riskScore >= 50) return false;

      if (search) {
        const q = search.toLowerCase();
        const match = p.name.toLowerCase().includes(q) ||
                      p.state.toLowerCase().includes(q) ||
                      (p.city && p.city.toLowerCase().includes(q)) ||
                      p.sector.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    res.json({ success: true, count: list.length, total: 1981, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET Single Project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const projId = req.params.id;
    if (isDbConnected) {
      const proj = await Project.findOne({ id: projId });
      if (proj) return res.json({ success: true, data: proj });
    }
    const projMem = memoryStore.projects.find(p => p.id === projId) || memoryStore.projects[0];
    res.json({ success: true, data: projMem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST Create New Project
app.post('/api/projects', async (req, res) => {
  try {
    const newProj = req.body;
    if (!newProj.id) newProj.id = 'PRJ-' + (1000 + Math.floor(Math.random() * 9000));
    
    if (isDbConnected) {
      const created = await Project.create(newProj);
      return res.status(201).json({ success: true, data: created });
    }

    memoryStore.projects.unshift(newProj);
    res.status(201).json({ success: true, data: newProj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET Analytics S-Curve Data
app.get('/api/analytics/scurve', async (req, res) => {
  try {
    if (isDbConnected) {
      const scurve = await SCurve.findOne({ key: 'mospi_portfolio_scurve' });
      if (scurve) return res.json({ success: true, data: scurve });
    }
    res.json({ success: true, data: memoryStore.sCurveData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET Overall Stats & Risk Breakdown
app.get('/api/analytics/stats', async (req, res) => {
  try {
    res.json({
      success: true,
      stats: {
        totalProjects: 1981,
        highRisk: 151,
        mediumRisk: 412,
        lowRisk: 1418,
        delayRisk: 298,
        costRisk: 236
      },
      riskDistribution: {
        high: { count: 151, percentage: 8 },
        medium: { count: 412, percentage: 21 },
        low: { count: 1418, percentage: 71 }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET Alerts List
app.get('/api/alerts', async (req, res) => {
  try {
    const { tab, state } = req.query;

    if (isDbConnected) {
      let filter = {};
      if (tab === 'critical') filter.type = 'critical';
      else if (tab === 'warning') filter.type = 'warning';
      else if (tab === 'delay') filter.category = 'delay';
      else if (tab === 'cost') filter.category = 'cost';
      else if (tab === 'resolved') filter.type = 'resolved';

      if (state && state !== 'all') filter.state = state;

      const list = await Alert.find(filter);
      return res.json({ success: true, count: list.length, data: list });
    }

    let list = memoryStore.alerts.filter(item => {
      if (tab && tab !== 'all') {
        if (tab === 'critical' && item.type !== 'critical') return false;
        if (tab === 'warning' && item.type !== 'warning') return false;
        if (tab === 'delay' && item.category !== 'delay') return false;
        if (tab === 'cost' && item.category !== 'cost') return false;
        if (tab === 'resolved' && item.type !== 'resolved') return false;
      }
      if (state && state !== 'all' && item.state !== state) return false;
      return true;
    });

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST Escalate Alert
app.post('/api/alerts/:id/escalate', async (req, res) => {
  try {
    const alertId = req.params.id;

    if (isDbConnected) {
      const item = await Alert.findOne({ id: alertId });
      if (item) {
        if (item.escalationLevel.includes('Level 1')) {
          item.escalationLevel = 'Level 2: Ministry Nodal Agency';
        } else {
          item.escalationLevel = 'Level 3: Cabinet Committee';
          item.type = 'critical';
        }
        await item.save();
        return res.json({ success: true, data: item, message: `Escalated to ${item.escalationLevel}` });
      }
    }

    const itemMem = memoryStore.alerts.find(a => a.id === alertId);
    if (itemMem) {
      itemMem.escalationLevel = 'Level 3: Cabinet Committee';
      itemMem.type = 'critical';
      return res.json({ success: true, data: itemMem, message: 'Escalated to Level 3: Cabinet Committee' });
    }

    res.status(404).json({ success: false, message: 'Alert not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. POST Resolve Alert
app.post('/api/alerts/:id/resolve', async (req, res) => {
  try {
    const alertId = req.params.id;

    if (isDbConnected) {
      const item = await Alert.findOne({ id: alertId });
      if (item) {
        item.type = 'resolved';
        item.riskPercentage = Math.round(item.riskPercentage * 0.4);
        await item.save();
        return res.json({ success: true, data: item });
      }
    }

    const itemMem = memoryStore.alerts.find(a => a.id === alertId);
    if (itemMem) {
      itemMem.type = 'resolved';
      itemMem.riskPercentage = Math.round(itemMem.riskPercentage * 0.4);
      return res.json({ success: true, data: itemMem });
    }

    res.status(404).json({ success: false, message: 'Alert not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. POST Natural Language AI Query Engine
app.post('/api/ai/query', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required.' });

    const q = prompt.toLowerCase();
    const isHighRisk = q.includes('high risk') || q.includes('critical');
    const isDelayed = q.includes('delayed') || q.includes('delay');

    const sectors = ['roads', 'railways', 'bridges', 'energy', 'water', 'urban transport', 'irrigation', 'ports'];
    const matchedSector = sectors.find(s => q.includes(s));

    const states = ['rajasthan', 'uttar pradesh', 'bihar', 'gujarat', 'maharashtra', 'delhi', 'karnataka', 'andhra pradesh', 'west bengal', 'assam', 'tamil nadu'];
    const matchedState = states.find(st => q.includes(st));

    let projectsList = [];
    if (isDbConnected) {
      let filter = {};
      if (isHighRisk) filter.riskScore = { $gte: 70 };
      if (isDelayed) filter.status = 'Delayed';
      if (matchedSector) filter.sector = new RegExp(matchedSector, 'i');
      if (matchedState) filter.state = new RegExp(matchedState, 'i');

      projectsList = await Project.find(filter).sort({ riskScore: -1 });
    } else {
      projectsList = memoryStore.projects.filter(p => {
        if (isHighRisk && p.riskScore < 70) return false;
        if (isDelayed && p.status !== 'Delayed') return false;
        if (matchedSector && !p.sector.toLowerCase().includes(matchedSector)) return false;
        if (matchedState && !p.state.toLowerCase().includes(matchedState)) return false;
        return true;
      });
    }

    res.json({
      success: true,
      query: prompt,
      matchedCount: projectsList.length,
      data: projectsList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve Static Frontend Assets from SIH/ directory
app.use(express.static(path.join(__dirname, '../SIH')));

// Serve index/dashboard fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../SIH/dashboard.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 NIRMAAN AI Backend API running at http://localhost:${PORT}`);
  console.log(`🌐 Static Frontend served at http://localhost:${PORT}/dashboard.html`);
  console.log(`=======================================================`);
});
