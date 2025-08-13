class Browser {
    constructor() {
        this.tabs = [];
        this.activeTabIndex = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createNewTab();
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('forwardBtn').addEventListener('click', () => this.goForward());
        document.getElementById('reloadBtn').addEventListener('click', () => this.reload());

        // URL input
        const urlInput = document.getElementById('urlInput');
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigateToUrl(urlInput.value);
            }
        });
        document.getElementById('goBtn').addEventListener('click', () => {
            this.navigateToUrl(urlInput.value);
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value);
            }
        });
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch(searchInput.value);
        });

        // New tab button
        document.getElementById('newTabBtn').addEventListener('click', () => {
            this.createNewTab();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeWebviews();
        });
    }

    createNewTab(url = 'https://www.google.com') {
        const tab = {
            id: Date.now() + Math.random(),
            title: 'New Tab',
            url: url,
            webview: null
        };

        this.tabs.push(tab);
        this.createTabElement(tab);
        this.switchToTab(this.tabs.length - 1);
    }

    createTabElement(tab) {
        const tabList = document.getElementById('tabList');
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tab.id;

        tabElement.innerHTML = `
            <span class="tab-title">${tab.title}</span>
            <button class="tab-close" title="Close tab">×</button>
        `;

        // Tab click handler
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                const index = this.tabs.findIndex(t => t.id === tab.id);
                this.switchToTab(index);
            }
        });

        // Close button handler
        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });

        tabList.appendChild(tabElement);
    }

    switchToTab(index) {
        if (index < 0 || index >= this.tabs.length) return;

        // Update active tab
        this.activeTabIndex = index;
        const activeTab = this.tabs[index];

        // Update tab UI
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        const activeTabElement = document.querySelector(`[data-tab-id="${activeTab.id}"]`);
        if (activeTabElement) {
            activeTabElement.classList.add('active');
        }

        // Create webview if it doesn't exist
        if (!activeTab.webview) {
            this.createWebview(activeTab);
        }

        // Show active webview
        this.showWebview(activeTab.webview);
        
        // Update URL input
        document.getElementById('urlInput').value = activeTab.url;
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Resize webview to ensure proper height
        setTimeout(() => this.resizeWebviews(), 100);
    }

    createWebview(tab) {
        const webviewContainer = document.querySelector('.webview-container');
        
        // Create new webview
        const webview = document.createElement('webview');
        webview.id = `webview-${tab.id}`;
        webview.src = tab.url;
        webview.preload = 'preload.js';
        webview.style.display = 'none'; // Hide by default
        
        // Apply webkit-fill-available height
        webview.style.height = '-webkit-fill-available';
        webview.style.width = '100%';
        webview.style.border = 'none';
        webview.addEventListener('dom-ready', () => {
            webview.insertCSS(`
              iframe {
                height: 100% !important;
              }
            `);
          });

        // Webview event listeners
        webview.addEventListener('did-start-loading', () => {
            this.updateTabTitle(tab.id, 'Loading...');
        });

        webview.addEventListener('did-stop-loading', () => {
            this.updateTabTitle(tab.id, webview.getTitle() || 'New Tab');
            this.updateNavigationButtons();
        });

        webview.addEventListener('did-navigate', (e) => {
            tab.url = e.url;
            document.getElementById('urlInput').value = e.url;
            this.updateTabTitle(tab.id, webview.getTitle() || 'New Tab');
        });

        webview.addEventListener('page-title-updated', (e) => {
            this.updateTabTitle(tab.id, e.title);
        });

        webviewContainer.appendChild(webview);
        tab.webview = webview;
    }

    showWebview(webview) {
        // Hide all webviews
        document.querySelectorAll('webview').forEach(wv => {
            wv.style.display = 'none';
        });
        
        // Show active webview
        if (webview) {
            
            webview.style.display = 'flex';
            // Apply webkit-fill-available height
            webview.style.height = '-webkit-fill-available';
            webview.style.width = '100%';
            webview.style.border = 'none';
        }
    }

    updateTabTitle(tabId, title) {
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            const titleElement = tabElement.querySelector('.tab-title');
            titleElement.textContent = title;
        }
    }

    closeTab(tabId) {
        const index = this.tabs.findIndex(t => t.id === tabId);
        if (index === -1) return;

        // Remove tab element
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }

        // Remove webview
        const webview = document.getElementById(`webview-${tabId}`);
        if (webview) {
            webview.remove();
        }

        // Remove from tabs array
        this.tabs.splice(index, 1);

        // Switch to another tab if this was the active one
        if (index === this.activeTabIndex) {
            if (this.tabs.length === 0) {
                this.createNewTab();
            } else {
                this.switchToTab(Math.max(0, index - 1));
            }
        } else if (index < this.activeTabIndex) {
            this.activeTabIndex--;
        }

        // Update navigation buttons after tab switch
        this.updateNavigationButtons();
    }

    navigateToUrl(url) {
        if (!url.trim()) return;

        const activeTab = this.tabs[this.activeTabIndex];
        if (!activeTab) return;

        // Check if it's a search query or URL
        if (this.isSearchQuery(url)) {
            this.performSearch(url);
        } else {
            // Use the electronAPI to handle URL navigation
            window.electronAPI.navigate(url).then(result => {
                if (result.success) {
                    activeTab.url = result.url;
                    if (activeTab.webview) {
                        activeTab.webview.loadURL(result.url);
                    }
                }
            });
        }
    }

    performSearch(query) {
        if (!query.trim()) return;

        window.electronAPI.search(query).then(result => {
            if (result.success) {
                const activeTab = this.tabs[this.activeTabIndex];
                if (activeTab) {
                    activeTab.url = result.url;
                    if (activeTab.webview) {
                        activeTab.webview.loadURL(result.url);
                    }
                }
            }
        });
    }

    isSearchQuery(query) {
        // Check if the query looks like a URL
        const urlPattern = /^(https?:\/\/)|^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        return !urlPattern.test(query);
    }

    goBack() {
        const activeTab = this.tabs[this.activeTabIndex];
        if (activeTab && activeTab.webview && activeTab.webview.canGoBack()) {
            activeTab.webview.goBack();
        }
    }

    goForward() {
        const activeTab = this.tabs[this.activeTabIndex];
        if (activeTab && activeTab.webview && activeTab.webview.canGoForward()) {
            activeTab.webview.goForward();
        }
    }

    reload() {
        const activeTab = this.tabs[this.activeTabIndex];
        if (activeTab && activeTab.webview) {
            activeTab.webview.reload();
        }
    }

    updateNavigationButtons() {
        const activeTab = this.tabs[this.activeTabIndex];
        if (!activeTab || !activeTab.webview) return;

        const backBtn = document.getElementById('backBtn');
        const forwardBtn = document.getElementById('forwardBtn');

        backBtn.disabled = !activeTab.webview.canGoBack();
        forwardBtn.disabled = !activeTab.webview.canGoForward();
    }

    resizeWebviews() {
        // Let CSS handle the sizing
        // This method is kept for potential future use
    }
}

// Initialize the browser when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Browser();
});