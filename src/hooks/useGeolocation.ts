import { useState, useEffect } from 'react';
import type { InteractionLocation } from '../types/interactions';

export interface GeolocationState {
  location: InteractionLocation | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
}

export const useGeolocation = (autoRequest: boolean = false) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
    supported: 'geolocation' in navigator,
  });

  const getCurrentLocation = async (): Promise<InteractionLocation | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by this browser' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 60000, // Cache for 1 minute
          }
        );
      });

      const location: InteractionLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      // Try to get address via reverse geocoding
      try {
        const address = await reverseGeocode(location.lat, location.lng);
        location.address = address;
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
        // Continue without address
      }

      setState(prev => ({ ...prev, location, loading: false }));
      return location;
    } catch (error) {
      let errorMessage = 'Unable to get location';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
      }

      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  };

  const watchLocation = () => {
    if (!navigator.geolocation) return null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: InteractionLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setState(prev => ({ ...prev, location, error: null }));
      },
      (error) => {
        setState(prev => ({ ...prev, error: error.message }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return watchId;
  };

  const stopWatching = (watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
  };

  // Auto-request location on mount if enabled
  useEffect(() => {
    if (autoRequest && state.supported && !state.location && !state.loading) {
      getCurrentLocation();
    }
  }, [autoRequest, state.supported]);

  return {
    ...state,
    getCurrentLocation,
    watchLocation,
    stopWatching,
  };
};

// Simple reverse geocoding using a free service
// In production, you might want to use Google Maps API or similar
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    
    if (!response.ok) throw new Error('Geocoding service unavailable');
    
    const data = await response.json();
    
    // Build a readable address
    const parts = [
      data.locality,
      data.principalSubdivision,
      data.countryName
    ].filter(Boolean);
    
    return parts.join(', ') || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    // Fallback to coordinates if geocoding fails
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};