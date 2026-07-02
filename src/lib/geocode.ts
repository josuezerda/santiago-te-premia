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
