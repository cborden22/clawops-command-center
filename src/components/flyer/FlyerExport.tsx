
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Share2, FileText, Image, Mail, Facebook, Instagram, MessageCircle } from 'lucide-react'
import { ExportFormat, SharePlatform, FlyerData } from '@/types/flyer'
import { toast } from 'sonner'

interface FlyerExportProps {
  flyerData: FlyerData
  onExport: (format: ExportFormat) => void
  onShare: (platform: SharePlatform) => void
}

const FlyerExport: React.FC<FlyerExportProps> = ({
  flyerData,
  onExport,
  onShare
}) => {
  const generateFileName = (format: ExportFormat) => {
    const locationName = flyerData.locationName || flyerData.businessName || 'Flyer'
    const date = new Date().toISOString().split('T')[0]
    return `Flyer_${locationName.replace(/\s+/g, '_')}_${date}.${format}`
  }

  const handleExport = (format: ExportFormat) => {
    const fileName = generateFileName(format)
    toast.success(`Exporting as ${fileName}`)
    onExport(format)
  }

  const handleShare = (platform: SharePlatform) => {
    toast.success(`Opening ${platform} share dialog`)
    onShare(platform)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export & Share
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Options */}
        <div>
          <h4 className="font-semibold mb-3">Export Options</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 h-auto py-3"
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">PDF</div>
                <div className="text-xs text-muted-foreground">Print Ready</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('png')}
              className="flex items-center gap-2 h-auto py-3"
            >
              <Image className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">PNG</div>
                <div className="text-xs text-muted-foreground">High Quality</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('jpeg')}
              className="flex items-center gap-2 h-auto py-3"
            >
              <Image className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">JPEG</div>
                <div className="text-xs text-muted-foreground">Smaller Size</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Share Options */}
        <div>
          <h4 className="font-semibold mb-3">Share Directly</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('email')}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="flex items-center gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('instagram')}
              className="flex items-center gap-2"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={() => handleExport('pdf')} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => handleShare('facebook')} className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Share Now
            </Button>
          </div>
        </div>

        {/* File Name Preview */}
        <div className="text-xs text-muted-foreground">
          File will be saved as: {generateFileName('pdf')}
        </div>
      </CardContent>
    </Card>
  )
}

export default FlyerExport
