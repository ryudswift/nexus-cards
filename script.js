document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const config = {
        notionApiKey: 'secret_YOUR_NOTION_TOKEN', // <-- Replace with your Notion Integration Token
        databaseId: 'YOUR_DATABASE_ID', // <-- Replace with your Notion Database ID
        n8nWebhookUrl: 'https://n8n.sudev.site/webhook/yt-expert-sauce',
        playerAge: 42, // As per PRD, for level capping
        ownerId: 'SudoDev' // Static owner ID for MVP
    };
    // --- DOM ELEMENT REFERENCES ---
    const generateBtn = document.getElementById('generate-card-btn');
    const urlInput = document.getElementById('youtube-url-input');
    const statusText = document.getElementById('generate-status');
    const cardLibrary = document.getElementById('card-library');
    const loadingSpinner = document.getElementById('loading-spinner');
    const kpiTotal = document.getElementById('kpi-total-cards');
    const kpiCreated = document.getElementById('kpi-courses-created');
    const kpiRate = document.getElementById('kpi-completion-rate');
    const playerLevelDisplay = document.getElementById('player-level-display');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalSummary = document.getElementById('modal-summary');
    const modalImg = document.getElementById('modal-img');
    const modalDocLink = document.getElementById('modal-doc-link');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- New Modal Element References ---
    const tabSummary = document.getElementById('tab-summary');
    const tabDetails = document.getElementById('tab-details');
    const tabMarkdown = document.getElementById('tab-markdown');
    const contentSummary = document.getElementById('content-summary');
    const contentDetails = document.getElementById('content-details');
    const contentMarkdown = document.getElementById('content-markdown');
    const modalOriginalTitle = document.getElementById('modal-original-title');
    const modalStatus = document.getElementById('modal-status');
    const modalRarity = document.getElementById('modal-rarity');
    const modalInsight = document.getElementById('modal-insight');
    const modalClarity = document.getElementById('modal-clarity');
    const modalRarityStat = document.getElementById('modal-rarity-stat');
    const modalOwner = document.getElementById('modal-owner');
    const modalVidLink = document.getElementById('modal-vid-link');
    const modalDocLinkDetail = document.getElementById('modal-doc-link-detail');
    const modalMarkdown = document.getElementById('modal-markdown');
    const downloadMdBtn = document.getElementById('download-md-btn');
    const learnUnlockBtn = document.getElementById('learn-unlock-btn');
    const learnTimer = document.getElementById('learn-timer');
    const timerDisplay = document.getElementById('timer-display');

    // --- APPLICATION STATE ---
    let state = {
        cards: [],
        playerXP: 0,
        trueLevel: 1,
        currentModalCard: null // To keep track of the card currently shown in the modal
    };

    /**
     * Utility to get YouTube Video ID
     */
    function getYoutubeID(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    /**
     * Fetches card data from the Notion Database.
     */
    async function fetchNotionData() {
        // Using a CORS proxy is often necessary for client-side Notion API calls
        const PROXY_URL = 'https://cors-anywhere.herokuapp.com/'; 
        const NOTION_API_URL = `https://api.notion.com/v1/databases/${config.databaseId}/query`;
        try {
            const response = await fetch(PROXY_URL + NOTION_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.notionApiKey}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                body: JSON.stringify({ page_size: 100 })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (errorData) {
                     throw new Error(`Notion API Error: ${errorData.message}`);
                } else {
                    const textResponse = await response.text();
                     throw new Error(`API Error (Not JSON): ${textResponse.substring(0, 100)}...`);
                }
            }
            const data = await response.json();
            
            // Process raw Notion data into our card objects
            state.cards = data.results.map(page => {
                const props = page.properties;
                
                // Helper to safely extract property values
                const getProp = (name, type, sub) => {
                    if (!props[name] || !props[name][type]) return null;
                    if (sub && props[name][type][0]) {
                        return props[name][type][0][sub];
                    }
                    return props[name][type];
                }

                const cardTitle = getProp('Title', 'title', 'plain_text') || 'Untitled Card';
                const cardName = getProp('Card Name', 'rich_text', 'plain_text') || cardTitle;
                
                // Calculate derived stats
                const summaryText = getProp('Summary', 'rich_text', 'plain_text') || 'No summary available.';
                const videoUrl = getProp('vid Link', 'url');
                let videoDurationInMinutes = 10; // Default/fallback
                // In a real scenario, you'd get this from the n8n workflow or YouTube API
                // For now, we'll mock it or use a default for Clarity calculation.
                
                const insight = summaryText.length; // Length of Summary text
                const clarity = Math.round(1000 / videoDurationInMinutes); // 1000 / duration
                const rarityScore = getProp('Rarity Score', 'number') || Math.floor(Math.random() * 50) + 1;
                
                return {
                    id: page.id,
                    title: cardTitle,
                    cardName: cardName,
                    summary: summaryText,
                    docUrl: getProp('Doc URL', 'url'),
                    vidUrl: videoUrl,
                    status: getProp('Status', 'select')?.name || 'Not started',
                    coverArtUrl: getProp('Cover Art URL', 'url') || 
                                (videoUrl ? `https://img.youtube.com/vi/${getYoutubeID(videoUrl)}/maxresdefault.jpg` : 'https://placehold.co/600x400/0c0a18/FFF?text=Nexus'),
                    rarityScore: rarityScore,
                    // --- New Stats ---
                    insight: insight,
                    clarity: clarity,
                    rarity: rarityScore, // Using Rarity Score for SPD
                    ownerId: config.ownerId // Static for MVP
                };
            }).filter(card => card.title !== 'Untitled Card');

            render();
        } catch (error) {
            console.error('Failed to fetch data from Notion:', error);
            let userMessage = `Error: ${error.message}. Check console for details.`;
            if (error.message.includes('cors-anywhere')) {
                userMessage = `CORS Proxy Error. Please visit cors-anywhere.herokuapp.com and request temporary access.`;
            }
            loadingSpinner.innerHTML = `<p class="text-red-400">${userMessage}</p>`;
        }
    }

    /**
     * Renders all parts of the application based on the current state.
     */
    function render() {
        if (state.cards.length === 0 && loadingSpinner.style.display !== 'none') {
             return;
        }
        loadingSpinner.style.display = 'none';
        cardLibrary.innerHTML = ''; 
        calculatePlayerLevel();
        renderDashboard();
        renderCards();
    }

    /**
     * Calculates player level based on completed courses.
     */
    function calculatePlayerLevel() {
        const completedCourses = state.cards.filter(card => card.status === 'Complete').length;
        state.playerXP = completedCourses * 100; // 100 XP per completed course
        state.trueLevel = Math.floor(state.playerXP / 100) + 1; // Start at level 1
    }

    /**
     * Updates the KPI displays and player level on the dashboard.
     */
    function renderDashboard() {
        const totalCards = state.cards.length;
        const coursesCreated = state.cards.filter(card => card.status === 'Complete').length;
        const completionRate = totalCards > 0 ? Math.round((coursesCreated / totalCards) * 100) : 0;
        kpiTotal.textContent = totalCards;
        kpiCreated.textContent = coursesCreated;
        kpiRate.textContent = `${completionRate}%`;
        const displayLevel = Math.min(state.trueLevel, config.playerAge);
        playerLevelDisplay.innerHTML = `
            <div class="font-bold text-2xl text-purple-400">LVL ${displayLevel}</div>
            <div class="text-xs text-gray-500">True Lvl: ${state.trueLevel}</div>
        `;
    }

    /**
     * Renders the Nexus Cards into the library grid.
     */
    function renderCards() {
        state.cards.forEach(card => {
            const isEpic = card.status === 'Complete';
            const cardContainer = document.createElement('div');
            cardContainer.className = 'perspective-container';
            
            const cardHTML = `
                <div class="nexus-card w-full aspect-[2.5/3.5] bg-gray-900/60 rounded-lg shadow-xl p-3 flex flex-col justify-between warframe-glare ${isEpic ? 'epic-card-border' : 'border border-gray-700'}">
                    <div class="flex justify-between items-start text-xs">
                        <span class="font-bold text-white truncate pr-2">${card.cardName}</span>
                        <span class="font-black text-yellow-400">${card.rarityScore}</span>
                    </div>
                    <div class="flex-grow my-2 flex items-center justify-center">
                        <img src="${card.coverArtUrl}" alt="${card.cardName}" class="max-h-full max-w-full object-contain rounded-md">
                    </div>
                    <div class="text-center text-xs">
                       ${isEpic ? `<span class="font-bold text-yellow-300 tracking-widest">:: EPIC ::</span>` : `<span class="text-gray-500">${card.status}</span>`}
                    </div>
                </div>
            `;
            cardContainer.innerHTML = cardHTML;
            cardContainer.addEventListener('click', () => openModal(card));
            add3dHoverEffect(cardContainer);
            cardLibrary.appendChild(cardContainer);
        });
    }

    /**
     * Generates Markdown content for a card.
     */
    function generateMarkdown(card) {
        return `# ${card.cardName}

**Original Title:** ${card.title}
**Status:** ${card.status}
**Rarity Score:** ${card.rarityScore}
**Insight (ATK):** ${card.insight}
**Clarity (DEF):** ${card.clarity}
**Rarity (SPD):** ${card.rarity}
**Owner ID:** ${card.ownerId}

## Summary
${card.summary}

## Links
- [Video](${card.vidUrl})
- [Document](${card.docUrl})
`;
    }

    /**
     * Opens the modal with details for a specific card.
     */
    function openModal(card) {
        state.currentModalCard = card; // Store reference

        // Populate Summary Tab
        modalTitle.textContent = card.cardName;
        modalSummary.textContent = card.summary;
        modalImg.src = card.coverArtUrl;
        modalImg.alt = card.cardName;
        modalDocLink.href = card.docUrl || '#';

        // Populate Details Tab
        modalOriginalTitle.textContent = card.title;
        modalStatus.textContent = card.status;
        modalRarity.textContent = card.rarityScore;
        modalInsight.textContent = card.insight;
        modalClarity.textContent = card.clarity;
        modalRarityStat.textContent = card.rarity;
        modalOwner.textContent = card.ownerId;
        modalVidLink.href = card.vidUrl || '#';
        modalVidLink.textContent = card.vidUrl ? 'Watch Video' : 'N/A';
        modalDocLinkDetail.href = card.docUrl || '#';
        modalDocLinkDetail.textContent = card.docUrl ? 'View Document' : 'N/A';

        // Populate Markdown Tab
        const markdownContent = generateMarkdown(card);
        modalMarkdown.textContent = markdownContent;

        // Reset modal view to Summary tab
        switchTab('summary');

        // Show modal with fade-in effect
        modal.classList.remove('hidden');
        const modalContent = document.querySelector('.modal-content');
        setTimeout(() => modalContent.classList.remove('modal-hidden'), 10); // Small delay for transition
        modalContent.classList.add('modal-visible');
    }

    /**
     * Switches the active tab and content in the modal.
     */
    function switchTab(tabName) {
        // Deactivate all tabs and content
        [tabSummary, tabDetails, tabMarkdown].forEach(tab => tab.classList.remove('active'));
        [contentSummary, contentDetails, contentMarkdown].forEach(content => content.classList.remove('active'));

        // Activate the selected tab and content
        if (tabName === 'summary') {
            tabSummary.classList.add('active');
            contentSummary.classList.add('active');
        } else if (tabName === 'details') {
            tabDetails.classList.add('active');
            contentDetails.classList.add('active');
        } else if (tabName === 'markdown') {
            tabMarkdown.classList.add('active');
            contentMarkdown.classList.add('active');
        }
    }

    /**
     * Closes the modal.
     */
    function closeModal() {
        const modalContent = document.querySelector('.modal-content');
        modalContent.classList.add('modal-hidden');
        modalContent.classList.remove('modal-visible');
        setTimeout(() => {
            modal.classList.add('hidden');
            state.currentModalCard = null; // Clear reference
        }, 300); // Match CSS transition duration
    }

    /**
     * Adds the 3D hover effect to a card element.
     */
    function add3dHoverEffect(container) {
        const card = container.querySelector('.nexus-card');
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const { width, height } = rect;
            const rotateX = (y / height - 0.5) * -25;
            const rotateY = (x / width - 0.5) * 25;
            card.style.setProperty('--rotateX', `${rotateX}deg`);
            card.style.setProperty('--rotateY', `${rotateY}deg`);
        });
        container.addEventListener('mouseleave', () => {
            card.style.setProperty('--rotateX', '0deg');
            card.style.setProperty('--rotateY', '0deg');
        });
    }

    /**
     * Handles the click event for the 'Generate' button.
     */
    async function handleGenerateCard() {
        const url = urlInput.value.trim();
        if (!url) {
            statusText.textContent = 'Please enter a YouTube URL.';
            return;
        }
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        statusText.textContent = 'Sending request to n8n workflow...';
        try {
            const response = await fetch(config.n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });
            if (!response.ok) {
               throw new Error(`Webhook failed with status: ${response.status}`);
            }
            statusText.textContent = 'Success! Card is being processed. Refresh in a moment.';
            urlInput.value = '';
            // Optional: Auto-refresh after a delay
            // setTimeout(fetchNotionData, 5000);
        } catch(error) {
            console.error('Failed to trigger n8n webhook:', error);
            statusText.textContent = `Error: ${error.message}`;
        } finally {
             setTimeout(() => {
                 generateBtn.disabled = false;
                 generateBtn.textContent = 'Generate';
                 statusText.textContent = '';
             }, 5000);
        }
    }

    /**
     * Handles downloading the Markdown content.
     */
    function handleDownloadMarkdown() {
        if (!state.currentModalCard) return;

        const markdownContent = generateMarkdown(state.currentModalCard);
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.currentModalCard.cardName.replace(/\s+/g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }

    /**
     * Handles the "Learn & Unlock" button click.
     * Starts a simulated timer.
     */
    function handleLearnUnlock() {
        if (!state.currentModalCard || state.currentModalCard.status === 'Complete') {
            return; // Already unlocked or no card
        }

        // Mock duration based on video length or fixed time
        // For demo, let's use a short fixed time
        let timeLeft = 10; // seconds

        learnUnlockBtn.classList.add('hidden');
        learnTimer.classList.remove('hidden');
        timerDisplay.textContent = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;

        const timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                // Simulate completion
                state.currentModalCard.status = 'Complete';
                // Update local storage (simulated)
                // In a real app, you'd update Notion here
                console.log(`Card ${state.currentModalCard.id} marked as Complete.`);
                
                // Update UI
                learnTimer.classList.add('hidden');
                // Re-open modal to reflect changes
                closeModal();
                // Brief delay to allow close animation
                setTimeout(() => {
                    openModal(state.currentModalCard);
                    // Refresh the main card grid to show EPIC styling
                    render();
                }, 350);
            }
        }, 1000);
    }


    // --- EVENT LISTENERS ---
    function initEventListeners() {
        generateBtn.addEventListener('click', handleGenerateCard);
        modalCloseBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if(e.target === modal) closeModal();
        });

        // Modal Tab Switching
        tabSummary.addEventListener('click', () => switchTab('summary'));
        tabDetails.addEventListener('click', () => switchTab('details'));
        tabMarkdown.addEventListener('click', () => switchTab('markdown'));

        // Download Markdown
        downloadMdBtn.addEventListener('click', handleDownloadMarkdown);

        // Learn & Unlock
        learnUnlockBtn.addEventListener('click', handleLearnUnlock);
    }

    // --- INITIALIZATION ---
    function init() {
        initEventListeners();
        fetchNotionData();
    }
    init();
});
