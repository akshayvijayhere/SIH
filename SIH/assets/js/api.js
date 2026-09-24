/* 
   NIRMAAN AI - REST API Client
   Connects Frontend UI to Node.js & MongoDB Backend
*/

window.NIRMAAN_API = {
  baseUrl: window.location.origin.includes('5000') ? '' : 'http://localhost:5000',

  async getProjects(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${this.baseUrl}/api/projects?${params}`);
      const data = await res.json();
      if (data.success && data.data) {
        window.NIRMAAN_DATA.projects = data.data;
        return data.data;
      }
    } catch (e) {
      console.warn('API getProjects failed, fallback to local store:', e);
    }
    return window.NIRMAAN_DATA.projects;
  },

  async getProjectById(id) {
    try {
      const res = await fetch(`${this.baseUrl}/api/projects/${id}`);
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch (e) {
      console.warn('API getProjectById failed:', e);
    }
    return window.NIRMAAN_DATA.projects.find(p => p.id === id) || window.NIRMAAN_DATA.projects[0];
  },

  async getSCurveData() {
    try {
      const res = await fetch(`${this.baseUrl}/api/analytics/scurve`);
      const data = await res.json();
      if (data.success && data.data) {
        window.NIRMAAN_DATA.sCurveData = data.data;
        return data.data;
      }
    } catch (e) {
      console.warn('API getSCurveData failed:', e);
    }
    return window.NIRMAAN_DATA.sCurveData;
  },

  async getAlerts(params = {}) {
    try {
      const q = new URLSearchParams(params);
      const res = await fetch(`${this.baseUrl}/api/alerts?${q}`);
      const data = await res.json();
      if (data.success && data.data) {
        window.NIRMAAN_DATA.alerts = data.data;
        return data.data;
      }
    } catch (e) {
      console.warn('API getAlerts failed:', e);
    }
    return window.NIRMAAN_DATA.alerts;
  },

  async escalateAlert(alertId) {
    try {
      const res = await fetch(`${this.baseUrl}/api/alerts/${alertId}/escalate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) return data;
    } catch (e) {
      console.warn('API escalateAlert failed:', e);
    }
    return null;
  },

  async resolveAlert(alertId) {
    try {
      const res = await fetch(`${this.baseUrl}/api/alerts/${alertId}/resolve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) return data;
    } catch (e) {
      console.warn('API resolveAlert failed:', e);
    }
    return null;
  },

  async queryAI(prompt) {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success) return data;
    } catch (e) {
      console.warn('API queryAI failed:', e);
    }
    return null;
  }
};
