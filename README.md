# Afropop Operations Manual

A secure file storage and management system for Afropop's operational content, featuring JWT authentication, smart file handling, and a comprehensive category-based organization system.

## 🚀 Quick Start

### For Local Development

**Unix/Mac:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

**Manual Setup:**
```bash
# Install dependencies
npm install

# Setup database with default password
npm run setup

# Start the development server
npm start
```

## 🌐 Live Deployment

The application is deployed on Vercel: **https://apww.vercel.app/**

- **Login Password:** `afropop123`
- **Auto-deployment:** Pushes to `main` branch trigger automatic deployment

## 📁 Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── health.js          # Health check endpoint
│   ├── login.js           # Authentication endpoint
│   └── files/             # File management endpoints
├── cli/                   # Command-line tools
├── scripts/               # Database setup and utilities
├── Afropop/              # Local folder structure (11 categories)
├── server.js             # Express server (for local development)
├── index.html            # Frontend application
├── script.js             # Client-side JavaScript
├── styles.css            # Application styles
└── vercel.json           # Vercel deployment configuration
```

## 🔐 Authentication

- **JWT-based authentication** with 24-hour token expiry
- **Secure password hashing** using bcrypt (12 salt rounds)
- **Default password:** `afropop123` (configurable)

## 📦 File Storage System

### Smart Storage Logic
- **Files ≤ 5MB:** Stored directly in database
- **Files > 5MB:** External URL references (keeps site fast)
- **Supported formats:** All file types via URL links

### Categories (Afropop Structure)
1. **01_Archive_Audio** - Podcast episodes, segment reports
2. **02_Images** - Show slideshow, artwork, marketing banners
3. **03_Scripts_&_Text** - Episode scripts, blog drafts
4. **04_Grants_Compliance** - NEA, NEH, BMI, SAM documentation
5. **05_Fundraising** - Givebutter reports, Stripe receipts
6. **06_Finance** - Invoices, budgets, bookkeeping
7. **07_Analytics** - GA exports, SoundCloud stats
8. **08_Templates** - Brand kit, email templates
9. **09_Social_Media** - Instagram reels, Twitter images
10. **10_Website_Backup** - Database dumps, schemas
11. **99_Obsolete** - Cleanup staging area

## 🛠️ Features

### Frontend
- **Secure login screen** with error handling
- **Interactive file manager** with upload/link capabilities
- **Category-based filtering** and organization
- **Responsive design** for desktop and mobile
- **Search functionality** across all content
- **Real-time notifications** for user feedback

### Backend
- **RESTful API** with full CRUD operations
- **SQLite database** for lightweight deployment
- **Serverless architecture** optimized for Vercel
- **File type detection** and validation
- **CORS handling** for cross-origin requests

### CLI Tools
```bash
# Add files via command line
npm run cli add --file ./document.pdf --category "03_Scripts_&_Text"

# Add external links
npm run cli add --url "https://example.com/file.pdf" --category "06_Finance"

# List all files
npm run cli list

# Get statistics
npm run cli stats
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file for custom configuration:

```env
PORT=3001
JWT_SECRET=your-custom-secret-key
NODE_ENV=development
MAX_FILE_SIZE=5242880
SESSION_TIMEOUT=86400000
```

### Database
- **Development:** SQLite database (`afropop_storage.db`)
- **Production:** Serverless SQLite in `/tmp/` (Vercel)
- **Auto-initialization** with sample data

## 📊 API Endpoints

### Authentication
- `POST /api/login` - User login
- `GET /api/health` - Health check

### File Management
- `GET /api/files` - List all files (with optional category filter)
- `POST /api/files` - Upload file or add URL
- `GET /api/files/[id]` - Get specific file
- `DELETE /api/files/[id]` - Delete file

## 🚀 Deployment

### Vercel (Production)
- **Automatic deployment** from GitHub
- **Serverless functions** for API endpoints
- **Static file serving** for frontend assets
- **Environment variables** managed in Vercel dashboard

### Local Development
- **Express server** on port 3001
- **Live reload** with nodemon
- **Database persistence** across restarts

## 🔍 Troubleshooting

### Common Issues

**"Connection Error" on Login:**
- Check that the server is running on correct port
- Verify API endpoints are accessible
- Ensure CORS headers are properly configured

**Database Issues:**
```bash
# Reset database
rm afropop_storage.db
npm run setup
```

**Permission Issues (Unix/Mac):**
```bash
chmod +x start.sh
```

## 📱 Usage

1. **Start the application** using `./start.sh` (or appropriate method)
2. **Open browser** to `http://localhost:3001` (or live URL)
3. **Login** with password: `afropop123`
4. **Access File Manager** to upload files or add links
5. **Organize content** by selecting appropriate categories
6. **Search and filter** files using the interface

## 🛡️ Security Features

- **Password hashing** with bcrypt
- **JWT token authentication**
- **Input validation** and sanitization
- **CORS protection** 
- **File type validation**
- **Session timeout** management

## 📋 Development

### Requirements
- Node.js 16+
- npm 7+

### Setup
```bash
git clone <repository>
cd digital-operations-manual
npm install
npm run setup
npm start
```

### Testing
- Manual testing via browser interface
- API testing with curl or Postman
- Database verification through CLI tools

---

**Built for Afropop Worldwide** 🎵  
Secure, fast, and organized file management for creative teams.