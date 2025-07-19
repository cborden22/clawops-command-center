import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, FileText, Download, Edit, Search } from "lucide-react"

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const templates = [
    {
      id: "location-agreement",
      title: "Location Agreement",
      description: "Standard agreement for machine placement",
      fields: ["Business Name", "Location Address", "Install Date", "Payout Percentage", "Agreement Duration"]
    },
    {
      id: "contract",
      title: "Service Contract", 
      description: "Full service and maintenance contract",
      fields: ["Client Name", "Service Level", "Monthly Fee", "Contract Start Date", "Terms"]
    },
    {
      id: "cold-call-script",
      title: "Cold Call Script",
      description: "Structured script for initial outreach",
      fields: ["Business Type", "Decision Maker", "Value Proposition", "Follow-up Actions"]
    },
    {
      id: "inventory-log",
      title: "Inventory Log",
      description: "Track machine inventory and supplies",
      fields: ["Machine ID", "Location", "Last Restocked", "Prize Inventory", "Revenue Collected"]
    }
  ]

  const savedDocuments = [
    { name: "Downtown Arcade Agreement", template: "Location Agreement", created: "2024-01-15", status: "Signed" },
    { name: "Pizza Palace Contract", template: "Service Contract", created: "2024-01-14", status: "Pending" },
    { name: "Mall Kiosk Agreement", template: "Location Agreement", created: "2024-01-13", status: "Draft" }
  ]

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Document Creator</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage business documents with smart templates
          </p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Selection */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Templates</h2>
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-smooth hover:shadow-hover ${
                selectedTemplate === template.id ? 'ring-2 ring-primary bg-accent/50' : ''
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {template.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Document Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>
                  {templates.find(t => t.id === selectedTemplate)?.title}
                </CardTitle>
                <CardDescription>
                  Fill in the required information to generate your document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {templates.find(t => t.id === selectedTemplate)?.fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field.toLowerCase().replace(' ', '-')}>
                      {field}
                    </Label>
                    {field.toLowerCase().includes('terms') || field.toLowerCase().includes('actions') ? (
                      <Textarea
                        id={field.toLowerCase().replace(' ', '-')}
                        placeholder={`Enter ${field.toLowerCase()}...`}
                        className="min-h-20"
                      />
                    ) : (
                      <Input
                        id={field.toLowerCase().replace(' ', '-')}
                        placeholder={`Enter ${field.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
                
                <div className="flex gap-3 pt-4">
                  <Button className="bg-gradient-primary hover:bg-primary/90">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card h-96 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a template to start creating your document</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Saved Documents */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>
            Your saved and generated documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {savedDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-smooth">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">{doc.template} • {doc.created}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doc.status === 'Signed' ? 'bg-green-100 text-green-700' :
                    doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {doc.status}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}