
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FlyerTemplate } from '@/types/flyer'

interface TemplateSelectorProps {
  templates: FlyerTemplate[]
  selectedTemplate: FlyerTemplate | null
  onTemplateSelect: (template: FlyerTemplate) => void
  selectedCategory?: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'new-machine', name: 'New Machine' },
  { id: 'prizes', name: 'Win Prizes' },
  { id: 'limited-event', name: 'Limited Event' },
  { id: 'holiday', name: 'Holiday Specials' },
  { id: 'partnership', name: 'Partnerships' }
]

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  selectedCategory = 'all',
  onCategoryChange
}) => {
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const getSizeLabel = (size: string) => {
    switch (size) {
      case '8.5x11': return 'Flyer'
      case '11x17': return 'Poster'
      case 'square': return 'Social Square'
      case 'story': return 'Story'
      default: return size
    }
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate?.id === template.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <CardContent className="p-0">
              <div className={`h-32 rounded-t-lg ${template.preview}`} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{template.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {getSizeLabel(template.size)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default TemplateSelector
