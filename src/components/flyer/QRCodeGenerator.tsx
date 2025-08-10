
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { QrCode } from 'lucide-react'

interface QRCodeGeneratorProps {
  websiteUrl: string
  onUrlChange: (url: string) => void
  onGenerateQR: (url: string) => void
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  websiteUrl,
  onUrlChange,
  onGenerateQR
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  const generateQRCode = () => {
    if (!websiteUrl) return
    
    // Using QR Server API for offline-capable QR generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(websiteUrl)}`
    setQrCodeUrl(qrUrl)
    onGenerateQR(qrUrl)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="websiteUrl">Website/Social Media URL</Label>
        <Input
          id="websiteUrl"
          type="url"
          value={websiteUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://yourwebsite.com"
        />
      </div>
      
      <Button 
        onClick={generateQRCode}
        disabled={!websiteUrl}
        className="w-full"
        variant="outline"
      >
        <QrCode className="h-4 w-4 mr-2" />
        Generate QR Code
      </Button>

      {qrCodeUrl && (
        <div className="flex justify-center">
          <img src={qrCodeUrl} alt="Generated QR Code" className="border rounded" />
        </div>
      )}
    </div>
  )
}

export default QRCodeGenerator
