
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Clock, MapPin, Timer, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { OptimizedRoute } from '@/utils/routeOptimizer';

interface OptimizedRouteDisplayProps {
  route: OptimizedRoute;
  startingPoint: string;
  startTime: string;
}

const OptimizedRouteDisplay: React.FC<OptimizedRouteDisplayProps> = ({
  route,
  startingPoint,
  startTime
}) => {
  const generateGoogleMapsUrl = () => {
    const allAddresses = [startingPoint, ...route.stops.map(stop => stop.address)];
    const encodedAddresses = allAddresses.map(addr => encodeURIComponent(addr));
    return `https://www.google.com/maps/dir/${encodedAddresses.join('/')}`;
  };

  const generateWazeUrl = () => {
    // Waze doesn't support multiple waypoints well, so we'll link to the first destination
    if (route.stops.length > 0) {
      return `https://waze.com/ul?q=${encodeURIComponent(route.stops[0].address)}`;
    }
    return '';
  };

  const copyRouteDetails = () => {
    const routeText = [
      `Optimized Route (Starting at ${startTime})`,
      '=' .repeat(40),
      `Starting Point: ${startingPoint}`,
      '',
      ...route.estimatedTimes.map((eta, index) => 
        `${index + 1}. ${eta.address}\n` +
        `   Arrival: ${eta.arrivalTime}\n` +
        `   Service: ${eta.serviceTime} min\n` +
        `   Departure: ${eta.departureTime}\n`
      ),
      '',
      `Total Distance: ${route.totalDistance.toFixed(1)} miles`,
      `Total Time: ${Math.floor(route.totalTime / 60)}h ${route.totalTime % 60}m`
    ].join('\n');
    
    navigator.clipboard.writeText(routeText);
    toast.success('Route details copied to clipboard!');
  };

  const hasTimeWindowViolations = route.estimatedTimes.some(eta => {
    const stop = route.stops.find(s => s.address === eta.address);
    if (!stop?.timeWindow) return false;
    
    const arrivalMinutes = parseInt(eta.arrivalTime.split(':')[0]) * 60 + parseInt(eta.arrivalTime.split(':')[1]);
    const startMinutes = parseInt(stop.timeWindow.start.split(':')[0]) * 60 + parseInt(stop.timeWindow.start.split(':')[1]);
    const endMinutes = parseInt(stop.timeWindow.end.split(':')[0]) * 60 + parseInt(stop.timeWindow.end.split(':')[1]);
    
    return arrivalMinutes > endMinutes;
  });

  if (route.stops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Optimized Route</CardTitle>
          <CardDescription>
            Your optimized route with estimated arrival times will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter your starting point and destinations to generate an optimized route.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Optimized Route
          {hasTimeWindowViolations && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Time Conflicts
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Route optimized using 2-opt algorithm with service times and time windows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{route.stops.length + 1}</div>
            <div className="text-sm text-muted-foreground">Stops</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{route.totalDistance.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Miles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.floor(route.totalTime / 60)}:{(route.totalTime % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </div>
        </div>

        {/* Route Steps */}
        <div className="space-y-3">
          {/* Starting Point */}
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="rounded-full w-8 h-8 bg-green-500 text-white flex items-center justify-center text-sm font-medium">
              S
            </div>
            <div className="flex-1">
              <div className="font-medium">Starting Point</div>
              <div className="text-sm text-muted-foreground">{startingPoint}</div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Departure: {startTime}</span>
              </div>
            </div>
          </div>

          {/* Route Stops */}
          {route.estimatedTimes.map((eta, index) => {
            const stop = route.stops[index];
            const hasViolation = stop.timeWindow && (() => {
              const arrivalMinutes = parseInt(eta.arrivalTime.split(':')[0]) * 60 + parseInt(eta.arrivalTime.split(':')[1]);
              const endMinutes = parseInt(stop.timeWindow!.end.split(':')[0]) * 60 + parseInt(stop.timeWindow!.end.split(':')[1]);
              return arrivalMinutes > endMinutes;
            })();

            return (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  hasViolation ? 'bg-red-50 border-red-200' : 'bg-background border-border'
                }`}
              >
                <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium ${
                  hasViolation ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{eta.address}</div>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Arrive: {eta.arrivalTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="h-3 w-3 text-muted-foreground" />
                      <span>{eta.serviceTime}min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Leave: {eta.departureTime}</span>
                    </div>
                  </div>
                  {stop.timeWindow && (
                    <div className={`text-xs mt-1 ${hasViolation ? 'text-red-600' : 'text-muted-foreground'}`}>
                      Window: {stop.timeWindow.start} - {stop.timeWindow.end}
                      {hasViolation && ' (VIOLATION)'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={copyRouteDetails} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Copy Details
          </Button>
          <Button asChild className="flex-1">
            <a href={generateGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Maps
            </a>
          </Button>
          {generateWazeUrl() && (
            <Button variant="outline" asChild className="flex-1">
              <a href={generateWazeUrl()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Waze
              </a>
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          * Route optimized using 2-opt algorithm. Times are estimates based on average city driving speeds.
        </p>
      </CardContent>
    </Card>
  );
};

export default OptimizedRouteDisplay;
