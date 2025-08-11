
export interface RouteStop {
  address: string;
  serviceTime: number; // minutes
  timeWindow?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number;
  totalTime: number;
  estimatedTimes: {
    address: string;
    arrivalTime: string;
    departureTime: string;
    serviceTime: number;
  }[];
}

// Convert time string to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convert minutes since midnight to time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Calculate distance between two addresses (simplified)
const calculateDistance = (addr1: string, addr2: string): number => {
  // In a real implementation, you'd use geocoding + distance matrix API
  // For demo, using string similarity as proxy
  const similarity = Math.abs(addr1.toLowerCase().localeCompare(addr2.toLowerCase()));
  return Math.max(1, similarity / 100) + Math.random() * 5;
};

// Calculate travel time between addresses (minutes)
const calculateTravelTime = (addr1: string, addr2: string): number => {
  const distance = calculateDistance(addr1, addr2);
  // Assume average speed of 30 mph in city
  return Math.round(distance * 2 + Math.random() * 10);
};

// 2-opt optimization algorithm
const twoOptImprovement = (route: string[], startAddress: string): string[] => {
  const allAddresses = [startAddress, ...route];
  let bestRoute = [...allAddresses];
  let bestDistance = calculateTotalDistance(bestRoute);
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        if (j - i === 1) continue; // Skip adjacent edges
        
        const newRoute = [...bestRoute];
        // Reverse the segment between i and j
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, j - i + 1, ...segment);
        
        const newDistance = calculateTotalDistance(newRoute);
        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return bestRoute.slice(1); // Remove starting address from route
};

// Calculate total distance for a route
const calculateTotalDistance = (route: string[]): number => {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += calculateDistance(route[i], route[i + 1]);
  }
  return total;
};

// Check if a time falls within a time window
const isWithinTimeWindow = (time: number, timeWindow: { start: string; end: string }): boolean => {
  const startMinutes = timeToMinutes(timeWindow.start);
  const endMinutes = timeToMinutes(timeWindow.end);
  return time >= startMinutes && time <= endMinutes;
};

export const optimizeRoute = (
  startingPoint: string,
  stops: RouteStop[],
  startTime: string = '09:00'
): OptimizedRoute => {
  // Filter valid stops
  const validStops = stops.filter(stop => stop.address.trim().length > 0);
  
  if (validStops.length === 0) {
    return {
      stops: [],
      totalDistance: 0,
      totalTime: 0,
      estimatedTimes: []
    };
  }

  // Apply 2-opt optimization
  const addresses = validStops.map(stop => stop.address);
  const optimizedAddresses = twoOptImprovement(addresses, startingPoint);
  
  // Reorder stops according to optimized route
  const optimizedStops = optimizedAddresses.map(addr => 
    validStops.find(stop => stop.address === addr)!
  );

  // Calculate ETAs and validate time windows
  const estimatedTimes = [];
  let currentTime = timeToMinutes(startTime);
  let currentLocation = startingPoint;
  let totalDistance = 0;
  let feasible = true;

  for (const stop of optimizedStops) {
    const travelTime = calculateTravelTime(currentLocation, stop.address);
    const distance = calculateDistance(currentLocation, stop.address);
    
    totalDistance += distance;
    currentTime += travelTime;
    
    // Check time window constraints
    if (stop.timeWindow) {
      const windowStart = timeToMinutes(stop.timeWindow.start);
      const windowEnd = timeToMinutes(stop.timeWindow.end);
      
      if (currentTime < windowStart) {
        // Arrive early, wait until window opens
        currentTime = windowStart;
      } else if (currentTime > windowEnd) {
        // Arrive too late, mark as infeasible but continue
        feasible = false;
      }
    }

    const arrivalTime = minutesToTime(currentTime);
    const departureTime = minutesToTime(currentTime + stop.serviceTime);
    
    estimatedTimes.push({
      address: stop.address,
      arrivalTime,
      departureTime,
      serviceTime: stop.serviceTime
    });

    currentTime += stop.serviceTime;
    currentLocation = stop.address;
  }

  const totalTime = currentTime - timeToMinutes(startTime);

  return {
    stops: optimizedStops,
    totalDistance,
    totalTime,
    estimatedTimes
  };
};
