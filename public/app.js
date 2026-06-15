// State variables
let nodes = [];
let edges = [];
let selectedNode = null;
let currentPrompt = "";

// Viewport pan & zoom state
let pan = { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 }; // start centered
let zoom = 1.0;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3.0;

// Mouse tracking
let isDraggingCanvas = false;
let draggedNode = null;
let dragStart = { x: 0, y: 0 };
let panStart = { x: 0, y: 0 };

// DOM Elements
const canvasContainer = document.getElementById('canvasContainer');
const canvasViewport = document.getElementById('canvasViewport');
const connectionsLayer = document.getElementById('connectionsLayer');
const nodesLayer = document.getElementById('nodesLayer');
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingTitle = document.getElementById('loadingTitle');
const canvasInstruction = document.getElementById('canvasInstruction');
const inspector = document.getElementById('inspector');
const inspectorNodeGroup = document.getElementById('inspectorNodeGroup');
const inspectorNodeLabel = document.getElementById('inspectorNodeLabel');
const inspectorNodeDesc = document.getElementById('inspectorNodeDesc');
const expandNodeBtn = document.getElementById('expandNodeBtn');
const resetGraphBtn = document.getElementById('resetGraphBtn');
const exportImageBtn = document.getElementById('exportImageBtn');

// Initialize Lucide Icons
lucide.createIcons();

// Setup UI Theme toggling
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Remove all theme classes
    document.body.className = '';
    
    // Add selected theme class
    const theme = btn.getAttribute('data-theme');
    document.body.classList.add(`theme-${theme}`);
  });
});

// Setup Presets
document.querySelectorAll('.preset-badge').forEach(badge => {
  badge.addEventListener('click', () => {
    const prompt = badge.getAttribute('data-prompt');
    promptInput.value = prompt;
    generateMindMap(prompt);
  });
});

// Setup Zoom Controls
document.getElementById('zoomInBtn').addEventListener('click', () => adjustZoom(0.1));
document.getElementById('zoomOutBtn').addEventListener('click', () => adjustZoom(-0.1));
document.getElementById('zoomResetBtn').addEventListener('click', resetView);
resetGraphBtn.addEventListener('click', resetView);

// Submit handler
generateBtn.addEventListener('click', () => {
  const prompt = promptInput.value.trim();
  if (prompt) {
    generateMindMap(prompt);
  }
});

promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    generateBtn.click();
  }
});

// Expand Node handler
expandNodeBtn.addEventListener('click', () => {
  if (selectedNode) {
    expandNode(selectedNode);
  }
});

// Canvas Pan & Zoom Mouse Event Listeners
canvasContainer.addEventListener('mousedown', (e) => {
  // Check if we clicked on a node card or buttons
  if (e.target.closest('.mindmap-node') || e.target.closest('button') || e.target.closest('.sidebar')) {
    return;
  }
  
  isDraggingCanvas = true;
  canvasContainer.style.cursor = 'grabbing';
  panStart.x = e.clientX - pan.x;
  panStart.y = e.clientY - pan.y;
});

window.addEventListener('mousemove', (e) => {
  if (isDraggingCanvas) {
    pan.x = e.clientX - panStart.x;
    pan.y = e.clientY - panStart.y;
    updateViewportTransform();
  } else if (draggedNode) {
    // Convert screen mouse coords to canvas coords based on zoom and pan
    const rect = canvasContainer.getBoundingClientRect();
    const mouseXInCanvas = (e.clientX - rect.left - pan.x) / zoom;
    const mouseYInCanvas = (e.clientY - rect.top - pan.y) / zoom;
    
    draggedNode.x = mouseXInCanvas;
    draggedNode.y = mouseYInCanvas;
    draggedNode.vx = 0;
    draggedNode.vy = 0;
  }
});

window.addEventListener('mouseup', () => {
  if (isDraggingCanvas) {
    isDraggingCanvas = false;
    canvasContainer.style.cursor = 'grab';
  }
  if (draggedNode) {
    draggedNode.dragging = false;
    const nodeEl = document.getElementById(`node-${draggedNode.id}`);
    if (nodeEl) nodeEl.classList.remove('dragging');
    draggedNode = null;
  }
});

// Wheel zoom
canvasContainer.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  const rect = canvasContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Calculate coordinate of mouse on canvas before zoom
  const canvasX = (mouseX - pan.x) / zoom;
  const canvasY = (mouseY - pan.y) / zoom;
  
  if (e.deltaY < 0) {
    zoom = Math.min(ZOOM_MAX, zoom * zoomFactor);
  } else {
    zoom = Math.max(ZOOM_MIN, zoom / zoomFactor);
  }
  
  // Recalculate pan to keep mouse point anchored
  pan.x = mouseX - canvasX * zoom;
  pan.y = mouseY - canvasY * zoom;
  
  updateViewportTransform();
}, { passive: false });

