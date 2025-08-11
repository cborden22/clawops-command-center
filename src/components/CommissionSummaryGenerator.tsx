import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Calendar as CalendarIcon, DollarSign, TrendingUp } from "lucide-react"
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
        <title>Commission Summary Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: white;
            padding: 40px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
          }
          .header h1 { 
            font-size: 28px; 
            color: #1e40af; 
            margin-bottom: 8px; 
            font-weight: bold;
          }
          .header p { 
            color: #64748b; 
            font-size: 14px; 
          }
          .section { 
            margin-bottom: 30px; 
            padding: 20px; 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
          }
          .section h2 { 
            color: #1e40af; 
            font-size: 18px; 
            margin-bottom: 15px; 
            border-bottom: 1px solid #e2e8f0; 
            padding-bottom: 8px; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin-bottom: 15px; 
          }
          .info-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
          }
          .info-label { 
            font-weight: 600; 
            color: #475569; 
          }
          .info-value { 
            color: #1e293b; 
            font-weight: 500; 
          }
          .financial-summary { 
            background: #f8fafc; 
            padding: 25px; 
            border-radius: 8px; 
            text-align: center; 
          }
          .revenue-box { 
            background: white; 
            padding: 20px; 
            border-radius: 6px; 
            margin-bottom: 20px; 
            border: 1px solid #e2e8f0; 
          }
          .revenue-amount { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 5px; 
          }
          .revenue-label { 
            color: #64748b; 
            font-size: 14px; 
            font-weight: 500; 
          }
          .commission-breakdown { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-top: 20px; 
          }
          .breakdown-item { 
            background: white; 
            padding: 15px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0; 
            text-align: center; 
          }
          .breakdown-amount { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .commission-amount { 
            color: #059669; 
          }
          .operator-amount { 
            color: #dc2626; 
          }
          .breakdown-label { 
            color: #64748b; 
            font-size: 12px; 
          }
          .notes-section { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 6px; 
            border-left: 4px solid #2563eb; 
          }
          .notes-text { 
            color: #374151; 
            line-height: 1.6; 
            white-space: pre-wrap; 
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 20px; 
          }
          .summary-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          .summary-table th, .summary-table td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .summary-table th { 
            background: #f1f5f9; 
            font-weight: 600; 
            color: #334155; 
          }
          .highlight-box { 
            background: #dbeafe; 
            border: 1px solid #93c5fd; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 15px 0; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>COMMISSION SUMMARY REPORT</h1>
          <p>Generated on ${currentDate} | ClawOps Business Dashboard</p>
        </div>

        <div class="section">
          <h2>📍 Location Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Business Name:</span>
              <span class="info-value">${locationData.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contact Person:</span>
              <span class="info-value">${locationData.contactPerson || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Reporting Period:</span>
              <span class="info-value">${periodText}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Number of Machines:</span>
              <span class="info-value">${locationData.machineCount}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>💰 Financial Summary</h2>
          <div class="financial-summary">
            <div class="revenue-box">
              <div class="revenue-amount">$${locationData.totalRevenue.toFixed(2)}</div>
              <div class="revenue-label">TOTAL REVENUE GENERATED</div>
            </div>
            
            <div class="highlight-box">
              <strong>Commission Rate: ${locationData.commissionRate}%</strong>
            </div>

            <div class="commission-breakdown">
              <div class="breakdown-item">
                <div class="breakdown-amount commission-amount">$${locationData.commissionAmount.toFixed(2)}</div>
                <div class="breakdown-label">YOUR COMMISSION</div>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-amount operator-amount">$${operatorShare.toFixed(2)}</div>
                <div class="breakdown-label">OPERATOR SHARE</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>📊 Revenue Breakdown</h2>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Revenue</td>
                <td>$${locationData.totalRevenue.toFixed(2)}</td>
                <td>100%</td>
              </tr>
              <tr>
                <td>Location Commission (${locationData.commissionRate}%)</td>
                <td>$${locationData.commissionAmount.toFixed(2)}</td>
                <td>${locationData.commissionRate}%</td>
              </tr>
              <tr>
                <td>Operator Share</td>
                <td>$${operatorShare.toFixed(2)}</td>
                <td>${(100 - locationData.commissionRate)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${locationData.notes ? `
        <div class="section">
          <h2>📝 Additional Notes</h2>
          <div class="notes-section">
            <div class="notes-text">${locationData.notes}</div>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>ClawOps Business Dashboard</strong></p>
          <p>This commission summary was generated automatically. For questions or concerns, please contact our support team.</p>
          <p>Report generated: ${currentDate} | Period: ${periodText}</p>
        </div>
      </body>
      </html>
    `

    const opt = {
      margin: 0.5,
      filename: `commission-summary-${locationData.name.replace(/\s+/g, '-').toLowerCase()}-${format(locationData.startDate, 'yyyy-MM-dd')}-to-${format(locationData.endDate, 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait',
        compress: true
      }
    }

    // Create a temporary element to render the HTML
    const element = document.createElement('div')
    element.innerHTML = htmlContent
    element.style.width = '8.5in'
    element.style.minHeight = '11in'
    element.style.backgroundColor = 'white'
    
    // Temporarily add to DOM for rendering
    document.body.appendChild(element)
    
    html2pdf().set(opt).from(element).save().then(() => {
      // Remove the temporary element
      document.body.removeChild(element)
      
      toast({
        title: "Commission Summary Generated",
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
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
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
            <span className="text-sm text-muted-foreground">Commission Amount:</span>
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
