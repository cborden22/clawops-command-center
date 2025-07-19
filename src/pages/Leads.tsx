import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Calendar, Phone, Mail, MapPin, Filter, X } from "lucide-react"

interface Lead {
  id: string
  businessName: string
  contactPerson: string
  email: string
  phone: string
  location: string
  status: "not-contacted" | "contacted" | "followed-up" | "closed" | "rejected"
  notes: string
  followUpDate?: string
  createdAt: string
}

export default function Leads() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    location: "",
    notes: "",
    status: "not-contacted"
  })

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "1",
      businessName: "Downtown Arcade",
      contactPerson: "Mike Johnson",
      email: "mike@downtownarcade.com",
      phone: "(555) 123-4567",
      location: "123 Main St, Downtown",
      status: "contacted",
      notes: "Interested in 2-3 machines. Wants to discuss revenue split.",
      followUpDate: "2024-01-20",
      createdAt: "2024-01-15"
    },
    {
      id: "2", 
      businessName: "Pizza Palace",
      contactPerson: "Sarah Williams",
      email: "sarah@pizzapalace.com",
      phone: "(555) 987-6543",
      location: "456 Oak Ave, Midtown",
      status: "followed-up",
      notes: "Second meeting scheduled. Very positive response.",
      followUpDate: "2024-01-22",
      createdAt: "2024-01-10"
    },
    {
      id: "3",
      businessName: "Bowlero Lanes",
      contactPerson: "Tom Davis",
      email: "tom@bowlero.com", 
      phone: "(555) 456-7890",
      location: "789 Pine St, Westside",
      status: "closed",
      notes: "Contract signed! Installing 3 machines next week.",
      createdAt: "2024-01-05"
    }
  ])

  const statusOptions = [
    { value: "not-contacted", label: "Not Contacted", color: "bg-gray-500" },
    { value: "contacted", label: "Contacted", color: "bg-blue-500" },
    { value: "followed-up", label: "Followed Up", color: "bg-yellow-500" },
    { value: "closed", label: "Closed", color: "bg-green-500" },
    { value: "rejected", label: "Rejected", color: "bg-red-500" }
  ]

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option ? (
      <Badge className={`${option.color} text-white`}>
        {option.label}
      </Badge>
    ) : null
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleAddLead = () => {
    if (!newLead.businessName?.trim() || !newLead.contactPerson?.trim()) {
      toast({
        title: "Error",
        description: "Business name and contact person are required.",
        variant: "destructive"
      })
      return
    }

    const lead: Lead = {
      id: Date.now().toString(),
      businessName: newLead.businessName!,
      contactPerson: newLead.contactPerson!,
      email: newLead.email || "",
      phone: newLead.phone || "",
      location: newLead.location || "",
      status: "not-contacted",
      notes: newLead.notes || "",
      createdAt: new Date().toISOString().split('T')[0]
    }

    setLeads(prev => [lead, ...prev])
    setNewLead({
      businessName: "",
      contactPerson: "",
      email: "",
      phone: "",
      location: "",
      notes: "",
      status: "not-contacted"
    })
    setShowAddForm(false)
    
    toast({
      title: "Lead Added",
      description: `${lead.businessName} has been added to your leads.`,
    })
  }

  const updateLeadStatus = (leadId: string, newStatus: Lead["status"]) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ))
    
    toast({
      title: "Status Updated",
      description: "Lead status has been updated successfully.",
    })
  }

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead)
    setNewLead(lead)
    setShowAddForm(true)
  }

  const handleUpdateLead = () => {
    if (!editingLead) return handleAddLead()

    setLeads(prev => prev.map(lead => 
      lead.id === editingLead.id ? { ...lead, ...newLead } : lead
    ))
    
    setEditingLead(null)
    setNewLead({
      businessName: "",
      contactPerson: "",
      email: "",
      phone: "",
      location: "",
      notes: "",
      status: "not-contacted"
    })
    setShowAddForm(false)
    
    toast({
      title: "Lead Updated",
      description: "Lead has been updated successfully.",
    })
  }

  const resetForm = () => {
    setEditingLead(null)
    setNewLead({
      businessName: "",
      contactPerson: "",
      email: "",
      phone: "",
      location: "",
      notes: "",
      status: "not-contacted"
    })
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Manage your business prospects and opportunities
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:bg-primary/90"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statusOptions.slice(0, 4).map(status => {
          const count = leads.filter(lead => lead.status === status.value).length
          return (
            <Card key={status.value} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{status.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Leads Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{lead.businessName}</CardTitle>
                  <CardDescription>{lead.contactPerson}</CardDescription>
                </div>
                {getStatusBadge(lead.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{lead.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{lead.location}</span>
                </div>
                {lead.followUpDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Follow up: {lead.followUpDate}</span>
                  </div>
                )}
              </div>
              
              {lead.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">{lead.notes}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditLead(lead)}
                >
                  Edit
                </Button>
                <Select value={lead.status} onValueChange={(value) => updateLeadStatus(lead.id, value as Lead["status"])}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No leads found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Lead Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</CardTitle>
                  <CardDescription>
                    {editingLead ? "Update lead information" : "Enter the details for your new business prospect"}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input 
                  id="businessName" 
                  placeholder="Enter business name"
                  value={newLead.businessName || ""}
                  onChange={(e) => setNewLead(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input 
                  id="contactPerson" 
                  placeholder="Enter contact name"
                  value={newLead.contactPerson || ""}
                  onChange={(e) => setNewLead(prev => ({ ...prev, contactPerson: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter email address"
                  value={newLead.email || ""}
                  onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  placeholder="Enter phone number"
                  value={newLead.phone || ""}
                  onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  placeholder="Enter business location"
                  value={newLead.location || ""}
                  onChange={(e) => setNewLead(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Add any initial notes..."
                  value={newLead.notes || ""}
                  onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1 bg-gradient-primary hover:bg-primary/90"
                  onClick={editingLead ? handleUpdateLead : handleAddLead}
                >
                  {editingLead ? "Update Lead" : "Add Lead"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}