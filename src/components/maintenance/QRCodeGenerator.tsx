import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Printer, Copy, Check, QrCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId: string;
  machineName: string;
  locationName: string;
}

export function QRCodeGenerator({
  open,
  onOpenChange,
  machineId,
  machineName,
  locationName,
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Always use the published URL for customer-facing QR codes
  const reportUrl = `https://clawops-command-center.lovable.app/m/${machineId}`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    // Create a canvas and draw the SVG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 300);

        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-${machineName.replace(/\s+/g, "-").toLowerCase()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        toast({
          title: "QR Code Downloaded",
          description: "The QR code image has been saved.",
        });
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Pop-up Blocked",
        description: "Please allow pop-ups to print the QR code.",
        variant: "destructive",
      });
      return;
    }

    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Sticker - ${machineName}</title>
          <style>
            @page {
              size: 3.5in 2in;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              width: 3.5in;
              height: 2in;
              margin: 0;
              padding: 0.15in;
              display: flex;
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            .left-column {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding-right: 0.15in;
            }
            .right-column {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            h1 {
              font-size: 13px;
              font-weight: 700;
              margin-bottom: 2px;
              color: #000;
            }
            .subtitle {
              font-size: 9px;
              color: #666;
              margin-bottom: 10px;
            }
            .steps {
              font-size: 9px;
              line-height: 1.5;
              color: #333;
            }
            .step {
              margin-bottom: 2px;
            }
            .branding {
              font-size: 8px;
              color: #999;
              margin-top: auto;
              padding-top: 8px;
            }
            .qr-code svg {
              width: 1.25in;
              height: 1.25in;
            }
            .machine-info {
              text-align: center;
              margin-top: 4px;
            }
            .machine-name {
              font-size: 8px;
              font-weight: 600;
              color: #000;
            }
            .location-name {
              font-size: 7px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="left-column">
            <h1>HAVING TROUBLE?</h1>
            <p class="subtitle">Scan to report an issue</p>
            <div class="steps">
              <div class="step">1. Open your camera</div>
              <div class="step">2. Point at the QR code</div>
              <div class="step">3. Tap the link</div>
            </div>
            <div class="branding">ClawOps</div>
          </div>
          <div class="right-column">
            <div class="qr-code">${svgData}</div>
            <div class="machine-info">
              <div class="machine-name">${machineName}</div>
              <div class="location-name">${locationName}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "The report link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy the link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            QR Code
          </DialogTitle>
          <DialogDescription>
            Customers can scan this to report issues with {machineName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code Display */}
          <div
            ref={qrRef}
            className="flex justify-center p-6 bg-white rounded-xl border"
          >
            <QRCodeSVG
              value={reportUrl}
              size={200}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          {/* Machine Info */}
          <div className="text-center space-y-1">
            <p className="font-medium">{machineName}</p>
            <p className="text-sm text-muted-foreground">{locationName}</p>
          </div>

          {/* URL Display */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Report URL</Label>
            <div className="flex gap-2">
              <Input
                value={reportUrl}
                readOnly
                className="text-xs bg-muted/30"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
