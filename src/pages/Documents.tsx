import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, FileText, Download, Edit, Search } from "lucide-react"

interface FormData {
  [key: string]: string
}

interface SavedDocument {
  id: string
  name: string
  template: string
  created: string
  status: "Signed" | "Pending" | "Draft"
  formData: FormData
}

export default function Documents() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({})

  const templates = [
    {
      id: "location-agreement",
      title: "Location Agreement",
      description: "Professional 1-year claw machine placement agreement",
      fields: [
        "Agreement Date",
        "Provider Name", 
        "Provider Address",
        "Provider Contact Info",
        "Business Name",
        "Business Address", 
        "Business Contact Info",
        "Start Date",
        "End Date", 
        "Revenue Share Percentage",
        "Flat Fee Amount",
        "Payment Method",
        "Notice Period (Hours/Days)"
      ]
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

  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([
    { 
      id: "1",
      name: "Downtown Arcade Agreement", 
      template: "Location Agreement", 
      created: "2024-01-15", 
      status: "Signed",
      formData: {}
    },
    { 
      id: "2",
      name: "Pizza Palace Contract", 
      template: "Service Contract", 
      created: "2024-01-14", 
      status: "Pending",
      formData: {}
    },
    { 
      id: "3",
      name: "Mall Kiosk Agreement", 
      template: "Location Agreement", 
      created: "2024-01-13", 
      status: "Draft",
      formData: {}
    }
  ])

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateLocationAgreementContent = () => {
    return `
CLAW MACHINE PLACEMENT AGREEMENT
Standard 1-Year Term

This Agreement is made effective as of ${formData["Agreement Date"] || "[Date]"}, by and between:

Claw Machine Provider: ${formData["Provider Name"] || "[Provider Name]"}
Address: ${formData["Provider Address"] || "[Provider Address]"}
Phone / Email: ${formData["Provider Contact Info"] || "[Contact Info]"}

Business Location Owner: ${formData["Business Name"] || "[Business Name]"}
Business Address: ${formData["Business Address"] || "[Business Address]"}
Phone / Email: ${formData["Business Contact Info"] || "[Contact Info]"}

Together referred to as "the Parties."

1. PURPOSE
The Provider agrees to place and operate one or more claw machines (the "Machine(s)") at the Location Owner's place of business. The Location Owner agrees to host the Machine(s) in exchange for a share of the revenue.

2. TERM
This Agreement is valid for 12 months, beginning on ${formData["Start Date"] || "[Start Date]"} and ending on ${formData["End Date"] || "[End Date]"}, unless terminated earlier as outlined in Section 9.

3. REVENUE SHARE
The Provider will collect all revenue from the Machine(s) and pay the Location Owner a ${formData["Revenue Share Percentage"] || "[%]"}% share, or a flat fee of $${formData["Flat Fee Amount"] || "[Amount]"} per month.

Payments will be made by the 10th of each month for the prior month's earnings, via ${formData["Payment Method"] || "[Payment Method]"}.

4. RESPONSIBILITIES

Provider:
• Owns all machines and their contents
• Handles installation, restocking, servicing, and maintenance
• Covers all operational costs, including electricity and repairs

Location Owner:
• Provides a power outlet and accessible space for the Machine(s)
• Maintains general cleanliness and accessibility around the machine

5. THEFT, DAMAGE & COOPERATION
The Location Owner will not be held liable for theft, vandalism, or accidental damage to the Machine(s).

In the event of such incidents, the Location Owner agrees to:
• Provide available security footage, if applicable
• Allow access for inspection
• Cooperate with law enforcement or insurance representatives

6. INSURANCE & LIABILITY
The Provider is responsible for carrying insurance for equipment and general liability.
The Location Owner assumes no liability for injuries or damages related to the Machine(s), except in cases of gross negligence.

7. MARKETING MATERIALS
The Provider may display branding and signage on or near the Machine(s).
Any additional signage in other areas of the premises must be approved by the Location Owner.

8. RELOCATION OR REMOVAL
The Provider may replace, relocate, or remove the Machine(s) with ${formData["Notice Period (Hours/Days)"] || "[Notice Period]"} notice to the Location Owner.
The Location Owner may request relocation of the machine within the business if needed.

9. TERMINATION
Either party may terminate this Agreement with 30 days' written notice. Immediate termination is permitted in the event of a material breach.

10. RENEWAL
If neither party provides written notice of termination at least 30 days before the end date, this Agreement automatically renews for another 12-month term.

11. ENTIRE AGREEMENT
This document represents the full agreement between the Parties. Any amendments must be in writing and signed by both Parties.

SIGNATURES

Claw Machine Provider
Name: ${formData["Provider Name"] || "[Provider Name]"}
Signature: _________________________________
Date: ${formData["Agreement Date"] || "[Date]"}

Business Location Owner
Name: ${formData["Business Name"] || "[Business Name]"}
Signature: _________________________________
Date: ${formData["Agreement Date"] || "[Date]"}
    `.trim()
  }

  const handleDownloadPDF = () => {
    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) return

    let content = ""
    
    if (selectedTemplate === "location-agreement") {
      content = generateLocationAgreementContent()
    } else {
      // For other templates, use the simple format
      content = `
${template.title}
${"=".repeat(template.title.length)}

${template.fields.map(field => `${field}: ${formData[field] || '[Not provided]'}`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
ClawOps Document Creator
      `.trim()
    }

    // Create a styled HTML document for better PDF generation
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${template.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            text-align: center;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
        }
        h2 {
            color: #1e40af;
            margin-top: 30px;
        }
        .parties {
            background-color: #f8fafc;
            padding: 15px;
            border-left: 4px solid #2563eb;
            margin: 20px 0;
        }
        .signatures {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature-block {
            width: 45%;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
        ul {
            margin: 10px 0;
        }
        li {
            margin: 5px 0;
        }
        @media print {
            body { margin: 0; padding: 15px; }
        }
    </style>
</head>
<body>
    <pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${content}</pre>
</body>
</html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    // Open in new window for printing to PDF
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    }

    toast({
      title: "Document Generated",
      description: `${template.title} opened in new window. Use Ctrl+P to save as PDF.`,
    })
  }

  const handleSaveDraft = () => {
    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) return

    const businessName = formData["Business Name"] || formData["Client Name"] || "Untitled"
    const newDocument: SavedDocument = {
      id: Date.now().toString(),
      name: `${businessName} ${template.title}`,
      template: template.title,
      created: new Date().toISOString().split('T')[0],
      status: "Draft",
      formData: { ...formData }
    }

    setSavedDocuments(prev => [newDocument, ...prev])
    
    toast({
      title: "Draft Saved",
      description: `Document saved as draft successfully.`,
    })
  }

  const handleNewDocument = () => {
    setSelectedTemplate(null)
    setFormData({})
  }

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
        <Button 
          className="bg-gradient-primary hover:bg-primary/90"
          onClick={handleNewDocument}
        >
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
                        value={formData[field] || ""}
                        onChange={(e) => handleFormChange(field, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={field.toLowerCase().replace(' ', '-')}
                        placeholder={`Enter ${field.toLowerCase()}...`}
                        value={formData[field] || ""}
                        onChange={(e) => handleFormChange(field, e.target.value)}
                      />
                    )}
                  </div>
                ))}
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    className="bg-gradient-primary hover:bg-primary/90"
                    onClick={handleDownloadPDF}
                    disabled={!formData || Object.keys(formData).length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleSaveDraft}
                  >
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
            {savedDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-smooth">
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Document Downloaded",
                        description: `${doc.name} has been downloaded.`,
                      })
                    }}
                  >
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