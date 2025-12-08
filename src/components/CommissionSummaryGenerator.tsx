import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Calendar as CalendarIcon, Building2, User, DollarSign, Calculator, MapPin, AlertCircle } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import html2pdf from "html2pdf.js"
import { useLocations } from "@/hooks/useLocationsDB"
import { addRevenueExpense } from "@/hooks/useRevenueEntriesDB"
import { useAuth } from "@/contexts/AuthContext"
import { Link } from "react-router-dom"

interface LocationData {
  locationId: string
  name: string
  contactPerson: string
  totalRevenue: number
  commissionPercentage: number
  commissionAmount: number
  startDate: Date | undefined
  endDate: Date | undefined
  machineCount: number
  notes: string
}

export function CommissionSummaryGenerator() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { activeLocations, getLocationById, isLoaded, addCommissionSummary } = useLocations()
  const [locationData, setLocationData] = useState<LocationData>({
    locationId: "",
    name: "",
    contactPerson: "",
    totalRevenue: 0,
    commissionPercentage: 0,
    commissionAmount: 0,
    startDate: undefined,
    endDate: undefined,
    machineCount: 1,
    notes: ""
  })

  // When a location is selected, populate the form fields
  const handleLocationSelect = (locationId: string) => {
    const location = getLocationById(locationId)
    if (location) {
      setLocationData(prev => ({
        ...prev,
        locationId: location.id,
        name: location.name,
        contactPerson: location.contactPerson,
        machineCount: location.machineCount,
        commissionPercentage: location.commissionRate,
        commissionAmount: (prev.totalRevenue * location.commissionRate) / 100
      }))
    }
  }

  const updateCommissionFromPercentage = (revenue: number, percentage: number) => {
    const calculatedAmount = (revenue * percentage) / 100
    setLocationData(prev => ({ 
      ...prev, 
      totalRevenue: revenue,
      commissionPercentage: percentage,
      commissionAmount: calculatedAmount 
    }))
  }

  // Quick date presets
  const setLastWeek = () => {
    const today = new Date()
    setLocationData(prev => ({
      ...prev,
      startDate: subDays(today, 7),
      endDate: today
    }))
  }

  const setLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1)
    setLocationData(prev => ({
      ...prev,
      startDate: startOfMonth(lastMonth),
      endDate: endOfMonth(lastMonth)
    }))
  }

  const setThisMonth = () => {
    const today = new Date()
    setLocationData(prev => ({
      ...prev,
      startDate: startOfMonth(today),
      endDate: today
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
    
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
          <h1 style="font-size: 28px; margin: 0; color: #1f2937; font-weight: bold;">COMMISSION SUMMARY</h1>
          <p style="color: #6b7280; margin: 10px 0; font-size: 14px;">Generated on ${currentDate}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin: 0 0 20px 0; color: #374151; font-weight: 600;">Location Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; width: 40%; border-bottom: 1px solid #f3f4f6;">Business Name:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${locationData.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Contact Person:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${locationData.contactPerson || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Period:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${periodText}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151;">Number of Machines:</td>
              <td style="padding: 12px 0; color: #1f2937;">${locationData.machineCount}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 40px 0; padding: 30px; background: #f9fafb; border-radius: 8px;">
          <div style="margin-bottom: 25px;">
            <p style="color: #6b7280; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">TOTAL REVENUE</p>
            <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #1f2937;">$${locationData.totalRevenue.toFixed(2)}</p>
          </div>

          <div style="background: #dcfce7; padding: 25px; border-radius: 8px; border: 2px solid #22c55e;">
            <p style="color: #15803d; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">COMMISSION PAYMENT</p>
            <p style="font-size: 36px; font-weight: bold; margin: 15px 0; color: #15803d;">$${locationData.commissionAmount.toFixed(2)}</p>
          </div>
        </div>

        ${locationData.notes ? `
        <div style="margin: 30px 0;">
          <h3 style="font-size: 16px; color: #374151; margin: 0 0 15px 0; font-weight: 600;">Additional Notes</h3>
          <div style="color: #4b5563; line-height: 1.6; margin: 0; padding: 20px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #e5e7eb;">${locationData.notes}</div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This commission summary was generated by ClawOps Business Dashboard
          </p>
        </div>
      </div>
    `

    const filename = `commission-summary-${locationData.name.replace(/\s+/g, '-').toLowerCase()}-${format(locationData.startDate, 'yyyy-MM-dd')}.pdf`
    
    const options = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' 
      }
    }
    
    html2pdf()
      .set(options)
      .from(content)
      .save()
      .then(() => {
        // Save commission summary to location if a location was selected
        if (locationData.locationId && locationData.startDate && locationData.endDate) {
          addCommissionSummary(locationData.locationId, {
            startDate: locationData.startDate.toISOString(),
            endDate: locationData.endDate.toISOString(),
            totalRevenue: locationData.totalRevenue,
            commissionPercentage: locationData.commissionPercentage,
            commissionAmount: locationData.commissionAmount,
            machineCount: locationData.machineCount,
            notes: locationData.notes,
          })
        }
        
        // Automatically log the commission as an expense in Revenue Tracker
        // Works whether location is selected or manually entered
        if (user && locationData.commissionAmount > 0 && locationData.startDate && locationData.endDate) {
          addRevenueExpense(
            user.id,
            locationData.locationId || "manual",
            locationData.commissionAmount,
            "Commission Payout",
            `Commission for ${locationData.name} (${periodText})`,
            locationData.endDate
          )
        }
        
        toast({
          title: "Commission Summary Generated",
          description: `PDF created for ${locationData.name} - commission logged as expense`,
        })
      })
      .catch((error) => {
        console.error('PDF generation error:', error)
        toast({
          title: "PDF Generation Failed",
          description: "There was an error generating the PDF. Please try again.",
          variant: "destructive"
        })
      })
  }

  const isFormValid = locationData.name && locationData.startDate && locationData.endDate

  if (!isLoaded) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-primary" />
          Generate Report
        </CardTitle>
        <CardDescription>
          Select a location or fill in details manually to create a commission summary PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Quick Location Select */}
        {activeLocations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Quick Select from Saved Locations
            </div>
            <Select value={locationData.locationId} onValueChange={handleLocationSelect}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a location to auto-fill details..." />
              </SelectTrigger>
              <SelectContent>
                {activeLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {loc.name}
                      {loc.commissionRate > 0 && (
                        <span className="text-xs text-muted-foreground">({loc.commissionRate}%)</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {activeLocations.length === 0 && (
          <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">No saved locations</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add locations in the Location Tracker to quickly fill in details, or enter them manually below.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/locations">Go to Locations</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-border" />
        
        {/* Section 1: Location Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Location Information
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="locationName">Business Name <span className="text-destructive">*</span></Label>
              <Input
                id="locationName"
                placeholder="Enter business name..."
                value={locationData.name}
                onChange={(e) => setLocationData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                placeholder="Enter contact person..."
                value={locationData.contactPerson}
                onChange={(e) => setLocationData(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="machineCount">Number of Machines</Label>
            <Input
              id="machineCount"
              type="number"
              min="1"
              className="md:w-1/4"
              value={locationData.machineCount}
              onChange={(e) => setLocationData(prev => ({ ...prev, machineCount: parseInt(e.target.value) || 1 }))}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Section 2: Report Period */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            Report Period
          </div>
          
          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={setLastWeek}>
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={setThisMonth}>
              This Month
            </Button>
            <Button variant="outline" size="sm" onClick={setLastMonth}>
              Last Month
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date <span className="text-destructive">*</span></Label>
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
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
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
              <Label>End Date <span className="text-destructive">*</span></Label>
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
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
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
        </div>

        <div className="border-t border-border" />

        {/* Section 3: Financial Data */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Financial Details
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
                onChange={(e) => updateCommissionFromPercentage(parseFloat(e.target.value) || 0, locationData.commissionPercentage)}
              />
              <p className="text-xs text-muted-foreground">Total machine revenue for the period</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionPercentage">Commission Rate (%)</Label>
              <Input
                id="commissionPercentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0.0"
                value={locationData.commissionPercentage || ""}
                onChange={(e) => updateCommissionFromPercentage(locationData.totalRevenue, parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Location's share of revenue</p>
            </div>
          </div>

          {/* Live Commission Preview */}
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commission to Pay</p>
                  <p className="text-xs text-muted-foreground">
                    {locationData.commissionPercentage > 0 
                      ? `${locationData.commissionPercentage}% of $${locationData.totalRevenue.toFixed(2)}`
                      : "Enter revenue and rate above"
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  ${locationData.commissionAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Section 4: Notes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="h-4 w-4" />
            Additional Notes
          </div>
          <Textarea
            id="notes"
            placeholder="Add any additional information or notes for this report..."
            value={locationData.notes}
            onChange={(e) => setLocationData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generatePDF}
          className="w-full h-12 text-base"
          disabled={!isFormValid}
        >
          <Download className="h-5 w-5 mr-2" />
          Generate Commission Summary PDF
        </Button>
      </CardContent>
    </Card>
  )
}
