module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    return res.status(200).json({
        message: 'Vercel API is working with CommonJS!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
    });
};