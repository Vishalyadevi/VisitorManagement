class VisitorManager {
    constructor() {
        this.visitors = this.loadVisitors();
        this.currentEditId = null;
        this.currentView = 'card'; // 'card' or 'table'
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderVisitors();
        this.updateStats();
    }

    setupEventListeners() {
        // Add visitor button
        const addBtn = document.getElementById('addVisitorBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }

        // Modal close buttons
        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());

        // Delete modal
        const closeDeleteModal = document.getElementById('closeDeleteModal');
        const cancelDelete = document.getElementById('cancelDelete');
        const confirmDelete = document.getElementById('confirmDelete');
        if (closeDeleteModal) closeDeleteModal.addEventListener('click', () => this.closeDeleteModal());
        if (cancelDelete) cancelDelete.addEventListener('click', () => this.closeDeleteModal());
        if (confirmDelete) confirmDelete.addEventListener('click', () => this.confirmDelete());

        // Form submission
        const visitorForm = document.getElementById('visitorForm');
        if (visitorForm) {
            visitorForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }

        // Filter functionality
        const statusFilter = document.getElementById('statusFilter');
        const clearFilters = document.getElementById('clearFilters');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.handleFilter());
        }
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearFilters());
        }

        // View toggle
        const cardView = document.getElementById('cardView');
        const tableView = document.getElementById('tableView');
        if (cardView) {
            cardView.addEventListener('click', () => this.setView('card'));
        }
        if (tableView) {
            tableView.addEventListener('click', () => this.setView('table'));
        }

        // Modal click outside to close
        const modal = document.getElementById('visitorModal');
        const deleteModal = document.getElementById('deleteModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) this.closeDeleteModal();
            });
        }
    }

    // Visitor CRUD Operations
    addVisitor(visitorData) {
        const visitor = {
            id: this.generateId(),
            ...visitorData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.visitors.push(visitor);
        this.saveVisitors();
        return visitor;
    }

    updateVisitor(id, visitorData) {
        const index = this.visitors.findIndex(v => v.id === id);
        if (index !== -1) {
            this.visitors[index] = {
                ...this.visitors[index],
                ...visitorData,
                updatedAt: new Date().toISOString()
            };
            this.saveVisitors();
            return this.visitors[index];
        }
        return null;
    }

    deleteVisitor(id) {
        const index = this.visitors.findIndex(v => v.id === id);
        if (index !== -1) {
            const deletedVisitor = this.visitors.splice(index, 1)[0];
            this.saveVisitors();
            return deletedVisitor;
        }
        return null;
    }

    getVisitor(id) {
        return this.visitors.find(v => v.id === id);
    }

    getAllVisitors() {
        return [...this.visitors];
    }

    // Form handling
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const visitorData = {};
        
        // Extract form data
        for (let [key, value] of formData.entries()) {
            visitorData[key] = value.trim();
        }

        // Validate required fields
        const requiredFields = ['visitorName', 'visitorPhone', 'visitorPurpose'];
        const missingFields = requiredFields.filter(field => !visitorData[field]);
        
        if (missingFields.length > 0) {
            alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Set default check-in time if not provided
        if (!visitorData.checkInTime) {
            visitorData.checkInTime = new Date().toISOString().slice(0, 16);
        }

        // Set default status if not provided
        if (!visitorData.visitorStatus) {
            visitorData.visitorStatus = 'checked-in';
        }

        try {
            if (this.currentEditId) {
                // Update existing visitor
                this.updateVisitor(this.currentEditId, visitorData);
                this.showNotification('Visitor updated successfully!', 'success');
            } else {
                // Add new visitor
                this.addVisitor(visitorData);
                this.showNotification('Visitor added successfully!', 'success');
            }

            this.closeModal();
            this.resetForm();
            this.renderVisitors();
            this.updateStats();
        } catch (error) {
            console.error('Error saving visitor:', error);
            this.showNotification('Error saving visitor. Please try again.', 'error');
        }
    }

    // Modal management
    openModal(visitorId = null) {
        const modal = document.getElementById('visitorModal');
        const modalTitle = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveBtn');

        this.currentEditId = visitorId;

        if (visitorId) {
            // Edit mode
            const visitor = this.getVisitor(visitorId);
            if (visitor) {
                modalTitle.textContent = 'Edit Visitor';
                saveBtn.textContent = 'Update Visitor';
                this.populateForm(visitor);
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Add New Visitor';
            saveBtn.textContent = 'Save Visitor';
            this.resetForm();
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('visitorModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.currentEditId = null;
    }

    openDeleteModal(visitorId) {
        const visitor = this.getVisitor(visitorId);
        if (!visitor) return;

        const deleteModal = document.getElementById('deleteModal');
        const deleteVisitorName = document.getElementById('deleteVisitorName');
        
        deleteVisitorName.textContent = visitor.visitorName;
        deleteModal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Store the visitor ID for deletion
        this.pendingDeleteId = visitorId;
    }

    closeDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        deleteModal.classList.remove('show');
        document.body.style.overflow = '';
        this.pendingDeleteId = null;
    }

    confirmDelete() {
        if (this.pendingDeleteId) {
            const deletedVisitor = this.deleteVisitor(this.pendingDeleteId);
            if (deletedVisitor) {
                this.showNotification('Visitor deleted successfully!', 'success');
                this.renderVisitors();
                this.updateStats();
            }
        }
        this.closeDeleteModal();
    }

    // Form utilities
    populateForm(visitor) {
        document.getElementById('visitorName').value = visitor.visitorName || '';
        document.getElementById('visitorPhone').value = visitor.visitorPhone || '';
        document.getElementById('visitorEmail').value = visitor.visitorEmail || '';
        document.getElementById('visitorCompany').value = visitor.visitorCompany || '';
        document.getElementById('visitorPurpose').value = visitor.visitorPurpose || '';
        document.getElementById('visitorHost').value = visitor.visitorHost || '';
        document.getElementById('checkInTime').value = visitor.checkInTime || '';
        document.getElementById('visitorStatus').value = visitor.visitorStatus || 'checked-in';
        document.getElementById('visitorNotes').value = visitor.visitorNotes || '';
    }

    resetForm() {
        document.getElementById('visitorForm').reset();
        // Set default check-in time to now
        const now = new Date().toISOString().slice(0, 16);
        document.getElementById('checkInTime').value = now;
    }

    // Rendering
    renderVisitors() {
        const filteredVisitors = this.getFilteredVisitors();
        
        if (this.currentView === 'card') {
            this.renderCardView(filteredVisitors);
        } else {
            this.renderTableView(filteredVisitors);
        }

        this.toggleNoDataState(filteredVisitors.length === 0);
    }

    renderCardView(visitors) {
        const container = document.getElementById('visitorsContainer');
        container.className = 'visitors-grid';
        
        if (visitors.length === 0) return;

        container.innerHTML = visitors.map(visitor => this.createVisitorCard(visitor)).join('');
        
        // Add event listeners to action buttons
        this.attachCardEventListeners();
    }

    renderTableView(visitors) {
        const container = document.getElementById('visitorsContainer');
        container.className = 'visitors-table-container';
        
        if (visitors.length === 0) return;

        const tableHTML = `
            <table class="visitors-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Purpose</th>
                        <th>Status</th>
                        <th>Check-in Time</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${visitors.map(visitor => this.createVisitorRow(visitor)).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        this.attachTableEventListeners();
    }

    createVisitorCard(visitor) {
        const checkInTime = visitor.checkInTime ? 
            new Date(visitor.checkInTime).toLocaleString() : 'Not set';
        
        return `
            <div class="visitor-card" data-id="${visitor.id}">
                <div class="visitor-header">
                    <div class="visitor-info">
                        <h3>${this.escapeHtml(visitor.visitorName)}</h3>
                        <p>${this.escapeHtml(visitor.visitorPhone)}</p>
                    </div>
                    <span class="visitor-status ${visitor.visitorStatus}">
                        ${visitor.visitorStatus === 'checked-in' ? 'Checked In' : 'Checked Out'}
                    </span>
                </div>
                
                <div class="visitor-details">
                    ${visitor.visitorEmail ? `
                        <div class="visitor-detail">
                            <span>Email:</span>
                            <span>${this.escapeHtml(visitor.visitorEmail)}</span>
                        </div>
                    ` : ''}
                    ${visitor.visitorCompany ? `
                        <div class="visitor-detail">
                            <span>Company:</span>
                            <span>${this.escapeHtml(visitor.visitorCompany)}</span>
                        </div>
                    ` : ''}
                    <div class="visitor-detail">
                        <span>Purpose:</span>
                        <span>${this.escapeHtml(visitor.visitorPurpose)}</span>
                    </div>
                    ${visitor.visitorHost ? `
                        <div class="visitor-detail">
                            <span>Host:</span>
                            <span>${this.escapeHtml(visitor.visitorHost)}</span>
                        </div>
                    ` : ''}
                    <div class="visitor-detail">
                        <span>Check-in:</span>
                        <span>${checkInTime}</span>
                    </div>
                </div>
                
                <div class="visitor-actions">
                    <button class="edit-btn" data-id="${visitor.id}">Edit</button>
                    <button class="delete-btn" data-id="${visitor.id}">Delete</button>
                </div>
            </div>
        `;
    }

    createVisitorRow(visitor) {
        const checkInTime = visitor.checkInTime ? 
            new Date(visitor.checkInTime).toLocaleDateString() : 'Not set';
        
        return `
            <tr data-id="${visitor.id}">
                <td>${this.escapeHtml(visitor.visitorName)}</td>
                <td>${this.escapeHtml(visitor.visitorPhone)}</td>
                <td>${this.escapeHtml(visitor.visitorCompany || 'N/A')}</td>
                <td>${this.escapeHtml(visitor.visitorPurpose)}</td>
                <td>
                    <span class="visitor-status ${visitor.visitorStatus}">
                        ${visitor.visitorStatus === 'checked-in' ? 'Checked In' : 'Checked Out'}
                    </span>
                </td>
                <td>${checkInTime}</td>
                <td>
                    <button class="edit-btn" data-id="${visitor.id}">Edit</button>
                    <button class="delete-btn" data-id="${visitor.id}">Delete</button>
                </td>
            </tr>
        `;
    }

    attachCardEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const visitorId = btn.getAttribute('data-id');
                this.openModal(visitorId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const visitorId = btn.getAttribute('data-id');
                this.openDeleteModal(visitorId);
            });
        });
    }

    attachTableEventListeners() {
        this.attachCardEventListeners(); // Same event listeners work for table view
    }

    // View management
    setView(view) {
        this.currentView = view;
        
        // Update button states
        const cardBtn = document.getElementById('cardView');
        const tableBtn = document.getElementById('tableView');
        
        cardBtn.classList.toggle('active', view === 'card');
        tableBtn.classList.toggle('active', view === 'table');
        
        this.renderVisitors();
    }

    // Search and filter
    handleSearch() {
        this.renderVisitors();
    }

    handleFilter() {
        this.renderVisitors();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        this.renderVisitors();
    }

    getFilteredVisitors() {
        let filtered = [...this.visitors];
        
        // Search filter
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(visitor => 
                visitor.visitorName.toLowerCase().includes(searchTerm) ||
                visitor.visitorPhone.toLowerCase().includes(searchTerm) ||
                visitor.visitorPurpose.toLowerCase().includes(searchTerm) ||
                (visitor.visitorCompany && visitor.visitorCompany.toLowerCase().includes(searchTerm)) ||
                (visitor.visitorEmail && visitor.visitorEmail.toLowerCase().includes(searchTerm))
            );
        }
        
        // Status filter
        const statusFilter = document.getElementById('statusFilter').value;
        if (statusFilter) {
            filtered = filtered.filter(visitor => visitor.visitorStatus === statusFilter);
        }
        
        // Sort by check-in time (most recent first)
        filtered.sort((a, b) => {
            const dateA = new Date(a.checkInTime || a.createdAt);
            const dateB = new Date(b.checkInTime || b.createdAt);
            return dateB - dateA;
        });
        
        return filtered;
    }

    toggleNoDataState(show) {
        const noDataDiv = document.getElementById('noVisitors');
        const container = document.getElementById('visitorsContainer');
        
        if (show) {
            noDataDiv.style.display = 'block';
            container.style.display = 'none';
        } else {
            noDataDiv.style.display = 'none';
            container.style.display = 'grid';
        }
    }

    // Statistics
    updateStats() {
        const totalVisitors = this.visitors.length;
        const activeVisitors = this.visitors.filter(v => v.visitorStatus === 'checked-in').length;
        const todayVisitors = this.getTodayVisitors().length;

        document.getElementById('totalVisitors').textContent = totalVisitors;
        document.getElementById('activeVisitors').textContent = activeVisitors;
        document.getElementById('todayVisitors').textContent = todayVisitors;
    }

    getTodayVisitors() {
        const today = new Date().toDateString();
        return this.visitors.filter(visitor => {
            const visitorDate = new Date(visitor.checkInTime || visitor.createdAt).toDateString();
            return visitorDate === today;
        });
    }

    // Utility functions
    generateId() {
        return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 
                         type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'};
            color: white;
            padding: 16px 20px;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
        `;
        
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Data persistence
    loadVisitors() {
        try {
            const stored = localStorage.getItem('visitors');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading visitors:', error);
            return [];
        }
    }

    saveVisitors() {
        try {
            localStorage.setItem('visitors', JSON.stringify(this.visitors));
        } catch (error) {
            console.error('Error saving visitors:', error);
        }
    }
}

// Add notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Export for use in other files
window.VisitorManager = VisitorManager;