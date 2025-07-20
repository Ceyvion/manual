// Afropop Operations Manual - Enhanced with File Storage
class OperationsManual {
    constructor() {
        this.cards = [];
        this.files = [];
        this.token = localStorage.getItem('afropop_token');
        this.expandedCard = null;
        this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        this.konamiInput = [];
        this.API_BASE = window.location.hostname === 'localhost' ? 
            'http://localhost:3001' : 
            window.location.origin;
        
        this.categories = [
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
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.createSampleData();
        this.renderCards();
        this.setupEventListeners();
        this.populateCategorySelects();
    }

    checkAuthentication() {
        if (this.token) {
            // Verify token is still valid
            this.verifyToken().then(valid => {
                if (valid) {
                    this.showMainApp();
                } else {
                    this.showLoginScreen();
                }
            });
        } else {
            this.showLoginScreen();
        }
    }

    async verifyToken() {
        try {
            const response = await fetch(`${this.API_BASE}/api/health`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('password').focus();
    }

    showMainApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        this.loadFiles();
    }

    async login(password) {
        try {
            const response = await fetch(`${this.API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('afropop_token', this.token);
                this.showMainApp();
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Connection error' };
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('afropop_token');
        this.showLoginScreen();
    }

    async loadFiles(category = null) {
        if (!this.token) return;

        try {
            const url = category 
                ? `${this.API_BASE}/api/files?category=${encodeURIComponent(category)}`
                : `${this.API_BASE}/api/files`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.files = await response.json();
                this.renderFileList();
            }
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }

    renderFileList() {
        const fileList = document.getElementById('file-list');
        if (!fileList) return;

        if (this.files.length === 0) {
            fileList.innerHTML = '<p class="no-files">No files found</p>';
            return;
        }

        fileList.innerHTML = this.files.map(file => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-name">${file.original_name}</div>
                    <div class="file-meta">
                        <span class="file-category">${file.category}</span>
                        <span class="file-type">${file.storage_type === 'direct' ? '📦 Stored' : '🔗 Link'}</span>
                        <span class="file-size">${file.file_size > 0 ? `${(file.file_size / 1024).toFixed(1)}KB` : 'Link'}</span>
                        <span class="file-date">${new Date(file.created_at).toLocaleDateString()}</span>
                    </div>
                    ${file.description ? `<div class="file-description">${file.description}</div>` : ''}
                </div>
                <div class="file-actions">
                    <button onclick="operationsManual.downloadFile(${file.id})" class="file-btn download">OPEN</button>
                    <button onclick="operationsManual.deleteFile(${file.id})" class="file-btn delete">DELETE</button>
                </div>
            </div>
        `).join('');
    }

    async downloadFile(id) {
        if (!this.token) return;

        try {
            const response = await fetch(`${this.API_BASE}/api/files/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                // Check if it's a redirect (for links)
                if (response.redirected) {
                    window.open(response.url, '_blank');
                } else {
                    // Download the file
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download';
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
            }
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    }

    async deleteFile(id) {
        if (!this.token) return;
        
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const response = await fetch(`${this.API_BASE}/api/files/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.loadFiles();
                this.showNotification('File deleted successfully', 'success');
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Failed to delete file', 'error');
            }
        } catch (error) {
            this.showNotification('Error deleting file', 'error');
        }
    }

    async uploadFile(formData) {
        if (!this.token) return;

        try {
            const response = await fetch(`${this.API_BASE}/api/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                this.loadFiles();
                this.showNotification('File uploaded successfully', 'success');
                return { success: true };
            } else {
                this.showNotification(data.error || 'Upload failed', 'error');
                return { success: false, error: data.error };
            }
        } catch (error) {
            this.showNotification('Upload error', 'error');
            return { success: false, error: 'Connection error' };
        }
    }

    populateCategorySelects() {
        const selects = ['file-category', 'link-category', 'category-filter'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // Keep existing options for filter
                if (selectId === 'category-filter') {
                    select.innerHTML = '<option value="">ALL CATEGORIES</option>';
                } else {
                    select.innerHTML = '<option value="">SELECT CATEGORY</option>';
                }
                
                this.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category.replace(/^\d+_/, '').replace(/_/g, ' ');
                    select.appendChild(option);
                });
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const password = document.getElementById('password').value;
                const loginText = document.getElementById('login-text');
                const loginLoading = document.getElementById('login-loading');
                const loginError = document.getElementById('login-error');

                loginText.style.display = 'none';
                loginLoading.style.display = 'inline';
                loginError.style.display = 'none';

                const result = await this.login(password);

                loginText.style.display = 'inline';
                loginLoading.style.display = 'none';

                if (!result.success) {
                    loginError.textContent = result.error;
                    loginError.style.display = 'block';
                    document.getElementById('password').value = '';
                }
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // File manager button
        const fileManagerBtn = document.getElementById('file-manager-btn');
        if (fileManagerBtn) {
            fileManagerBtn.addEventListener('click', () => {
                document.getElementById('file-manager-modal').style.display = 'flex';
                this.loadFiles();
            });
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // File upload modal
        const uploadBtn = document.getElementById('upload-file-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                document.getElementById('upload-modal').style.display = 'flex';
            });
        }

        // Link add modal
        const linkBtn = document.getElementById('add-link-btn');
        if (linkBtn) {
            linkBtn.addEventListener('click', () => {
                document.getElementById('link-modal').style.display = 'flex';
            });
        }

        // Refresh files
        const refreshBtn = document.getElementById('refresh-files-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadFiles();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.loadFiles(e.target.value || null);
            });
        }

        // File upload form
        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                const fileInput = document.getElementById('file-input');
                const categoryInput = document.getElementById('file-category');
                const descriptionInput = document.getElementById('file-description');

                if (!fileInput.files[0]) {
                    this.showNotification('Please select a file', 'error');
                    return;
                }

                formData.append('file', fileInput.files[0]);
                formData.append('category', categoryInput.value);
                formData.append('description', descriptionInput.value);

                const result = await this.uploadFile(formData);
                
                if (result.success) {
                    document.getElementById('upload-modal').style.display = 'none';
                    uploadForm.reset();
                    document.getElementById('file-info').style.display = 'none';
                }
            });
        }

        // Link form
        const linkForm = document.getElementById('link-form');
        if (linkForm) {
            linkForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                const urlInput = document.getElementById('link-url');
                const categoryInput = document.getElementById('link-category');
                const descriptionInput = document.getElementById('link-description');

                formData.append('file_url', urlInput.value);
                formData.append('category', categoryInput.value);
                formData.append('description', descriptionInput.value);

                const result = await this.uploadFile(formData);
                
                if (result.success) {
                    document.getElementById('link-modal').style.display = 'none';
                    linkForm.reset();
                }
            });
        }

        // File input change handler
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const fileInfo = document.getElementById('file-info');
                
                if (file) {
                    const size = (file.size / 1024 / 1024).toFixed(2);
                    const maxSize = 5; // MB
                    
                    let info = `File: ${file.name}<br>Size: ${size}MB`;
                    
                    if (size > maxSize) {
                        info += `<br><span style="color: #ff6b6b;">⚠️ File exceeds ${maxSize}MB limit. Consider adding as external link instead.</span>`;
                    }
                    
                    fileInfo.innerHTML = info;
                    fileInfo.style.display = 'block';
                } else {
                    fileInfo.style.display = 'none';
                }
            });
        }

        // Original search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Konami code listener
        document.addEventListener('keydown', (e) => this.handleKonamiCode(e.code));
    }

    createSampleData() {
        // Afropop organization categories
        this.cards = [
            {
                id: 'arc-001',
                title: 'ARCHIVE AUDIO',
                data: [
                    { label: 'PODCAST EPISODES', value: 'MP3 MASTERS, 59-MIN & PROMO CUTS' },
                    { label: 'SEGMENT REPORTS', value: 'XLSX, PDF FORMATS' },
                    { label: 'LOCATION', value: '/AFROPOP/01_ARCHIVE_AUDIO' },
                    { label: 'ACCESS LEVEL', value: 'PRODUCTION TEAM' },
                    { label: 'BACKUP FREQUENCY', value: 'WEEKLY' }
                ]
            },
            {
                id: 'img-002',
                title: 'IMAGES',
                data: [
                    { label: 'SHOW SLIDESHOW', value: '4000×2000 JPEG/PNG' },
                    { label: 'SQUARE ARTWORK', value: 'ALBUM-STYLE 1:1' },
                    { label: 'MARKETING BANNERS', value: '728×90, 1080×1920' },
                    { label: 'LOCATION', value: '/AFROPOP/02_IMAGES' },
                    { label: 'COLOR PROFILE', value: 'SRGB' }
                ]
            },
            {
                id: 'scr-003',
                title: 'SCRIPTS & TEXT',
                data: [
                    { label: 'EPISODE SCRIPTS', value: 'DOCX, GDOC FORMATS' },
                    { label: 'BLOG DRAFTS', value: 'WIP & PUBLISHED' },
                    { label: 'LOCATION', value: '/AFROPOP/03_SCRIPTS_&_TEXT' },
                    { label: 'VERSION CONTROL', value: 'GOOGLE DRIVE SYNC' },
                    { label: 'EDITORIAL REVIEW', value: 'REQUIRED' }
                ]
            },
            {
                id: 'gra-004',
                title: 'GRANTS COMPLIANCE',
                data: [
                    { label: 'NEA DOCUMENTATION', value: 'NATIONAL ENDOWMENT ARTS' },
                    { label: 'NEH DOCUMENTATION', value: 'NATIONAL ENDOWMENT HUMANITIES' },
                    { label: 'BMI REPORTING', value: 'MUSIC LICENSING' },
                    { label: 'SAM REGISTRY', value: 'FEDERAL COMPLIANCE' },
                    { label: 'LOCATION', value: '/AFROPOP/04_GRANTS_COMPLIANCE' }
                ]
            },
            {
                id: 'fun-005',
                title: 'FUNDRAISING',
                data: [
                    { label: 'GIVEBUTTER REPORTS', value: 'CSV EXPORTS' },
                    { label: 'STRIPE RECEIPTS', value: 'PAYMENT PROCESSING' },
                    { label: 'YEAR END APPEAL', value: 'ANNUAL CAMPAIGN' },
                    { label: 'LOCATION', value: '/AFROPOP/05_FUNDRAISING' },
                    { label: 'TAX DOCUMENTS', value: '501(C)(3) STATUS' }
                ]
            },
            {
                id: 'fin-006',
                title: 'FINANCE',
                data: [
                    { label: 'INVOICES SENT', value: 'OUTGOING BILLING' },
                    { label: 'INVOICES RECEIVED', value: 'VENDOR PAYMENTS' },
                    { label: 'BUDGETS', value: 'QUARTERLY & ANNUAL' },
                    { label: 'LOCATION', value: '/AFROPOP/06_FINANCE' },
                    { label: 'BOOKKEEPING', value: 'QUICKBOOKS SYNC' }
                ]
            },
            {
                id: 'ana-007',
                title: 'ANALYTICS',
                data: [
                    { label: 'GA EXPORTS', value: 'GOOGLE ANALYTICS DATA' },
                    { label: 'SOUNDCLOUD STATS', value: 'STREAMING METRICS' },
                    { label: 'LOCATION', value: '/AFROPOP/07_ANALYTICS' },
                    { label: 'UPDATE FREQUENCY', value: 'MONTHLY' },
                    { label: 'KPI TRACKING', value: 'AUDIENCE GROWTH' }
                ]
            },
            {
                id: 'tem-008',
                title: 'TEMPLATES',
                data: [
                    { label: 'BRAND KIT', value: 'LOGOS, COLORS, FONTS' },
                    { label: 'MAILCHIMP BLOCKS', value: 'EMAIL TEMPLATES' },
                    { label: 'LETTERHEADS ENVELOPES', value: 'OFFICIAL STATIONERY' },
                    { label: 'LOCATION', value: '/AFROPOP/08_TEMPLATES' },
                    { label: 'BRAND GUIDELINES', value: 'STYLE CONSISTENCY' }
                ]
            },
            {
                id: 'soc-009',
                title: 'SOCIAL MEDIA',
                data: [
                    { label: 'INSTAGRAM REELS', value: 'VERTICAL VIDEO CONTENT' },
                    { label: 'TWITTER IMAGES', value: 'PROMOTIONAL GRAPHICS' },
                    { label: 'LOCATION', value: '/AFROPOP/09_SOCIAL_MEDIA' },
                    { label: 'POSTING SCHEDULE', value: 'CONTENT CALENDAR' },
                    { label: 'ENGAGEMENT', value: 'COMMUNITY MANAGEMENT' }
                ]
            },
            {
                id: 'web-010',
                title: 'WEBSITE BACKUP',
                data: [
                    { label: 'CRAFT DB DUMPS', value: 'DATABASE BACKUPS' },
                    { label: 'GRAPHQL SCHEMAS', value: 'API DOCUMENTATION' },
                    { label: 'LOCATION', value: '/AFROPOP/10_WEBSITE_BACKUP' },
                    { label: 'BACKUP FREQUENCY', value: 'DAILY AUTOMATED' },
                    { label: 'RECOVERY TIME', value: '< 24 HOURS' }
                ]
            },
            {
                id: 'obs-099',
                title: 'OBSOLETE',
                data: [
                    { label: 'PURPOSE', value: 'STAGING AREA FOR CLEANUP' },
                    { label: 'RETENTION POLICY', value: '90 DAYS MAXIMUM' },
                    { label: 'LOCATION', value: '/AFROPOP/99_OBSOLETE' },
                    { label: 'REVIEW FREQUENCY', value: 'QUARTERLY' },
                    { label: 'DISPOSAL METHOD', value: 'SECURE DELETE' }
                ]
            }
        ];
    }

    renderCards() {
        const stack = document.getElementById('card-stack');
        if (!stack) return;
        
        stack.innerHTML = '';

        this.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            stack.appendChild(cardElement);
        });
    }

    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;

        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.textContent = card.title;
        tabButton.setAttribute('role', 'button');
        tabButton.setAttribute('aria-expanded', 'false');
        tabButton.addEventListener('click', () => this.toggleCard(card.id));

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        card.data.forEach(item => {
            const row = document.createElement('div');
            row.className = 'card-row';

            const label = document.createElement('div');
            label.className = 'card-label';
            label.textContent = item.label;

            const value = document.createElement('div');
            value.className = 'card-value';
            value.textContent = item.value;

            row.appendChild(label);
            row.appendChild(value);
            cardBody.appendChild(row);
        });

        cardDiv.appendChild(tabButton);
        cardDiv.appendChild(cardBody);

        return cardDiv;
    }

    toggleCard(cardId) {
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        const tabButton = cardElement.querySelector('.tab-button');
        
        if (this.expandedCard && this.expandedCard !== cardId) {
            // Collapse previously expanded card
            const prevCard = document.querySelector(`[data-card-id="${this.expandedCard}"]`);
            const prevButton = prevCard.querySelector('.tab-button');
            prevCard.classList.remove('expanded');
            prevButton.setAttribute('aria-expanded', 'false');
        }

        if (cardElement.classList.contains('expanded')) {
            // Collapse this card
            cardElement.classList.remove('expanded');
            tabButton.setAttribute('aria-expanded', 'false');
            this.expandedCard = null;
        } else {
            // Expand this card
            cardElement.classList.add('expanded');
            tabButton.setAttribute('aria-expanded', 'true');
            this.expandedCard = cardId;
            
            // Scroll card into view
            setTimeout(() => {
                cardElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 100);
        }
    }

    handleSearch(query) {
        const normalizedQuery = query.toLowerCase().trim();
        const cards = document.querySelectorAll('.card');

        if (!normalizedQuery) {
            // Clear all filters
            cards.forEach(card => card.classList.remove('filtered'));
            return;
        }

        let firstMatch = null;

        cards.forEach(card => {
            const title = card.querySelector('.tab-button').textContent.toLowerCase();
            const cardData = Array.from(card.querySelectorAll('.card-value'))
                .map(el => el.textContent.toLowerCase())
                .join(' ');

            const matches = title.includes(normalizedQuery) || cardData.includes(normalizedQuery);

            if (matches) {
                card.classList.remove('filtered');
                if (!firstMatch) firstMatch = card;
            } else {
                card.classList.add('filtered');
            }
        });

        // Auto-scroll to first match
        if (firstMatch) {
            firstMatch.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    handleKonamiCode(keyCode) {
        this.konamiInput.push(keyCode);
        
        // Keep only the last 10 inputs
        if (this.konamiInput.length > this.konamiCode.length) {
            this.konamiInput.shift();
        }

        // Check if the sequence matches
        if (this.konamiInput.length === this.konamiCode.length &&
            this.konamiInput.every((key, index) => key === this.konamiCode[index])) {
            this.toggleSeveranceMode();
            this.konamiInput = []; // Reset sequence
        }
    }

    toggleSeveranceMode() {
        document.documentElement.classList.toggle('severance');
        
        // Visual feedback
        const body = document.body;
        body.style.transition = 'all 0.3s ease';
        body.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
            body.style.transform = 'scale(1)';
            setTimeout(() => {
                body.style.transition = '';
            }, 300);
        }, 150);
    }
}

// Initialize the manual when DOM is ready
let operationsManual;
document.addEventListener('DOMContentLoaded', () => {
    operationsManual = new OperationsManual();
});

// Performance optimization for reduced motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition-duration', '0ms');
}