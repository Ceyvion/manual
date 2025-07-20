import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'afropop-operations-manual-secret-key-2024-secure';

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

    try {
        if (req.method === 'GET') {
            // For now, just redirect to external URLs since we're using links
            // In a real implementation, you'd fetch from database
            return res.status(404).json({ error: 'File not found or external link' });

        } else if (req.method === 'DELETE') {
            // For demo purposes, just return success
            // In real implementation, you'd delete from database
            res.json({ message: 'File deleted successfully' });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('File API error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}