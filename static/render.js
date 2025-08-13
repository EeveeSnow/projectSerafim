function getDominantColorFromWebview(webview, callback) {
    webview.capturePage().then(image => {
        const img = new Image();
        img.src = image.toDataURL();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const w = canvas.width = 64;
            const h = canvas.height = 64;

            ctx.drawImage(img, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;

            const colorMap = {};
            let maxCount = 0;
            let dominantColor = '';

            for (let i = 0; i < data.length; i += 4) {
                const r = Math.round(data[i] / 24) * 24;
                const g = Math.round(data[i + 1] / 24) * 24;
                const b = Math.round(data[i + 2] / 24) * 24;
                const key = `${r},${g},${b}`;
                
                colorMap[key] = (colorMap[key] || 0) + 1;

                if (colorMap[key] > maxCount) {
                    maxCount = colorMap[key];
                    dominantColor = key;
                }
            }

            callback(`rgb(${dominantColor})`);
        };
    }).catch(err => {
        console.error("capturePage failed:", err);
    });
}





class Browser {
    constructor() {
        this.tabs = [];
        this.activeTabIndex = 0;
        this.init();
        this.searchMode = true;
        this.isOpen = false;
    }

    
      
    init() {
        
        this.setupEventListeners();
        this.createNewTab();
    }

