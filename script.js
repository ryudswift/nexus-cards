document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const config = {
        playerAge: 42, // As per PRD, for level capping
        ownerId: 'SudoDev' // Static owner ID for MVP
    };

    // --- APPLICATION STATE ---
    // In a full implementation, this would be populated by reading JSON files.
    // state.allCardData holds the full data from individual JSONs
    // state.db holds the compiled data for the dashboard (like cards-db.json)
    const state = {
        allCardData: {}, // Will hold full data from individual JSONs (key: cardId)
        db: [],          // Will hold simplified data for dashboard rendering
        playerXP: 0,
        trueLevel: 1,
        currentCardId: null, // ID of card in main modal
        currentQuiz: null    // Data for quiz in progress
    };

    // --- DOM ELEMENT REFERENCES ---
    const syncLibraryBtn = document.getElementById('sync-library-btn');
    const syncStatus = document.getElementById('sync-status');
    const cardLibrary = document.getElementById('card-library');
    const loadingSpinner = document.getElementById('loading-spinner');
    const kpiTotal = document.getElementById('kpi-total-cards');
    const kpiMastered = document.getElementById('kpi-cards-mastered');
    const kpiRate = document.getElementById('kpi-mastery-rate');
    const playerLevelDisplay = document.getElementById('player-level-display');

    // Modal elements
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalSummary = document.getElementById('modal-summary');
    const modalImg = document.getElementById('modal-img');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const flipCardBtn = document.getElementById('flip-card-btn');
    const modalCard = modal.querySelector('.modal-card');
    const modalBackTitle = document.getElementById('modal-back-title');
    const modalBackContent = document.getElementById('modal-back-content');
    const modalActionButtons = document.getElementById('modal-action-buttons');
    // --- Audio Player Elements ---
    const audioPlayerSection = document.getElementById('audio-player-section');
    const audioPlayer = document.getElementById('audio-player');
    // --- End Audio Player Elements ---

    // Quiz Modal elements
    const quizModal = document.getElementById('quiz-modal');
    const quizTitle = document.getElementById('quiz-title');
    const quizQuestionsArea = document.getElementById('quiz-questions-area');
    const quizSubmitBtn = document.getElementById('quiz-submit-btn');
    const quizResultText = document.getElementById('quiz-result-text');

    /**
     * Placeholder for the file sync process.
     * In a real app, this would scan directories and read JSON files.
     * For now, it initializes with sample data.
     */
    function simulateFileSync() {
        syncStatus.textContent = 'Scanning directories... (Placeholder)';
        console.log("Simulating sync: In a real app, this would read /cards/*/*.json");

        // Reset state for clean sync
        state.allCardData = {};
        state.db = [];

        // Load sample data
        const foundFilesData = getSampleIndividualCardJSONs();
        foundFilesData.forEach(cardData => {
            state.allCardData[cardData.id] = cardData;
            // Create the entry for our "cards-db.json" simulation (state.db)
            state.db.push({
                id: cardData.id,
                cardName: cardData.cardName,
                title: cardData.title,
                coverArtUrl: cardData.coverArtUrl,
                rarityScore: cardData.rarityScore,
                status: cardData.status,
                level: cardData.level,
                category: cardData.category,
                subcategory: cardData.subcategory, // Include subcategory
                summary: cardData.summary,
                latentAbility: cardData.latentAbility,
                docUrl: cardData.docUrl,
                audioUrl: cardData.audioUrl // Include audioUrl for modal logic
                // guidePath could be derived: `cards/{category}/{id}.html`
            });
        });

        syncStatus.textContent = `Sync complete. ${state.db.length} cards loaded.`;
        setTimeout(() => {
            if (syncStatus.textContent === `Sync complete. ${state.db.length} cards loaded.`) {
                syncStatus.textContent = '';
            }
        }, 4000);

        render(); // Render the state with sample data
    }

    /**
     * Renders all parts of the application based on the current state.
     */
    function render() {
        if (state.db.length > 0) {
            loadingSpinner.style.display = 'none';
        } else {
            // Update spinner message if library is empty
            loadingSpinner.innerHTML = `<p class="text-lg">Click "Sync Library" to begin.</p>`;
        }
        cardLibrary.innerHTML = '';
        calculatePlayerLevel();
        renderDashboard();
        renderCards();
    }

    /**
     * Calculates player level based on mastered cards (Level 3).
     */
    function calculatePlayerLevel() {
        const masteredCards = state.db.filter(card => card.level === 3).length;
        state.playerXP = masteredCards * 100; // 100 XP per mastered card
        state.trueLevel = Math.floor(state.playerXP / 100) + 1; // Start at level 1
    }

    /**
     * Updates the KPI displays and player level on the dashboard.
     */
    function renderDashboard() {
        const totalCards = state.db.length;
        const cardsMastered = state.db.filter(card => card.level === 3).length;
        const masteryRate = totalCards > 0 ? Math.round((cardsMastered / totalCards) * 100) : 0;

        kpiTotal.textContent = totalCards;
        kpiMastered.textContent = cardsMastered;
        kpiRate.textContent = `${masteryRate}%`;

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
        state.db.forEach(card => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'perspective-container';

            // Determine border style based on card level
            let borderClass = 'border border-gray-700'; // Default for Level 1
            if (card.level === 2) borderClass = 'level-2-border';
            if (card.level === 3) borderClass = 'level-3-border';

            cardContainer.innerHTML = `
                <div class="nexus-card w-full aspect-[2.5/3.5] bg-gray-900/60 rounded-lg shadow-xl p-3 flex flex-col justify-between warframe-glare ${borderClass}">
                    <div class="flex justify-between items-start text-xs">
                        <span class="font-bold text-white truncate pr-2">${card.cardName}</span>
                        <span class="font-black text-yellow-400">${card.rarityScore}</span>
                    </div>
                    <div class="flex-grow my-2 flex items-center justify-center">
                        <img src="${card.coverArtUrl}" alt="${card.cardName}" class="max-h-full max-w-full object-contain rounded-md">
                    </div>
                    <div class="text-center text-xs">
                        ${card.level === 3 ?
                            `<span class="font-bold text-yellow-300 tracking-widest">:: MASTERED ::</span>` :
                            `<span class="text-gray-500">Level ${card.level}</span>`
                        }
                    </div>
                </div>
            `;
            cardContainer.addEventListener('click', () => openModal(card.id));
            add3dHoverEffect(cardContainer);
            cardLibrary.appendChild(cardContainer);
        });
    }

    /**
     * Opens the detailed modal for a specific card.
     * @param {string} cardId - The ID of the card to display.
     */
    function openModal(cardId) {
        state.currentCardId = cardId;
        // Find card data in our "database" (state.db)
        const cardEntry = state.db.find(c => c.id === cardId);
        if (!cardEntry) {
            console.error("Card entry not found in DB:", cardId);
            return;
        }

        // Populate Front of Card
        modalTitle.textContent = cardEntry.cardName;
        modalSummary.textContent = cardEntry.summary;
        modalImg.src = cardEntry.coverArtUrl;

        // Populate Back of Card
        modalBackTitle.textContent = `${cardEntry.cardName} - Intel`;

        // Determine Latent Ability display
        let latentAbilityHTML = cardEntry.level === 3 ?
            `<p class="text-sm text-yellow-300"><span class="font-bold">Latent Ability:</span> ${cardEntry.latentAbility}</p>` :
            `<p class="text-sm text-gray-500"><span class="font-bold">Latent Ability:</span> [Locked - Reach Level 3]</p>`;

        modalBackContent.innerHTML = `
            <p class="text-sm"><span class="font-bold">Level:</span> ${cardEntry.level} (${cardEntry.status})</p>
            <p class="text-sm"><span class="font-bold">Rarity:</span> ${cardEntry.rarityScore}</p>
            <p class="text-sm"><span class="font-bold">Category:</span> ${cardEntry.category} / ${cardEntry.subcategory}</p>
            ${latentAbilityHTML}
        `;

        // --- Audio Player Logic ---
        // Use the full data (state.allCardData) for the audio URL
        const fullCardData = state.allCardData[cardId];
        if (fullCardData && fullCardData.audioUrl && fullCardData.audioUrl.trim() !== '') {
            // Make the audio source playable by Google Drive by modifying the URL format
            // This is a common workaround for direct audio playback from Google Drive links
            let playableAudioUrl = fullCardData.audioUrl;
            if (fullCardData.audioUrl.includes('drive.google.com/file/d/')) {
                // Convert 'https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk'
                // to 'https://drive.google.com/uc?export=download&id=FILE_ID'
                const fileIdMatch = fullCardData.audioUrl.match(/\/file\/d\/([^\/]+)/);
                if (fileIdMatch && fileIdMatch[1]) {
                    playableAudioUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
                }
            }
            audioPlayer.src = playableAudioUrl;
            audioPlayerSection.classList.remove('hidden');
        } else {
            audioPlayerSection.classList.add('hidden');
        }
        // --- End Audio Player Logic ---

        // Populate Action Buttons based on card level
        // Use the full data (state.allCardData) for actions that might need more details
        modalActionButtons.innerHTML = ''; // Clear previous buttons
        if (cardEntry.level === 1) {
            const quizBtn = createModalButton('Take Quiz: Level 1', 'bg-green-600', () => startQuiz(cardId, 1));
            modalActionButtons.appendChild(quizBtn);
        } else if (cardEntry.level === 2) {
            // Order: Guide first, then Quiz (as in Beta v1.11)
            const guideBtn = createModalButton('View Full Guide', 'bg-blue-600', () => window.open(cardEntry.docUrl, '_blank'));
            const quizBtn = createModalButton('Take Quiz: Level 2', 'bg-green-600', () => startQuiz(cardId, 2));
            modalActionButtons.appendChild(guideBtn);
            modalActionButtons.appendChild(quizBtn);
        } else if (cardEntry.level === 3) {
            const guideBtn = createModalButton('View Full Guide', 'bg-blue-600', () => window.open(cardEntry.docUrl, '_blank'));
            modalActionButtons.appendChild(guideBtn);
        }

        // Reset card flip state and show modal
        modalCard.classList.remove('is-flipped');
        modal.classList.remove('hidden');
    }


    /**
     * Helper function to create styled buttons for the modal.
     * @param {string} text - Button text.
     * @param {string} bgColor - Tailwind background color class.
     * @param {Function} onClick - Click handler function.
     * @returns {HTMLButtonElement} - The created button element.
     */
    function createModalButton(text, bgColor, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = `${bgColor} hover:opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300 flex-1`;
        btn.onclick = onClick;
        return btn;
    }

    /**
     * Closes the main card detail modal.
     */
    function closeModal() {
        modal.classList.add('hidden');
        state.currentCardId = null;
    }

    /**
     * Starts the quiz process for a given card and level.
     * @param {string} cardId - The ID of the card.
     * @param {number} level - The level of the quiz (1 or 2).
     */
    function startQuiz(cardId, level) {
        closeModal(); // Close the main card modal first

        // Get the full card data (which contains quiz questions)
        const fullCardData = state.allCardData[cardId];
        // Select the correct quiz data based on level
        const quizData = level === 1 ? fullCardData.quizLevel1 : fullCardData.quizLevel2;

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            alert('Quiz data not found or is empty for this level.');
            return;
        }

        // Store current quiz state
        state.currentQuiz = { cardId, level, questions: quizData.questions };

        // Populate Quiz Modal UI
        quizTitle.textContent = `${fullCardData.cardName} - Quiz Level ${level}`;
        quizQuestionsArea.innerHTML = '';
        quizResultText.textContent = '';
        quizResultText.className = 'text-lg font-semibold'; // Reset result text style
        quizSubmitBtn.disabled = false;

        // Dynamically create quiz questions
        quizData.questions.forEach((q, index) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'mb-6';

            // Create HTML for answer options
            let optionsHTML = q.options.map((opt, i) => `
                <div class="quiz-option p-3 border border-gray-700 rounded-md cursor-pointer hover:bg-gray-700" data-q-index="${index}" data-opt-index="${i}">
                    <span class="font-bold mr-2">${String.fromCharCode(65 + i)}:</span> ${opt}
                </div>
            `).join('');

            questionEl.innerHTML = `
                <p class="font-semibold mb-3">${index + 1}. ${q.text}</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${optionsHTML}</div>
            `;
            quizQuestionsArea.appendChild(questionEl);
        });

        // Add interactivity to quiz options (select one per question)
        quizQuestionsArea.querySelectorAll('.quiz-option').forEach(el => {
            el.addEventListener('click', (e) => {
                const qIndex = e.currentTarget.dataset.qIndex;
                // Deselect other options for the same question
                quizQuestionsArea.querySelectorAll(`.quiz-option[data-q-index="${qIndex}"]`).forEach(opt => opt.classList.remove('selected'));
                // Select the clicked option
                e.currentTarget.classList.add('selected');
            });
        });

        // Show the quiz modal
        quizModal.classList.remove('hidden');
    }

    /**
     * Handles the submission and grading of the current quiz.
     */
    function submitQuiz() {
        if (!state.currentQuiz) return;

        const { cardId, level, questions } = state.currentQuiz;
        let score = 0;

        // Grade each question
        questions.forEach((q, qIndex) => {
            // Find all options and the selected one for this question
            const options = quizQuestionsArea.querySelectorAll(`.quiz-option[data-q-index="${qIndex}"]`);
            const selectedOption = quizQuestionsArea.querySelector(`.quiz-option[data-q-index="${qIndex}"].selected`);

            if (!selectedOption) return; // Skip if no answer was selected

            // Get the text of the selected answer
            const selectedAnswerIndex = selectedOption.dataset.optIndex;
            const selectedAnswer = q.options[selectedAnswerIndex];
            const correctAnswer = q.correct;

            // Remove selection highlight for clarity
            options.forEach(opt => opt.classList.remove('selected'));

            // Check if the answer is correct and apply styling
            if (selectedAnswer === correctAnswer) {
                score++;
                selectedOption.classList.add('correct');
            } else {
                selectedOption.classList.add('incorrect');
                // Highlight the correct answer for feedback
                options.forEach(opt => {
                    if (q.options[opt.dataset.optIndex] === correctAnswer) {
                        opt.classList.add('correct');
                    }
                });
            }
        });

        // Disable submit button to prevent multiple submissions
        quizSubmitBtn.disabled = true;

        // Determine pass/fail (e.g., 80% required)
        const passingScore = Math.ceil(questions.length * 0.8);
        const passed = score >= passingScore;

        // Display result
        if (passed) {
            quizResultText.textContent = `Passed! (${score}/${questions.length})`;
            quizResultText.className = 'text-lg font-semibold text-green-400';

            // Update card level in the "database" (state.db)
            const cardInDb = state.db.find(c => c.id === cardId);
            if (cardInDb) {
                cardInDb.level = level + 1; // Level up
                // Update status based on new level
                if (cardInDb.level === 3) {
                    cardInDb.status = 'Complete';
                } else if (cardInDb.level === 2) {
                    cardInDb.status = 'In Progress';
                }
                console.log(`Card ${cardId} leveled up to ${cardInDb.level}`);
            }

            // After a short delay, close the quiz and refresh the dashboard
            setTimeout(() => {
                quizModal.classList.add('hidden');
                render(); // Re-render to show updated card levels/stats
            }, 2000);

        } else {
            quizResultText.textContent = `Failed. (${score}/${questions.length}). Review and try again!`;
            quizResultText.className = 'text-lg font-semibold text-red-400';

            // Close quiz modal after delay
            setTimeout(() => {
                quizModal.classList.add('hidden');
            }, 2000);
        }
    }

    /**
     * Adds the 3D hover effect to a card element.
     * @param {HTMLElement} container - The perspective container div.
     */
    function add3dHoverEffect(container) {
        const card = container.querySelector('.nexus-card');
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const { width, height } = rect;
            const rotateX = (y / height - 0.5) * -25; // Invert Y axis
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
     * Provides sample data simulating individual JSON card files.
     * This mimics the structure expected from files like:
     * /cards/health/[HM]-001-Mindfulness_Techniques.json
     * /cards/wealth/[WI]-042-AI_Business_Prototyping.json
     * In a real app, this data would come from reading and parsing those files.
     * @returns {Array} - An array of card data objects.
     */
    function getSampleIndividualCardJSONs() {
        // This function simulates the content that would be in individual .json files
        return [
            {
                "id": "WI-017-Significant_Income_through_Clipping",
                "cardName": "Clipping Profit Matrix",
                "title": "017-Significant Income through Clipping-sudev",
                "summary": "This video discusses the process of clipping, which involves taking long-form video content and editing it into engaging short clips for platforms like TikTok and Instagram. By using a specific platform, viewers can tap into a lucrative market that allows for freelance work or larger agency setups, making it a timely opportunity in content creation.",
                "vidUrl": "https://www.youtube.com/watch?v=9krpfoW0i5E",
                "docUrl": "",
                "pdfUrl": "",
                "audioUrl": "", // No audio for this example
                "coverArtUrl": "https://img.youtube.com/vi/9krpfoW0i5E/maxresdefault.jpg",
                "rarityScore": 75,
                "status": "Not Started",
                "level": 1,
                "ownerId": "SudoDev",
                "category": "Wealth",
                "subcategory": "Income",
                "latentAbility": "Unlocks 10% faster editing workflow suggestions.",
                "insight": 300,
                "clarity": 80,
                "rarity": 75,
                "quizLevel1": {
                    "questions": [
                        {
                            "text": "What is the primary platform mentioned for distributing clipped content?",
                            "options": ["Facebook", "TikTok and Instagram", "LinkedIn", "Snapchat"],
                            "correct": "TikTok and Instagram"
                        },
                        {
                            "text": "What is a key benefit of the 'clipping' process described?",
                            "options": ["It requires no editing skills.", "It guarantees viral content.", "It creates income opportunities from long-form content.", "It replaces the need for original content."],
                            "correct": "It creates income opportunities from long-form content."
                        }
                    ]
                },
                "quizLevel2": {
                    "questions": [
                        {
                            "text": "Besides freelance work, what other type of business setup is mentioned as a possibility?",
                            "options": ["Non-profit organization", "Large agency setups", "E-commerce store", "Physical retail"],
                            "correct": "Large agency setups"
                        }
                    ]
                }
            },
            {
                "id": "WI-748-ProfitAI-Business",
                "cardName": "AI Prototype Engine",
                "title": "748-ProfitAI-Business-sudev",
                "summary": "This video showcases Riley Brown, a self-taught entrepreneur, who emphasizes the concept of \"vibe coding\"—a method of quickly creating apps using AI tools. The discussion targets aspiring creators lacking formal coding backgrounds, illustrating how they can build and launch viable tech solutions in a short time. This matters because it democratizes software development, allowing anyone with creativity and drive to innovate in the tech space.",
                "vidUrl": "https://www.youtube.com/watch?v=J_GCvfto07c",
                "docUrl": "https://docs.google.com/document/d/1W_ELeJVLKxj2Snem6wWxhVF-fCap4s0E6KkftlGXC9w/edit?tab=t.0#heading=h.n56e9sthavvn",
                "pdfUrl": "",
                "audioUrl": "https://drive.google.com/file/d/1e7L5ZClAFxXRyVIFcGZemQ6NbMaEB3Hp/view?usp=drivesdk",
                "coverArtUrl": "https://img.youtube.com/vi/J_GCvfto07c/maxresdefault.jpg",
                "rarityScore": 88,
                "status": "Not Started", // Changed to Not Started to match initial state
                "level": 1,             // Changed to Level 1
                "ownerId": "SudoDev",
                "category": "Wealth",
                "subcategory": "Income",
                "latentAbility": "Generates one new AI business idea per day.",
                "insight": 450,
                "clarity": 85,
                "rarity": 88,
                "quizLevel1": {
                    "questions": [
                        {
                            "text": "What is the core concept demonstrated by Riley Brown for building apps?",
                            "options": ["Traditional coding", "Vibe coding", "No-code platforms only", "Hiring developers"],
                            "correct": "Vibe coding"
                        },
                        {
                            "text": "Who is the primary target audience for this approach?",
                            "options": ["Experienced software engineers", "Aspiring creators without formal coding backgrounds", "Large corporations", "Graphic designers"],
                            "correct": "Aspiring creators without formal coding backgrounds"
                        }
                    ]
                },
                "quizLevel2": {
                    "questions": [
                        {
                            "text": "What is a key takeaway regarding the development process?",
                            "options": ["It guarantees immediate profit.", "It requires extensive market research upfront.", "Embrace failure and iterate quickly.", "Only use pre-built templates."],
                            "correct": "Embrace failure and iterate quickly."
                        },
                        {
                            "text": "What should you do after creating a prototype?",
                            "options": ["Sell it immediately.", "Launch it to a wide audience.", "Launch to a small group for feedback and iterate.", "Archive it and start a new project."],
                            "correct": "Launch to a small group for feedback and iterate."
                        }
                    ]
                }
            },
            {
                "id": "HM-742-Manage_Trading_Risk_Effectively",
                "cardName": "Risk Horizon Navigator",
                "title": "742-Manage Trading Risk Effectively-sudev",
                "summary": "Understanding how moving up time frames in trading increases risk and how to manage that risk effectively using trend lines and position sizing.",
                "vidUrl": "https://www.youtube.com/watch?v=E_m8LwjiL30",
                "docUrl": "https://docs.google.com/document/d/1IE50VZl9PW5IEilrPAgWh9b9hnbkpU2apXHNYCx-KEI/edit?tab=t.0#heading=h.n56e9sthavvn",
                "pdfUrl": "",
                "audioUrl": "https://drive.google.com/file/d/10KCRWxuxbNnSXvEFCpMuPdymN9E4y1kD/view?usp=drivesdk",
                "coverArtUrl": "https://img.youtube.com/vi/E_m8LwjiL30/maxresdefault.jpg",
                "rarityScore": 82,
                "status": "Not Started", // Changed to Not Started to match initial state
                "level": 1,             // Changed to Level 1
                "ownerId": "SudoDev",
                "category": "Health",
                "subcategory": "Mind",
                "latentAbility": "Provides +5%冷静 (calm) bonus during high-stress market simulations.",
                "insight": 520,
                "clarity": 75,
                "rarity": 82,
                "quizLevel1": {
                    "questions": [
                        {
                            "text": "How does moving to a higher time frame generally affect risk?",
                            "options": ["Decreases risk significantly", "Has no effect on risk", "Increases risk", "Makes risk easier to predict"],
                            "correct": "Increases risk"
                        },
                        {
                            "text": "What is one way to manage increased risk on higher time frames?",
                            "options": ["Increase position size", "Trade more frequently", "Reduce position size", "Ignore trend lines"],
                            "correct": "Reduce position size"
                        }
                    ]
                },
                "quizLevel2": {
                    "questions": [
                        {
                            "text": "What is the purpose of using 'action lines' and 'safety lines'?",
                            "options": ["To identify support and resistance levels", "To define entry points and risk levels using trend lines", "To predict future price movements", "To automate trading signals"],
                            "correct": "To define entry points and risk levels using trend lines"
                        },
                        {
                            "text": "According to the summary, what is a benefit of trading on lower time frames?",
                            "options": ["Less frequent monitoring required", "Higher potential profit per trade", "Tighter risk controls", "Longer holding periods"],
                            "correct": "Tighter risk controls"
                        }
                    ]
                }
            }
        ];
    }


    // --- EVENT LISTENERS & INITIALIZATION ---
    function init() {
        syncLibraryBtn.addEventListener('click', simulateFileSync);
        modalCloseBtn.addEventListener('click', closeModal);
        // Close modal if backdrop is clicked
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        flipCardBtn.addEventListener('click', () => modalCard.classList.toggle('is-flipped'));

        quizSubmitBtn.addEventListener('click', submitQuiz);
        // Close quiz modal if backdrop is clicked (optional)
        // quizModal.addEventListener('click', (e) => { if (e.target === quizModal) quizModal.classList.add('hidden'); });

        // Initial load - start with sample data
        simulateFileSync();
    }

    init();
});
