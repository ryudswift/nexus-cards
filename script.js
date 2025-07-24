// ... (previous code remains the same until openModal function) ...

/**
 * Opens the detailed modal for a specific card.
 * @param {string} cardId - The ID of the card to display.
 */
function openModal(cardId) {
    state.currentCardId = cardId;
    // Find card data in our "database"
    const card = state.db.find(c => c.id === cardId);
    if (!card) {
        console.error("Card not found in DB:", cardId);
        return;
    }

    // Populate Front of Card
    modalTitle.textContent = card.cardName;
    modalSummary.textContent = card.summary;
    modalImg.src = card.coverArtUrl;

    // Populate Back of Card
    modalBackTitle.textContent = `${card.cardName} - Intel`;

    // Determine Latent Ability display
    let latentAbilityHTML = card.level === 3 ?
        `<p class="text-sm text-yellow-300"><span class="font-bold">Latent Ability:</span> ${card.latentAbility}</p>` :
        `<p class="text-sm text-gray-500"><span class="font-bold">Latent Ability:</span> [Locked - Reach Level 3]</p>`;

    modalBackContent.innerHTML = `
        <p class="text-sm"><span class="font-bold">Level:</span> ${card.level} (${card.status})</p>
        <p class="text-sm"><span class="font-bold">Rarity:</span> ${card.rarityScore}</p>
        <p class="text-sm"><span class="font-bold">Category:</span> ${card.category} / ${card.subcategory}</p>
        ${latentAbilityHTML}
    `;

    // --- Audio Player Logic ---
    const audioPlayerSection = document.getElementById('audio-player-section');
    const audioPlayer = document.getElementById('audio-player');
    if (card.audioUrl && card.audioUrl.trim() !== '') {
        // Make the audio source playable by Google Drive by modifying the URL format
        // This is a common workaround for direct audio playback from Google Drive links
        let playableAudioUrl = card.audioUrl;
        if (card.audioUrl.includes('drive.google.com/file/d/')) {
             // Convert 'https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk'
             // to 'https://drive.google.com/uc?export=download&id=FILE_ID'
             const fileIdMatch = card.audioUrl.match(/\/file\/d\/([^\/]+)/);
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
    modalActionButtons.innerHTML = ''; // Clear previous buttons
    if (card.level === 1) {
        const quizBtn = createModalButton('Take Quiz: Level 1', 'bg-green-600', () => startQuiz(card.id, 1));
        modalActionButtons.appendChild(quizBtn);
    } else if (card.level === 2) {
        // Order: Guide first (or Audio if preferred), then Quiz
        const guideBtn = createModalButton('View Full Guide', 'bg-blue-600', () => window.open(card.docUrl, '_blank'));
        const quizBtn = createModalButton('Take Quiz: Level 2', 'bg-green-600', () => startQuiz(card.id, 2));
        modalActionButtons.appendChild(guideBtn);
        // You could add an "Audio" button here if you want it separate from the guide
        // const audioBtn = createModalButton('Listen (Audio)', 'bg-indigo-600', () => { /* Logic to play audio or show player */ });
        modalActionButtons.appendChild(quizBtn);
    } else if (card.level === 3) {
        const guideBtn = createModalButton('View Full Guide', 'bg-blue-600', () => window.open(card.docUrl, '_blank'));
        // Audio button could also be here if desired
        modalActionButtons.appendChild(guideBtn);
    }

    // Reset card flip state and show modal
    modalCard.classList.remove('is-flipped');
    modal.classList.remove('hidden');
}

// ... (rest of the script.js code remains the same) ...
