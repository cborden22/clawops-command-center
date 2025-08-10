
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
  },
  {
    id: 'electric-purple',
    name: 'Electric Purple',
    primary: 'hsl(270, 100%, 60%)',
    secondary: 'hsl(320, 100%, 70%)',
    accent: 'hsl(50, 100%, 60%)',
    background: 'hsl(0, 0%, 100%)'
  },
  {
    id: 'retro-orange',
    name: 'Retro Orange',
    primary: 'hsl(25, 100%, 55%)',
    secondary: 'hsl(45, 100%, 65%)',
    accent: 'hsl(5, 100%, 60%)',
    background: 'hsl(0, 0%, 100%)'
  }
]

export const flyerTemplates: FlyerTemplate[] = [
  // New Machine Templates
  {
    id: 'new-machine-bold',
    name: 'Bold New Machine',
    description: 'Eye-catching bold design with large text and vibrant colors',
    category: 'new-machine',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-pink-500 via-purple-600 to-blue-700',
    layout: 'bold-header'
  },
  {
    id: 'new-machine-modern',
    name: 'Modern Launch',
    description: 'Clean, modern design perfect for contemporary locations',
    category: 'new-machine',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600',
    layout: 'modern-clean'
  },
  {
    id: 'new-machine-poster',
    name: 'Grand Opening Poster',
    description: 'Large format poster for maximum impact',
    category: 'new-machine',
    size: '11x17',
    preview: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600',
    layout: 'poster-style'
  },
  {
    id: 'new-machine-social',
    name: 'Social Media Square',
    description: 'Perfect for Instagram and Facebook posts',
    category: 'new-machine',
    size: 'square',
    preview: 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500',
    layout: 'social-square'
  },
  
  // Prize Templates
  {
    id: 'prizes-showcase',
    name: 'Prize Showcase',
    description: 'Highlight your best prizes with elegant design',
    category: 'prizes',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500',
    layout: 'prize-grid'
  },
  {
    id: 'win-big-poster',
    name: 'Win Big Display',
    description: 'Large format prize showcase',
    category: 'prizes',
    size: '11x17',
    preview: 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600',
    layout: 'big-prizes'
  },
  {
    id: 'prize-story',
    name: 'Prize Story',
    description: 'Vertical format for stories and mobile viewing',
    category: 'prizes',
    size: 'story',
    preview: 'bg-gradient-to-b from-purple-400 via-pink-500 to-red-500',
    layout: 'vertical-story'
  },
  {
    id: 'prizes-elegant',
    name: 'Elegant Prizes',
    description: 'Sophisticated design for upscale locations',
    category: 'prizes',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600',
    layout: 'elegant-showcase'
  },

  // Limited Event Templates
  {
    id: 'flash-sale-urgent',
    name: 'Flash Sale Alert',
    description: 'High-energy design that creates urgency',
    category: 'limited-event',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500',
    layout: 'urgent-flash'
  },
  {
    id: 'limited-time-classic',
    name: 'Limited Time Classic',
    description: 'Traditional event promotion style',
    category: 'limited-event',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700',
    layout: 'classic-event'
  },
  {
    id: 'weekend-special',
    name: 'Weekend Special',
    description: 'Perfect for weekend promotions',
    category: 'limited-event',
    size: 'square',
    preview: 'bg-gradient-to-br from-green-500 via-teal-500 to-blue-600',
    layout: 'weekend-fun'
  },

  // Holiday Templates
  {
    id: 'holiday-festive',
    name: 'Festive Celebration',
    description: 'Warm, festive design for any holiday',
    category: 'holiday',
    size: '8.5x11',
    preview: 'bg-gradient-to-br from-red-600 via-green-600 to-gold',
    layout: 'festive-holiday'
  },
  {
    id: 'holiday-winter',
    name: 'Winter Wonderland',
    description: 'Cool, elegant winter theme',
    category: 'holiday',
    size: '11x17',
    preview: 'bg-gradient-to-br from-blue-400 via-cyan-300 to-white',
    layout: 'winter-theme'
  },
  {
    id: 'holiday-party',
    name: 'Holiday Party',
    description: 'Fun, party-themed holiday design',
    category: 'holiday',
    size: 'square',
    preview: 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500',
    layout: 'party-theme'
  }
]

export const stockImages = [
  { id: 'claw-machine-1', url: '/placeholder.svg', alt: 'Modern claw machine' },
  { id: 'claw-machine-2', url: '/placeholder.svg', alt: 'Vintage claw machine' },
  { id: 'prizes-plush', url: '/placeholder.svg', alt: 'Plush toy prizes' },
  { id: 'prizes-electronics', url: '/placeholder.svg', alt: 'Electronic prizes' },
  { id: 'prizes-mixed', url: '/placeholder.svg', alt: 'Mixed prize collection' }
]
