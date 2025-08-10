
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      case '8.5x11': return 'aspect-[8.5/11] max-h-96'
      case '11x17': return 'aspect-[11/17] max-h-96'
      case 'square': return 'aspect-square max-h-80'
      case 'story': return 'aspect-[9/16] max-h-96'
      default: return 'aspect-[8.5/11] max-h-96'
    }
  }

  const previewStyle = {
    background: `linear-gradient(135deg, ${flyerData.selectedColors.primary}, ${flyerData.selectedColors.secondary})`,
    color: flyerData.selectedColors.background === 'hsl(240, 10%, 10%)' ? 'white' : 'black'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`w-full ${getPreviewSize(template.size)} rounded-lg overflow-hidden`}>
          <div 
            className="w-full h-full p-6 flex flex-col justify-between relative"
            style={previewStyle}
          >
            {/* Header Section */}
            <div className="text-center">
              {flyerData.businessName && (
                <h1 className="text-2xl font-bold mb-2" style={{ color: flyerData.selectedColors.accent }}>
                  {flyerData.businessName}
                </h1>
              )}
              {flyerData.locationName && (
                <h2 className="text-lg font-semibold mb-1">{flyerData.locationName}</h2>
              )}
              {flyerData.specialOffer && (
                <div 
                  className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-4"
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
              <div className="flex-1 my-4">
                <h3 className="text-lg font-semibold mb-2 text-center">Win Amazing Prizes!</h3>
                <div className="grid grid-cols-1 gap-1 text-sm">
                  {flyerData.prizeHighlights.slice(0, 4).map((prize, index) => (
                    <div key={index} className="flex items-center">
                      <span className="mr-2">🎁</span>
                      <span>{prize}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Section */}
            <div className="text-center text-sm space-y-1">
              {flyerData.address && <p>📍 {flyerData.address}</p>}
              {flyerData.contactInfo && <p>📞 {flyerData.contactInfo}</p>}
              {flyerData.socialHandles && <p>📱 {flyerData.socialHandles}</p>}
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="absolute bottom-4 right-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 bg-white p-1 rounded" />
              </div>
            )}

            {/* Decorative Elements */}
            <div className="absolute top-2 right-2 opacity-20">
              <div className="text-4xl">🎪</div>
            </div>
            <div className="absolute bottom-2 left-2 opacity-20">
              <div className="text-3xl">🎯</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FlyerPreview
