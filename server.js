const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'afropop-operations-manual-secret-key-2024';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('afropop_storage.db');

// Initialize database tables
db.serialize(() => {
  // Files table
  db.run(`CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    category TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_type TEXT NOT NULL, -- 'direct' or 'link'
    file_data BLOB,
    file_url TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Auth table (simple single-password system)
  db.run(`CREATE TABLE IF NOT EXISTS auth_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for uploads
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Get stored password hash
    db.get("SELECT setting_value FROM auth_settings WHERE setting_name = 'admin_password'", 
      async (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
          return res.status(500).json({ error: 'Admin password not configured' });
        }

        const validPassword = await bcrypt.compare(password, row.setting_value);
        
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, message: 'Login successful' });
      });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all files
app.get('/api/files', authenticateToken, (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM files ORDER BY created_at DESC';
  let params = [];

  if (category) {
    query = 'SELECT * FROM files WHERE category = ? ORDER BY created_at DESC';
    params = [category];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Don't send file_data in list view for performance
    const files = rows.map(file => ({
      ...file,
      file_data: undefined
    }));
    
    res.json(files);
  });
});

// Get specific file
app.get('/api/files/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM files WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (row.storage_type === 'direct' && row.file_data) {
      // Return file data for direct storage
      res.set({
        'Content-Type': row.file_type,
        'Content-Disposition': `attachment; filename="${row.original_name}"`
      });
      res.send(row.file_data);
    } else if (row.storage_type === 'link') {
      // Redirect to external URL
      res.redirect(row.file_url);
    } else {
      res.status(404).json({ error: 'File data not available' });
    }
  });
});

// Upload file
app.post('/api/files', authenticateToken, upload.single('file'), (req, res) => {
  try {
    const { category, description, file_url } = req.body;
    const file = req.file;

    if (!file && !file_url) {
      return res.status(400).json({ error: 'File or URL required' });
    }

    if (!category) {
      return res.status(400).json({ error: 'Category required' });
    }

    let storage_type, file_data, filename, original_name, file_type, file_size;

    if (file) {
      // Handle uploaded file
      original_name = file.originalname;
      file_type = file.mimetype;
      file_size = file.size;
      filename = `${Date.now()}_${original_name}`;

      if (file_size <= MAX_FILE_SIZE) {
        // Store file directly in database
        storage_type = 'direct';
        file_data = file.buffer;
      } else {
        // For large files, we'd typically store in external storage
        // For now, reject files over limit without external URL
        return res.status(400).json({ 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB. Please provide a URL instead.` 
        });
      }
    } else {
      // Handle URL reference
      storage_type = 'link';
      original_name = file_url.split('/').pop() || 'External Link';
      filename = original_name;
      file_type = 'application/octet-stream'; // Generic type for links
      file_size = 0;
    }

    const query = `INSERT INTO files 
      (filename, original_name, category, file_type, file_size, storage_type, file_data, file_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [
      filename, original_name, category, file_type, file_size, 
      storage_type, file_data, file_url, description
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        id: this.lastID,
        filename,
        original_name,
        category,
        file_type,
        file_size,
        storage_type,
        message: 'File uploaded successfully'
      });
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete file
app.delete('/api/files/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM files WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ message: 'File deleted successfully' });
  });
});

// Get categories
app.get('/api/categories', authenticateToken, (req, res) => {
  db.all('SELECT DISTINCT category FROM files ORDER BY category', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const categories = rows.map(row => row.category);
    res.json(categories);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Database: afropop_storage.db`);
  console.log(`🔐 Authentication: JWT with 24h expiry`);
  console.log(`📦 File size limit: ${MAX_FILE_SIZE / 1024 / 1024}MB for direct storage`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});