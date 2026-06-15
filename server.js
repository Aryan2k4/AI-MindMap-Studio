import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 8080;

// Initialize Google Gen AI client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not set in environment variables. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey });
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Schema for generating the initial mindmap
const mindmapSchema = {
  type: 'OBJECT',
  properties: {
    nodes: {
      type: 'ARRAY',
      description: 'The list of concepts/nodes representing different points on the mindmap',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING', description: 'A unique short identifier for the node (e.g. "1", "2")' },
          label: { type: 'STRING', description: 'A short name/title for the node (1-4 words)' },
          description: { type: 'STRING', description: 'A brief description of this specific concept (1 sentence)' },
          group: { type: 'STRING', description: 'Category group to color-code the node (e.g., "Core", "Concept", "Application", "Future")' }
        },
        required: ['id', 'label', 'description', 'group']
      }
    },
    edges: {
      type: 'ARRAY',
      description: 'The directed connections between nodes',
      items: {
        type: 'OBJECT',
        properties: {
          from: { type: 'STRING', description: 'The source node ID' },
          to: { type: 'STRING', description: 'The destination node ID' }
        },
        required: ['from', 'to']
      }
    }
  },
  required: ['nodes', 'edges']
};

// Schema for expanding a specific node
const expansionSchema = {
  type: 'OBJECT',
  properties: {
    nodes: {
      type: 'ARRAY',
      description: 'The new sub-nodes being added to the mindmap',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING', description: 'A unique ID for the new node. Ensure it does not overlap with existing IDs.' },
          label: { type: 'STRING', description: 'A short name/title for the node (1-4 words)' },
          description: { type: 'STRING', description: 'A brief description of this specific concept (1 sentence)' },
          group: { type: 'STRING', description: 'Category group to color-code the node' }
        },
        required: ['id', 'label', 'description', 'group']
      }
    },
    edges: {
      type: 'ARRAY',
      description: 'The connections between the parent node and the new sub-nodes',
      items: {
        type: 'OBJECT',
        properties: {
          from: { type: 'STRING', description: 'The source node ID (should match parentNodeId)' },
          to: { type: 'STRING', description: 'The new child node ID' }
        },
        required: ['from', 'to']
      }
    }
  },
  required: ['nodes', 'edges']
};

app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log(`Generating mindmap for topic: "${prompt}" using ${MODEL_NAME}...`);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a detailed conceptual mindmap for the topic: "${prompt}".
      Break the topic down into 6-10 logical nodes (concepts or sub-topics) with connecting edges.
      Provide a clean hierarchy. The root node should represent the main topic.
      For each node, assign a group name (e.g., 'Core', 'Application', 'Foundation', 'Theory') to categorize it.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: mindmapSchema
      }
    });

    const text = response.text;
    const data = JSON.parse(text);
    res.json(data);
  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({ error: 'Failed to generate mindmap. Please try again.', details: error.message });
  }
});

app.post('/api/expand', async (req, res) => {
  const { parentNodeId, nodeLabel, nodeDescription, contextPrompt, existingNodeIds } = req.body;
  
  if (!parentNodeId || !nodeLabel) {
    return res.status(400).json({ error: 'parentNodeId and nodeLabel are required' });
  }

  try {
    console.log(`Expanding node: "${nodeLabel}" (ID: ${parentNodeId}) in the context of "${contextPrompt}"...`);
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `We have a mindmap about "${contextPrompt || 'a general topic'}".
      We are expanding the specific node: "${nodeLabel}" (Description: "${nodeDescription || ''}", ID: "${parentNodeId}").
      Generate exactly 3 new sub-nodes (child concepts) that directly branch out from "${nodeLabel}".
      Make sure the sub-nodes represent deeper levels of detail, specific examples, or related sub-problems.
      Ensure the new node IDs are unique and do NOT overlap with existing node IDs: ${JSON.stringify(existingNodeIds || [])}.
      Create directed edges pointing from the parent node "${parentNodeId}" to the new child node IDs.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: expansionSchema
      }
    });

    const text = response.text;
    const data = JSON.parse(text);
    res.json(data);
  } catch (error) {
    console.error('Error in /api/expand:', error);
    res.status(500).json({ error: 'Failed to expand node. Please try again.', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Verify health at http://localhost:${PORT}/health`);
});