function adjustZoom(amount) {
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const canvasX = (center.x - pan.x) / zoom;
  const canvasY = (center.y - pan.y) / zoom;
  
  zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom + amount));
  
  pan.x = center.x - canvasX * zoom;
  pan.y = center.y - canvasY * zoom;
  updateViewportTransform();
}

function resetView() {
  zoom = 1.0;
  pan = { x: (window.innerWidth - varWidth()) / 2, y: window.innerHeight / 2 - 100 };
  updateViewportTransform();
}

function varWidth() {
  return window.innerWidth > 768 ? 340 : 0; // Sidebar width offset
}

function updateViewportTransform() {
  canvasViewport.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
}

// ----------------------------------------------------
// Core API calls
// ----------------------------------------------------
async function generateMindMap(prompt) {
  currentPrompt = prompt;
  showLoader("Consulting Gemini...", "Weaving ideas, creating structural clusters...");
  
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to generate');
    }
    
    const data = await response.json();
    
    // Clear and build new graph
    initGraph(data.nodes, data.edges);
    canvasInstruction.classList.add('hidden');
    
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    hideLoader();
  }
}

async function expandNode(node) {
  showLoader(`Expanding Node: ${node.label}`, "Gemini is researching related details and branching concepts...");
  
  const existingNodeIds = nodes.map(n => n.id);
  
  try {
    const response = await fetch('/api/expand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentNodeId: node.id,
        nodeLabel: node.label,
        nodeDescription: node.description,
        contextPrompt: currentPrompt,
        existingNodeIds
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to expand');
    }
    
    const data = await response.json();
    
    // Merge new nodes and edges
    // Position new nodes right near parent
    const parentNode = nodes.find(n => n.id === node.id);
    const originX = parentNode ? parentNode.x : 0;
    const originY = parentNode ? parentNode.y : 0;
    
    data.nodes.forEach(n => {
      // Check duplicate safety
      if (!nodes.some(existing => existing.id === n.id)) {
        nodes.push({
          ...n,
          x: originX + (Math.random() - 0.5) * 60,
          y: originY + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10
        });
      }
    });
    
    data.edges.forEach(e => {
      if (!edges.some(existing => existing.from === e.from && existing.to === e.to)) {
        edges.push(e);
      }
    });
    
    rebuildNodeDOM();
    
    // Select the newly expanded node's first child if possible
    if (data.nodes.length > 0) {
      selectNode(data.nodes[0].id);
    }
    
  } catch (error) {
    alert(`Error expanding node: ${error.message}`);
  } finally {
    hideLoader();
  }
}

// ----------------------------------------------------
// Graph Initialization & Logic
// ----------------------------------------------------
function initGraph(newNodes, newEdges) {
  // Empty old UI elements
  nodesLayer.innerHTML = '';
  connectionsLayer.innerHTML = '';
  
  // Map and place nodes in canvas space
  nodes = newNodes.map((node, index) => {
    // Place first node in center, rest in radial positions
    let x = 0;
    let y = 0;
    
    if (index > 0) {
      const angle = (index / (newNodes.length - 1)) * Math.PI * 2;
      const radius = 220 + Math.random() * 50;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
    }
    
    return {
      ...node,
      x,
      y,
      vx: 0,
      vy: 0
    };
  });
  
  edges = newEdges;
  
  rebuildNodeDOM();
  resetView();
  
  // Select root node initially
  if (nodes.length > 0) {
    selectNode(nodes[0].id);
  }
}

function rebuildNodeDOM() {
  // Remove nodes that are no longer present
  const existingNodeEls = document.querySelectorAll('.mindmap-node');
  existingNodeEls.forEach(el => el.remove());
  
  // Create HTML Node Elements
  nodes.forEach(node => {
    const el = document.createElement('div');
    el.id = `node-${node.id}`;
    el.className = `mindmap-node group-${node.group.toLowerCase()}`;
    
    // Handle specific group styling fallback
    const validGroups = ['core', 'concept', 'application', 'future', 'other'];
    const lowerGroup = node.group.toLowerCase();
    const matchedGroup = validGroups.find(g => lowerGroup.includes(g)) || 'concept';
    el.className = `mindmap-node group-${matchedGroup}`;
    
    el.innerHTML = `
      <div class="node-title">${node.label}</div>
      <div class="node-desc">${node.description}</div>
      <div class="node-expand-indicator">+</div>
    `;
    
    // Event listeners for dragging
    el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      selectNode(node.id);
      draggedNode = node;
      node.dragging = true;
      el.classList.add('dragging');
    });
    
    // Expand on double click
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      expandNode(node);
    });
    
    nodesLayer.appendChild(el);
  });
  
  // Refresh SVG Connections
  connectionsLayer.innerHTML = '';
  edges.forEach((edge, index) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.id = `edge-${index}`;
    path.className = 'connection-line';
    connectionsLayer.appendChild(path);
  });
}

