
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Upload, X, Palette, QrCode, Plus, Building2, MapPin, Sparkles } from 'lucide-react'
import { FlyerData, ColorPalette } from '@/types/flyer'
import QRCodeGenerator from './QRCodeGenerator'

interface FlyerFormProps {
  flyerData: FlyerData
  onDataChange: (data: Partial<FlyerData>) => void
  colorPalettes: ColorPalette[]
  onGenerateQR: (url: string) => void
}

const FlyerForm: React.FC<FlyerFormProps> = ({
  flyerData,
  onDataChange,
  colorPalettes,
  onGenerateQR
}) => {
  const handleFileUpload = (file: File, type: 'logo' | 'image') => {
    const key = type === 'logo' ? 'logoFile' : 'customImage'
    onDataChange({ [key]: file })
  }

  const handlePrizeAdd = () => {
    const newPrize = prompt('Enter prize description:')
    if (newPrize) {
      onDataChange({
        prizeHighlights: [...flyerData.prizeHighlights, newPrize]
      })
    }
  }

  const handlePrizeRemove = (index: number) => {
    const newPrizes = flyerData.prizeHighlights.filter((_, i) => i !== index)
    onDataChange({ prizeHighlights: newPrizes })
  }

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      {/* Business Information */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-sm font-medium flex items-center gap-2">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="businessName"
              value={flyerData.businessName}
              onChange={(e) => onDataChange({ businessName: e.target.value })}
              placeholder="Your Business Name"
              className="border-border/50 focus:border-primary/50 bg-background/50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="locationName" className="text-sm font-medium">Location Name</Label>
            <Input
              id="locationName"
              value={flyerData.locationName}
              onChange={(e) => onDataChange({ locationName: e.target.value })}
              placeholder="Store/Location Name"
              className="border-border/50 focus:border-primary/50 bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Address
            </Label>
            <Input
              id="address"
              value={flyerData.address}
              onChange={(e) => onDataChange({ address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
              className="border-border/50 focus:border-primary/50 bg-background/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactInfo" className="text-sm font-medium">Contact Info</Label>
              <Input
                id="contactInfo"
                value={flyerData.contactInfo}
                onChange={(e) => onDataChange({ contactInfo: e.target.value })}
                placeholder="(555) 123-4567"
                className="border-border/50 focus:border-primary/50 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialHandles" className="text-sm font-medium">Social Media</Label>
              <Input
                id="socialHandles"
                value={flyerData.socialHandles}
                onChange={(e) => onDataChange({ socialHandles: e.target.value })}
                placeholder="@yourbusiness"
                className="border-border/50 focus:border-primary/50 bg-background/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content & Offers */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Content & Offers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="specialOffer" className="text-sm font-medium">Special Offer/Hook</Label>
            <Input
              id="specialOffer"
              value={flyerData.specialOffer}
              onChange={(e) => onDataChange({ specialOffer: e.target.value })}
              placeholder="Play 3 Times, Get 1 Free!"
              className="border-border/50 focus:border-primary/50 bg-background/50"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Prize Highlights</Label>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handlePrizeAdd}
                className="h-7 px-2 text-xs border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Prize
              </Button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {flyerData.prizeHighlights.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                  No prizes added yet. Click "Add Prize" to get started!
                </div>
              ) : (
                flyerData.prizeHighlights.map((prize, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <Input
                      value={prize}
                      onChange={(e) => {
                        const newPrizes = [...flyerData.prizeHighlights]
                        newPrizes[index] = e.target.value
                        onDataChange({ prizeHighlights: newPrizes })
                      }}
                      className="flex-1 text-sm border-border/50 focus:border-primary/50 bg-background/50"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePrizeRemove(index)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Customization */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            Design & Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Color Palette</Label>
            <div className="grid grid-cols-1 gap-2">
              {colorPalettes.map((palette) => (
                <div
                  key={palette.id}
                  className={`group p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    flyerData.selectedColors.id === palette.id
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 scale-102'
                      : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                  onClick={() => onDataChange({ selectedColors: palette })}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[palette.primary, palette.secondary, palette.accent].map((color, index) => (
                        <div 
                          key={index}
                          className="w-6 h-6 rounded-lg shadow-sm border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium flex-1">{palette.name}</span>
                    {flyerData.selectedColors.id === palette.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { type: 'logo' as const, label: 'Logo Upload', file: flyerData.logoFile },
              { type: 'image' as const, label: 'Custom Image', file: flyerData.customImage }
            ].map(({ type, label, file }) => (
              <div key={type} className="space-y-2">
                <Label className="text-sm font-medium">{label} (Optional)</Label>
                <label className="group flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:bg-muted/20 hover:border-primary/30 transition-all duration-200">
                  <Upload className="h-5 w-5 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground text-center px-2">
                    {file ? file.name : `Upload ${label}`}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, type)
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Generator */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5 text-primary" />
            QR Code Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QRCodeGenerator
            websiteUrl={flyerData.websiteUrl}
            onUrlChange={(url) => onDataChange({ websiteUrl: url })}
            onGenerateQR={onGenerateQR}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default FlyerForm
