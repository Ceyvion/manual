// Operations Manual - Interactive Functionality
class OperationsManual {
    constructor() {
        this.cards = [];
        this.expandedCard = null;
        this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        this.konamiInput = [];
        
        this.init();
    }

    init() {
        this.createSampleData();
        this.renderCards();
        this.setupEventListeners();
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

    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Konami code listener
        document.addEventListener('keydown', (e) => this.handleKonamiCode(e.code));
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
document.addEventListener('DOMContentLoaded', () => {
    new OperationsManual();
});

// Performance optimization for reduced motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition-duration', '0ms');
}