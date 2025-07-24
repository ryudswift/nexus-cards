# Nexus Cards - MVP v1.05 (Local Data Draft)

A gamified learning platform that turns knowledge into collectible Nexus Cards. This version uses a local file structure for card data instead of the Notion API.

## Features (v1.05)

- View a library of Nexus Cards organized by Category and Subcategory.
- Cards are loaded from local Markdown files.
- 3D tilt hover effect on cards.
- Detailed modal view for each card.
- Track Player Level (Dual-Level Display) and Completion Rate.
- Deep space nebula themed UI.
- **No external API dependencies for card data.**

## Tech Stack

- HTML5
- CSS (Tailwind via CDN)
- Vanilla JavaScript (ES6+)
- Markdown for local data storage

## Project Structure

See `cards/README-cards.md` for details on how card data is organized.

- `index.html`: Main application page.
- `style.css`: Custom styles.
- `script.js`: Application logic.
- `cards/`: Directory containing all card data as Markdown files.
  - `README-cards.md`: Explains the data structure.
  - `card-template.md`: Template for creating new cards.
  - `Health/`, `Wealth/`, `Relationships/`: Category folders.

## Setup Instructions

1.  Clone or download this repository.
2.  Open `index.html` in a modern web browser.
3.  The application will automatically scan the `cards/` directory and load any `.md` files it finds, using the metadata in their frontmatter.

## Changelog (v1.05)

- **Shifted Data Source:** Removed dependency on Notion API. Card data is now loaded from local Markdown files within the `cards/` directory.
- **New File Structure:** Defined a clear folder hierarchy (`cards/Category/Subcategory/`) for organizing knowledge.
- **Markdown Template:** Introduced `cards/card-template.md` to standardize the format for card data.
- **Local Data Loading:** Modified `script.js` logic to parse local Markdown files instead of fetching from Notion.
- **Documentation:** Added `cards/README-cards.md` to explain the new local data structure.
