import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("drought_system.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS villages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    block TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    population INTEGER,
    latitude REAL,
    longitude REAL,
    water_source TEXT,
    base_water_demand INTEGER
  );

  CREATE TABLE IF NOT EXISTS drought_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id INTEGER,
    date TEXT,
    rainfall_deviation REAL,
    groundwater_level REAL,
    groundwater_velocity REAL,
    water_stress_index REAL,
    risk_level TEXT, -- 'Green', 'Orange', 'Red'
    FOREIGN KEY(village_id) REFERENCES villages(id)
  );

  CREATE TABLE IF NOT EXISTS tankers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_no TEXT UNIQUE,
    capacity_liters INTEGER,
    current_load_percentage INTEGER DEFAULT 100,
    assigned_state TEXT,
    assigned_district TEXT,
    assigned_block TEXT,
    assigned_village_id INTEGER,
    source_point TEXT,
    status TEXT, -- 'Available', 'In Transit', 'Delivering', 'Maintenance'
    current_lat REAL,
    current_lng REAL,
    last_updated TEXT,
    FOREIGN KEY(assigned_village_id) REFERENCES villages(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'Critical', 'Warning', 'Info'
    message TEXT,
    location_id INTEGER, -- village_id
    tanker_id INTEGER,
    timestamp TEXT,
    status TEXT DEFAULT 'Active',
    FOREIGN KEY(location_id) REFERENCES villages(id),
    FOREIGN KEY(tanker_id) REFERENCES tankers(id)
  );

  CREATE TABLE IF NOT EXISTS deployments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanker_id INTEGER,
    village_id INTEGER,
    scheduled_date TEXT,
    status TEXT, -- 'Pending', 'Delivered', 'Cancelled'
    volume_delivered INTEGER,
    cost_estimated REAL,
    fuel_consumed REAL,
    FOREIGN KEY(tanker_id) REFERENCES tankers(id),
    FOREIGN KEY(village_id) REFERENCES villages(id)
  );
