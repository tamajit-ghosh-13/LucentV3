<div align="center">

```
██╗     ██╗   ██╗ ██████╗███████╗███╗   ██╗████████╗
██║     ██║   ██║██╔════╝██╔════╝████╗  ██║╚══██╔══╝
██║     ██║   ██║██║     █████╗  ██╔██╗ ██║   ██║   
██║     ██║   ██║██║     ██╔══╝  ██║╚██╗██║   ██║   
███████╗╚██████╔╝╚██████╗███████╗██║ ╚████║   ██║   
╚══════╝ ╚═════╝  ╚═════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   
```

### **The Autonomous, Client-Side Web Accessibility Engine**
#### *Adapts any website, in real-time, for any user — without touching a single line of the site's code.*

<br/>

[![Made with React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Gemini_2.0-AI_Powered-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-FBBC05?style=for-the-badge&logo=googlechrome&logoColor=black)](https://developer.chrome.com/docs/extensions/mv3/)
[![WCAG](https://img.shields.io/badge/WCAG-2.2_AAA-005A9C?style=for-the-badge&logo=w3c&logoColor=white)](https://www.w3.org/WAI/WCAG22/)

<br/>

> **🏆 Global Innovation Hackathon 2026**
>
> *Debadrita Bhattacharyya · Reetabrata Mandal · Prathama Biswas · Enaakshi Sen · Tamajit Ghosh · Shreyan Dasgupta*

<br/>

</div>

---

# 🌟 Lucent — Submission & Evaluator Guide

> **Live Deployed App**: [https://lucent-v3.vercel.app](https://lucent-v3.vercel.app)  
> **GitHub Repository**: [https://github.com/tamajit-ghosh-13/LucentV3](https://github.com/tamajit-ghosh-13/LucentV3)  
> **Video Walkthrough**: [Watch on YouTube (https://youtu.be/DA1tLGGaov0)](https://youtu.be/DA1tLGGaov0) · `Explanation.mp4`  

---

## ⚡ Quick Start for Judges (3 Ways to Experience Lucent)

### 1. 🌐 Live Production Dashboard
Visit **[https://lucent-v3.vercel.app](https://lucent-v3.vercel.app)**:
- Explore the interactive dashboard and profile configurations (**Visual & Low Vision**, **Motor & Tremor**, and **Cognitive & ADHD**).
- Test the live accessibility audit scoring, feature toggles, and real-time event telemetry.

---

### 2. 🧩 Install & Test the Chrome Extension (Live on Any Webpage)
Lucent operates directly inside the user's browser, modifying third-party websites without requiring site owners to change their code.

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension` folder included in this submission package.
5. Open any website (e.g., [Wikipedia: Green Lantern](https://en.wikipedia.org/wiki/Green_Lantern) or [BBC News](https://www.bbc.com)).
6. **Try the features live**:
   - **Cognitive / AI Simplification**: Highlight any long paragraph with your mouse, open the Lucent widget (or popup), and click **`✨ Simplify Selected Text`**. Gemini AI will instantly condense it into a clean, 1/3-length plain summary right on the page with an expandable drawer!
   - **Text-to-Speech (TTS)**: Highlight text and click **Read Aloud** to hear natural speech synthesis.
   - **Visual Aids**: Toggle High Contrast (Solar, Cyberpunk, Monochrome), Color-Blind Simulators, Font Scaling, Reading Guides, and Hover Magnifiers.
   - **Motor Aids**: Enable Click Smoothing, Target Padding, and Virtual Sticky Anchors.

*(Alternatively, the ready-to-use archive is also available at `public/Lucent-extension.zip`)*.

---

### 3. 🎥 Watch the Feature Walkthrough Video
Watch our complete feature walkthrough, live demonstrations, and architectural overview:

[![Lucent Video Walkthrough](youtube_thumbnail.jpg)](https://youtu.be/DA1tLGGaov0)

▶️ **[Click here to watch on YouTube (https://youtu.be/DA1tLGGaov0)](https://youtu.be/DA1tLGGaov0)**  
*(Also available offline as `Explanation.mp4` in the root of the project package).*

---

## 💻 Running the Dashboard Locally (Optional)

If you wish to run the full dashboard codebase locally:

```bash
# 1. Install dependencies
npm install

# 2. Run the Vite development server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

---

## 🏗️ Submission Directory Structure

```text
├── Explanation.mp4             # Video walkthrough (YouTube: https://youtu.be/DA1tLGGaov0)
├── README.md                   # Evaluator guide, architecture & submission docs
├── extension/                  # Chrome Extension source (Manifest V3)
│   ├── manifest.json
│   ├── src/
│   │   ├── background/         # Service worker (Gemini 3.5 AI & LRU cache)
│   │   ├── content/            # DOM injection, styles & assistive UI widgets
│   │   └── popup/              # Extension popup controller
│   └── icons/
├── src/                        # React 19 + TypeScript Dashboard source code
├── ml_backend/                 # Python computer vision & motor pipelines
├── supabase/                   # Database schema & user preference storage
├── public/                     # Static assets & pre-built Lucent-extension.zip
├── package.json
└── vite.config.ts
```

---
*Created for the Global Innovation Hackathon · Team Lucent*
