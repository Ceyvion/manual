const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

async function setupTestDatabase() {
    console.log('🔧 Setting up test database...\n');
    
    const db = new sqlite3.Database('afropop_storage.db');
    
    try {
        // Create tables
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                console.log('📋 Creating tables...');
                
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
                )`, (err) => {
                    if (err) reject(err);
                });

                db.run(`CREATE TABLE IF NOT EXISTS auth_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    setting_name TEXT UNIQUE NOT NULL,
                    setting_value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        console.log('✅ Tables created successfully');

        // Set up test password: "afropop123"
        console.log('🔐 Setting up test admin password (afropop123)...');
        const password = 'afropop123';
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Store password
        await new Promise((resolve, reject) => {
            db.run(`INSERT OR REPLACE INTO auth_settings (setting_name, setting_value) 
                    VALUES ('admin_password', ?)`, 
                [hashedPassword], 
                (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });

        console.log('✅ Admin password configured successfully');
        
        // Add sample file structure
        console.log('📁 Adding sample file structure...');
        
        const sampleFiles = [
            { category: '01_Archive_Audio', name: 'Sample Audio Structure', description: 'Placeholder for podcast episodes and reports' },
            { category: '02_Images', name: 'Sample Image Structure', description: 'Placeholder for slideshow and artwork' },
            { category: '03_Scripts_&_Text', name: 'Sample Script Structure', description: 'Placeholder for episode scripts and blog drafts' },
            { category: '04_Grants_Compliance', name: 'Sample Grants Structure', description: 'Placeholder for NEA, NEH, BMI, and SAM documentation' },
            { category: '05_Fundraising', name: 'Sample Fundraising Structure', description: 'Placeholder for reports and receipts' },
            { category: '06_Finance', name: 'Sample Finance Structure', description: 'Placeholder for invoices and budgets' },
            { category: '07_Analytics', name: 'Sample Analytics Structure', description: 'Placeholder for GA exports and stats' },
            { category: '08_Templates', name: 'Sample Template Structure', description: 'Placeholder for brand kit and templates' },
            { category: '09_Social_Media', name: 'Sample Social Structure', description: 'Placeholder for Instagram and Twitter content' },
            { category: '10_Website_Backup', name: 'Sample Backup Structure', description: 'Placeholder for database dumps and schemas' },
            { category: '99_Obsolete', name: 'Sample Obsolete Structure', description: 'Staging area for periodic cleanup' }
        ];

        for (const file of sampleFiles) {
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO files 
                        (filename, original_name, category, file_type, file_size, storage_type, description)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                    [
                        file.name, file.name, file.category, 'text/plain', 
                        0, 'link', file.description
                    ], 
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });
        }
        
        console.log('✅ Sample file structure added');

        console.log('\n🎉 Test database setup complete!');
        console.log('📝 Login with password: afropop123');
        console.log('💻 Start the server with: npm start');
        console.log('🌐 Open http://localhost:3001 in your browser');

    } catch (error) {
        console.error('❌ Error setting up database:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

setupTestDatabase();