import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'afropop-operations-manual-secret-key-2024-secure';

// Simple in-memory file storage for demo (replace with real database later)
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
    },
    {
        id: 2,
        filename: "Sample Image Structure",
        original_name: "Sample Image Structure",
        category: "02_Images", 
        file_type: "text/plain",
        file_size: 0,
        storage_type: "link",
        file_url: null,
        description: "Placeholder for slideshow and artwork",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
    // Add more sample files as needed
];

let nextId = 3;

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

    try {
        if (req.method === 'GET') {
            // Get all files
            const { category } = req.query;
            let filteredFiles = files;

            if (category) {
                filteredFiles = files.filter(file => file.category === category);
            }
            
            // Don't send file_data in list view for performance
            const safeFiles = filteredFiles.map(file => ({
                ...file,
                file_data: undefined
            }));
            
            res.json(safeFiles);

        } else if (req.method === 'POST') {
            // Handle file upload or link addition
            const { category, description, file_url } = req.body;

            if (!file_url) {
                return res.status(400).json({ error: 'URL required (file upload not supported in this version)' });
            }

            if (!category) {
                return res.status(400).json({ error: 'Category required' });
            }

            const filename = file_url.split('/').pop() || 'External Link';
            
            const newFile = {
                id: nextId++,
                filename: filename,
                original_name: filename,
                category: category,
                file_type: 'application/octet-stream',
                file_size: 0,
                storage_type: 'link',
                file_url: file_url,
                description: description || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            files.push(newFile);

            res.json({
                ...newFile,
                message: 'Link added successfully'
            });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Files API error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}