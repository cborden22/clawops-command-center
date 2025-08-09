
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Download, Printer, Share2 } from 'lucide-react'

interface BusinessInfo {
  businessName: string
  tagline: string
  phone: string
  email: string
  address: string
  website: string
  description: string
}

interface Template {
  id: string
  name: string
  description: string
  preview: string
  category: 'flyer' | 'poster'
}

const templates: Template[] = [
  {
    id: 'modern-flyer',
    name: 'Modern Business Flyer',
    description: 'Clean and professional design perfect for service businesses',
    preview: 'bg-gradient-to-br from-blue-500 to-purple-600',
    category: 'flyer'
  },
  {
    id: 'restaurant-flyer',
    name: 'Restaurant Special Flyer',
    description: 'Appetizing design ideal for food promotions',
    preview: 'bg-gradient-to-br from-orange-500 to-red-500',
    category: 'flyer'
  },
  {
    id: 'event-poster',
    name: 'Event Announcement Poster',
    description: 'Bold design for concerts, parties, and events',
    preview: 'bg-gradient-to-br from-pink-500 to-yellow-500',
    category: 'poster'
  },
  {
    id: 'sale-poster',
    name: 'Sale Promotion Poster',
    description: 'Eye-catching design for retail promotions',
    preview: 'bg-gradient-to-br from-green-500 to-teal-500',
    category: 'poster'
  },
  {
    id: 'real-estate-flyer',
    name: 'Real Estate Flyer',
    description: 'Professional layout for property listings',
    preview: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    category: 'flyer'
  },
  {
    id: 'fitness-poster',
    name: 'Fitness Class Poster',
    description: 'Dynamic design for gym and wellness businesses',
    preview: 'bg-gradient-to-br from-purple-500 to-pink-500',
    category: 'poster'
  }
]

const FlyerGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    description: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleInputChange = (field: keyof BusinessInfo, value: string) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }))
  }

  const generateFlyer = async () => {
    if (!selectedTemplate || !businessInfo.businessName.trim()) {
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate generation process
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Generating flyer with:', { selectedTemplate, businessInfo })
    } catch (error) {
      console.error('Error generating flyer:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    console.log('Downloading flyer...')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${businessInfo.businessName} Flyer`,
        text: 'Check out this flyer!',
        url: window.location.href
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Flyer & Poster Generator</h1>
        <p className="text-muted-foreground">
          Create professional flyers and posters for your business in minutes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template Selection & Business Info */}
        <div className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose a Template</CardTitle>
              <CardDescription>
                Select a design that matches your business needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className={`h-24 rounded-t-lg ${template.preview}`} />
                    <div className="p-3">
                      <h4 className="font-semibold text-sm">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                      <span className="inline-block mt-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Enter your business details to customize the template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessInfo.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Your Business Name"
                />
              </div>
              
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={businessInfo.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="Your catchy tagline"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="info@business.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={businessInfo.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="www.yourbusiness.com"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={businessInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={businessInfo.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your business or promotion"
                  rows={3}
                />
              </div>

              <Button
                onClick={generateFlyer}
                disabled={!selectedTemplate || !businessInfo.businessName.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Flyer'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Your flyer will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTemplate && businessInfo.businessName ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8">
                  <div className={`w-full h-96 rounded-lg ${selectedTemplate.preview} text-white p-6 flex flex-col justify-between`}>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{businessInfo.businessName}</h2>
                      {businessInfo.tagline && (
                        <p className="text-lg opacity-90 mb-4">{businessInfo.tagline}</p>
                      )}
                      {businessInfo.description && (
                        <p className="text-sm opacity-80">{businessInfo.description}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      {businessInfo.phone && <p>📞 {businessInfo.phone}</p>}
                      {businessInfo.email && <p>✉️ {businessInfo.email}</p>}
                      {businessInfo.website && <p>🌐 {businessInfo.website}</p>}
                      {businessInfo.address && <p>📍 {businessInfo.address}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">
                    Select a template and enter your business name to see preview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTemplate && businessInfo.businessName && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Download, print, or share your flyer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default FlyerGenerator
