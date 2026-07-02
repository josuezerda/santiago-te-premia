/**
 * Extraer coordenadas de un enlace de Google Maps
 * Soporta formatos: maps.app.goo.gl, maps.google.com, etc.
 */
export async function extractCoordsFromMapUrl(mapUrl: string): Promise<{ lat: number, lng: number } | null> {
  try {
    // Intentar resolver URL corta (goo.gl) siguiendo el redirect
    let fullUrl = mapUrl;
    if (mapUrl.includes('goo.gl') || mapUrl.includes('maps.app')) {
      const res = await fetch(mapUrl, { redirect: 'follow', headers: { 'User-Agent': 'SantiagoTePremiaApp/1.0' } });
      fullUrl = res.url;
    }

    // Buscar coordenadas en la URL expandida
    // Formato: @-27.7864587,-64.2608791 o !3d-27.7864587!4d-64.2608791
    const atMatch = fullUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    const dMatch = fullUrl.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (dMatch) {
      return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
    }

    // Formato: q=-27.7864587,-64.2608791
    const qMatch = fullUrl.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    return null;
  } catch (err) {
    console.error('Error extracting coords from map URL:', err);
    return null;
  }
}

/**
 * Geocodificar una dirección usando OpenStreetMap Nominatim
 */
export async function geocodeAddress(address: string, city: string = 'Santiago del Estero', country: string = 'Argentina'): Promise<{ lat: number, lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, ${city}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    
    // Add user-agent as required by Nominatim policy
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SantiagoTePremiaApp/1.0',
      }
    });

    if (!res.ok) return null;
    
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (err) {
    console.error('Error geocoding address:', err);
    return null;
  }
}

/**
 * Obtener coordenadas de un comercio: primero intentar desde map_url,
 * luego desde la dirección con geocodificación
 */
export async function getCoordinates(address?: string, mapUrl?: string): Promise<{ lat: number, lng: number } | null> {
  // 1. Intentar extraer de la URL de Google Maps
  if (mapUrl) {
    const coords = await extractCoordsFromMapUrl(mapUrl);
    if (coords) return coords;
  }

  // 2. Fallback: geocodificar la dirección
  if (address) {
    return geocodeAddress(address);
  }

  return null;
}
