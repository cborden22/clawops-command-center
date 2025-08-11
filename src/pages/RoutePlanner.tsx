
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Route, Plus, Trash2, Zap, Clock, Navigation } from 'lucide-react'
import { toast } from 'sonner'
import { RouteStop, optimizeRoute, OptimizedRoute } from '@/utils/routeOptimizer'
import ServiceTimeConfig from '@/components/route/ServiceTimeConfig'
import OptimizedRouteDisplay from '@/components/route/OptimizedRouteDisplay'

const RoutePlanner = () => {
  const [startingPoint, setStartingPoint] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [routeStops, setRouteStops] = useState<RouteStop[]>([
    { address: '', serviceTime: 15 },
    { address: '', serviceTime: 15 }
  ])
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute>({
    stops: [],
    totalDistance: 0,
    totalTime: 0,
    estimatedTimes: []
  })
  const [isLoading, setIsLoading] = useState(false)

  const addStop = () => {
    setRouteStops([...routeStops, { address: '', serviceTime: 15 }])
  }

  const removeStop = (index: number) => {
    if (routeStops.length <= 2) {
      toast.error('You need at least 2 destinations for a route')
      return
    }
    const newStops = routeStops.filter((_, i) => i !== index)
    setRouteStops(newStops)
  }

  const updateStopAddress = (index: number, address: string) => {
    const newStops = [...routeStops]
    newStops[index] = { ...newStops[index], address }
    setRouteStops(newStops)
  }

  const updateStopServiceTime = (index: number, serviceTime: number) => {
    const newStops = [...routeStops]
    newStops[index] = { ...newStops[index], serviceTime }
    setRouteStops(newStops)
  }

  const updateStopTimeWindow = (index: number, timeWindow: { start: string; end: string } | undefined) => {
    const newStops = [...routeStops]
    newStops[index] = { ...newStops[index], timeWindow }
    setRouteStops(newStops)
  }

  const optimizeRouteHandler = async () => {
    // Validate inputs
    if (!startingPoint.trim()) {
      toast.error('Please enter a starting point address')
      return
    }

    const validStops = routeStops.filter(stop => stop.address.trim().length > 0)
    if (validStops.length < 1) {
      toast.error('Please enter at least 1 destination address')
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const result = optimizeRoute(startingPoint, validStops, startTime)
      setOptimizedRoute(result)
      
      toast.success('Route optimized successfully!')
    } catch (error) {
      toast.error('Failed to optimize route')
      console.error('Route optimization error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAll = () => {
    setStartingPoint('')
    setStartTime('09:00')
    setRouteStops([
      { address: '', serviceTime: 15 },
      { address: '', serviceTime: 15 }
    ])
    setOptimizedRoute({
      stops: [],
      totalDistance: 0,
      totalTime: 0,
      estimatedTimes: []
    })
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-gold-600/5 rounded-2xl blur-xl" />
        <div className="relative glass-card p-8 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl shadow-lg">
                <Navigation className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl opacity-20 blur animate-glow" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
                Advanced Route Planner
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Professional route optimization with service times, time windows, and estimated arrival times
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-gold-500" />
              <span>2-opt Algorithm</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-gold-500" />
              <span>Time Windows Support</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-gold-500" />
              <span>Real-time ETAs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card className="glass-card border-white/10 accent-glow">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Route className="h-6 w-6 text-gold-500" />
              Route Configuration
            </CardTitle>
            <CardDescription className="text-base">
              Configure your route with starting point, destinations, service times, and time windows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startingPoint" className="text-sm font-semibold text-gold-500">Starting Point</Label>
                <Input
                  id="startingPoint"
                  placeholder="123 Home St, City, State"
                  value={startingPoint}
                  onChange={(e) => setStartingPoint(e.target.value)}
                  className="bg-white/5 border-white/20 focus:border-gold-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-semibold text-gold-500">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-white/5 border-white/20 focus:border-gold-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gold-500">Destinations</Label>
              {routeStops.map((stop, index) => (
                <div key={index} className="space-y-3 p-4 glass-card rounded-xl border border-white/10">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder={`Destination ${index + 1}`}
                        value={stop.address}
                        onChange={(e) => updateStopAddress(index, e.target.value)}
                        className="bg-white/5 border-white/20 focus:border-gold-500 transition-colors"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeStop(index)}
                      disabled={routeStops.length <= 2}
                      className="border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                  
                  <ServiceTimeConfig
                    serviceTime={stop.serviceTime}
                    timeWindow={stop.timeWindow}
                    onServiceTimeChange={(serviceTime) => updateStopServiceTime(index, serviceTime)}
                    onTimeWindowChange={(timeWindow) => updateStopTimeWindow(index, timeWindow)}
                    addressIndex={index}
                  />
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addStop}
                className="w-full border-gold-500/20 hover:bg-gold-500/10 hover:border-gold-500/40 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Destination
              </Button>
            </div>
            
            <div className="flex gap-3 pt-6">
              <Button 
                onClick={optimizeRouteHandler} 
                disabled={isLoading}
                className="flex-1 premium-button"
              >
                <Route className="h-4 w-4 mr-2" />
                {isLoading ? 'Optimizing Route...' : 'Optimize Route'}
              </Button>
              <Button 
                variant="outline" 
                onClick={clearAll}
                className="border-white/20 hover:bg-white/5 transition-colors"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <OptimizedRouteDisplay 
          route={optimizedRoute}
          startingPoint={startingPoint}
          startTime={startTime}
        />
      </div>
    </div>
  )
}

export default RoutePlanner
