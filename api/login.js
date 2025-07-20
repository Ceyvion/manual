module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Password required' });
        }

        if (password === 'afropop123') {
            const token = 'simple-demo-token-' + Date.now();
            return res.status(200).json({ token, message: 'Login successful' });
        } else {
            return res.status(401).json({ error: 'Invalid password' });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};