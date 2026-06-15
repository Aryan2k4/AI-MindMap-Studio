# AI MindMap Studio 

Working Link :- https://ai-mindmap-studio.onrender.com/

AI MindMap Studio is a web application that helps users turn ideas, topics, and questions into interactive visual mind maps.

I built this project during the Kaggle 5-Day Vibe Coding Bootcamp while experimenting with Gemini 3.5 Flash and structured AI outputs. The goal was simple: instead of reading long blocks of AI-generated text, users should be able to explore information visually and expand concepts as they learn.

The application takes a prompt from the user, generates related concepts using Gemini, and displays them as an interactive mind map. Users can then expand individual nodes to dive deeper into specific topics without losing the overall structure of the map.

---

## Why I Built This

When learning a new topic, I often found AI responses informative but difficult to organize mentally. Mind maps have always been a great way to break complex subjects into smaller ideas, so I wanted to combine that visual approach with the capabilities of modern AI.

This project was an opportunity to explore how AI can generate structured data that directly powers a user interface rather than simply generating text.

---

## Features

* Generate complete mind maps from a simple text prompt
* Expand any node to discover related subtopics
* Interactive drag-and-drop nodes
* Automatic graph layout using a custom physics system
* Multiple visual themes
* Fast AI-powered concept generation with Gemini 3.5 Flash
* Responsive and lightweight interface

---

## How It Works

1. The user enters a topic or question.
2. Gemini generates related concepts in a structured format.
3. The backend validates and sends the data to the frontend.
4. A force-directed layout engine positions the nodes automatically.
5. Users can interact with the map and expand branches whenever they want.

This creates a learning experience that feels more exploratory than reading a traditional AI response.

---

## Tech Stack

### Frontend

* HTML
* CSS
* JavaScript
* Lucide Icons

### Backend

* Node.js
* Express.js

### AI

* Google Gemini 3.5 Flash
* Google Gen AI SDK

### Deployment

* Docker
* Google Cloud Run

---

## What I Learned

Building this project helped me understand:

* Working with AI APIs in real-world applications
* Generating reliable structured outputs from language models
* Designing interactive visual interfaces
* Implementing force-directed graph layouts
* Deploying containerized applications

Most importantly, it showed me how AI can be used as a development partner while still requiring careful planning, testing, and problem-solving from the developer.

---

## Running the Project

Clone the repository:

```bash
git clone https://github.com/your-username/ai-mindmap-studio.git
cd ai-mindmap-studio
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

Start the application:

```bash
npm start
```

Open your browser and visit:

```text
http://localhost:3000
```

---

## Future Improvements

Some ideas I would like to explore in future versions:

* Export mind maps as images or PDFs
* Save and load projects
* Collaboration between multiple users
* Different visualization styles
* Learning-focused templates for students

---

## Acknowledgements

This project was created during the Kaggle 5-Day Vibe Coding Bootcamp using AntiGravity 2.0 and Gemini 3.5 Flash.

---

## License

MIT License
