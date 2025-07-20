// Simple in-memory file storage for demo
let files = [
    {
        id: 1,
        filename: "Sample Audio Structure",
        original_name: "Sample Audio Structure", 
        category: "01_Archive_Audio",
        file_type: "text/plain",
        file_size: 0,
        storage_type: "link",
        file_url: null,
        description: "Placeholder for podcast episodes and reports",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

let nextId = 2;

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

    // Simple auth check - in production use proper JWT validation
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.includes('simple-demo-token')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        if (req.method === 'GET') {
            res.status(200).json(files);
        } else if (req.method === 'POST') {
            const { category, description, file_url } = req.body;
            
            if (!file_url) {
                return res.status(400).json({ error: 'URL required' });
            }

            const newFile = {
                id: nextId++,
                filename: file_url.split('/').pop() || 'External Link',
                original_name: file_url.split('/').pop() || 'External Link',
                category: category || 'Uncategorized',
                file_type: 'application/octet-stream',
                file_size: 0,
                storage_type: 'link',
                file_url: file_url,
                description: description || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            files.push(newFile);
            res.status(200).json({ ...newFile, message: 'Link added successfully' });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Files API error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}