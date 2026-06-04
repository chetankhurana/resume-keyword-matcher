# Resume Keyword Matcher Chrome Extension

A privacy-focused Chrome extension analyzing job postings and your resume for keyword and skill match, offering actionable Gemini AI-powered optimization tips for Applicant Tracking Systems (ATS).

---

## Features
- **Automatic job description detection** — Supports LinkedIn, Naukri.com, Indeed, Internshala, Greenhouse, Lever, and more.
- **ATS keyword/skill matching** — Instantly see skill/job requirement matches.
- **Gemini AI integration** — Get tailored AI suggestions and project ideas to boost your resume.
- **Side Panel UI** — Use the Chrome side panel for resume/job comparison.
- **Manual mode** — Paste any job description if a site isn’t supported.
- **Context menu support** — Right-click-to-analyze selected job text.
- **All processing is local** — Data stays on your device; Gemini calls only happen if you opt in with an API key.

---

## Getting Started (Developers)
1. **Clone and Install**
   ```sh
   git clone [YOUR REPO URL]
   cd chrome-extension
   npm install
   ```
2. **Build the extension**
   ```sh
   npm run build
   ```
3. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable “Developer mode”
   - Click “Load unpacked” and select the `dist` folder

---

## Usage
- Go to a job posting on a supported site.
- Open the extension popup or side panel.
- The extension scrapes the job details and scores your resume automatically.
- Paste your own job description if needed.
- See missing skills and tips, plus optional AI-generated project ideas.
- **(Optional) Add a Gemini API key via Settings for best AI results.**

---

## Gemini API Key Setup
- In the side panel, open **Settings** (gear icon).
- Paste your Google Gemini API Key.
    - [How to create a Gemini API key](https://aistudio.google.com/app/apikey)
- Your key is stored securely—never uploaded or shared with anyone except Google’s API endpoint.
- If no key, a built-in key is used (may be subject to usage limits).

---

## Tech Stack
- **Vite** — Modern build tooling
- **React + TypeScript** — UI and logic
- **Chrome Extension v3 APIs** — Service worker, manifest, side panel
- **Google Gemini API** — AI resume improvement suggestions

---

## Security & Privacy
- Resume and job details are processed and stored locally in your browser only.
- Any Gemini API key is kept in chrome storage and is never shared or exposed.
