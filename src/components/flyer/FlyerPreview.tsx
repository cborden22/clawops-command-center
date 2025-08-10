
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Maximize2 } from 'lucide-react'
import { FlyerTemplate, FlyerData } from '@/types/flyer'

interface FlyerPreviewProps {
  template: FlyerTemplate
  flyerData: FlyerData
  qrCodeUrl?: string
}

const FlyerPreview: React.FC<FlyerPreviewProps> = ({
  template,
  flyerData,
  qrCodeUrl
}) => {
  const getPreviewSize = (size: string) => {
    switch (size) {
      case '8.5x11': return 'aspect-[8.5/11] max-h-80'
      case '11x17': return 'aspect-[11/17] max-h-80'
      case 'square': return 'aspect-square max-h-72'
      case 'story': return 'aspect-[9/16] max-h-80'
      default: return 'aspect-[8.5/11] max-h-80'
    }
  }

  const previewStyle = {
    background: `linear-gradient(135deg, ${flyerData.selectedColors.primary}, ${flyerData.selectedColors.secondary})`,
    color: flyerData.selectedColors.background === 'hsl(240, 10%, 10%)' ? 'white' : 'black'
  }

  return (
    <div className="space-y-4">
      {/* Preview Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {template.size}
          </Badge>
          <button className="p-1 hover:bg-accent rounded">
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="relative">
        {/* Preview Card */}
        <div className={`w-full ${getPreviewSize(template.size)} rounded-xl overflow-hidden shadow-xl border-2 border-border/20`}>
          <div 
            className="w-full h-full p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden"
            style={previewStyle}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 text-6xl">🎪</div>
              <div className="absolute bottom-4 left-4 text-4xl">🎯</div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5">🎮</div>
            </div>

            {/* Content Layers */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Header Section */}
              <div className="text-center mb-4">
                {flyerData.businessName && (
                  <h1 
                    className="text-xl sm:text-3xl font-bold mb-2 drop-shadow-lg" 
                    style={{ color: flyerData.selectedColors.accent }}
                  >
                    {flyerData.businessName}
                  </h1>
                )}
                {flyerData.locationName && (
                  <h2 className="text-sm sm:text-lg font-semibold mb-2 opacity-90">
                    {flyerData.locationName}
                  </h2>
                )}
                {flyerData.specialOffer && (
                  <div 
                    className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-bold mb-3 shadow-lg"
                    style={{ 
                      backgroundColor: flyerData.selectedColors.accent,
                      color: flyerData.selectedColors.background 
                    }}
                  >
                    {flyerData.specialOffer}
                  </div>
                )}
              </div>

              {/* Prize Section */}
              {flyerData.prizeHighlights.length > 0 && (
                <div className="flex-1 my-2 sm:my-4">
                  <h3 className="text-sm sm:text-lg font-semibold mb-2 text-center drop-shadow">
                    🏆 Win Amazing Prizes! 🏆
                  </h3>
                  <div className="grid grid-cols-1 gap-1 text-xs sm:text-sm">
                    {flyerData.prizeHighlights.slice(0, 4).map((prize, index) => (
                      <div key={index} className="flex items-center bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                        <span className="mr-2 text-sm">🎁</span>
                        <span className="truncate">{prize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Section */}
              <div className="text-center text-xs sm:text-sm space-y-1 mt-auto">
                {flyerData.address && (
                  <p className="flex items-center justify-center gap-1 bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                    <span>📍</span>
                    <span className="truncate">{flyerData.address}</span>
                  </p>
                )}
                {flyerData.contactInfo && (
                  <p className="flex items-center justify-center gap-1 bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                    <span>📞</span>
                    <span>{flyerData.contactInfo}</span>
                  </p>
                )}
                {flyerData.socialHandles && (
                  <p className="flex items-center justify-center gap-1 bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                    <span>📱</span>
                    <span>{flyerData.socialHandles}</span>
                  </p>
                )}
              </div>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4">
                <div className="bg-white p-1 rounded-lg shadow-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Glow Effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl scale-105 opacity-50"></div>
      </div>

      {/* Preview Stats */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-full text-xs text-muted-foreground">
          <span>✨ Real-time preview</span>
          <span>•</span>
          <span>📱 Mobile optimized</span>
        </div>
      </div>
    </div>
  )
}

export default FlyerPreview
