#!/usr/bin/env node

const { Command } = require('commander');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const program = new Command();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Database connection
const db = new sqlite3.Database('afropop_storage.db');

// Categories based on Afropop structure
const CATEGORIES = [
  '01_Archive_Audio',
  '02_Images', 
  '03_Scripts_&_Text',
  '04_Grants_Compliance',
  '05_Fundraising',
  '06_Finance',
  '07_Analytics',
  '08_Templates',
  '09_Social_Media',
  '10_Website_Backup',
  '99_Obsolete'
];

program
  .name('afropop-files')
  .description('CLI tool for managing Afropop Operations Manual files')
  .version('1.0.0');

// Add file command
program
  .command('add')
  .description('Add a file to the storage system')
  .option('-f, --file <path>', 'Path to file')
  .option('-u, --url <url>', 'URL for external file')
  .option('-c, --category <category>', 'File category')
  .option('-d, --description <description>', 'File description')
  .action(async (options) => {
    try {
      let { file, url, category, description } = options;

      // Interactive prompts if options not provided
      if (!file && !url) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'How do you want to add the file?',
            choices: [
              { name: 'Upload local file', value: 'file' },
              { name: 'Add external URL', value: 'url' }
            ]
          }
        ]);

        if (answers.type === 'file') {
          const fileAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'filePath',
              message: 'Enter the path to your file:',
              validate: (input) => {
                if (!fs.existsSync(input)) {
                  return 'File does not exist';
                }
                return true;
              }
            }
          ]);
          file = fileAnswer.filePath;
        } else {
          const urlAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'fileUrl',
              message: 'Enter the URL:',
              validate: (input) => {
                try {
                  new URL(input);
                  return true;
                } catch {
                  return 'Please enter a valid URL';
                }
              }
            }
          ]);
          url = urlAnswer.fileUrl;
        }
      }

      if (!category) {
        const categoryAnswer = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedCategory',
            message: 'Select a category:',
            choices: CATEGORIES
          }
        ]);
        category = categoryAnswer.selectedCategory;
      }

      if (!description) {
        const descAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'fileDescription',
            message: 'Enter a description (optional):'
          }
        ]);
        description = descAnswer.fileDescription || '';
      }

      // Process file or URL
      if (file) {
        await addFile(file, category, description);
      } else {
        await addUrl(url, category, description);
      }

    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// List files command
program
  .command('list')
  .description('List all files')
  .option('-c, --category <category>', 'Filter by category')
  .action((options) => {
    let query = 'SELECT * FROM files ORDER BY created_at DESC';
    let params = [];

    if (options.category) {
      query = 'SELECT * FROM files WHERE category = ? ORDER BY created_at DESC';
      params = [options.category];
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(chalk.red('Database error:'), err.message);
        return;
      }

      if (rows.length === 0) {
        console.log(chalk.yellow('No files found'));
        return;
      }

      console.log(chalk.blue('\n📁 Files in storage:\n'));
      
      rows.forEach((file, index) => {
        const size = file.file_size > 0 ? 
          `${(file.file_size / 1024).toFixed(1)}KB` : 
          'Link';
        
        console.log(`${chalk.cyan(index + 1)}. ${chalk.white(file.original_name)}`);
        console.log(`   Category: ${chalk.green(file.category)}`);
        console.log(`   Type: ${file.storage_type === 'direct' ? '📦 Stored' : '🔗 Link'}`);
        console.log(`   Size: ${size}`);
        if (file.description) {
          console.log(`   Description: ${file.description}`);
        }
        console.log(`   Added: ${new Date(file.created_at).toLocaleDateString()}`);
        console.log('');
      });
    });
  });

