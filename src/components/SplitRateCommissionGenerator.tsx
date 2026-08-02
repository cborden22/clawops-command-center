import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  FileText, Download, Calendar as CalendarIcon, Building2, User, DollarSign,
  Calculator, MapPin, AlertCircle, Plus, Trash2,
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { generatePDFFromHTML } from "@/utils/pdfGenerator"
import { sanitizeForHTML } from "@/utils/htmlSanitize"
import { useLocations } from "@/hooks/useLocationsDB"
import { addRevenueExpense } from "@/hooks/useRevenueEntriesDB"
import { useAuth } from "@/contexts/AuthContext"
import { Link } from "react-router-dom"

interface MachineRow {
  id: string
  name: string
  revenue: number
  rate: number
}

const newRow = (name = "", rate = 0): MachineRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  revenue: 0,
  rate,
})

export function SplitRateCommissionGenerator() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { activeLocations, getLocationById, isLoaded, addCommissionSummary } = useLocations()

  const [showRevenue, setShowRevenue] = useState(true)
  const [locationId, setLocationId] = useState("")
  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [notes, setNotes] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [rows, setRows] = useState<MachineRow[]>([newRow()])

  const handleLocationSelect = (id: string) => {
    const location = getLocationById(id)
    if (!location) return
    setLocationId(location.id)
    setName(location.name)
    setContactPerson(location.contactPerson)

    const seeded: MachineRow[] = []
    location.machines.forEach((m) => {
      const count = Math.max(1, m.count || 1)
      for (let i = 0; i < count; i++) {
        const label = m.customLabel || m.label
        seeded.push(newRow(count > 1 ? `${label} #${i + 1}` : label, location.commissionRate || 0))
      }
    })
    setRows(seeded.length > 0 ? seeded : [newRow("", location.commissionRate || 0)])
  }

  const updateRow = (id: string, patch: Partial<MachineRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }

  const rowCommission = (r: MachineRow) => (r.revenue * r.rate) / 100
  const totalRevenue = rows.reduce((sum, r) => sum + (r.revenue || 0), 0)
  const totalCommission = rows.reduce((sum, r) => sum + rowCommission(r), 0)
  const blendedRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0

  const setLastWeek = () => {
    const today = new Date()
    setStartDate(subDays(today, 7))
    setEndDate(today)
  }
  const setThisMonth = () => {
    const today = new Date()
    setStartDate(startOfMonth(today))
    setEndDate(endOfMonth(today))
  }
  const setLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1)
    setStartDate(startOfMonth(lastMonth))
    setEndDate(endOfMonth(lastMonth))
  }

  const getFormattedPeriod = () => {
    if (!startDate || !endDate) return ""
    return `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`
  }

  const isFormValid = !!name && !!startDate && !!endDate && totalCommission > 0

  const generatePDF = async () => {
    if (!name || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in the location name and select both start and end dates.",
        variant: "destructive",
      })
      return
    }

    const currentDate = new Date().toLocaleDateString()
    const periodText = getFormattedPeriod()
    const safeName = sanitizeForHTML(name)
    const safeContactPerson = sanitizeForHTML(contactPerson)
    const safeNotes = sanitizeForHTML(notes)

    const breakdownRows = rows
      .filter((r) => r.revenue > 0 || r.rate > 0)
      .map((r) => {
        const label = sanitizeForHTML(r.name || "Machine")
        return `
          <tr>
            <td style="padding: 10px 8px; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${label}</td>
            ${showRevenue ? `<td style="padding: 10px 8px; color: #1f2937; text-align: right; border-bottom: 1px solid #f3f4f6;">$${r.revenue.toFixed(2)}</td>` : ""}
            <td style="padding: 10px 8px; color: #1f2937; text-align: right; border-bottom: 1px solid #f3f4f6;">${r.rate}%</td>
            <td style="padding: 10px 8px; color: #1f2937; text-align: right; font-weight: 600; border-bottom: 1px solid #f3f4f6;">$${rowCommission(r).toFixed(2)}</td>
          </tr>`
      })
      .join("")

    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
          <h1 style="font-size: 28px; margin: 0; color: #1f2937; font-weight: bold;">COMMISSION SUMMARY</h1>
          <p style="color: #6b7280; margin: 10px 0; font-size: 14px;">Generated on ${currentDate}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin: 0 0 20px 0; color: #374151; font-weight: 600;">Location Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; width: 40%; border-bottom: 1px solid #f3f4f6;">Business Name:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Contact Person:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${safeContactPerson || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Period:</td>
              <td style="padding: 12px 0; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${periodText}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151;">Number of Machines:</td>
              <td style="padding: 12px 0; color: #1f2937;">${rows.length}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #374151; font-weight: 600;">Commission Breakdown by Machine</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px 8px; text-align: left; color: #374151; border-bottom: 2px solid #e5e7eb;">Machine</th>
                ${showRevenue ? `<th style="padding: 10px 8px; text-align: right; color: #374151; border-bottom: 2px solid #e5e7eb;">Revenue</th>` : ""}
                <th style="padding: 10px 8px; text-align: right; color: #374151; border-bottom: 2px solid #e5e7eb;">Rate</th>
                <th style="padding: 10px 8px; text-align: right; color: #374151; border-bottom: 2px solid #e5e7eb;">Commission</th>
              </tr>
            </thead>
            <tbody>${breakdownRows}</tbody>
            <tfoot>
              <tr>
                <td style="padding: 12px 8px; font-weight: 700; color: #1f2937;">Totals</td>
                ${showRevenue ? `<td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #1f2937;">$${totalRevenue.toFixed(2)}</td>` : ""}
                <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #1f2937;">${showRevenue ? `${blendedRate.toFixed(1)}%` : "&mdash;"}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #1f2937;">$${totalCommission.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <div style="background: #dcfce7; padding: 30px; border-radius: 12px; border: 2px solid #22c55e;">
            <p style="color: #15803d; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">TOTAL COMMISSION PAYMENT</p>
            <p style="font-size: 40px; font-weight: bold; margin: 0 0 10px 0; color: #15803d;">$${totalCommission.toFixed(2)}</p>
            <p style="color: #16a34a; margin: 0; font-size: 14px;">For the period ${periodText}</p>
          </div>
        </div>

        ${safeNotes ? `
        <div style="margin: 30px 0;">
          <h3 style="font-size: 16px; color: #374151; margin: 0 0 15px 0; font-weight: 600;">Additional Notes</h3>
          <div style="color: #4b5563; line-height: 1.6; margin: 0; padding: 20px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #e5e7eb;">${safeNotes}</div>
        </div>
        ` : ""}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This commission summary was generated by ClawOps Business Dashboard
          </p>
        </div>
      </div>
    `

    const filename = `commission-summary-split-${name.replace(/\s+/g, "-").toLowerCase()}-${format(startDate, "yyyy-MM-dd")}.pdf`

    try {
      await generatePDFFromHTML(content, {
        filename,
        margin: 12,
        format: "letter",
        orientation: "portrait",
      })

      const breakdownNote = rows
        .filter((r) => r.revenue > 0 || r.rate > 0)
        .map((r) => `${r.name || "Machine"}: $${r.revenue.toFixed(2)} @ ${r.rate}% = $${rowCommission(r).toFixed(2)}`)
        .join("; ")
      const combinedNotes = [notes, breakdownNote ? `Breakdown — ${breakdownNote}` : ""]
        .filter(Boolean)
        .join("\n")

      let savedToLocation = false
      if (locationId) {
        const result = await addCommissionSummary(locationId, {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          totalRevenue,
          commissionPercentage: Number(blendedRate.toFixed(2)),
          commissionAmount: totalCommission,
          machineCount: rows.length,
          notes: combinedNotes,
          commissionPaid: false,
          commissionPaidAt: null,
        })
        savedToLocation = !!result
      }

      if (user && totalCommission > 0) {
        await addRevenueExpense(
          user.id,
          locationId || "manual",
          totalCommission,
          "Commission Payout",
          `Commission for ${name} (${periodText})`,
          endDate
        )
      }

      toast({
        title: "Split-Rate Summary Generated",
        description: savedToLocation
          ? `PDF created for ${name} - saved to location and logged as expense`
          : `PDF created for ${name} - logged as expense`,
      })
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-primary" />
          Split-Rate Report
        </CardTitle>
        <CardDescription>
          For locations that pay a different percentage per machine — set the rate on each machine individually
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {activeLocations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Quick Select from Saved Locations
            </div>
            <Select value={locationId} onValueChange={handleLocationSelect}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a location to load its machines..." />
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
                  Add locations in the Location Tracker to load machines automatically, or add rows manually below.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/locations">Go to Locations</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        {/* Location Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Location Information
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="splitLocationName">Business Name <span className="text-destructive">*</span></Label>
              <Input
                id="splitLocationName"
                placeholder="Enter business name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="splitContactPerson">Contact Person</Label>
              <Input
                id="splitContactPerson"
                placeholder="Enter contact person..."
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Report Period */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            Report Period
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={setLastWeek}>Last 7 Days</Button>
            <Button variant="outline" size="sm" onClick={setThisMonth}>This Month</Button>
            <Button variant="outline" size="sm" onClick={setLastMonth}>Last Month</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
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
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => (startDate ? date < startDate : false)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Machine rows */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Revenue &amp; Rate per Machine
            </div>
            <Button variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, newRow()])}>
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </div>

          {/* Header (desktop) */}
          <div className="hidden md:grid grid-cols-[1fr_130px_100px_110px_40px] gap-3 px-1 text-xs font-medium text-muted-foreground">
            <span>Machine</span>
            <span>Revenue ($)</span>
            <span>Rate (%)</span>
            <span className="text-right">Commission</span>
            <span />
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_130px_100px_110px_40px] gap-3 items-center rounded-lg border border-border/60 p-3 md:border-0 md:p-0"
              >
                <Input
                  placeholder="Machine name (e.g. Boxing Machine)"
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <div className="grid grid-cols-2 gap-3 md:contents">
                  <NumberInput
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={row.revenue || ""}
                    onChange={(e) => updateRow(row.id, { revenue: parseFloat(e.target.value) || 0 })}
                  />
                  <NumberInput
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={row.rate || ""}
                    onChange={(e) => updateRow(row.id, { rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <p className="text-right font-semibold tabular-nums text-primary">
                  ${rowCommission(row).toFixed(2)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="justify-self-end text-muted-foreground hover:text-destructive"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  aria-label="Remove machine row"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="splitShowRevenue">Show revenue on PDF</Label>
              <p className="text-xs text-muted-foreground">
                When disabled, the PDF shows machines, rates and commissions only
              </p>
            </div>
            <Switch id="splitShowRevenue" checked={showRevenue} onCheckedChange={setShowRevenue} />
          </div>

          {/* Totals */}
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Commission to Pay</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    ${totalRevenue.toFixed(2)} revenue · {blendedRate.toFixed(1)}% blended rate
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-primary tabular-nums">${totalCommission.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Notes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="h-4 w-4" />
            Additional Notes
          </div>
          <Textarea
            id="splitNotes"
            placeholder="Add any additional information or notes for this report..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <Button onClick={generatePDF} className="w-full h-12 text-base" disabled={!isFormValid}>
          <Download className="h-5 w-5 mr-2" />
          Generate Split-Rate Commission PDF
        </Button>
      </CardContent>
    </Card>
  )
}
