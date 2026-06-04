# Resume Keyword Matcher Chrome Extension

A powerful, privacy-focused Chrome extension that analyzes job postings and your resume for keyword and skill match, offering actionable Gemini AI-powered optimization tips for Applicant Tracking Systems (ATS).

---

## 🚀 Features
- **Automatic job description detection**: Supports LinkedIn, Naukri.com, Indeed, Internshala, Greenhouse, Lever, and more job boards.
- **ATS keyword/skill matching**: Instantly see which skills the job requires versus your resume.
- **Gemini AI integration**: Tailored AI suggestions and project ideas to help your resume stand out. Supports your own Google Gemini API Key for maximum security.
- **Side Panel UI**: Analyze jobs and compare resumes in an always-available Chrome side panel.
- **Manual mode**: Paste any job description if a site isn't supported.
- **Context menu support**: Right-click-to-analyze on supported job text anywhere.
- **All processing is local**: Your resume and job data stay on your device.

---
## 🖼️ Screenshots
<!-- TODO: Insert extension and side panel screenshots here after first load/build -->

---

## ⚡ Getting Started (For Developers)

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
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

---

## 🧑‍💻 Usage (For End Users)
- Browse to a job posting on a supported site.
- Open the extension popup or click the side panel icon.
- The extension auto-fetches the job details and scores your resume.
- Paste your own job description if needed.
- See tips, missing skills, and even AI-generated project ideas!
- **Add your Gemini key for best AI results**: See below.

---

## 🔑 Gemini API Key Setup
- In the side panel, go to **Settings** (gear icon)
- Paste your Google Gemini API Key
    - [How to create a Gemini API key](https://aistudio.google.com/app/apikey)
- Your key is securely stored locally (never uploaded)
- If no key, a built-in key is used (subject to Google's quotas/limits)

---

## ⚙️ Tech Stack
- **Vite** – Fast, modern build tooling
- **React + TypeScript** – UI, logic, type-safe codebase
- **Chrome Extension v3 APIs** – Service worker, side panel
- **Google Gemini API** – AI content (resume/ATS/project tips)

---

## 🏗️ Build & Develop
- Develop locally with Vite HMR (`npm run dev`), then `npm run build` outputs to `/dist/`
- Content scripts auto-injected on supported job boards, including after SPA/dynamic navigation

---

## 🔒 Security & Privacy Notice
- All resume/job data is stored and processed locally on your machine
- Gemini API key is only stored in browser storage and never shared externally except directly with Google APIs you invoke
- You can use your own Gemini key for total control and privacy

---

## 📄 License & Contributing
Feel free to fork this project or submit pull requests for new board support or features!

---

## 📫 Contact
[Your Name/LinkedIn/GitHub/email here]

---

> Impress recruiters by linking this project in your portfolio or resume—showing modern Chrome extension skills, React/TypeScript competence, and real-world AI integration!
