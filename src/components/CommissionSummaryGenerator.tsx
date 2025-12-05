
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Calendar as CalendarIcon, Check, ChevronsUpDown, Building2, User, DollarSign, Calculator } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import html2pdf from "html2pdf.js"

const STORAGE_KEY = "commission-saved-entries"

interface SavedEntry {
  businessName: string
  contactPerson: string
}

interface LocationData {
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
  const [locationData, setLocationData] = useState<LocationData>({
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
  
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([])
  const [businessOpen, setBusinessOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  // Load saved entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setSavedEntries(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse saved entries:", e)
      }
    }
  }, [])

  // Save entry when generating PDF
  const saveEntry = (businessName: string, contactPerson: string) => {
    if (!businessName) return
    
    const existingIndex = savedEntries.findIndex(
      entry => entry.businessName.toLowerCase() === businessName.toLowerCase()
    )
    
    let updatedEntries: SavedEntry[]
    if (existingIndex >= 0) {
      updatedEntries = [...savedEntries]
      updatedEntries[existingIndex] = { businessName, contactPerson }
    } else {
      updatedEntries = [...savedEntries, { businessName, contactPerson }]
    }
    
    setSavedEntries(updatedEntries)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries))
  }

  const selectSavedBusiness = (businessName: string) => {
    const entry = savedEntries.find(e => e.businessName === businessName)
    if (entry) {
      setLocationData(prev => ({
        ...prev,
        name: entry.businessName,
        contactPerson: entry.contactPerson
      }))
    }
    setBusinessOpen(false)
  }

  const getUniqueContacts = () => {
    return [...new Set(savedEntries.map(e => e.contactPerson).filter(Boolean))]
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

    console.log('Starting PDF generation...')
    console.log('Location data:', locationData)
    
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

    console.log('Creating PDF with options:', options)
    
    html2pdf()
      .set(options)
      .from(content)
      .save()
      .then(() => {
        console.log('PDF generated successfully')
        saveEntry(locationData.name, locationData.contactPerson)
        toast({
          title: "Commission Summary Generated",
          description: `PDF report created for ${locationData.name}`,
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

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-primary" />
          Generate Report
        </CardTitle>
        <CardDescription>
          Fill in the details below to create a commission summary PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Section 1: Location Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Location Information
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="locationName">Business Name <span className="text-destructive">*</span></Label>
              <Popover open={businessOpen} onOpenChange={setBusinessOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={businessOpen}
                    className="w-full justify-between font-normal"
                  >
                    {locationData.name || "Select or type business..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search or type new..." 
                      value={locationData.name}
                      onValueChange={(value) => setLocationData(prev => ({ ...prev, name: value }))}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm text-muted-foreground">
                          Press enter to use "{locationData.name}"
                        </div>
                      </CommandEmpty>
                      {savedEntries.length > 0 && (
                        <CommandGroup heading="Saved Businesses">
                          {savedEntries.map((entry) => (
                            <CommandItem
                              key={entry.businessName}
                              value={entry.businessName}
                              onSelect={() => selectSavedBusiness(entry.businessName)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  locationData.name === entry.businessName ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{entry.businessName}</span>
                                {entry.contactPerson && (
                                  <span className="text-xs text-muted-foreground">{entry.contactPerson}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Popover open={contactOpen} onOpenChange={setContactOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={contactOpen}
                    className="w-full justify-between font-normal"
                  >
                    {locationData.contactPerson || "Select or type contact..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search or type new..." 
                      value={locationData.contactPerson}
                      onValueChange={(value) => setLocationData(prev => ({ ...prev, contactPerson: value }))}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm text-muted-foreground">
                          Press enter to use "{locationData.contactPerson}"
                        </div>
                      </CommandEmpty>
                      {getUniqueContacts().length > 0 && (
                        <CommandGroup heading="Saved Contacts">
                          {getUniqueContacts().map((contact) => (
                            <CommandItem
                              key={contact}
                              value={contact}
                              onSelect={(value) => {
                                setLocationData(prev => ({ ...prev, contactPerson: value }))
                                setContactOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  locationData.contactPerson === contact ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {contact}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
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