`);

// Seed initial data if empty
const villageCount = db.prepare("SELECT COUNT(*) as count FROM villages").get() as { count: number };
if (villageCount.count === 0) {
  const statesData = [
    { name: "Andhra Pradesh", districts: ["Anantapur", "Chittoor", "Kurnool"] },
    { name: "Arunachal Pradesh", districts: ["Tawang", "West Kameng"] },
    { name: "Assam", districts: ["Kamrup", "Dibrugarh"] },
    { name: "Bihar", districts: ["Patna", "Gaya", "Muzaffarpur"] },
    { name: "Chhattisgarh", districts: ["Raipur", "Bastar"] },
    { name: "Goa", districts: ["North Goa", "South Goa"] },
    { name: "Gujarat", districts: ["Ahmedabad", "Rajkot", "Kutch"] },
    { name: "Haryana", districts: ["Gurugram", "Hisar"] },
    { name: "Himachal Pradesh", districts: ["Shimla", "Kangra"] },
    { name: "Jharkhand", districts: ["Ranchi", "Dhanbad"] },
    { name: "Karnataka", districts: ["Bengaluru", "Mysuru", "Belagavi"] },
    { name: "Kerala", districts: ["Thiruvananthapuram", "Kochi"] },
    { name: "Madhya Pradesh", districts: ["Bhopal", "Indore", "Gwalior"] },
    { name: "Maharashtra", districts: ["Mumbai", "Pune", "Nagpur", "Latur", "Beed"] },
    { name: "Manipur", districts: ["Imphal East", "Imphal West"] },
    { name: "Meghalaya", districts: ["East Khasi Hills", "West Garo Hills"] },
    { name: "Mizoram", districts: ["Aizawl", "Lunglei"] },
    { name: "Nagaland", districts: ["Kohima", "Dimapur"] },
    { name: "Odisha", districts: ["Bhubaneswar", "Cuttack"] },
    { name: "Punjab", districts: ["Ludhiana", "Amritsar"] },
    { name: "Rajasthan", districts: ["Jaipur", "Jodhpur", "Udaipur"] },
    { name: "Sikkim", districts: ["Gangtok", "Namchi"] },
    { name: "Tamil Nadu", districts: ["Chennai", "Coimbatore", "Madurai"] },
    { name: "Telangana", districts: ["Hyderabad", "Warangal"] },
    { name: "Tripura", districts: ["Agartala", "Udaipur"] },
    { name: "Uttar Pradesh", districts: ["Lucknow", "Kanpur", "Varanasi"] },
    { name: "Uttarakhand", districts: ["Dehradun", "Haridwar"] },
    { name: "West Bengal", districts: ["Kolkata", "Darjeeling"] },
    { name: "Delhi", districts: ["New Delhi", "North Delhi"] },
    { name: "Jammu & Kashmir", districts: ["Srinagar", "Jammu"] },
    { name: "Ladakh", districts: ["Leh", "Kargil"] },
    { name: "Puducherry", districts: ["Puducherry", "Karaikal"] },
    { name: "Andaman & Nicobar", districts: ["Port Blair"] },
    { name: "Chandigarh", districts: ["Chandigarh"] },
    { name: "Dadra & Nagar Haveli", districts: ["Silvassa"] },
    { name: "Lakshadweep", districts: ["Kavaratti"] }
  ];

  const insertVillage = db.prepare(`
    INSERT INTO villages (name, block, district, state, population, latitude, longitude, water_source, base_water_demand)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMetric = db.prepare(`
    INSERT INTO drought_metrics (village_id, date, rainfall_deviation, groundwater_level, groundwater_velocity, water_stress_index, risk_level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  statesData.forEach(s => {
    s.districts.forEach(d => {
      // Create 3 villages per district for national coverage simulation
      for (let i = 1; i <= 3; i++) {
        const vName = `${d} Village ${i}`;
        const lat = 20 + (Math.random() - 0.5) * 15; // Rough India bounds
        const lng = 78 + (Math.random() - 0.5) * 15;
        const pop = Math.floor(Math.random() * 5000) + 500;
        const result = insertVillage.run(vName, "Block A", d, s.name, pop, lat, lng, "Borewell", pop * 20);
        
        const vId = result.lastInsertRowid;
        const rDev = (Math.random() * -60).toFixed(2);
        const gwLevel = (Math.random() * 50 + 20).toFixed(2);
        const wsi = Math.random() * 100;
        let risk = "Green";
        if (wsi > 70) risk = "Red";
        else if (wsi > 40) risk = "Orange";

        insertMetric.run(vId, new Date().toISOString(), rDev, gwLevel, -1.2, wsi, risk);
      }
    });
  });

  // Seed Tankers
  const insertTanker = db.prepare(`
    INSERT INTO tankers (
      registration_no, capacity_liters, status, current_lat, current_lng, 
      assigned_state, assigned_district, assigned_block, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTanker.run("MH-24-AB-1234", 10000, "Available", 18.4088, 76.5604, "Maharashtra", "Latur", "Block A", new Date().toISOString());
  insertTanker.run("MH-24-CD-5678", 12000, "In Transit", 18.9891, 75.7601, "Maharashtra", "Beed", "Block B", new Date().toISOString());
  insertTanker.run("RJ-19-XY-9999", 15000, "Available", 26.2389, 73.0243, "Rajasthan", "Jodhpur", "Block C", new Date().toISOString());

  // Seed Alerts
  const insertAlert = db.prepare("INSERT INTO alerts (type, message, location_id, timestamp) VALUES (?, ?, ?, ?)");
  insertAlert.run("Critical", "Village 1 in Latur needs tanker urgently", 1, new Date().toISOString());
  insertAlert.run("Warning", "Groundwater level critical in Village 3", 3, new Date().toISOString());

  // Seed Deployments for reports
  const insertDeployment = db.prepare(`
    INSERT INTO deployments (tanker_id, village_id, scheduled_date, status, volume_delivered, cost_estimated, fuel_consumed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertDeployment.run(1, 1, new Date().toISOString(), "Delivered", 10000, 1500, 45);
  insertDeployment.run(2, 6, new Date().toISOString(), "Delivered", 12000, 1800, 52);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/dashboard/stats", (req, res) => {
    const { state, district } = req.query;
    let villageQuery = "SELECT id FROM villages WHERE 1=1";
    const params: any[] = [];
    if (state) { villageQuery += " AND state = ?"; params.push(state); }
    if (district) { villageQuery += " AND district = ?"; params.push(district); }

    const totalVillages = db.prepare(`SELECT COUNT(*) as count FROM villages WHERE id IN (${villageQuery})`).get(...params) as any;
    const criticalVillages = db.prepare(`
      SELECT COUNT(*) as count FROM drought_metrics 
      WHERE risk_level = 'Red' AND village_id IN (${villageQuery})
    `).get(...params) as any;
    const activeTankers = db.prepare(`
      SELECT COUNT(*) as count FROM tankers 
      WHERE status = 'In Transit' ${state ? 'AND assigned_state = ?' : ''} ${district ? 'AND assigned_district = ?' : ''}
    `).get(...(state ? (district ? [state, district] : [state]) : [])) as any;
    
    const waterDemand = db.prepare(`SELECT SUM(base_water_demand) as total FROM villages WHERE id IN (${villageQuery})`).get(...params) as any;
    
    res.json({
      totalVillages: totalVillages.count,
      criticalVillages: criticalVillages.count,
      activeTankers: activeTankers.count,
      waterGapLiters: (waterDemand.total || 0) * 0.4
    });
  });

  app.get("/api/villages", (req, res) => {
    const { state, district } = req.query;
    let query = `
      SELECT v.*, m.risk_level, m.water_stress_index, m.rainfall_deviation, m.groundwater_level
      FROM villages v
      JOIN drought_metrics m ON v.id = m.village_id
      WHERE m.id IN (SELECT MAX(id) FROM drought_metrics GROUP BY village_id)
    `;
    const params: any[] = [];
    if (state) { query += " AND v.state = ?"; params.push(state); }
    if (district) { query += " AND v.district = ?"; params.push(district); }
    
    const villages = db.prepare(query).all(...params);
    res.json(villages);
  });

  app.get("/api/tankers", (req, res) => {
    const { state, district } = req.query;
    let query = "SELECT * FROM tankers WHERE 1=1";
    const params: any[] = [];
    if (state) { query += " AND assigned_state = ?"; params.push(state); }
    if (district) { query += " AND assigned_district = ?"; params.push(district); }
    
    const tankers = db.prepare(query).all(...params);
    res.json(tankers);
  });

  app.get("/api/locations/hierarchy", (req, res) => {
    const states = db.prepare("SELECT DISTINCT state FROM villages").all();
    const districts = db.prepare("SELECT DISTINCT state, district FROM villages").all();
    const blocks = db.prepare("SELECT DISTINCT district, block FROM villages").all();
    const villages = db.prepare("SELECT id, name, block, district, state FROM villages").all();
    res.json({ states, districts, blocks, villages });
  });

  app.post("/api/tankers", (req, res) => {
    const { 
      registration_no, capacity_liters, assigned_state, 
      assigned_district, assigned_block, assigned_village_id, 
      source_point, status 
    } = req.body;

    try {
      const village = db.prepare("SELECT latitude, longitude FROM villages WHERE id = ?").get(assigned_village_id) as any;
      const result = db.prepare(`
        INSERT INTO tankers (
          registration_no, capacity_liters, assigned_state, 
          assigned_district, assigned_block, assigned_village_id, 
          source_point, status, current_lat, current_lng, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        registration_no, capacity_liters, assigned_state, 
        assigned_district, assigned_block, assigned_village_id, 
        source_point, status, village?.latitude || 0, village?.longitude || 0, new Date().toISOString()
      );
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/alerts", (req, res) => {
    const { state, district } = req.query;
    let query = `
      SELECT a.*, v.name as village_name, v.district, t.registration_no as tanker_no
      FROM alerts a
      LEFT JOIN villages v ON a.location_id = v.id
      LEFT JOIN tankers t ON a.tanker_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (state) { query += " AND v.state = ?"; params.push(state); }
    if (district) { query += " AND v.district = ?"; params.push(district); }
    query += " ORDER BY a.timestamp DESC";

    const alerts = db.prepare(query).all(...params);
    res.json(alerts);
  });

  app.get("/api/reports/usage", (req, res) => {
    const { state, district } = req.query;
    let query = `
      SELECT t.registration_no, SUM(d.volume_delivered) as total_volume, COUNT(d.id) as trips, SUM(d.fuel_consumed) as total_fuel
      FROM tankers t
      JOIN deployments d ON t.id = d.tanker_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (state) { query += " AND t.assigned_state = ?"; params.push(state); }
    if (district) { query += " AND t.assigned_district = ?"; params.push(district); }
    query += " GROUP BY t.id";
    
    const report = db.prepare(query).all(...params);
    res.json(report);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
