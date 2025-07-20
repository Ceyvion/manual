const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const multer = require('multer');

const JWT_SECRET = process.env.JWT_SECRET || 'afropop-operations-manual-secret-key-2024-secure';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Initialize database
function initDatabase() {
    const dbPath = '/tmp/afropop_storage.db';
    const db = new sqlite3.Database(dbPath);
    
    db.serialize(() => {
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
    });
    
    return db;
}

// Authentication middleware
function authenticateToken(token) {
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
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

    // Check authentication
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const user = authenticateToken(token);

    if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const db = initDatabase();

    try {
        if (req.method === 'GET') {
            // Get all files
            const { category } = req.query;
            let query = 'SELECT * FROM files ORDER BY created_at DESC';
            let params = [];

            if (category) {
                query = 'SELECT * FROM files WHERE category = ? ORDER BY created_at DESC';
                params = [category];
            }

            db.all(query, params, (err, rows) => {
                db.close();
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

        } else if (req.method === 'POST') {
            // Handle file upload or link addition
            const { category, description, file_url } = req.body;

            if (!file_url && !req.files) {
                db.close();
                return res.status(400).json({ error: 'File or URL required' });
            }

            if (!category) {
                db.close();
                return res.status(400).json({ error: 'Category required' });
            }

            let storage_type, file_data, filename, original_name, file_type, file_size;

            if (file_url) {
                // Handle URL reference
                storage_type = 'link';
                original_name = file_url.split('/').pop() || 'External Link';
                filename = original_name;
                file_type = 'application/octet-stream';
                file_size = 0;
            } else {
                // Handle uploaded file (simplified for serverless)
                db.close();
                return res.status(400).json({ error: 'File upload not supported in this version. Please use external URLs.' });
            }

            const query = `INSERT INTO files 
                (filename, original_name, category, file_type, file_size, storage_type, file_data, file_url, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            db.run(query, [
                filename, original_name, category, file_type, file_size, 
                storage_type, file_data, file_url, description
            ], function(err) {
                db.close();
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
                    message: 'Link added successfully'
                });
            });

        } else {
            db.close();
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        db.close();
        console.error('Files API error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}