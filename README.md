# AI MindMap Studio 🧠✨

An interactive, premium web application that translates your prompts into beautiful, dynamic mindmaps and concept structures. Built with **Node.js, Express, and vanilla HTML5/CSS3/JavaScript**, powered by the **Google AI Studio (Gemini) Free Tier API**, and designed for deployment to **Google Cloud Run**.

![AI MindMap Studio View](https://img.shields.io/badge/Gemini-2.0--flash-blueviolet?style=for-the-badge&logo=google-gemini)
![Cloud Run Deploy](https://img.shields.io/badge/Deploy-Cloud%20Run-blue?style=for-the-badge&logo=google-cloud)

---

## Key Features
- 🚀 **AI-Driven Map Generation**: Describe any topic (e.g., "Photosynthesis", "Kubernetes Architecture") to create a structured node diagram.
- 🔗 **Interactive Force Physics**: Nodes float organically, repel each other to avoid overlap, and pull together along connection links. Drag nodes freely or zoom/pan the canvas.
- 🧬 **Dynamic Node Branching**: Double-click or click **"Expand AI Nodes"** on any node to dynamically generate 3-4 sub-nodes, growing your mindmap recursively.
- 🎨 **Visual Themes**: Switch between premium design systems: **Aura Dark (Vibrant Violet)**, **Cyberpunk (Neon Pink & Cyan)**, **Forest Emerald**, and **Minimalist Light**.
- ☁️ **Cloud Run Ready**: Completely containerized with a Dockerfile and deployable to Google Cloud Run in minutes.

---

## Repository Structure
```text
ai-mindmap-studio/
├── package.json          # Node dependencies & start scripts
├── server.js             # Express API server (Gemini SDK client)
├── Dockerfile            # Container definition
├── .dockerignore         # Docker build exclusion list
├── deploy.ps1            # Windows PowerShell deployment script
├── README.md             # Project documentation
└── public/               # Frontend Client Assets
    ├── index.html        # App structure, presets, sidebar
    ├── style.css         # Visual themes, glassmorphism, node animations
    └── app.js            # Custom physics-engine, pan/zoom canvas, API hooks
```

---

## Local Setup & Development

### Prerequisites
1. **Node.js**: Install Node.js (v18 or higher).
2. **Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-2.0-flash
   PORT=8080
   ```

3. Run the application:
   ```bash
   # Production mode
   npm start
   
   # Development mode (with server auto-restart)
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:8080`.

---

## Deploying to Google Cloud Run

To host your web app on Google Cloud Run, follow these steps:

### Prerequisites
1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) on your system.
2. Ensure billing is enabled for your Google Cloud Project.

### Automated Deployment (PowerShell)
On Windows, run the interactive deployment script in PowerShell:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy.ps1
```
The script will walk you through:
1. Google Cloud Authentication (`gcloud auth login`).
2. Setting your active Google Cloud Project ID.
3. Enabling necessary services (`artifactregistry`, `cloudbuild`, `run`).
4. Creating a Docker repository in Artifact Registry (`us-central1`).
5. Uploading code to Google Cloud Build to build and push the container.
6. Deploying the service to Cloud Run with your `GEMINI_API_KEY` injected securely as an environment variable.

---

## Customizing the AI Model
By default, the application uses **`gemini-2.0-flash`**, which is optimized for sub-second speeds and JSON generation. 

If you wish to explore complex research queries and benefit from the **2,000,000 token context window**, you can configure the model name to **`gemini-1.5-pro`** in your `.env` file (local development) or set the `GEMINI_MODEL` environment variable in your Cloud Run revision settings.
