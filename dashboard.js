class DashboardManager {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication
        if (!window.authManager.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        this.setupWelcomeMessage();
        this.initializeVisitorManager();
        this.setupEventListeners();
        this.loadSampleData();
    }

    setupWelcomeMessage() {
        const adminNameElement = document.querySelector('.admin-name');
        if (adminNameElement) {
            const username = window.authManager.getAdminUsername();
            adminNameElement.textContent = `Welcome, ${username}`;
        }
    }

    initializeVisitorManager() {
        this.visitorManager = new VisitorManager();
    }

    setupEventListeners() {
        // Logout button is handled by authManager
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N to add new visitor
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.visitorManager.openModal();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.visitorManager.closeModal();
                this.visitorManager.closeDeleteModal();
            }
            
            // Ctrl/Cmd + F to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        });

        // Auto-refresh stats every 30 seconds
        setInterval(() => {
            if (this.visitorManager) {
                this.visitorManager.updateStats();
            }
        }, 30000);

        // Handle window resize for responsive design
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleResize() {
        // Handle responsive design changes if needed
        const width = window.innerWidth;
        
        if (width < 768) {
            // Mobile: ensure table view is readable
            const currentView = this.visitorManager.currentView;
            if (currentView === 'table') {
                // Optionally switch to card view on mobile
                // this.visitorManager.setView('card');
            }
        }
    }

    loadSampleData() {
        // Check if this is the first run
        const hasData = localStorage.getItem('visitors');
        const isFirstRun = localStorage.getItem('firstRun');
        
        if (!hasData && !isFirstRun) {
            this.createSampleVisitors();
            localStorage.setItem('firstRun', 'false');
        }
    }

    createSampleVisitors() {
        const sampleVisitors = [
            {
                visitorName: 'John Smith',
                visitorPhone: '+1-555-0123',
                visitorEmail: 'john.smith@email.com',
                visitorCompany: 'Tech Solutions Inc.',
                visitorPurpose: 'business',
                visitorHost: 'Sarah Johnson',
                visitorStatus: 'checked-in',
                checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 2 hours ago
                visitorNotes: 'VIP client meeting'
            },
            {
                visitorName: 'Emily Davis',
                visitorPhone: '+1-555-0456',
                visitorEmail: 'emily.davis@email.com',
                visitorCompany: 'Marketing Pro',
                visitorPurpose: 'interview',
                visitorHost: 'Mike Wilson',
                visitorStatus: 'checked-out',
                checkInTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 16), // 5 hours ago
                visitorNotes: 'Interview for Marketing Manager position'
            },
            {
                visitorName: 'Robert Chen',
                visitorPhone: '+1-555-0789',
                visitorEmail: 'robert.chen@email.com',
                visitorCompany: 'Global Logistics',
                visitorPurpose: 'delivery',
                visitorHost: 'Reception',
                visitorStatus: 'checked-in',
                checkInTime: new Date(Date.now() - 30 * 60 * 1000).toISOString().slice(0, 16), // 30 minutes ago
                visitorNotes: 'Package delivery for IT department'
            },
            {
                visitorName: 'Maria Rodriguez',
                visitorPhone: '+1-555-0321',
                visitorEmail: 'maria.rodriguez@email.com',
                visitorCompany: 'Consulting Group',
                visitorPurpose: 'business',
                visitorHost: 'David Brown',
                visitorStatus: 'checked-out',
                checkInTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Yesterday
                visitorNotes: 'Quarterly business review meeting'
            },
            {
                visitorName: 'James Wilson',
                visitorPhone: '+1-555-0654',
                visitorEmail: 'james.wilson@email.com',
                visitorCompany: 'Maintenance Services',
                visitorPurpose: 'maintenance',
                visitorHost: 'Facilities Team',
                visitorStatus: 'checked-in',
                checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString().slice(0, 16), // 1 hour ago
                visitorNotes: 'HVAC system maintenance'
            }
        ];

        sampleVisitors.forEach(visitorData => {
            this.visitorManager.addVisitor(visitorData);
        });

        this.visitorManager.renderVisitors();
        this.visitorManager.updateStats();
        
        // Show welcome notification
        setTimeout(() => {
            this.visitorManager.showNotification(
                'Welcome to the Visitor Management System! Sample data has been loaded.',
                'success'
            );
        }, 1000);
    }

    // Export data functionality
    exportVisitors(format = 'json') {
        const visitors = this.visitorManager.getAllVisitors();
        
        if (format === 'json') {
            this.downloadJSON(visitors);
        } else if (format === 'csv') {
            this.downloadCSV(visitors);
        }
    }

    downloadJSON(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitors_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadCSV(data) {
        const headers = ['Name', 'Phone', 'Email', 'Company', 'Purpose', 'Host', 'Status', 'Check-in Time', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...data.map(visitor => [
                this.escapeCSV(visitor.visitorName),
                this.escapeCSV(visitor.visitorPhone),
                this.escapeCSV(visitor.visitorEmail || ''),
                this.escapeCSV(visitor.visitorCompany || ''),
                this.escapeCSV(visitor.visitorPurpose),
                this.escapeCSV(visitor.visitorHost || ''),
                this.escapeCSV(visitor.visitorStatus),
                this.escapeCSV(visitor.checkInTime || ''),
                this.escapeCSV(visitor.visitorNotes || '')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitors_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    escapeCSV(field) {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    }

    // Utility methods for dashboard features
    showSystemStats() {
        const visitors = this.visitorManager.getAllVisitors();
        const stats = {
            total: visitors.length,
            checkedIn: visitors.filter(v => v.visitorStatus === 'checked-in').length,
            checkedOut: visitors.filter(v => v.visitorStatus === 'checked-out').length,
            today: this.visitorManager.getTodayVisitors().length,
            purposes: this.getPurposeStats(visitors),
            companies: this.getCompanyStats(visitors)
        };
        
        console.log('System Statistics:', stats);
        return stats;
    }

    getPurposeStats(visitors) {
        const purposes = {};
        visitors.forEach(visitor => {
            const purpose = visitor.visitorPurpose || 'other';
            purposes[purpose] = (purposes[purpose] || 0) + 1;
        });
        return purposes;
    }

    getCompanyStats(visitors) {
        const companies = {};
        visitors.forEach(visitor => {
            const company = visitor.visitorCompany || 'Individual';
            companies[company] = (companies[company] || 0) + 1;
        });
        return companies;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});

// Global keyboard shortcuts helper
document.addEventListener('DOMContentLoaded', () => {
    // Add keyboard shortcuts info
    const helpText = document.createElement('div');
    helpText.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        font-size: 12px;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    `;
    helpText.innerHTML = `
        <strong>Keyboard Shortcuts:</strong><br>
        Ctrl+N: Add visitor | Ctrl+F: Search | Esc: Close modal
    `;
    document.body.appendChild(helpText);

    // Show help on Alt key hold
    let altTimeout;
    document.addEventListener('keydown', (e) => {
        if (e.altKey && !altTimeout) {
            helpText.style.opacity = '1';
        }
    });

    document.addEventListener('keyup', (e) => {
        if (!e.altKey) {
            helpText.style.opacity = '0';
        }
    });
});