'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import Link from 'next/link';

interface MapProps {
  businesses: {
    id: string;
    name: string;
    category?: string;
    address: string;
    lat?: number | null;
    lng?: number | null;
  }[];
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function Map({ businesses }: MapProps) {
  // Centro por defecto: Santiago del Estero
  const defaultCenter: [number, number] = [-27.7833, -64.2667];
  
  // Filtrar comercios que tienen coordenadas válidas
  const markers = businesses.filter(b => b.lat != null && b.lng != null) as {
    id: string;
    name: string;
    category?: string;
    address: string;
    lat: number;
    lng: number;
  }[];

  // Si hay marcadores, centrar en el primero, si no en el centro por defecto
  const center = markers.length > 0 ? [markers[0].lat, markers[0].lng] as [number, number] : defaultCenter;

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', zIndex: 1 }}>
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />
        {markers.map(marker => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
            <Popup>
              <div style={{ padding: '4px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{marker.name}</h3>
                {marker.category && (
                  <span style={{ display: 'inline-block', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    {marker.category}
                  </span>
                )}
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {marker.address}</p>
                <Link href={`https://maps.google.com/?q=${marker.lat},${marker.lng}`} target="_blank" style={{ display: 'block', textAlign: 'center', background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                  Cómo llegar
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
