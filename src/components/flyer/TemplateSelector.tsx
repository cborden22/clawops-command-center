
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap } from 'lucide-react'
import { FlyerTemplate } from '@/types/flyer'

interface TemplateSelectorProps {
  templates: FlyerTemplate[]
  selectedTemplate: FlyerTemplate | null
  onTemplateSelect: (template: FlyerTemplate) => void
  selectedCategory?: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { id: 'all', name: 'All Templates', icon: Sparkles, isComponent: true },
  { id: 'new-machine', name: 'New Machine', icon: Zap, isComponent: true },
  { id: 'prizes', name: 'Win Prizes', icon: '🎁', isComponent: false },
  { id: 'limited-event', name: 'Limited Event', icon: '⏰', isComponent: false },
  { id: 'holiday', name: 'Holiday Specials', icon: '🎄', isComponent: false },
  { id: 'partnership', name: 'Partnerships', icon: '🤝', isComponent: false }
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

  const getSizeColor = (size: string) => {
    switch (size) {
      case '8.5x11': return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case '11x17': return 'bg-purple-500/10 text-purple-600 border-purple-200'
      case 'square': return 'bg-green-500/10 text-green-600 border-green-200'
      case 'story': return 'bg-orange-500/10 text-orange-600 border-orange-200'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="grid grid-cols-2 gap-2">
        {categories.map((category) => {
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`group relative p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/80 hover:scale-102'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {category.isComponent ? (
                  <category.icon className="h-4 w-4" />
                ) : (
                  <span className="text-base">{category.icon}</span>
                )}
                <span className="hidden sm:inline">{category.name}</span>
              </div>
              
              {selectedCategory === category.id && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-4 h-4 bg-primary-foreground rounded-full flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Template Count */}
      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`group cursor-pointer transition-all duration-300 hover:shadow-hover hover:-translate-y-1 ${
              selectedTemplate?.id === template.id
                ? 'ring-2 ring-primary border-primary shadow-lg bg-primary/5'
                : 'hover:border-primary/30 bg-card/50 backdrop-blur-sm'
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <CardContent className="p-0">
              {/* Template Preview */}
              <div className={`relative h-24 rounded-t-lg overflow-hidden ${template.preview}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
                
                {/* Selection Indicator */}
                {selectedTemplate?.id === template.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  </div>
                )}
                
                {/* Template Preview Elements */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-white text-xs">
                  <div className="font-bold">Business Name</div>
                  <div className="text-center">
                    <div className="bg-white/20 rounded px-2 py-1 backdrop-blur-sm">
                      Special Offer
                    </div>
                  </div>
                  <div className="text-xs opacity-80">Contact Info</div>
                </div>
              </div>
              
              {/* Template Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {template.name}
                  </h4>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs border ${getSizeColor(template.size)}`}
                  >
                    {getSizeLabel(template.size)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
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
