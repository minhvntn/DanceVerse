import { AvatarCustomization } from '../../../../shared/types';

export const BODY_COLORS = [
  { id: 'cyan', color: '#00F0FF', name: 'Neon Cyan' },
  { id: 'pink', color: '#FF2B9B', name: 'Hot Pink' },
  { id: 'purple', color: '#7C3AED', name: 'Deep Purple' },
  { id: 'blue', color: '#2563EB', name: 'Royal Blue' },
  { id: 'yellow', color: '#FFE45E', name: 'Electric Yellow' },
  { id: 'green', color: '#62FF38', name: 'Acid Green' },
  { id: 'white', color: '#FFFFFF', name: 'Pure White' },
  { id: 'black', color: '#1E293B', name: 'Shadow Black' },
];

export const HAIR_STYLES = [
  { id: 'default', name: 'Default' },
  { id: 'short', name: 'Short' },
  { id: 'spiky', name: 'Spiky' },
  { id: 'side-part', name: 'Side Part' },
  { id: 'cute', name: 'Cute Bob' },
  { id: 'dj', name: 'DJ Headphones' },
];

export const HAIR_COLORS = [
  { id: 'navy', color: '#172033', name: 'Navy Dark' },
  { id: 'blonde', color: '#FFE45E', name: 'Blonde' },
  { id: 'pink', color: '#FF2B9B', name: 'Pink' },
  { id: 'silver', color: '#E2E8F0', name: 'Silver' },
  { id: 'cyan', color: '#00F0FF', name: 'Cyan' },
];

export const FACE_STYLES = [
  { id: 'happy', name: 'Happy' },
  { id: 'cute', name: 'Cute' },
  { id: 'cool', name: 'Cool (Shades)' },
  { id: 'sleepy', name: 'Sleepy' },
  { id: 'star-eyes', name: 'Star Eyes' },
];

export const OUTFIT_STYLES = [
  { id: 'danceverse-basic', name: 'DanceVerse Basic' },
  { id: 'neon-raver', name: 'Neon Raver' },
  { id: 'kpop-fan', name: 'K-Pop Fan' },
  { id: 'dj', name: 'DJ Street' },
  { id: 'cyber', name: 'Cyberpunk' },
  { id: 'street', name: 'Streetwear' },
];

export const OUTFIT_COLORS = [
  { id: 'blue', color: '#2552D9', name: 'Blue' },
  { id: 'pink', color: '#FF2B9B', name: 'Pink' },
  { id: 'black', color: '#172033', name: 'Black' },
  { id: 'white', color: '#FFFFFF', name: 'White' },
  { id: 'green', color: '#24D26D', name: 'Green' },
];

export const SHOE_STYLES = [
  { id: 'basic', name: 'Basic Sneakers' },
  { id: 'high-top', name: 'High Tops' },
  { id: 'cyber-boots', name: 'Cyber Boots' },
];

export const SHOE_COLORS = [
  { id: 'cyan', color: '#00F0FF', name: 'Cyan' },
  { id: 'white', color: '#FFFFFF', name: 'White' },
  { id: 'black', color: '#172033', name: 'Black' },
  { id: 'pink', color: '#FF2B9B', name: 'Pink' },
];

export const LIGHTSTICK_STYLES = [
  { id: 'classic', name: 'Classic Stick' },
  { id: 'hex', name: 'Hexagon (EXO)' },
  { id: 'star', name: 'Star Glow' },
  { id: 'heart', name: 'Heart Beat' },
];

export const LIGHTSTICK_COLORS = [
  { id: 'cyan', color: '#8ffcff', name: 'Cyan' },
  { id: 'pink', color: '#ff2dbb', name: 'Pink' },
  { id: 'purple', color: '#b347ff', name: 'Purple' },
  { id: 'blue', color: '#2563EB', name: 'Blue' },
  { id: 'white', color: '#ffffff', name: 'White' },
];

export const DEFAULT_AVATAR: AvatarCustomization = {
  bodyColor: 'cyan',
  hairStyle: 'default',
  hairColor: 'navy',
  faceStyle: 'happy',
  outfitTop: 'danceverse-basic',
  outfitBottom: 'danceverse-basic',
  outfitColor: 'blue',
  shoes: 'basic',
  shoesColor: 'white',
  lightstickStyle: 'hex',
  lightstickColor: 'cyan',
};

// Helper function to resolve color values from IDs
export const resolveColor = (registry: { id: string, color: string }[], id: string, fallback: string) => {
  return registry.find(item => item.id === id)?.color || fallback;
};
