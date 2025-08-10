
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Upload, X, Palette, QrCode } from 'lucide-react'
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
    <div className="space-y-6">
      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={flyerData.businessName}
              onChange={(e) => onDataChange({ businessName: e.target.value })}
              placeholder="Your Business Name"
            />
          </div>
          
          <div>
            <Label htmlFor="locationName">Location Name</Label>
            <Input
              id="locationName"
              value={flyerData.locationName}
              onChange={(e) => onDataChange({ locationName: e.target.value })}
              placeholder="Store/Location Name"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={flyerData.address}
              onChange={(e) => onDataChange({ address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div>
            <Label htmlFor="contactInfo">Contact Info</Label>
            <Input
              id="contactInfo"
              value={flyerData.contactInfo}
              onChange={(e) => onDataChange({ contactInfo: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="socialHandles">Social Media</Label>
            <Input
              id="socialHandles"
              value={flyerData.socialHandles}
              onChange={(e) => onDataChange({ socialHandles: e.target.value })}
              placeholder="@yourbusiness"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content & Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Content & Offers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="specialOffer">Special Offer/Hook</Label>
            <Input
              id="specialOffer"
              value={flyerData.specialOffer}
              onChange={(e) => onDataChange({ specialOffer: e.target.value })}
              placeholder="Play 3 Times, Get 1 Free!"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Prize Highlights</Label>
              <Button size="sm" variant="outline" onClick={handlePrizeAdd}>
                Add Prize
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {flyerData.prizeHighlights.map((prize, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={prize}
                    onChange={(e) => {
                      const newPrizes = [...flyerData.prizeHighlights]
                      newPrizes[index] = e.target.value
                      onDataChange({ prizeHighlights: newPrizes })
                    }}
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePrizeRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Design & Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Color Palette</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {colorPalettes.map((palette) => (
                <div
                  key={palette.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    flyerData.selectedColors.id === palette.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onDataChange({ selectedColors: palette })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: palette.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: palette.secondary }}
                      />
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: palette.accent }}
                      />
                    </div>
                    <span className="text-sm font-medium">{palette.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Logo Upload (Optional)</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {flyerData.logoFile ? flyerData.logoFile.name : 'Upload Logo'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'logo')
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <Label>Custom Image (Optional)</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {flyerData.customImage ? flyerData.customImage.name : 'Upload Image'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'image')
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
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
