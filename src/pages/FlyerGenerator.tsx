
import React, { useState } from 'react'
import { toast } from 'sonner'
import { FlyerTemplate, FlyerData, ExportFormat, SharePlatform } from '@/types/flyer'
import { flyerTemplates, colorPalettes } from '@/data/flyerTemplates'
import TemplateSelector from '@/components/flyer/TemplateSelector'
import FlyerForm from '@/components/flyer/FlyerForm'
import FlyerPreview from '@/components/flyer/FlyerPreview'
import FlyerExport from '@/components/flyer/FlyerExport'

const FlyerGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<FlyerTemplate | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  
  const [flyerData, setFlyerData] = useState<FlyerData>({
    businessName: '',
    locationName: '',
    address: '',
    prizeHighlights: [],
    specialOffer: '',
    contactInfo: '',
    socialHandles: '',
    websiteUrl: '',
    selectedColors: colorPalettes[0],
    logoFile: null,
    customImage: null
  })

  const handleDataChange = (newData: Partial<FlyerData>) => {
    setFlyerData(prev => ({ ...prev, ...newData }))
  }

  const handleExport = (format: ExportFormat) => {
    if (!selectedTemplate || !flyerData.businessName.trim()) {
      toast.error('Please select a template and enter your business name')
      return
    }

    // In a real implementation, this would generate the actual file
    toast.success(`Exporting flyer as ${format.toUpperCase()}...`)
    console.log('Exporting flyer:', { format, template: selectedTemplate, data: flyerData })
  }

  const handleShare = (platform: SharePlatform) => {
    if (!selectedTemplate || !flyerData.businessName.trim()) {
      toast.error('Please select a template and enter your business name')
      return
    }

    const shareText = `Check out ${flyerData.businessName}${flyerData.specialOffer ? ` - ${flyerData.specialOffer}` : '!'}`
    
    switch (platform) {
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${flyerData.address || ''}`)}`
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`, '_blank')
        break
      case 'instagram':
        toast.info('Save the image and share it on Instagram')
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
        break
    }
  }

  const handleSeasonalMode = () => {
    const currentMonth = new Date().getMonth()
    let seasonalPalette = colorPalettes[0]
    
    // Auto-detect season and apply appropriate colors
    if (currentMonth >= 11 || currentMonth <= 1) { // Winter/Holiday
      seasonalPalette = colorPalettes.find(p => p.id === 'holiday-red') || colorPalettes[0]
    } else if (currentMonth >= 2 && currentMonth <= 4) { // Spring
      seasonalPalette = colorPalettes.find(p => p.id === 'pastel-fun') || colorPalettes[0]
    } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer
      seasonalPalette = colorPalettes.find(p => p.id === 'bright-arcade') || colorPalettes[0]
    } else { // Fall
      seasonalPalette = colorPalettes.find(p => p.id === 'ocean-blue') || colorPalettes[0]
    }
    
    setFlyerData(prev => ({ ...prev, selectedColors: seasonalPalette }))
    toast.success('Applied seasonal colors!')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Professional Flyer & Poster Generator</h1>
        <p className="text-muted-foreground">
          Create stunning promotional materials for your claw machine business in minutes
        </p>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSeasonalMode}
            className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
          >
            🎄 Seasonal Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Template Selection */}
        <div className="xl:col-span-1">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Choose Template</h2>
            <TemplateSelector
              templates={flyerTemplates}
              selectedTemplate={selectedTemplate}
              onTemplateSelect={setSelectedTemplate}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        </div>

        {/* Middle Column - Form */}
        <div className="xl:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Customize Your Flyer</h2>
          <FlyerForm
            flyerData={flyerData}
            onDataChange={handleDataChange}
            colorPalettes={colorPalettes}
            onGenerateQR={setQrCodeUrl}
          />
        </div>

        {/* Right Column - Preview & Export */}
        <div className="xl:col-span-1 space-y-6">
          {selectedTemplate && flyerData.businessName ? (
            <>
              <FlyerPreview
                template={selectedTemplate}
                flyerData={flyerData}
                qrCodeUrl={qrCodeUrl}
              />
              <FlyerExport
                flyerData={flyerData}
                onExport={handleExport}
                onShare={handleShare}
              />
            </>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                {!selectedTemplate ? 'Select a template to get started' : 'Enter your business name to see preview'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FlyerGenerator
