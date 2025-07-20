const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'afropop-operations-manual-secret-key-2024-secure';

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

    const { id } = req.query;
    const db = initDatabase();

    try {
        if (req.method === 'GET') {
            // Get specific file
            db.get('SELECT * FROM files WHERE id = ?', [id], (err, row) => {
                db.close();
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (!row) {
                    return res.status(404).json({ error: 'File not found' });
                }

                if (row.storage_type === 'direct' && row.file_data) {
                    // Return file data for direct storage
                    res.setHeader('Content-Type', row.file_type);
                    res.setHeader('Content-Disposition', `attachment; filename="${row.original_name}"`);
                    res.send(row.file_data);
                } else if (row.storage_type === 'link' && row.file_url) {
                    // Redirect to external URL
                    res.redirect(302, row.file_url);
                } else {
                    res.status(404).json({ error: 'File data not available' });
                }
            });

        } else if (req.method === 'DELETE') {
            // Delete file
            db.run('DELETE FROM files WHERE id = ?', [id], function(err) {
                db.close();
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'File not found' });
                }
                
                res.json({ message: 'File deleted successfully' });
            });

        } else {
            db.close();
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        db.close();
        console.error('File API error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}