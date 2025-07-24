# Nexus Cards - MVP v1.01

A gamified learning platform that turns YouTube videos into collectible knowledge cards, now with an enhanced UI and local Markdown simulation.

## Features

- Submit YouTube videos via webhook to trigger card creation.
- View your collection of Nexus Cards with a 3D tilt hover effect.
- Detailed modal view with tabs for Summary, Card Details, and Markdown.
- Simulated local storage of card data as Markdown.
- Download individual card data as a Markdown file.
- Track XP, level (Dual-Level Display), and Completion Rate.
- Deep space nebula themed UI with futuristic styling.

## Tech Stack

- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript (ES6+)
- Notion API (via CORS proxy)
- n8n Webhook

## Setup Instructions

1.  **Obtain Notion Credentials:**
    *   Create a Notion integration (bot) and obtain its Internal Integration Token.
    *   Share your Notion database with this integration. Ensure the database has properties matching the PRD (Title, Summary, vid Link, Doc URL, Status, Cover Art URL, Card Name, Rarity Score).
2.  **Configure the Application:**
    *   Open `script.js` in a text editor.
    *   Find the `config` object at the top.
    *   Replace `'secret_YOUR_NOTION_TOKEN'` with your actual Notion Integration Token.
    *   Replace `'YOUR_DATABASE_ID'` with the ID of your Notion database. You can find this in the database's URL: `https://www.notion.so/{workspace_name}/{database_id}?v=...`
3.  **(Temporary) Enable CORS Proxy:**
    *   This demo uses `cors-anywhere.herokuapp.com` to bypass CORS restrictions for Notion API calls from the browser.
    *   **Before loading the app in your browser**, you must temporarily enable access to the proxy:
        *   Visit [https://cors-anywhere.herokuapp.com/](https://cors-anywhere.herokuapp.com/)
        *   Click the "Request temporary access to the demo server" button.
4.  **Deploy or Run Locally:**
    *   **Option 1 (Local):** Save `index.html` and `script.js` in the same folder on your computer. Open `index.html` in a modern web browser.
    *   **Option 2 (Static Hosting):** Upload `index.html`, `script.js`, and any other files to a static web hosting service (e.g., GitHub Pages, Netlify, Vercel). **Note:** The CORS proxy method might not work reliably on all hosting platforms due to security policies. For production, a backend proxy or direct Notion API access with proper authentication is recommended.

## How It Works

1.  **Generate a Card:** Paste a YouTube URL into the input field and click "Generate". This sends the URL to the configured n8n webhook.
2.  **View Your Library:** The app fetches card data from your Notion database and displays it in a grid.
3.  **Inspect a Card:** Click on any card to open the detailed modal.
4.  **Explore Tabs:**
    *   **Summary:** See the card's name, image, and summary.
    *   **Details:** View all card stats (Insight, Clarity, Rarity), links, and owner information. Includes a placeholder for the "Learn & Unlock" feature.
    *   **Markdown:** See the raw data for the card formatted as Markdown. You can download this file.
5.  **Simulated Learning (Future Phase Placeholder):** The "Learn & Unlock Abilities" button starts a 10-second countdown timer. Upon completion, it simulates marking the card as "Complete" and refreshing the view. In a future phase, this would unlock embedded PDF/Audio content.

## Future Enhancements (Planned for Next Phase)

- Implement full 3D card flip animation within the modal.
- Integrate an embedded viewer (`<iframe>`, `<audio>`, PDF.js) for Doc, PDF, and Audio files within the modal.
- Develop the full "Learn & Unlock" timer feature, connecting it to actual file unlocking and status updates in Notion.
- Add routing for dedicated card detail pages.
- Implement a more robust backend for API calls and file handling, removing the need for the CORS proxy.