    setupEventListeners() {
        
        document.getElementById('maximizeBtn').addEventListener('click', () => this.windowmodeChange());
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
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                this.reload();
            }
        });
        
        // Global PiP keyboard shortcut (Ctrl+Shift+P)
        // window.addEventListener('keydown', (e) => {
        //     if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        //         e.preventDefault();
        //         this.triggerGlobalPiP();
        //     }
        // });
        
        // document.getElementById('goBtn').addEventListener('click', () => {
        //     this.navigateToUrl(urlInput.value);
        // });

        // Search functionality
        // const searchInput = document.getElementById('searchInput');
        // searchInput.addEventListener('keypress', (e) => {
        //     if (e.key === 'Enter') {
        //         this.performSearch(searchInput.value);
        //     }
        // });
        // document.getElementById('searchBtn').addEventListener('click', () => {
        //     this.performSearch(searchInput.value);
        // });

        // New tab button
        document.getElementById('newTabBtn').addEventListener('click', () => {
            this.createNewTab();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeWebviews();
            this.updateTabWidthClasses();
        });
        document.getElementById('webBtn').addEventListener('click', () => {
            this.changeSearchMode();
        });
        document.getElementById('aiBtn').addEventListener('click', () => {
            this.changeSearchMode();
        });

        // const toggle = document.getElementById("menuToggle");
        // const dropdown = document.getElementById("dropdownContent");
        
        
        
        // toggle.addEventListener("click", (e) => {
        //   e.stopPropagation(); // Чтобы не закрывалось сразу
        //   this.isOpen = !this.isOpen;
        //   dropdown.style.display = this.isOpen ? "block !important" : "none"}); 
        
        // document.addEventListener("click", () => {
        //     if (this.isOpen) {
        //       dropdown.style.display = "none";
        //       this.isOpen = false;
        //     }
        // });
        const menuToggle = document.getElementById("menuToggle");
        const dropdownContent = document.getElementById("dropdownContent");
        
        if (!menuToggle || !dropdownContent) {
          return;
        }
        
        let isOpen = false;
        
        menuToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          isOpen = !isOpen;
          console.warn(isOpen);
          dropdownContent.style.display = isOpen ? "block" : "none";
        });
        
        // Закрытие при клике вне дропдауна
        document.addEventListener("click", (e) => {
          if (
            isOpen &&
            !dropdownContent.contains(e.target) &&
            e.target !== menuToggle
          ) {
            dropdownContent.style.display = "none";
            isOpen = false;
          }
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
        tabElement.className = 'tab glass-container';
        tabElement.dataset.tabId = tab.id;

        tabElement.innerHTML = `
            <div class="tab-content">
                <img class="tab-icon" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMUM0LjEzNCAxIDEgNC4xMzQgMSA4czMuMTM0IDcgNyA3IDctMy4xMzQgNy03LTMuMTM0LTctNy03em0wIDEyYy0yLjc1NyAwLTUtMi4yNDMtNS01czIuMjQzLTUgNS01IDUgMi4yNDMgNSA1LTIuMjQzIDUtNSA1eiIgZmlsbD0iI2NjY2NjYyIvPgo8L3N2Zz4K" alt="Default" />
                <span class="tab-title">${tab.title}</span>
            </div>
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
        this.updateTabWidthClasses();

    }

    updateTabWidthClasses() {
        const tabs = document.querySelectorAll('.tab');
        const tabList = document.getElementById('tabList');
        const availableWidth = tabList.offsetWidth;
        const tabCount = tabs.length;
        const averageTabWidth = availableWidth / tabCount;

        tabs.forEach(tab => {
            tab.classList.remove('narrow', 'very-narrow');
            if (averageTabWidth < 120) {
                tab.classList.add('narrow');
            }
            else if (averageTabWidth < 80) {
                tab.classList.add('icon-only');
            }
            else if (averageTabWidth < 40) {
                tab.classList.add('very-narrow');
            }
        });
    }

    updateTabIcon(tabId, iconUrl) {
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            const iconElement = tabElement.querySelector('.tab-icon');
            if (iconElement && iconUrl) {
                iconElement.src = iconUrl;
                iconElement.onerror = () => {
                    // Fallback to default icon if favicon fails to load
                    iconElement.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMUM0LjEzNCAxIDEgNC4xMzQgMSA4czMuMTM0IDcgNyA3IDctMy4xMzQgNy03LTMuMTM0LTctNy03em0wIDEyYy0yLjc1NyAwLTUtMi4yNDMtNS01czIuMjQzLTUgNS01IDUgMi4yNDMgNSA1LTIuMjQzIDUtNSA1eiIgZmlsbD0iI2NjY2NjYyIvPgo8L3N2Zz4K";
                };
            }
        }
    }

    updateTabFavicon(tabId, webview) {
        // Try to get favicon from the webview
        webview.executeJavaScript(`
            (function() {
                let favicon = null;
                
                // Try to find favicon in various ways
                const links = document.querySelectorAll('link[rel*="icon"]');
                if (links.length > 0) {
                    // Sort by size preference (larger icons first)
                    const sortedLinks = Array.from(links).sort((a, b) => {
                        const aSize = parseInt(a.sizes?.split('x')[0]) || 0;
                        const bSize = parseInt(b.sizes?.split('x')[0]) || 0;
                        return bSize - aSize;
                    });
                    favicon = sortedLinks[0].href;
                } else {
                    // Fallback to default favicon path
                    favicon = window.location.origin + '/favicon.ico';
                }
                
                return favicon;
            })();
        `).then(favicon => {
            if (favicon) {
                this.updateTabIcon(tabId, favicon);
            }
        }).catch(err => {
            console.log('Could not get favicon:', err);
        });
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
        this.updateTabWidthClasses();
        
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
        webview.webpreferences="contextIsolation=false";
        
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
            
            // Inject PiP functionality
            this.injectPiPFunctionality(webview);
          });

        // Webview event listeners
        webview.addEventListener('did-start-loading', () => {
            this.updateTabTitle(tab.id, 'Loading...');
        });

        webview.addEventListener('did-stop-loading', () => {
            this.updateTabTitle(tab.id, webview.getTitle() || 'New Tab');
            this.updateNavigationButtons();
            getDominantColorFromWebview(webview, (color) => {
                document.body.style.backgroundColor = color;
              });
            this.updateTabFavicon(tab.id, webview);
            // Re-inject PiP functionality after page load
            this.injectPiPFunctionality(webview);
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
        if (this.searchMode)
        {
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
        else {
            query = "https://www.perplexity.ai/search?q=" + query
            const activeTab = this.tabs[this.activeTabIndex];
                if (activeTab) {
                    activeTab.url = query;
                    if (activeTab.webview) {
                        activeTab.webview.loadURL(query);
                    }
                }
        }
        
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

    changeSearchMode()
    {
        if (this.searchMode)
        {
            document.getElementById('webBtn').classList.remove("active");
            document.getElementById('aiBtn').classList.add("active");
        }
        else
        {
            document.getElementById('webBtn').classList.add("active");
            document.getElementById('aiBtn').classList.remove("active");
        }
        this.searchMode = !this.searchMode
    }

    injectPiPFunctionality(webview) {
        const pipScript = `
            (function() {
                // PiP functionality
                function addPiPControls() {
                    const videos = document.querySelectorAll('video');
                    
                    videos.forEach(video => {
                        // Skip if already processed
                        if (video.dataset.pipProcessed) return;
                        video.dataset.pipProcessed = 'true';
                        
                        // Create PiP button
                        const pipButton = document.createElement('button');
                        pipButton.innerHTML = '🔲';
                        pipButton.title = 'Picture in Picture';
                        pipButton.style.cssText = \`
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: rgba(0, 0, 0, 0.7);
                            color: white;
                            border: none;
                            border-radius: 4px;
                            padding: 8px 12px;
                            cursor: pointer;
                            font-size: 14px;
                            z-index: 9999;
                            opacity: 0;
                            transition: opacity 0.3s ease;
                            background: rgba(255, 255, 255, 0.1);
                            backdrop-filter: blur(15px);
                            -webkit-backdrop-filter: blur(15px);
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                            color: white;
                            text-align: center;
                            transition: color 0.3s ease;
                            text-shadow: 0 0 5px rgba(0,0,0,0.6);
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
                            text-align: center;
                        \`;
                        pipButton.class = glass-container;
                        
                        // Show button on video hover
                        video.addEventListener('mouseenter', () => {
                            pipButton.style.opacity = '1';
                        });
                        
                        video.addEventListener('mouseleave', () => {
                            pipButton.style.opacity = '0';
                        });
                        
                        // PiP functionality
                        pipButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            try {
                                if (document.pictureInPictureElement) {
                                    await document.exitPictureInPicture();
                                } else if (document.pictureInPictureEnabled) {
                                    await video.requestPictureInPicture();
                                } else {
                                    console.log('PiP not supported');
                                }
                            } catch (error) {
                                console.error('PiP error:', error);
                            }
                        });
                        
                        // Add button to video container
                        const videoContainer = video.parentElement;
                        if (videoContainer) {
                            videoContainer.style.position = 'relative';
                            videoContainer.appendChild(pipButton);
                        }
                        
                        // Handle PiP events
                        video.addEventListener('enterpictureinpicture', () => {
                            pipButton.innerHTML = '🔳';
                            pipButton.title = 'Exit Picture in Picture';
                        });
                        
                        video.addEventListener('leavepictureinpicture', () => {
                            pipButton.innerHTML = '🔲';
                            pipButton.title = 'Picture in Picture';
                        });
                    });
                }
                
                // Run initially
                addPiPControls();
                
                // Watch for new videos
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // Element node
                                if (node.tagName === 'VIDEO') {
                                    addPiPControls();
                                } else if (node.querySelectorAll) {
                                    const videos = node.querySelectorAll('video');
                                    if (videos.length > 0) {
                                        addPiPControls();
                                    }
                                }
                            }
                        });
                    });
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                
                // Add keyboard shortcut (Ctrl+Shift+P)
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                        e.preventDefault();
                        const activeVideo = document.querySelector('video:focus, video:hover');
                        if (activeVideo) {
                            activeVideo.click();
                        }
                    }
                });
                
                // Add right-click context menu
                document.addEventListener('contextmenu', (e) => {
                    if (e.target.tagName === 'VIDEO') {
                        const menu = document.createElement('div');
                        menu.style.cssText = \`
                            position: fixed;
                            top: \${e.clientY}px;
                            left: \${e.clientX}px;
                            background: rgba(255, 255, 255, 0.1);
                            color: white;
                            border-radius: 4px;
                            padding: 8px 0;
                            z-index: 10000;
                            font-size: 14px;
                        \`;
                        
                        const pipOption = document.createElement('div');
                        pipOption.textContent = 'Picture in Picture';
                        pipOption.style.cssText = \`
                            padding: 8px 16px;
                            cursor: pointer;
                            transition: background 0.2s;
                        \`;
                        
                        pipOption.addEventListener('mouseenter', () => {
                            pipOption.style.background = 'rgba(255, 255, 255, 0.2)';
                        });
                        
                        pipOption.addEventListener('mouseleave', () => {
                            pipOption.style.background = 'transparent';
                        });
                        
                        pipOption.addEventListener('click', async () => {
                            try {
                                if (document.pictureInPictureElement) {
                                    await document.exitPictureInPicture();
                                } else if (document.pictureInPictureEnabled) {
                                    await e.target.requestPictureInPicture();
                                }
                            } catch (error) {
                                console.error('PiP error:', error);
                            }
                            document.body.removeChild(menu);
                        });
                        
                        menu.appendChild(pipOption);
                        document.body.appendChild(menu);
                        
                        // Remove menu when clicking elsewhere
                        setTimeout(() => {
                            if (document.body.contains(menu)) {
                                document.body.removeChild(menu);
                            }
                        }, 3000);
                        
                        e.preventDefault();
                    }
                });
            })();
        `;
        
        webview.executeJavaScript(pipScript);
    }

    triggerGlobalPiP() {
        const activeTab = this.tabs[this.activeTabIndex];
        if (!activeTab || !activeTab.webview) return;
        
        // Execute PiP trigger in the active webview
        const pipTriggerScript = `
            (function() {
                const videos = document.querySelectorAll('video');
                if (videos.length > 0) {
                    const firstVideo = videos[0];
                    if (document.pictureInPictureElement) {
                        document.exitPictureInPicture();
                    } else if (document.pictureInPictureEnabled) {
                        firstVideo.requestPictureInPicture();
                    }
                }
            })();
        `;
        
        activeTab.webview.executeJavaScript(pipTriggerScript);
        
        // Show indicator
        this.showPiPIndicator();
    }

    showPiPIndicator() {
        // Create indicator if it doesn't exist
        let indicator = document.querySelector('.pip-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'pip-indicator';
            indicator.innerHTML = '🎬 Picture-in-Picture Mode';
            document.body.appendChild(indicator);
        }
        
        indicator.classList.add('show');
        
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 3000);
    }

    windowmodeChange() {
        const maximizeBtn = document.getElementById('maximizeBtn')
        if (maximizeBtn.innerHTML === '<i class="bi bi-fullscreen"></i>')
        {
            maximizeBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>'
        }
        else maximizeBtn.innerHTML = '<i class="bi bi-fullscreen"></i>'
    }

    
}



// Initialize the browser when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Browser();
});