
import { MemeTemplate, AIProvider } from './types';

export const MEME_TEMPLATES: MemeTemplate[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800', name: 'Cool Cat' },
  { id: '2', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=800', name: 'Puppy' },
  { id: '3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800', name: 'Skeptical Dog' },
  { id: '4', url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=800', name: 'Shocked Cat' },
  { id: '5', url: 'https://images.unsplash.com/photo-1501705381039-ec07a421a24d?q=80&w=800', name: 'Chill Fox' },
  { id: '6', url: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=800', name: 'Golden Puppy' },
];

export const AI_PROVIDERS: { id: AIProvider; name: string; description: string; models: string[] }[] = [
  { 
    id: 'pollinations', 
    name: 'Pollinations.ai (Free)', 
    description: 'Zero setup, free unlimited usage.',
    models: ['openai', 'mistral', 'p1', 'large'] 
  },
  { 
    id: 'aihorde', 
    name: 'AI Horde (Community)', 
    description: 'Free community-driven cluster.',
    models: ['Mistral-7B-v0.1', 'Gemma-7b', 'Phind-CodeLlama-34B'] 
  },
  { 
    id: 'custom', 
    name: 'Custom Endpoint', 
    description: 'Use your own Grok, Claude, or OpenAI key.',
    models: ['gpt-4-turbo', 'claude-3-opus', 'grok-1'] 
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini (Pro)', 
    description: 'High-quality native integration.',
    models: ['gemini-3-pro-preview', 'gemini-3-flash-preview'] 
  },
];

export const STYLE_PRESETS = [
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'neon cyberpunk futuristic digital art style', icon: 'fa-bolt-lightning' },
  { id: 'ghibli', name: 'Ghibli', prompt: 'Studio Ghibli anime hand-painted style', icon: 'fa-wind' },
  { id: 'oil', name: 'Oil Paint', prompt: 'thick textured oil painting with visible brushstrokes', icon: 'fa-palette' },
  { id: 'sketch', name: 'Sketch', prompt: 'detailed pencil sketch on parchment paper', icon: 'fa-pencil' },
  { id: 'vaporwave', name: 'Vaporwave', prompt: '80s aesthetic vaporwave style with pink and teal gradients', icon: 'fa-clover' },
  { id: 'pixel', name: '8-Bit', prompt: 'retro 8-bit pixel art video game style', icon: 'fa-gamepad' },
];
