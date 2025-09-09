export interface LocationMatch {
  originalText: string;
  extractedLocation: string;
  confidence: 'high' | 'medium' | 'low';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Known Vista area locations with coordinates
const VISTA_LOCATIONS: { [key: string]: { lat: number; lng: number } } = {
  // Streets
  'east vista way': { lat: 33.2002, lng: -117.2425 },
  'vista way': { lat: 33.2002, lng: -117.2425 },
  'melrose drive': { lat: 33.195, lng: -117.236 },
  'mar vista drive': { lat: 33.1965, lng: -117.238 },
  'civic center drive': { lat: 33.1995, lng: -117.242 },
  'emerald drive': { lat: 33.2015, lng: -117.248 },
  'sycamore avenue': { lat: 33.192, lng: -117.24 },
  
  // Landmarks
  'go postal': { lat: 33.2001, lng: -117.2420 },
  'oceanfront pier': { lat: 33.1958, lng: -117.3794 }, // Oceanside pier
  'water front park': { lat: 33.1958, lng: -117.3794 },
  'oceanside library': { lat: 33.1958, lng: -117.3756 },
  'vista office': { lat: 33.2002, lng: -117.2425 },
  'onc': { lat: 33.1958, lng: -117.3794 }, // Oceanside Navigation Center
  
  // Areas
  'vista': { lat: 33.2002, lng: -117.2425 },
  'oceanside': { lat: 33.1958, lng: -117.3794 },
  'chula vista': { lat: 32.6401, lng: -117.0842 },
};

// Location extraction patterns
const LOCATION_PATTERNS = [
  // Street addresses
  /(\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|drive|dr|boulevard|blvd|way|road|rd|lane|ln|court|ct))/gi,
  
  // Landmarks and businesses
  /(in front of|behind|near|at the|at)\s+([A-Za-z\s]+(?:store|shop|market|restaurant|cafe|bank|post office|library|park|pier|bridge))/gi,
  
  // Specific places
  /(oceanfront pier|go postal|vista office|oceanside library|water front park|onc)/gi,
  
  // City names
  /(vista|oceanside|chula vista|carlsbad|encinitas|san diego)/gi,
];

export const extractLocationFromText = (text: string): LocationMatch[] => {
  if (!text) return [];
  
  const matches: LocationMatch[] = [];
  const textLower = text.toLowerCase();
  
  // Check for exact known locations first
  Object.keys(VISTA_LOCATIONS).forEach(location => {
    if (textLower.includes(location.toLowerCase())) {
      matches.push({
        originalText: text,
        extractedLocation: location,
        confidence: 'high',
        coordinates: VISTA_LOCATIONS[location]
      });
    }
  });
  
  // If we found exact matches, return those
  if (matches.length > 0) {
    return matches;
  }
  
  // Otherwise, try pattern matching
  LOCATION_PATTERNS.forEach(pattern => {
    const patternMatches = text.match(pattern);
    if (patternMatches) {
      patternMatches.forEach(match => {
        // Try to find coordinates for the match
        const matchLower = match.toLowerCase();
        let coordinates: { lat: number; lng: number } | undefined;
        let confidence: 'high' | 'medium' | 'low' = 'low';
        
        // Check if the match contains any known locations
        Object.keys(VISTA_LOCATIONS).forEach(knownLocation => {
          if (matchLower.includes(knownLocation.toLowerCase())) {
            coordinates = VISTA_LOCATIONS[knownLocation];
            confidence = 'medium';
          }
        });
        
        matches.push({
          originalText: text,
          extractedLocation: match.trim(),
          confidence,
          coordinates
        });
      });
    }
  });
  
  return matches;
};

export const getCoordinatesForLocation = (locationText: string): { lat: number; lng: number } | null => {
  const textLower = locationText.toLowerCase();
  
  // Check exact matches
  for (const [key, coords] of Object.entries(VISTA_LOCATIONS)) {
    if (textLower.includes(key.toLowerCase())) {
      return coords;
    }
  }
  
  // If no match found, return null (will use random Vista coordinates)
  return null;
};

// Generate a random location in Vista area if no specific location found
export const getRandomVistaLocation = (): { lat: number; lng: number } => {
  const vistaCoords = {
    minLat: 33.185,
    maxLat: 33.210,
    minLng: -117.260,
    maxLng: -117.230
  };
  
  return {
    lat: vistaCoords.minLat + Math.random() * (vistaCoords.maxLat - vistaCoords.minLat),
    lng: vistaCoords.minLng + Math.random() * (vistaCoords.maxLng - vistaCoords.minLng)
  };
};

export const analyzeLocationData = (records: any[]): {
  withKnownLocations: number;
  withTextLocations: number;
  withoutLocations: number;
  locationBreakdown: { [key: string]: number };
} => {
  let withKnownLocations = 0;
  let withTextLocations = 0;
  let withoutLocations = 0;
  const locationBreakdown: { [key: string]: number } = {};
  
  records.forEach(record => {
    const akaMatches = extractLocationFromText(record.AKA || '');
    const notesMatches = extractLocationFromText(record.Notes || '');
    const allMatches = [...akaMatches, ...notesMatches];
    
    if (allMatches.some(match => match.coordinates)) {
      withKnownLocations++;
      allMatches.forEach(match => {
        if (match.coordinates) {
          locationBreakdown[match.extractedLocation] = (locationBreakdown[match.extractedLocation] || 0) + 1;
        }
      });
    } else if (allMatches.length > 0) {
      withTextLocations++;
    } else {
      withoutLocations++;
    }
  });
  
  return {
    withKnownLocations,
    withTextLocations,
    withoutLocations,
    locationBreakdown
  };
};