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
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Commission Summary Report</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #333;
            padding: 60px;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 60px;
          }
          .header h1 { 
            font-size: 36px;
            font-weight: 500;
            color: #333;
            margin-bottom: 12px;
          }
          .header .date { 
            color: #666;
            font-size: 18px;
            font-weight: 400;
          }
          .divider {
            height: 2px;
            background: #333;
            margin: 40px 0;
          }
          .section-title {
            font-size: 24px;
            font-weight: 500;
            color: #333;
            margin-bottom: 40px;
            margin-top: 50px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px 60px;
            margin-bottom: 40px;
          }
          .info-item {
            margin-bottom: 20px;
          }
          .info-label {
            font-weight: 600;
            color: #333;
            font-size: 16px;
            margin-bottom: 4px;
          }
          .info-value {
            color: #333;
            font-size: 16px;
            font-weight: 400;
          }
          .financial-section {
            text-align: center;
            margin-top: 60px;
          }
          .revenue-container {
            margin-bottom: 50px;
          }
          .revenue-label {
            font-size: 18px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 400;
          }
          .revenue-amount {
            font-size: 42px;
            font-weight: 600;
            color: #333;
          }
          .commission-container {
            margin-bottom: 80px;
          }
          .commission-label {
            font-size: 18px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 400;
          }
          .commission-amount {
            font-size: 42px;
            font-weight: 600;
            color: #4CAF50;
          }
          .footer-divider {
            height: 1px;
            background: #ccc;
            margin: 60px 0 30px 0;
          }
          .footer {
            text-align: center;
            font-size: 14px;
            color: #666;
            font-weight: 400;
          }
          @page {
            size: letter;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Commission Summary Report</h1>
          <div class="date">Generated on ${currentDate}</div>
        </div>

        <div class="divider"></div>

        <div class="section-title">Location Information</div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Business Name:</div>
            <div class="info-value">${locationData.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Contact Person:</div>
            <div class="info-value">${locationData.contactPerson || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Reporting Period:</div>
            <div class="info-value">${periodText}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Number of Machines:</div>
            <div class="info-value">${locationData.machineCount}</div>
          </div>
        </div>

        <div class="section-title">Financial Summary</div>

        <div class="financial-section">
          <div class="revenue-container">
            <div class="revenue-label">Total Revenue</div>
            <div class="revenue-amount">$${locationData.totalRevenue.toFixed(2)}</div>
          </div>

          <div class="commission-container">
            <div class="commission-label">Your Commission Payment</div>
            <div class="commission-amount">$${locationData.commissionAmount.toFixed(2)}</div>
          </div>
        </div>

        <div class="footer-divider"></div>
        
        <div class="footer">
          This commission summary was generated automatically by ClawOps Business Dashboard.
        </div>
      </body>
      </html>
    `

    const opt = {
      margin: 0,
      filename: `commission-summary-${locationData.name.replace(/\s+/g, '-').toLowerCase()}-${format(locationData.startDate, 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 612,
        height: 792
      },
      jsPDF: { 
        unit: 'pt', 
        format: 'letter', 
        orientation: 'portrait'
      }
    }

    const element = document.createElement('div')
    element.innerHTML = htmlContent
    element.style.width = '612pt'
    element.style.height = '792pt'
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.top = '-9999px'
    
    document.body.appendChild(element)
    
    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element)
      toast({
        title: "Commission Summary Generated",
        description: `PDF report created for ${locationData.name}`,
      })
    }).catch((error) => {
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
          Generate Commission Summary PDF
        </Button>
      </CardContent>
    </Card>
  )
}
