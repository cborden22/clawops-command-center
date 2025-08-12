import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import html2pdf from "html2pdf.js"

interface LocationData {
  name: string
  contactPerson: string
  totalRevenue: number
  commissionRate: number
  commissionAmount: number
  startDate: Date | undefined
  endDate: Date | undefined
  machineCount: number
  notes: string
}

export function CommissionSummaryGenerator() {
  const { toast } = useToast()
  const [locationData, setLocationData] = useState<LocationData>({
    name: "",
    contactPerson: "",
    totalRevenue: 0,
    commissionRate: 50,
    commissionAmount: 0,
    startDate: undefined,
    endDate: undefined,
    machineCount: 1,
    notes: ""
  })

  const calculateCommission = (revenue: number, rate: number) => {
    return (revenue * rate) / 100
  }

  const handleRevenueChange = (value: string) => {
    const revenue = parseFloat(value) || 0
    const commission = calculateCommission(revenue, locationData.commissionRate)
    setLocationData(prev => ({
      ...prev,
      totalRevenue: revenue,
      commissionAmount: commission
    }))
  }

  const handleRateChange = (value: string) => {
    const rate = parseFloat(value) || 0
    const commission = calculateCommission(locationData.totalRevenue, rate)
    setLocationData(prev => ({
      ...prev,
      commissionRate: rate,
      commissionAmount: commission
    }))
  }

  const getFormattedPeriod = () => {
    if (!locationData.startDate || !locationData.endDate) return ""
    return `${format(locationData.startDate, "MMM dd, yyyy")} - ${format(locationData.endDate, "MMM dd, yyyy")}`
  }

  const generatePDF = () => {
    if (!locationData.name || !locationData.startDate || !locationData.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in the location name and select both start and end dates.",
        variant: "destructive"
      })
      return
    }

    const currentDate = new Date().toLocaleDateString()
    const periodText = getFormattedPeriod()
    const operatorShare = locationData.totalRevenue - locationData.commissionAmount
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Business Summary Report</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body { 
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif; 
            line-height: 1.4; 
            color: #2d3748; 
            background: white;
            padding: 30px;
            font-size: 14px;
          }
          .container {
            max-width: 100%;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #3182ce; 
            padding-bottom: 15px; 
          }
          .header h1 { 
            font-size: 24px; 
            color: #2d3748; 
            margin-bottom: 5px; 
            font-weight: 700;
          }
          .header p { 
            color: #718096; 
            font-size: 12px; 
          }
          .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }
          .section { 
            background: #f7fafc;
            padding: 20px; 
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .section h2 { 
            color: #2d3748; 
            font-size: 16px; 
            margin-bottom: 15px; 
            font-weight: 600;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
            align-items: center;
          }
          .info-label { 
            font-weight: 500; 
            color: #4a5568; 
            font-size: 13px;
          }
          .info-value { 
            color: #2d3748; 
            font-weight: 600;
            font-size: 13px;
          }
          .financial-section {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 25px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .revenue-display { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 15px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .revenue-label { 
            font-size: 12px; 
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
          }
          .split-container { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
          }
          .split-item { 
            background: rgba(255,255,255,0.15); 
            padding: 15px; 
            border-radius: 8px;
            backdrop-filter: blur(10px);
          }
          .split-amount { 
            font-size: 18px; 
            font-weight: 600; 
            margin-bottom: 5px; 
          }
          .split-label { 
            font-size: 11px; 
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .notes-section { 
            grid-column: 1 / -1;
            background: #fffbf0;
            padding: 20px; 
            border-radius: 8px;
            border-left: 4px solid #ed8936;
            margin-top: 15px;
          }
          .notes-section h3 {
            color: #2d3748;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .notes-text { 
            color: #4a5568; 
            line-height: 1.6; 
            white-space: pre-wrap;
            font-size: 13px;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 11px; 
            color: #a0aec0; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 15px; 
          }
          .footer strong {
            color: #4a5568;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BUSINESS SUMMARY REPORT</h1>
            <p>Generated on ${currentDate} | ClawOps Business Dashboard</p>
          </div>

          <div class="content">
            <div class="section">
              <h2>📍 Location Details</h2>
              <div class="info-row">
                <span class="info-label">Business Name:</span>
                <span class="info-value">${locationData.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact Person:</span>
                <span class="info-value">${locationData.contactPerson || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Number of Machines:</span>
                <span class="info-value">${locationData.machineCount}</span>
              </div>
            </div>

            <div class="section">
              <h2>📅 Reporting Period</h2>
              <div class="info-row">
                <span class="info-label">Period:</span>
                <span class="info-value">${periodText}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Report Date:</span>
                <span class="info-value">${currentDate}</span>
              </div>
            </div>
          </div>

          <div class="financial-section">
            <div class="revenue-display">$${locationData.totalRevenue.toFixed(2)}</div>
            <div class="revenue-label">Total Revenue Generated</div>
            
            <div class="split-container">
              <div class="split-item">
                <div class="split-amount">$${locationData.commissionAmount.toFixed(2)}</div>
                <div class="split-label">Location Earnings</div>
              </div>
              <div class="split-item">
                <div class="split-amount">$${operatorShare.toFixed(2)}</div>
                <div class="split-label">Operator Share</div>
              </div>
            </div>
          </div>

          ${locationData.notes ? `
          <div class="notes-section">
            <h3>📝 Additional Notes</h3>
            <div class="notes-text">${locationData.notes}</div>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>ClawOps Business Dashboard</strong></p>
            <p>This business summary was generated automatically. For questions or concerns, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const opt = {
      margin: 0.4,
      filename: `business-summary-${locationData.name.replace(/\s+/g, '-').toLowerCase()}-${format(locationData.startDate, 'yyyy-MM-dd')}-to-${format(locationData.endDate, 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 1.5, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: 792,
        width: 612
      },
      jsPDF: { 
        unit: 'pt', 
        format: 'letter', 
        orientation: 'portrait',
        compress: true
      }
    }

    // Create a temporary element to render the HTML
    const element = document.createElement('div')
    element.innerHTML = htmlContent
    element.style.width = '612pt'
    element.style.backgroundColor = 'white'
    
    // Temporarily add to DOM for rendering
    document.body.appendChild(element)
    
    html2pdf().set(opt).from(element).save().then(() => {
      // Remove the temporary element
      document.body.removeChild(element)
      
      toast({
        title: "Business Summary Generated",
        description: `Professional PDF report created for ${locationData.name}`,
      })
    }).catch((error) => {
      // Remove the temporary element on error too
      document.body.removeChild(element)
      
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      })
      console.error('PDF generation error:', error)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Commission Summary Generator
        </CardTitle>
        <CardDescription>
          Generate professional commission reports for your partner locations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="locationName">Business Name *</Label>
            <Input
              id="locationName"
              placeholder="Enter business name"
              value={locationData.name}
              onChange={(e) => setLocationData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              placeholder="Enter contact name"
              value={locationData.contactPerson}
              onChange={(e) => setLocationData(prev => ({ ...prev, contactPerson: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !locationData.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {locationData.startDate ? format(locationData.startDate, "PPP") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={locationData.startDate}
                  onSelect={(date) => setLocationData(prev => ({ ...prev, startDate: date }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !locationData.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {locationData.endDate ? format(locationData.endDate, "PPP") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={locationData.endDate}
                  onSelect={(date) => setLocationData(prev => ({ ...prev, endDate: date }))}
                  disabled={(date) => locationData.startDate ? date < locationData.startDate : false}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="machineCount">Number of Machines</Label>
          <Input
            id="machineCount"
            type="number"
            min="1"
            value={locationData.machineCount}
            onChange={(e) => setLocationData(prev => ({ ...prev, machineCount: parseInt(e.target.value) || 1 }))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="totalRevenue">Total Revenue ($)</Label>
            <Input
              id="totalRevenue"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={locationData.totalRevenue || ""}
              onChange={(e) => handleRevenueChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Split Rate (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              step="1"
              value={locationData.commissionRate}
              onChange={(e) => handleRateChange(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Location Earnings:</span>
            <span className="text-lg font-bold text-primary">
              ${locationData.commissionAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional information or notes for this location..."
            value={locationData.notes}
            onChange={(e) => setLocationData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <Button 
          onClick={generatePDF}
          className="w-full"
          disabled={!locationData.name || !locationData.startDate || !locationData.endDate}
        >
          <Download className="h-4 w-4 mr-2" />
          Generate Business Summary PDF
        </Button>
      </CardContent>
    </Card>
  )
}
