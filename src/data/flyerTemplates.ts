
import { FlyerTemplate, ColorPalette } from '@/types/flyer'

export const colorPalettes: ColorPalette[] = [
  {
    id: 'bright-arcade',
    name: 'Bright Arcade',
    primary: 'hsl(340, 82%, 52%)',
    secondary: 'hsl(291, 64%, 42%)',
    accent: 'hsl(48, 100%, 67%)',
    background: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'pastel-fun',
    name: 'Pastel Fun',
    primary: 'hsl(313, 73%, 84%)',
    secondary: 'hsl(197, 71%, 73%)',
    accent: 'hsl(60, 100%, 85%)',
    background: 'hsl(0, 0%, 98%)'
  },
  {
    id: 'holiday-red',
    name: 'Holiday Red',
    primary: 'hsl(0, 84%, 60%)',
    secondary: 'hsl(142, 71%, 45%)',
    accent: 'hsl(43, 74%, 66%)',
    background: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    primary: 'hsl(300, 100%, 50%)',
    secondary: 'hsl(180, 100%, 50%)',
    accent: 'hsl(60, 100%, 50%)',
    background: 'hsl(240, 10%, 10%)'
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    primary: 'hsl(207, 90%, 54%)',
    secondary: 'hsl(192, 100%, 67%)',
    accent: 'hsl(45, 100%, 51%)',
    background: 'hsl(0, 0%, 100%)'
  }
]

export const flyerTemplates: FlyerTemplate[] = [
  // New Machine Templates
  {
    id: 'new-machine-flyer',
    name: 'New Machine Alert',
    description: 'Eye-catching design for announcing new claw machines',
    category: 'new-machine',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-pink-500 to-purple-600'
  },
  {
    id: 'new-machine-poster',
    name: 'Grand Opening Poster',
    description: 'Large format poster for new machine launches',
    category: 'new-machine',
    size: '11x17',
    preview: 'bg-gradient-to-br from-orange-500 to-red-500'
  },
  {
    id: 'new-machine-social',
    name: 'New Machine Social Post',
    description: 'Perfect for Instagram and Facebook posts',
    category: 'new-machine',
    size: 'square',
    preview: 'bg-gradient-to-br from-blue-500 to-teal-500'
  },
  
  // Prize Templates
  {
    id: 'prizes-showcase',
    name: 'Prize Showcase',
    description: 'Highlight your best prizes with style',
    category: 'prizes',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-yellow-400 to-orange-500'
  },
  {
    id: 'win-big-poster',
    name: 'Win Big Poster',
    description: 'Large format prize display',
    category: 'prizes',
    size: '11x17',
    preview: 'bg-gradient-to-br from-green-500 to-emerald-600'
  },
  {
    id: 'prize-story',
    name: 'Prize Story',
    description: 'Instagram/TikTok story format',
    category: 'prizes',
    size: 'story',
    preview: 'bg-gradient-to-br from-purple-500 to-pink-500'
  },

  // Limited Event Templates
  {
    id: 'limited-event-flyer',
    name: 'Limited Time Event',
    description: 'Create urgency with time-sensitive promotions',
    category: 'limited-event',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-red-500 to-pink-600'
  },
  {
    id: 'flash-sale-square',
    name: 'Flash Sale Social',
    description: 'Quick promotion for social media',
    category: 'limited-event',
    size: 'square',
    preview: 'bg-gradient-to-br from-indigo-500 to-purple-600'
  },

  // Holiday Templates
  {
    id: 'holiday-special',
    name: 'Holiday Special',
    description: 'Seasonal promotions and themed events',
    category: 'holiday',
    size: '8.5x11',  
    preview: 'bg-gradient-to-br from-red-600 to-green-600'
  },
  {
    id: 'holiday-poster',
    name: 'Holiday Celebration Poster',
    description: 'Large format holiday promotions',
    category: 'holiday',
    size: '11x17',
    preview: 'bg-gradient-to-br from-green-500 to-red-500'
  }
]

export const stockImages = [
  { id: 'claw-machine-1', url: '/placeholder.svg', alt: 'Modern claw machine' },
  { id: 'claw-machine-2', url: '/placeholder.svg', alt: 'Vintage claw machine' },
  { id: 'prizes-plush', url: '/placeholder.svg', alt: 'Plush toy prizes' },
  { id: 'prizes-electronics', url: '/placeholder.svg', alt: 'Electronic prizes' },
  { id: 'prizes-mixed', url: '/placeholder.svg', alt: 'Mixed prize collection' }
]
