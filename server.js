const express = require('express');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'skb-enterprises-secret-2026';
const DB_PATH = path.join(__dirname, 'skb_database.sqlite');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

let db;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT DEFAULT '',
    service TEXT NOT NULL,
    city TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT 'quote',
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    service TEXT NOT NULL,
    city TEXT DEFAULT '',
    message TEXT DEFAULT '',
    preferred_date TEXT DEFAULT '',
    time_slot TEXT DEFAULT '',
    address TEXT DEFAULT '',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'new',
    assigned_engineer_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS engineers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    level TEXT NOT NULL DEFAULT 'L1',
    specialization TEXT DEFAULT '',
    city TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    active_tasks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS amc_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    type TEXT NOT NULL,
    devices INTEGER DEFAULT 0,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    value REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    amount REAL NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS career_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    position TEXT NOT NULL,
    resume_link TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // User system tables
  try { db.run("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN address TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN profile_picture TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE service_requests ADD COLUMN user_id INTEGER DEFAULT NULL"); } catch(e) {}

  db.run(`CREATE TABLE IF NOT EXISTS ticket_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_request_id INTEGER NOT NULL,
    update_text TEXT NOT NULL,
    updated_by TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed admin
  const adminRow = db.exec("SELECT id FROM users WHERE email = 'skbcomputer@Outlook.com'");
  if (!adminRow.length || !adminRow[0].values.length) {
    const hash = bcrypt.hashSync('Kannu@1984!@#', 10);
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ['Admin', 'skbcomputer@Outlook.com', hash, 'admin']);
  }

  // Seed sample engineers
  const engRows = db.exec("SELECT COUNT(*) as c FROM engineers");
  if (engRows[0].values[0][0] === 0) {
    const engineers = [
      ['Ravi Kumar','9876543201','ravi@skb.com','L3','Server & Cloud','Delhi NCR','available',1],
      ['Mohit Sharma','9876543202','mohit@skb.com','L2','Networking','Mumbai','on_task',2],
      ['Arun Patel','9876543203','arun@skb.com','L2','Hardware','Pune','available',0],
      ['Suresh Nair','9876543204','suresh@skb.com','L1','Desktop Support','Bengaluru','on_task',1],
      ['Vinod Singh','9876543205','vinod@skb.com','L3','Server & Security','Chennai','available',0],
      ['Deepak Verma','9876543206','deepak@skb.com','L2','CCTV & Security','Hyderabad','on_task',3],
      ['Anil Gupta','9876543207','anil@skb.com','L1','Desktop Support','Delhi NCR','available',0],
      ['Rajesh Yadav','9876543208','rajesh@skb.com','L2','Network & WiFi','Kolkata','available',0],
    ];
    const stmt = db.prepare("INSERT INTO engineers (name,phone,email,level,specialization,city,status,active_tasks) VALUES (?,?,?,?,?,?,?,?)");
    engineers.forEach(e => { stmt.run(e); });
    stmt.free();
  }

  // Seed sample AMC
  const amcRows = db.exec("SELECT COUNT(*) as c FROM amc_contracts");
  if (amcRows[0].values[0][0] === 0) {
    const amcs = [
      ['National Bank','Enterprise AMC',200,'2026-01-01','2026-12-31',1200000,'active'],
      ['MedHealth Hospitals','Office AMC',75,'2026-03-01','2027-02-28',525000,'active'],
      ['Apex Manufacturing','Desktop AMC',500,'2026-04-01','2027-03-31',2250000,'active'],
      ['DPS School Chain','Office AMC',120,'2026-02-01','2027-01-31',420000,'active'],
      ['RetailMax','Enterprise AMC',75,'2026-06-01','2027-05-31',675000,'active'],
    ];
    const stmt = db.prepare("INSERT INTO amc_contracts (client_name,type,devices,start_date,end_date,value,status) VALUES (?,?,?,?,?,?,?)");
    amcs.forEach(a => { stmt.run(a); });
    stmt.free();
  }

  // Seed sample invoices
  const invRows = db.exec("SELECT COUNT(*) as c FROM invoices");
  if (invRows[0].values[0][0] === 0) {
    const invoices = [
      ['INV-2026-001','National Bank','AMC Q2 Payment',300000,'2026-07-15','paid'],
      ['INV-2026-002','MedHealth Hospitals','AMC Q2 Payment',131250,'2026-07-20','paid'],
      ['INV-2026-003','Apex Manufacturing','Server Deployment + AMC',562500,'2026-07-25','pending'],
      ['INV-2026-004','ABC Corp','Server Emergency Repair',45000,'2026-07-10','overdue'],
      ['INV-2026-005','DPS Schools','CCTV Installation',280000,'2026-07-18','paid'],
    ];
    const stmt = db.prepare("INSERT INTO invoices (invoice_number,client_name,description,amount,due_date,status) VALUES (?,?,?,?,?,?)");
    invoices.forEach(i => { stmt.run(i); });
    stmt.free();
  }

  saveDB();
  console.log('Database initialized.');
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper: run query and return all rows as array of objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function runSQL(sql, params = []) {
  db.run(sql, params);
  const lastId = queryOne("SELECT last_insert_rowid() as id");
  saveDB();
  return lastId ? lastId.id : null;
}

// --- Auth Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ===========================
//         AUTH
// ===========================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// ===========================
//     USER AUTH & PROFILE
// ===========================
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const id = runSQL(
    'INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, hash, 'user', phone || '', address || '']
  );
  const token = jwt.sign({ id, email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
  res.status(201).json({ token, user: { id, name, email, role: 'user', phone: phone || '', address: address || '' } });
});

app.get('/api/user/profile', authenticateToken, (req, res) => {
  const user = queryOne('SELECT id, name, email, phone, address, profile_picture, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/user/profile', authenticateToken, (req, res) => {
  const { name, phone, address, profile_picture } = req.body;
  if (name) runSQL('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
  if (phone !== undefined) runSQL('UPDATE users SET phone = ? WHERE id = ?', [phone, req.user.id]);
  if (address !== undefined) runSQL('UPDATE users SET address = ? WHERE id = ?', [address, req.user.id]);
  if (profile_picture !== undefined) runSQL('UPDATE users SET profile_picture = ? WHERE id = ?', [profile_picture, req.user.id]);
  const user = queryOne('SELECT id, name, email, phone, address, profile_picture, role FROM users WHERE id = ?', [req.user.id]);
  res.json({ message: 'Profile updated', user });
});

app.get('/api/user/tickets', authenticateToken, (req, res) => {
  const tickets = queryAll(
    'SELECT sr.*, e.name as engineer_name FROM service_requests sr LEFT JOIN engineers e ON sr.assigned_engineer_id = e.id WHERE sr.user_id = ? ORDER BY sr.created_at DESC',
    [req.user.id]
  );
  res.json(tickets);
});

app.get('/api/user/tickets/:id/updates', authenticateToken, (req, res) => {
  const updates = queryAll(
    'SELECT * FROM ticket_updates WHERE service_request_id = ? ORDER BY created_at DESC',
    [parseInt(req.params.id)]
  );
  res.json(updates);
});

app.post('/api/user/tickets', authenticateToken, (req, res) => {
  const { service, city, message, preferred_date, time_slot, address, priority } = req.body;
  if (!service) {
    return res.status(400).json({ error: 'Service is required' });
  }
  const user = queryOne('SELECT name, phone, email FROM users WHERE id = ?', [req.user.id]);
  const id = runSQL(
    'INSERT INTO service_requests (type,name,phone,email,service,city,message,preferred_date,time_slot,address,priority,user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    ['user_ticket', user.name, user.phone || '', user.email, service, city || '', message || '', preferred_date || '', time_slot || '', address || '', priority || 'medium', req.user.id]
  );
  res.status(201).json({ id, message: 'Ticket created successfully' });
});

// Admin: add ticket update
app.post('/api/service-requests/:id/updates', authenticateToken, (req, res) => {
  const { update_text } = req.body;
  if (!update_text) return res.status(400).json({ error: 'Update text is required' });
  const id = runSQL(
    'INSERT INTO ticket_updates (service_request_id, update_text, updated_by) VALUES (?, ?, ?)',
    [parseInt(req.params.id), update_text, req.user.email]
  );
  res.status(201).json({ id, message: 'Update added' });
});

// ===========================
//         LEADS
// ===========================
app.post('/api/leads', (req, res) => {
  const { name, phone, email, company, service, city, message } = req.body;
  if (!name || !phone || !email || !service || !city) {
    return res.status(400).json({ error: 'Name, phone, email, service, and city are required' });
  }
  const id = runSQL('INSERT INTO leads (name,phone,email,company,service,city,message) VALUES (?,?,?,?,?,?,?)',
    [name, phone, email, company||'', service, city, message||'']);
  res.status(201).json({ id, message: 'Lead submitted successfully' });
});

app.get('/api/leads', authenticateToken, (req, res) => {
  const { status, service, search } = req.query;
  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  if (service && service !== 'all') { sql += ' AND service = ?'; params.push(service); }
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  res.json(queryAll(sql, params));
});

app.put('/api/leads/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  runSQL('UPDATE leads SET status = ? WHERE id = ?', [status, parseInt(req.params.id)]);
  res.json({ message: 'Lead updated' });
});

// ===========================
//     SERVICE REQUESTS
// ===========================
app.post('/api/service-requests', (req, res) => {
  const { type, name, phone, email, service, city, message, preferred_date, time_slot, address, priority } = req.body;
  if (!name || !phone || !service) {
    return res.status(400).json({ error: 'Name, phone, and service are required' });
  }
  const id = runSQL(
    'INSERT INTO service_requests (type,name,phone,email,service,city,message,preferred_date,time_slot,address,priority) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [type||'quote', name, phone, email||'', service, city||'', message||'', preferred_date||'', time_slot||'', address||'', priority||'medium']
  );
  res.status(201).json({ id, message: 'Service request submitted successfully' });
});

app.get('/api/service-requests', authenticateToken, (req, res) => {
  const { status, priority } = req.query;
  let sql = 'SELECT sr.*, e.name as engineer_name FROM service_requests sr LEFT JOIN engineers e ON sr.assigned_engineer_id = e.id WHERE 1=1';
  const params = [];
  if (status && status !== 'all') { sql += ' AND sr.status = ?'; params.push(status); }
  if (priority && priority !== 'all') { sql += ' AND sr.priority = ?'; params.push(priority); }
  sql += ' ORDER BY sr.created_at DESC';
  res.json(queryAll(sql, params));
});

app.put('/api/service-requests/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { status, priority, assigned_engineer_id } = req.body;
  if (status) runSQL('UPDATE service_requests SET status = ? WHERE id = ?', [status, id]);
  if (priority) runSQL('UPDATE service_requests SET priority = ? WHERE id = ?', [priority, id]);
  if (assigned_engineer_id !== undefined) runSQL('UPDATE service_requests SET assigned_engineer_id = ? WHERE id = ?', [assigned_engineer_id || null, id]);
  res.json({ message: 'Service request updated' });
});

// ===========================
//        ENGINEERS
// ===========================
app.get('/api/engineers', authenticateToken, (req, res) => {
  const { city, level, status } = req.query;
  let sql = 'SELECT * FROM engineers WHERE 1=1';
  const params = [];
  if (city && city !== 'all') { sql += ' AND city = ?'; params.push(city); }
  if (level && level !== 'all') { sql += ' AND level = ?'; params.push(level); }
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY name';
  res.json(queryAll(sql, params));
});

app.post('/api/engineers', authenticateToken, (req, res) => {
  const { name, phone, email, level, specialization, city } = req.body;
  if (!name || !city) return res.status(400).json({ error: 'Name and city are required' });
  const id = runSQL('INSERT INTO engineers (name,phone,email,level,specialization,city) VALUES (?,?,?,?,?,?)',
    [name, phone||'', email||'', level||'L1', specialization||'', city]);
  res.status(201).json({ id, message: 'Engineer added' });
});

app.put('/api/engineers/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { status, active_tasks } = req.body;
  if (status) runSQL('UPDATE engineers SET status = ? WHERE id = ?', [status, id]);
  if (active_tasks !== undefined) runSQL('UPDATE engineers SET active_tasks = ? WHERE id = ?', [active_tasks, id]);
  res.json({ message: 'Engineer updated' });
});

// ===========================
//      AMC CONTRACTS
// ===========================
app.get('/api/amc', authenticateToken, (req, res) => {
  const { status, type } = req.query;
  let sql = 'SELECT * FROM amc_contracts WHERE 1=1';
  const params = [];
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  if (type && type !== 'all') { sql += ' AND type = ?'; params.push(type); }
  sql += ' ORDER BY created_at DESC';
  res.json(queryAll(sql, params));
});

app.post('/api/amc', authenticateToken, (req, res) => {
  const { client_name, type, devices, start_date, end_date, value } = req.body;
  if (!client_name || !type || !start_date || !end_date) {
    return res.status(400).json({ error: 'Client name, type, start and end dates are required' });
  }
  const id = runSQL('INSERT INTO amc_contracts (client_name,type,devices,start_date,end_date,value) VALUES (?,?,?,?,?,?)',
    [client_name, type, devices||0, start_date, end_date, value||0]);
  res.status(201).json({ id, message: 'AMC contract created' });
});

app.put('/api/amc/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { client_name, type, devices, start_date, end_date, value, status } = req.body;
  const fields = [];
  const params = [];
  if (client_name !== undefined) { fields.push('client_name = ?'); params.push(client_name); }
  if (type !== undefined) { fields.push('type = ?'); params.push(type); }
  if (devices !== undefined) { fields.push('devices = ?'); params.push(devices); }
  if (start_date !== undefined) { fields.push('start_date = ?'); params.push(start_date); }
  if (end_date !== undefined) { fields.push('end_date = ?'); params.push(end_date); }
  if (value !== undefined) { fields.push('value = ?'); params.push(value); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(id);
  runSQL(`UPDATE amc_contracts SET ${fields.join(', ')} WHERE id = ?`, params);
  res.json({ message: 'AMC contract updated' });
});

app.delete('/api/amc/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  runSQL('DELETE FROM amc_contracts WHERE id = ?', [id]);
  res.json({ message: 'AMC contract deleted' });
});

// ===========================
//        INVOICES
// ===========================
app.get('/api/invoices', authenticateToken, (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM invoices WHERE 1=1';
  const params = [];
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  res.json(queryAll(sql, params));
});

app.post('/api/invoices', authenticateToken, (req, res) => {
  const { invoice_number, client_name, description, amount, due_date } = req.body;
  if (!invoice_number || !client_name || !amount || !due_date) {
    return res.status(400).json({ error: 'Invoice number, client, amount, and due date are required' });
  }
  const id = runSQL('INSERT INTO invoices (invoice_number,client_name,description,amount,due_date) VALUES (?,?,?,?,?)',
    [invoice_number, client_name, description||'', amount, due_date]);
  res.status(201).json({ id, message: 'Invoice created' });
});

app.put('/api/invoices/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  runSQL('UPDATE invoices SET status = ? WHERE id = ?', [status, parseInt(req.params.id)]);
  res.json({ message: 'Invoice updated' });
});

// ===========================
//      CAREERS
// ===========================
app.post('/api/careers', (req, res) => {
  const { name, email, phone, position, resume_link } = req.body;
  if (!name || !email || !phone || !position) {
    return res.status(400).json({ error: 'Name, email, phone, and position are required' });
  }
  const id = runSQL('INSERT INTO career_applications (name,email,phone,position,resume_link) VALUES (?,?,?,?,?)',
    [name, email, phone, position, resume_link||'']);
  res.status(201).json({ id, message: 'Application submitted successfully' });
});

app.get('/api/careers', authenticateToken, (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM career_applications WHERE 1=1';
  const params = [];
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  res.json(queryAll(sql, params));
});

app.put('/api/careers/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  runSQL('UPDATE career_applications SET status = ? WHERE id = ?', [status, parseInt(req.params.id)]);
  res.json({ message: 'Application updated' });
});

// ===========================
//      DASHBOARD STATS
// ===========================
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalLeads = queryOne('SELECT COUNT(*) as count FROM leads').count;
  const totalSR = queryOne('SELECT COUNT(*) as count FROM service_requests').count;
  const activeSR = queryOne("SELECT COUNT(*) as count FROM service_requests WHERE status IN ('new','assigned','in_progress')").count;
  const totalAMC = queryOne("SELECT COUNT(*) as count FROM amc_contracts WHERE status = 'active'").count;
  const totalRevenue = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'").total;
  const totalEngineers = queryOne('SELECT COUNT(*) as count FROM engineers').count;
  const availableEngineers = queryOne("SELECT COUNT(*) as count FROM engineers WHERE status = 'available'").count;
  const pendingInvoices = queryOne("SELECT COUNT(*) as count FROM invoices WHERE status IN ('pending','overdue')").count;

  const leadsByStatus = queryAll('SELECT status, COUNT(*) as count FROM leads GROUP BY status');
  const srByCity = queryAll('SELECT city, COUNT(*) as count FROM service_requests GROUP BY city ORDER BY count DESC');
  const revenueByMonth = queryAll(`
    SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as total
    FROM invoices WHERE status = 'paid'
    GROUP BY month ORDER BY month DESC LIMIT 6
  `);

  const recentLeads = queryAll('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5');
  const recentSR = queryAll('SELECT sr.*, e.name as engineer_name FROM service_requests sr LEFT JOIN engineers e ON sr.assigned_engineer_id = e.id ORDER BY sr.created_at DESC LIMIT 5');

  res.json({
    totalLeads, totalSR, activeSR, totalAMC, totalRevenue,
    totalEngineers, availableEngineers, pendingInvoices,
    leadsByStatus, srByCity, revenueByMonth,
    recentLeads, recentSR
  });
});

// --- Frontend Routes ---
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'dashboard.html')));
app.get('/pages/login.html', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'login.html')));
app.get('/pages/login', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'login.html')));
app.get('/user/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'user', 'dashboard.html')));
app.get('/user', (req, res) => res.sendFile(path.join(__dirname, 'user', 'dashboard.html')));

// --- Start ---
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  SKB Enterprises Backend Server`);
    console.log(`  URL:        http://localhost:${PORT}`);
    console.log(`  Admin:      http://localhost:${PORT}/admin/dashboard`);
    console.log(`  API:        http://localhost:${PORT}/api`);
    console.log(`  Login:      skbcomputer@Outlook.com`);
    console.log(`  Password:   Kannu@1984!@#`);
    console.log(`========================================\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
