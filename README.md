# BigQuery Release Hub

A premium, interactive web application built with **Python Flask** and **plain vanilla HTML, CSS, and JS** to fetch, parse, and view the Google Cloud BigQuery Release Notes. The application features micro-update selection and a built-in interactive Twitter/X composer.

## 🚀 Features

*   **Real-time XML Parsing**: Automatically fetches and parses Google's BigQuery release notes XML feed dynamically.
*   **Granular Selection**: Separates compound date postings into individual update cards (e.g. Features, Issues, Deprecations) to let you interact with or tweet specific updates.
*   **Interactive Tweet Composer**: Click any card to draft a formatted tweet instantly. Includes custom character counting (limit 280), quick-insert hashtags, and a direct Twitter Web Intent button.
*   **Search & Filter**: Real-time keyword filtering and tabbed categorization (All, Features, Issues, Deprecations, Changes).
*   **Modern Glassmorphic UI**: Beautiful dark theme using modern CSS gradients, glassmorphism, shimmer loader skeletons, and micro-interactions.

---

## 📁 Directory Structure

```text
├── app.py                  # Python Flask server (feed fetching & parsing)
├── templates/
│   └── index.html          # HTML5 layout shell
├── static/
│   ├── css/
│   │   └── style.css       # Custom glassmorphic styling, animations, responsive design
│   └── js/
│       └── app.js          # State management, rendering logic, search & selection behavior
├── news.txt                # Cached raw headlines
├── summary.txt             # Cached plain text summary of news.txt
├── .gitignore              # Git ignore configuration
└── README.md               # Project documentation
```

---

## 🛠️ Tech Stack

*   **Backend**: Python 3, Flask
*   **Frontend**: Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (Custom Grid/Flexbox)
*   **APIs**: Google Cloud Release Feed (Atom XML), Twitter Intent API

---

## ⚙️ Installation & Setup

Follow these steps to run the application locally:

### 1. Prerequisite
Ensure you have Python 3 and virtualenv package installed.

### 2. Set Up Virtual Environment
Create and activate a virtual environment to manage dependencies:
```bash
# Create the virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate
```

### 3. Install Dependencies
Install Flask in your virtual environment:
```bash
pip install Flask
```

### 4. Run the Application
Start the Flask development server:
```bash
python app.py
```
The server will start running on **[http://localhost:5000](http://localhost:5000)**. Open this address in your web browser to access the app.

---

## 🔒 License

This project is open-source and free to modify or distribute.
