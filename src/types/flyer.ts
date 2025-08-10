
export interface FlyerTemplate {
  id: string
  name: string
  description: string
  category: 'new-machine' | 'prizes' | 'limited-event' | 'holiday' | 'partnership'
  size: '8.5x11' | '11x17' | 'square' | 'story'
  preview: string
  backgroundImage?: string
}

export interface FlyerData {
  businessName: string
  locationName: string
  address: string
  prizeHighlights: string[]
  specialOffer: string
  contactInfo: string
  socialHandles: string
  websiteUrl: string
  selectedColors: ColorPalette
  logoFile: File | null
  customImage: File | null
}

export interface ColorPalette {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
}

export type ExportFormat = 'pdf' | 'png' | 'jpeg'
export type SharePlatform = 'email' | 'facebook' | 'instagram' | 'whatsapp'
