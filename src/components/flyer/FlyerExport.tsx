
import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2, FileText, Image, Mail, Facebook, Instagram, MessageCircle, Zap, Sparkles } from 'lucide-react'
import { ExportFormat, SharePlatform, FlyerData, FlyerTemplate } from '@/types/flyer'
import { toast } from 'sonner'
import { generatePDF } from '@/utils/pdfGenerator'

interface FlyerExportProps {
  flyerData: FlyerData
  template: FlyerTemplate
  onExport: (format: ExportFormat) => void
  onShare: (platform: SharePlatform) => void
  qrCodeUrl?: string
}

const FlyerExport: React.FC<FlyerExportProps> = ({
  flyerData,
  template,
  onExport,
  onShare,
  qrCodeUrl
}) => {
  const generateFileName = (format: ExportFormat) => {
    const locationName = flyerData.locationName || flyerData.businessName || 'Flyer'
    const date = new Date().toISOString().split('T')[0]
    return `Flyer_${locationName.replace(/\s+/g, '_')}_${date}.${format}`
  }

  const handleExport = async (format: ExportFormat) => {
    const fileName = generateFileName(format)
    
    try {
      if (format === 'pdf') {
        toast.loading('Generating PDF...', { id: 'pdf-generation' })
        await generatePDF(template, flyerData, qrCodeUrl)
        toast.success('PDF downloaded successfully!', { id: 'pdf-generation' })
      } else {
        toast.success(`Exporting as ${fileName}`)
        onExport(format)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-generation' })
    }
  }

  const handleShare = (platform: SharePlatform) => {
    toast.success(`Opening ${platform} share dialog`)
    onShare(platform)
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-4 w-4 text-primary" />
          <h4 className="font-semibold">Export Options</h4>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            className="group h-auto p-4 bg-gradient-card border-primary/20 hover:border-primary/40 hover:shadow-hover transition-all duration-300"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium">PDF Export</div>
                <div className="text-xs text-muted-foreground">High Quality • Print Ready</div>
              </div>
              <Sparkles className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport('png')}
              className="group h-auto p-3 bg-gradient-card border-primary/20 hover:border-primary/40 hover:shadow-hover transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Image className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">PNG</div>
                  <div className="text-xs text-muted-foreground">High Quality</div>
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('jpeg')}
              className="group h-auto p-3 bg-gradient-card border-primary/20 hover:border-primary/40 hover:shadow-hover transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <Image className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">JPEG</div>
                  <div className="text-xs text-muted-foreground">Smaller Size</div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Share Options */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="h-4 w-4 text-primary" />
          <h4 className="font-semibold">Share Directly</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('email')}
            className="group bg-gradient-card hover:shadow-md transition-all duration-200"
          >
            <Mail className="h-4 w-4 mr-2 text-gray-600 group-hover:text-primary transition-colors" />
            Email
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('facebook')}
            className="group bg-gradient-card hover:shadow-md transition-all duration-200"
          >
            <Facebook className="h-4 w-4 mr-2 text-blue-600 group-hover:text-blue-700 transition-colors" />
            Facebook
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('instagram')}
            className="group bg-gradient-card hover:shadow-md transition-all duration-200"
          >
            <Instagram className="h-4 w-4 mr-2 text-pink-600 group-hover:text-pink-700 transition-colors" />
            Instagram
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('whatsapp')}
            className="group bg-gradient-card hover:shadow-md transition-all duration-200"
          >
            <MessageCircle className="h-4 w-4 mr-2 text-green-600 group-hover:text-green-700 transition-colors" />
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-border/50">
        <div className="grid grid-cols-1 gap-3">
          <Button 
            onClick={() => handleExport('pdf')} 
            className="group bg-gradient-primary hover:shadow-hover transition-all duration-300"
          >
            <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
            Download PDF
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => handleShare('facebook')} 
            className="group border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
          >
            <Zap className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
            Share Now
          </Button>
        </div>
      </div>

      {/* File Name Preview */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">
            {generateFileName('pdf')}
          </span>
        </div>
      </div>
    </div>
  )
}

export default FlyerExport
