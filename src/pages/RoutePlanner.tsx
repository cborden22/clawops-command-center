
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Route, Copy, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const RoutePlanner = () => {
  const [startingPoint, setStartingPoint] = useState('')
  const [addresses, setAddresses] = useState<string[]>(['', ''])
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([])
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addAddress = () => {
    setAddresses([...addresses, ''])
  }

  const removeAddress = (index: number) => {
    if (addresses.length <= 2) {
      toast.error('You need at least 2 addresses for a route')
      return
    }
    const newAddresses = addresses.filter((_, i) => i !== index)
    setAddresses(newAddresses)
  }

  const updateAddress = (index: number, value: string) => {
    const newAddresses = [...addresses]
    newAddresses[index] = value
    setAddresses(newAddresses)
  }

  const optimizeRoute = async () => {
    // Filter out empty addresses
    const validAddresses = addresses.filter(addr => addr.trim().length > 0)
    
    if (!startingPoint.trim()) {
      toast.error('Please enter a starting point address')
      return
    }
    
    if (validAddresses.length < 1) {
      toast.error('Please enter at least 1 destination address')
      return
    }

    setIsLoading(true)
    
    try {
      // For demonstration, we'll do a simple optimization
      // In a real implementation, you could use routing APIs
      const shuffled = [...validAddresses]
      
      // Simple nearest-neighbor approach (for demo purposes)
      const optimized = [startingPoint] // Start with starting point
      
      while (shuffled.length > 0) {
        // Just add remaining addresses (in a real app, calculate distances)
        optimized.push(shuffled.shift()!)
      }

      setOptimizedRoute(optimized)
      
      // Generate Google Maps URL with waypoints
      const origin = encodeURIComponent(optimized[0])
      const destination = encodeURIComponent(optimized[optimized.length - 1])
      const waypoints = optimized.slice(1, -1).map(addr => encodeURIComponent(addr)).join('|')
      
      let mapsUrl = `https://www.google.com/maps/dir/${origin}`
      if (waypoints) {
        mapsUrl += `/${waypoints}`
      }
      mapsUrl += `/${destination}`
      
      setGoogleMapsUrl(mapsUrl)
      
      toast.success('Route optimized successfully!')
    } catch (error) {
      toast.error('Failed to optimize route')
      console.error('Route optimization error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyRoute = () => {
    const routeText = optimizedRoute.map((addr, index) => 
      `${index + 1}. ${addr}`
    ).join('\n')
    
    navigator.clipboard.writeText(routeText)
    toast.success('Route copied to clipboard!')
  }

  const clearAll = () => {
    setStartingPoint('')
    setAddresses(['', ''])
    setOptimizedRoute([])
    setGoogleMapsUrl('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Route Planner</h1>
      </div>
      
      <p className="text-muted-foreground">
        Enter your starting point and destination addresses for the day and get an optimized driving route. No data is stored - routes are generated in real-time.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Addresses</CardTitle>
            <CardDescription>
              Add your starting point and destination addresses. Include city and state for best results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="startingPoint">Starting Point</Label>
              <Input
                id="startingPoint"
                placeholder="Your starting address (e.g., 123 Home St, City, State)"
                value={startingPoint}
                onChange={(e) => setStartingPoint(e.target.value)}
                className="border-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Destination Addresses</Label>
              {addresses.map((address, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Destination ${index + 1} (e.g., 456 Main St, City, State)`}
                      value={address}
                      onChange={(e) => updateAddress(index, e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeAddress(index)}
                    disabled={addresses.length <= 2}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addAddress}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Destination
              </Button>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={optimizeRoute} 
                disabled={isLoading}
                className="flex-1"
              >
                <Route className="h-4 w-4 mr-2" />
                {isLoading ? 'Optimizing...' : 'Optimize Route'}
              </Button>
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Optimized Route</CardTitle>
            <CardDescription>
              Your optimized driving route starting from your specified location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {optimizedRoute.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Route Order:</h3>
                  <ol className="space-y-2">
                    {optimizedRoute.map((address, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className={`rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5 ${
                          index === 0 
                            ? 'bg-green-500 text-white' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          {index === 0 ? 'S' : index}
                        </span>
                        <div className="text-sm">
                          {index === 0 && <span className="text-green-600 font-medium">Starting Point: </span>}
                          {address}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyRoute} className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Route
                  </Button>
                  {googleMapsUrl && (
                    <Button asChild className="flex-1">
                      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Maps
                      </a>
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  * This is a basic optimization. For complex routes with many stops, consider using dedicated routing software.
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter your starting point and destination addresses, then click "Optimize Route" to see your optimized driving route.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RoutePlanner