function selectNode(id) {
  selectedNode = nodes.find(n => n.id === id);
  if (!selectedNode) return;
  
  document.querySelectorAll('.mindmap-node').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById(`node-${id}`);
  if (el) el.classList.add('selected');
  
  // Show inspector panel
  inspector.classList.remove('hidden');
  inspectorNodeGroup.textContent = selectedNode.group;
  inspectorNodeLabel.textContent = selectedNode.label;
  inspectorNodeDesc.textContent = selectedNode.description;
  
  // Highlight connection lines from/to selected node
  edges.forEach((edge, index) => {
    const path = document.getElementById(`edge-${index}`);
    if (path) {
      if (edge.from === id || edge.to === id) {
        path.classList.add('glowing');
      } else {
        path.classList.remove('glowing');
      }
    }
  });
}

// ----------------------------------------------------
// Physics Simulation Engine
// ----------------------------------------------------
function physicsStep() {
  if (nodes.length === 0) return;
  
  const repulsionStrength = 220;
  const attractionStrength = 0.04;
  const gravityStrength = 0.008;
  const optimalDistance = 160;
  
  // 1. Repulsion between all nodes
  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      
      // Repel if closer than 300px
      if (dist < 320) {
        const force = (320 - dist) * 0.07;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        n1.vx -= fx;
        n1.vy -= fy;
        n2.vx += fx;
        n2.vy += fy;
      }
    }
  }
  
  // 2. Attraction along edges
  edges.forEach(edge => {
    const n1 = nodes.find(n => n.id === edge.from);
    const n2 = nodes.find(n => n.id === edge.to);
    
    if (n1 && n2) {
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const force = (dist - optimalDistance) * attractionStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      n1.vx += fx;
      n1.vy += fy;
      n2.vx -= fx;
      n2.vy -= fy;
    }
  });
  
  // 3. Gravity pulling to center (0,0) and update positions
  nodes.forEach(node => {
    // Gravity force
    const distToCenter = Math.sqrt(node.x * node.x + node.y * node.y) || 1;
    node.vx -= (node.x / distToCenter) * (distToCenter * gravityStrength);
    node.vy -= (node.y / distToCenter) * (distToCenter * gravityStrength);
    
    // Friction damping
    node.vx *= 0.85;
    node.vy *= 0.85;
    
    // Move node unless being dragged
    if (node !== draggedNode) {
      node.x += node.vx;
      node.y += node.vy;
    }
  });
}

function renderStep() {
  // Update node positions in DOM
  nodes.forEach(node => {
    const el = document.getElementById(`node-${node.id}`);
    if (el) {
      // Offset by half dimensions (card width is 190, approx height 70)
      const xOffset = -95;
      const yOffset = -35;
      el.style.left = `${node.x + xOffset}px`;
      el.style.top = `${node.y + yOffset}px`;
    }
  });
  
  // Draw connection paths
  edges.forEach((edge, index) => {
    const path = document.getElementById(`edge-${index}`);
    if (!path) return;
    
    const n1 = nodes.find(n => n.id === edge.from);
    const n2 = nodes.find(n => n.id === edge.to);
    
    if (n1 && n2) {
      // Draw bezier curve or straight line
      // Cubic Bezier curve makes it look fluid
      const midX = (n1.x + n2.x) / 2;
      const midY = (n1.y + n2.y) / 2;
      
      // M x1 y1 C midX y1, midX y2, x2 y2
      path.setAttribute('d', `M ${n1.x} ${n1.y} C ${midX} ${n1.y}, ${midX} ${n2.y}, ${n2.x} ${n2.y}`);
    }
  });
}

// Main Animation Loop
function loop() {
  physicsStep();
  renderStep();
  requestAnimationFrame(loop);
}

// Start simulation loop
loop();

// ----------------------------------------------------
// UI Helpers
// ----------------------------------------------------
function showLoader(title, subtitle) {
  loadingTitle.textContent = title;
  loadingSubtitle.textContent = subtitle;
  loadingOverlay.classList.remove('hidden');
}

function hideLoader() {
  loadingOverlay.classList.add('hidden');
}

// Export canvas view as PNG
exportImageBtn.addEventListener('click', () => {
  alert("To save the mindmap as an image, you can take a screenshot of your workspace. Future versions will integrate direct SVG/canvas exports.");
});
