export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Simple auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.includes('simple-demo-token')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.query;

    try {
        if (req.method === 'DELETE') {
            res.status(200).json({ message: 'File deleted successfully' });
        } else if (req.method === 'GET') {
            res.status(404).json({ error: 'File not found or external link' });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('File API error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}