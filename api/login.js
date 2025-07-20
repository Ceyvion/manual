const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'afropop-operations-manual-secret-key-2024-secure';

// Initialize database
function initDatabase() {
    const dbPath = '/tmp/afropop_storage.db';
    const db = new sqlite3.Database(dbPath);
    
    // Create tables if they don't exist
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS auth_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_name TEXT UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            category TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            storage_type TEXT NOT NULL,
            file_data BLOB,
            file_url TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Initialize default password if not exists
        db.get("SELECT setting_value FROM auth_settings WHERE setting_name = 'admin_password'", 
            async (err, row) => {
                if (!row) {
                    const defaultPassword = 'afropop123';
                    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
                    db.run(`INSERT INTO auth_settings (setting_name, setting_value) VALUES ('admin_password', ?)`, 
                        [hashedPassword]);
                }
            });
    });
    
    return db;
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Password required' });
        }

        const db = initDatabase();

        // Get stored password hash
        db.get("SELECT setting_value FROM auth_settings WHERE setting_name = 'admin_password'", 
            async (err, row) => {
                if (err) {
                    db.close();
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!row) {
                    db.close();
                    return res.status(500).json({ error: 'Admin password not configured' });
                }

                const validPassword = await bcrypt.compare(password, row.setting_value);
                
                if (!validPassword) {
                    db.close();
                    return res.status(401).json({ error: 'Invalid password' });
                }

                const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
                db.close();
                res.json({ token, message: 'Login successful' });
            });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}