// Delete file command
program
  .command('delete')
  .description('Delete a file')
  .argument('<id>', 'File ID to delete')
  .action((id) => {
    // First, get file info
    db.get('SELECT * FROM files WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error(chalk.red('Database error:'), err.message);
        return;
      }

      if (!row) {
        console.error(chalk.red('File not found with ID:'), id);
        return;
      }

      console.log(`\nFile to delete: ${chalk.yellow(row.original_name)}`);
      console.log(`Category: ${row.category}`);
      console.log(`Type: ${row.storage_type}`);

      inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Are you sure you want to delete this file?',
          default: false
        }
      ]).then((answer) => {
        if (answer.confirmed) {
          db.run('DELETE FROM files WHERE id = ?', [id], function(err) {
            if (err) {
              console.error(chalk.red('Error deleting file:'), err.message);
              return;
            }
            
            console.log(chalk.green('✅ File deleted successfully'));
          });
        } else {
          console.log(chalk.yellow('❌ Delete cancelled'));
        }
      });
    });
  });

// Stats command
program
  .command('stats')
  .description('Show storage statistics')
  .action(() => {
    db.all(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(CASE WHEN storage_type = 'direct' THEN file_size ELSE 0 END) as total_size
      FROM files 
      GROUP BY category 
      ORDER BY category
    `, (err, rows) => {
      if (err) {
        console.error(chalk.red('Database error:'), err.message);
        return;
      }

      console.log(chalk.blue('\n📊 Storage Statistics:\n'));

      let totalFiles = 0;
      let totalSize = 0;

      rows.forEach(row => {
        totalFiles += row.count;
        totalSize += row.total_size;
        
        console.log(`${chalk.green(row.category)}: ${row.count} files (${(row.total_size / 1024).toFixed(1)}KB)`);
      });

      console.log(chalk.cyan(`\nTotal: ${totalFiles} files, ${(totalSize / 1024 / 1024).toFixed(2)}MB stored`));
    });
  });

// Helper functions
async function addFile(filePath, category, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist');
  }

  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  const fileName = path.basename(filePath);
  const fileExt = path.extname(filePath);
  
  console.log(`\n📁 Processing: ${chalk.yellow(fileName)}`);
  console.log(`Size: ${(fileSize / 1024).toFixed(1)}KB`);

  if (fileSize > MAX_FILE_SIZE) {
    console.log(chalk.red(`⚠️  File is larger than ${MAX_FILE_SIZE / 1024 / 1024}MB limit`));
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addAsLink',
        message: 'Would you like to store it as an external link instead?',
        default: false
      }
    ]);

    if (!answer.addAsLink) {
      console.log(chalk.yellow('❌ File not added'));
      return;
    }

    const linkAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter the URL where this file can be accessed:',
        validate: (input) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      }
    ]);

    await addUrl(linkAnswer.url, category, description, fileName);
    return;
  }

  // Read file data
  const fileData = fs.readFileSync(filePath);
  const mimeType = getMimeType(fileExt);
  const timestamp = Date.now();
  const storedFileName = `${timestamp}_${fileName}`;

  const query = `INSERT INTO files 
    (filename, original_name, category, file_type, file_size, storage_type, file_data, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [
    storedFileName, fileName, category, mimeType, fileSize, 'direct', fileData, description
  ], function(err) {
    if (err) {
      console.error(chalk.red('Database error:'), err.message);
      return;
    }

    console.log(chalk.green('✅ File uploaded successfully'));
    console.log(`ID: ${this.lastID}`);
    console.log(`Stored as: ${storedFileName}`);
  });
}

async function addUrl(url, category, description, originalName = null) {
  const fileName = originalName || url.split('/').pop() || 'External Link';
  
  console.log(`\n🔗 Adding link: ${chalk.yellow(fileName)}`);
  console.log(`URL: ${url}`);

  const query = `INSERT INTO files 
    (filename, original_name, category, file_type, file_size, storage_type, file_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [
    fileName, fileName, category, 'application/octet-stream', 0, 'link', url, description
  ], function(err) {
    if (err) {
      console.error(chalk.red('Database error:'), err.message);
      return;
    }

    console.log(chalk.green('✅ Link added successfully'));
    console.log(`ID: ${this.lastID}`);
  });
}

function getMimeType(ext) {
  const mimeTypes = {
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime'
  };

  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

program.parse();

// Handle no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}