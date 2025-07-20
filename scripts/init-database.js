const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function initializeDatabase() {
  console.log('🔧 Initializing Afropop Operations Manual Database...\n');
  
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

    // Check if admin password already exists
    const existingPassword = await new Promise((resolve, reject) => {
      db.get("SELECT setting_value FROM auth_settings WHERE setting_name = 'admin_password'", 
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (existingPassword) {
      console.log('⚠️  Admin password already configured');
      
      const updatePassword = await new Promise((resolve) => {
        rl.question('Do you want to update the admin password? (y/N): ', (answer) => {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });

      if (!updatePassword) {
        console.log('🏁 Database initialization complete');
        process.exit(0);
      }
    }

    // Get new admin password
    console.log('\n🔐 Setting up admin password...');
    const password = await new Promise((resolve) => {
      rl.question('Enter admin password: ', (answer) => {
        resolve(answer);
      });
    });

    if (!password || password.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    // Hash password
    console.log('🔒 Hashing password...');
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
    
    // Insert sample categories if no files exist
    const fileCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM files", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (fileCount === 0) {
      console.log('📁 Adding sample file structure...');
      
      const sampleFiles = [
        { category: '01_Archive_Audio', name: 'Sample Structure', type: 'folder' },
        { category: '02_Images', name: 'Sample Structure', type: 'folder' },
        { category: '03_Scripts_&_Text', name: 'Sample Structure', type: 'folder' },
        { category: '04_Grants_Compliance', name: 'Sample Structure', type: 'folder' },
        { category: '05_Fundraising', name: 'Sample Structure', type: 'folder' },
        { category: '06_Finance', name: 'Sample Structure', type: 'folder' },
        { category: '07_Analytics', name: 'Sample Structure', type: 'folder' },
        { category: '08_Templates', name: 'Sample Structure', type: 'folder' },
        { category: '09_Social_Media', name: 'Sample Structure', type: 'folder' },
        { category: '10_Website_Backup', name: 'Sample Structure', type: 'folder' },
        { category: '99_Obsolete', name: 'Sample Structure', type: 'folder' }
      ];

      for (const file of sampleFiles) {
        await new Promise((resolve, reject) => {
          db.run(`INSERT INTO files 
                  (filename, original_name, category, file_type, file_size, storage_type, description)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [
              file.name, file.name, file.category, 'text/plain', 
              0, 'link', 'Placeholder for category structure'
            ], 
            (err) => {
              if (err) reject(err);
              else resolve();
            });
        });
      }
      
      console.log('✅ Sample file structure added');
    }

    console.log('\n🎉 Database initialization complete!');
    console.log('📝 You can now start the server with: npm start');
    console.log('💻 Or use the CLI tool with: npm run cli');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    db.close();
    rl.close();
  }
}

initializeDatabase();