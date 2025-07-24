const NOTION_API_URL = "https://api.notion.com/v1/databases/YOUR_DATABASE_ID/query";
const NOTION_TOKEN = "secret_YOUR_NOTION_TOKEN";

let cards = [];
let playerXP = 0;
let playerLevel = 0;
let trueLevel = 0;

document.addEventListener("DOMContentLoaded", async () => {
  await fetchCards();
  renderCards();
  updateKPIs();
});

async function fetchCards() {
  const response = await fetch(NOTION_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  cards = data.results.map(page => {
    const props = page.properties;
    const status = props.Status.select?.name || "Not started";
    const rarity = props["Rarity Score"]?.number || 0;
    const isEpic = status === "Complete";

    if (isEpic) playerXP += rarity;

    return {
      id: page.id,
      title: props.Title.title[0]?.plain_text || "Untitled",
      summary: props.Summary.rich_text[0]?.plain_text || "No summary",
      url: props["vid Link"].url,
      docUrl: props["Doc URL"].url,
      status,
      coverArt: props["Cover Art URL"].url || "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg".replace("VIDEO_ID", getYoutubeID(props["vid Link"].url)),
      cardName: props["Card Name"].rich_text[0]?.plain_text || "Unknown",
      rarity,
      isEpic
    };
  });

  calculateLevels();
}

function getYoutubeID(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function renderCards() {
  const grid = document.getElementById("cardGrid");
  grid.innerHTML = "";

  cards.forEach(card => {
    const el = document.createElement("div");
    el.className = `card bg-gray-800 rounded-lg p-4 cursor-pointer ${card.isEpic ? "epic" : ""}`;
    el.innerHTML = `
      <img src="${card.coverArt}" alt="${card.title}" class="rounded mb-2 w-full h-32 object-cover">
      <h3 class="font-bold truncate">${card.cardName}</h3>
      <p class="text-xs text-gray-400">${card.title}</p>
    `;
    el.onclick = () => openCardModal(card);
    grid.appendChild(el);
  });
}

function openCardModal(card) {
  document.getElementById("modalTitle").textContent = card.cardName;
  document.getElementById("modalSummary").textContent = card.summary;
  document.getElementById("modalRarity").textContent = card.rarity;
  document.getElementById("modalStatus").textContent = card.status;
  document.getElementById("modalLink").href = card.url;
  document.getElementById("cardModal").classList.remove("hidden");
}

document.getElementById("closeModal").onclick = () => {
  document.getElementById("cardModal").classList.add("hidden");
};

function calculateLevels() {
  trueLevel = Math.floor(playerXP / 100);
  playerLevel = Math.min(trueLevel, 42); // Display capped at 42
}

function updateKPIs() {
  document.getElementById("totalCards").textContent = cards.length;
  const completed = cards.filter(c => c.status === "Complete").length;
  document.getElementById("completedCards").textContent = completed;
  document.getElementById("completionRate").textContent = cards.length ? Math.round((completed / cards.length) * 100) + "%" : "0%";
  document.getElementById("displayLevel").textContent = playerLevel;
  document.getElementById("trueLevel").textContent = trueLevel;
}