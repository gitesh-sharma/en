<div align="center">

# 🌐 Gitesh Sharma: Official Website

**A personal website hosting free online tools and a music platform, deployed with GitHub Pages.**

[![Deploy to GitHub Pages](https://github.com/gitesh-sharma/en/actions/workflows/static.yml/badge.svg)](https://github.com/gitesh-sharma/en/actions/workflows/static.yml)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![GitHub last commit](https://img.shields.io/github/last-commit/gitesh-sharma/en)
![GitHub repo size](https://img.shields.io/github/repo-size/gitesh-sharma/en)

[🔗 Live Website](https://gitesh-sharma.github.io/en/) •
[🛠️ Tools](https://gitesh-sharma.github.io/en/org/tools/) •
[🎵 Music](https://gitesh-sharma.github.io/en/org/musics/) •
[🐛 Report Bug](https://github.com/gitesh-sharma/en/issues)

</div>

---

## 📖 About

This repository contains the source code of my personal website. It is built as a **pure static site** with HTML, CSS and vanilla JavaScript. It needs no backend and no build step.

The website has three main sections:

| Section | Description | Link |
|---|---|---|
| 🏠 **Home** | Personal introduction and portfolio | [Visit](https://gitesh-sharma.github.io/en/) |
| 🛠️ **Tools** | Free online PDF, image, text and utility tools | [Visit](https://gitesh-sharma.github.io/en/org/tools/) |
| 🎵 **Musics** | Music platform with songs and artist profiles | [Visit](https://gitesh-sharma.github.io/en/org/musics/) |

---

## ✨ Features

### 🛠️ Online Tools

#### 📄 PDF Tools
| Tool | Description |
|---|---|
| 🗜️ [Compress](https://gitesh-sharma.github.io/en/org/tools/compress.html) | Reduce PDF file size |
| 🔄 [Convert](https://gitesh-sharma.github.io/en/org/tools/convert.html) | Convert files to and from PDF (incl. Word → PDF) |
| ✂️ [Merge & Split](https://gitesh-sharma.github.io/en/org/tools/merge-split.html) | Combine multiple PDFs or split one into parts |
| 📑 [Organize](https://gitesh-sharma.github.io/en/org/tools/organize.html) | Reorder, rotate and delete pages |
| ✍️ [eSign](https://gitesh-sharma.github.io/en/org/tools/esign.html) | Add your signature to documents |
| 🖊️ [Annotate](https://gitesh-sharma.github.io/en/org/tools/annotate.html) | Highlight, draw and comment on PDFs |
| 📝 [Forms](https://gitesh-sharma.github.io/en/org/tools/forms.html) | Fill PDF forms |
| 💧 [Watermark](https://gitesh-sharma.github.io/en/org/tools/watermark.html) | Add text or image watermarks |
| 🔒 [Protect](https://gitesh-sharma.github.io/en/org/tools/protect.html) | Password-protect PDFs |
| 🔓 [Unlock](https://gitesh-sharma.github.io/en/org/tools/unlock.html) | Remove the password from your PDFs |
| 🔍 [OCR](https://gitesh-sharma.github.io/en/org/tools/ocr.html) | Extract text from scanned documents and images |

#### 🖼️ Image Tools
| Tool | Description |
|---|---|
| 🌄 [Image to WebP](https://gitesh-sharma.github.io/en/org/tools/image-to-webp.html) | Convert images to the lightweight WebP format |
| ✨ [Remove Background](https://gitesh-sharma.github.io/en/org/tools/remove-bg.html) | Remove image backgrounds |
| 📱 [QR Code Generator](https://gitesh-sharma.github.io/en/org/tools/qr-code-generator.html) | Generate custom QR codes |

#### 🧰 Text & Utility Tools
| Tool | Description |
|---|---|
| ✅ [Grammar Checker](https://gitesh-sharma.github.io/en/org/tools/grammar-checker.html) | Check grammar and spelling |
| 🌍 [Translator](https://gitesh-sharma.github.io/en/org/tools/translator.html) | Translate text between languages |
| 💻 [HTML Editor](https://gitesh-sharma.github.io/en/org/tools/html-editor.html) | Write HTML and preview it live |
| 🧮 [Calculator](https://gitesh-sharma.github.io/en/org/tools/calculator.html) | Online calculator |
| 🎂 [Age Calculator](https://gitesh-sharma.github.io/en/org/tools/age-calculator.html) | Calculate exact age in years, months and days |
| 📊 [Dashboard](https://gitesh-sharma.github.io/en/org/tools/dashboard.html) | All tools in one place |

### 🎵 Music Platform
- 🎧 **Songs:** a song library with a dedicated page for each song
- 🎤 **Artists:** artist profile pages
- ⬆️ **Upload:** a page for artists to submit their music
- 🤝 **Partners and Support:** collaboration and help pages

**Featured artists:** Hazel Pandey, Mittu Yadav

**Featured songs:** *Ankhiya Me Basal Baada*, *Pardesiya Ke Patiya*

### 🔎 SEO Ready
- `sitemap.xml` and an HTML sitemap
- `robots.txt` for search engine crawlers
- Bing Webmaster verification (`BingSiteAuth.xml`)
- A custom `404.html` error page

---

## 📂 Project Structure

```
en/
├── index.html              # Homepage
├── about.html              # About me
├── 404.html                # Custom error page
├── sitemap.html / .xml     # Sitemaps (HTML + XML)
├── robots.txt              # Crawler rules
├── BingSiteAuth.xml        # Bing verification
│
├── org/                    # Organization section
│   ├── index.html
│   ├── about-us.html, contact.html, legal.html
│   ├── assets/             # Shared CSS & JS
│   │
│   ├── musics/             # 🎵 Music platform
│   │   ├── artists/        # Artist profile pages
│   │   ├── songs/          # Individual song pages
│   │   ├── css/  js/       # Styles, config & scripts
│   │   └── upload.html, partners.html, support.html
│   │
│   └── tools/              # 🛠️ Online tools
│       ├── *.html          # One page per tool
│       ├── css/style.css   # Shared tool styles
│       └── js/             # One script per tool + app.js
│
└── .github/workflows/
    └── static.yml          # GitHub Pages deployment
```

---

## 🧑‍💻 Tech Stack

- **HTML5:** page structure
- **CSS3:** responsive styling
- **Vanilla JavaScript:** tool logic and interactivity
- **GitHub Pages + GitHub Actions:** hosting and CI/CD

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser
- (Optional) Python, Node.js or the VS Code **Live Server** extension for a local server

### Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/gitesh-sharma/en.git

# 2. Go to the project folder
cd en

# 3. Start a local server (choose one)
python -m http.server 8000
# or
npx serve .
```

Then open **http://localhost:8000** in your browser.

> ⚠️ Use a local server instead of opening the HTML files directly with `file://`. Some features, such as JS modules and fetch requests, may not work without one.

---

## 🌍 Deployment

The site deploys to **GitHub Pages** automatically through GitHub Actions (`.github/workflows/static.yml`).

1. Push your changes to the `main` branch.
2. The workflow builds and deploys the site.
3. Your changes go live within a few minutes.

To set it up in a fork, go to **Settings → Pages → Source → GitHub Actions**.

---

## ➕ Adding New Content

<details>
<summary><b>🛠️ Add a new tool</b></summary>

1. Create `org/tools/your-tool.html`.
2. Create `org/tools/js/your-tool.js`.
3. Use the shared `org/tools/css/style.css` for styling.
4. Add a link to the tool on `org/tools/index.html` and `dashboard.html`.
5. Add the new URL to `sitemap.xml`.

</details>

<details>
<summary><b>🎵 Add a new song or artist</b></summary>

1. Create `org/musics/songs/song-name.html` or `org/musics/artists/artist-name.html`.
2. Link it from `songs/index.html` or `artists/index.html`.
3. Update `org/musics/js/config.js` if needed.
4. Add the new URL to `sitemap.xml`.

</details>

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome.

1. Fork the repository
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📜 License

© Gitesh Sharma. All rights reserved.
See the [Legal page](https://gitesh-sharma.github.io/en/org/legal.html) for terms of use.

---

## 📬 Contact

**Gitesh Sharma**

- 🐙 GitHub: [@gitesh-sharma](https://github.com/gitesh-sharma)
- 🌐 Website: [gitesh-sharma.github.io/en](https://gitesh-sharma.github.io/en/)
- 📧 Contact: [Contact Page](https://gitesh-sharma.github.io/en/org/contact.html)

---

<div align="center">

⭐ **If you find this project useful, please give it a star!** ⭐

Made with ❤️ by **Gitesh Sharma**

</div>
