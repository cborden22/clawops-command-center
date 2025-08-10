
import React, { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Wand2 } from 'lucide-react'
import { FlyerTemplate, FlyerData, ExportFormat, SharePlatform } from '@/types/flyer'
import { flyerTemplates, colorPalettes } from '@/data/flyerTemplates'
import TemplateSelector from '@/components/flyer/TemplateSelector'
import FlyerForm from '@/components/flyer/FlyerForm'
import FlyerPreview from '@/components/flyer/FlyerPreview'
import FlyerExport from '@/components/flyer/FlyerExport'
import { Button } from '@/components/ui/button'

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
    
    if (currentMonth >= 11 || currentMonth <= 1) {
      seasonalPalette = colorPalettes.find(p => p.id === 'holiday-red') || colorPalettes[0]
    } else if (currentMonth >= 2 && currentMonth <= 4) {
      seasonalPalette = colorPalettes.find(p => p.id === 'pastel-fun') || colorPalettes[0]
    } else if (currentMonth >= 5 && currentMonth <= 7) {
      seasonalPalette = colorPalettes.find(p => p.id === 'bright-arcade') || colorPalettes[0]
    } else {
      seasonalPalette = colorPalettes.find(p => p.id === 'ocean-blue') || colorPalettes[0]
    }
    
    setFlyerData(prev => ({ ...prev, selectedColors: seasonalPalette }))
    toast.success('Applied seasonal colors!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto py-12 px-6">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            Professional Design Tool
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Flyer & Poster Generator
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Create stunning promotional materials for your claw machine business in minutes. 
            Professional templates, easy customization, instant downloads.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={handleSeasonalMode}
              variant="outline"
              className="group bg-gradient-card border-primary/20 hover:border-primary/40 hover:shadow-hover transition-all duration-300"
            >
              <Wand2 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
              🎄 Seasonal Mode
            </Button>
            
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              No data stored • Session only
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8">
          {/* Template Selection - Left Column */}
          <div className="2xl:col-span-4">
            <div className="sticky top-8">
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <h2 className="text-2xl font-bold">Choose Template</h2>
                </div>
                
                <TemplateSelector
                  templates={flyerTemplates}
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={setSelectedTemplate}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </div>
            </div>
          </div>

          {/* Form - Middle Column */}
          <div className="2xl:col-span-4">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">2</span>
                </div>
                <h2 className="text-2xl font-bold">Customize Design</h2>
              </div>
              
              <FlyerForm
                flyerData={flyerData}
                onDataChange={handleDataChange}
                colorPalettes={colorPalettes}
                onGenerateQR={setQrCodeUrl}
              />
            </div>
          </div>

          {/* Preview & Export - Right Column */}
          <div className="2xl:col-span-4">
            <div className="sticky top-8 space-y-6">
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <h2 className="text-2xl font-bold">Preview & Export</h2>
                </div>
                
                {selectedTemplate && flyerData.businessName ? (
                  <div className="space-y-6">
                    <FlyerPreview
                      template={selectedTemplate}
                      flyerData={flyerData}
                      qrCodeUrl={qrCodeUrl}
                    />
                    <FlyerExport
                      flyerData={flyerData}
                      template={selectedTemplate}
                      onExport={handleExport}
                      onShare={handleShare}
                      qrCodeUrl={qrCodeUrl}
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-primary/20 rounded-2xl p-12 text-center bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Ready to Create?</h3>
                    <p className="text-muted-foreground">
                      {!selectedTemplate 
                        ? 'Select a template to get started' 
                        : 'Enter your business name to see preview'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlyerGenerator
