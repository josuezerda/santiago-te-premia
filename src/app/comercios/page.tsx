'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Map from '@/components/MapWrapper';

interface Category {
  id: string;
  name: string;
}

interface Business {
  id: string;
  name: string;
  category_id: string;
  categories?: { name: string };
  benefit_percentage: number;
  image?: string;
  logo_url?: string;
  address: string;
  lat?: number;
  lng?: number;
}

export default function ComerciosPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    async function fetchData() {
      try {
        const [bizRes, catRes] = await Promise.all([
          fetch('/api/businesses?status=ACTIVE'),
          fetch('/api/categories') // Asumo que existe o se puede obtener de supabase, si no, saco categories de unique categories en businesses
        ]);
        
        const bizJson = await bizRes.json();
        
        if (bizJson.success) {
          setBusinesses(bizJson.data);
          
          // Extraer categorías únicas de los comercios
          const uniqueCats = Array.from(new Set(bizJson.data.map((b: Business) => b.categories?.name).filter(Boolean))) as string[];
          setCategories([{ id: 'todos', name: 'Todos' }, ...uniqueCats.map(name => ({ id: name, name }))]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = businesses.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'Todos' || b.categories?.name === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: 'white',
        padding: '30px 20px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '16px' }}>
            ← Volver al inicio
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
            Comercios Adheridos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', maxWidth: '500px' }}>
            Descubrí todos los beneficios que Santiago te Premia tiene para vos en la ciudad.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Filters */}
        <div style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', zIndex: 9, position: 'sticky', top: 0 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none' }}
              />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none' }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            {/* View Toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? '#0f172a' : '#64748b', fontWeight: 600, cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
              >
                📋 Lista
              </button>
              <button
                onClick={() => setViewMode('map')}
                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: viewMode === 'map' ? 'white' : 'transparent', color: viewMode === 'map' ? '#0f172a' : '#64748b', fontWeight: 600, cursor: 'pointer', boxShadow: viewMode === 'map' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
              >
                🗺️ Mapa
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '20px' }}>
          {loading ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '60px', color: '#64748b' }}>
              ⏳ Cargando directorio...
            </div>
          ) : (
            <div style={{ display: 'flex', width: '100%', gap: '24px', flexDirection: 'column' }}>
              {viewMode === 'list' ? (
                /* List View */
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '24px',
                  alignContent: 'start'
                }}>
                  {filtered.length > 0 ? filtered.map(c => (
                    <div key={c.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ height: '160px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', position: 'relative' }}>
                        {c.logo_url ? (
                          <Image src={c.logo_url} alt={c.name} fill style={{ objectFit: 'cover' }} />
                        ) : c.image ? (
                          <Image src={c.image} alt={c.name} fill style={{ objectFit: 'cover' }} />
                        ) : '🏪'}
                      </div>
                      <div style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0', color: '#0f172a' }}>{c.name}</h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 12px 0' }}>{c.categories?.name || 'Comercio Local'}</p>
                        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                          <span>📍</span> <span style={{ flex: 1 }}>{c.address}</span>
                        </p>
                        <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)', textAlign: 'center' }}>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.85rem' }}>🎁 Beneficios con PIN exclusivo</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b', background: 'white', borderRadius: '16px' }}>
                      No se encontraron comercios con esos filtros.
                    </div>
                  )}
                </div>
              ) : (
                /* Map View */
                <div style={{ height: 'calc(100vh - 200px)', minHeight: '500px', width: '100%', position: 'relative' }}>
                  <Map businesses={filtered.map(b => ({
                    id: b.id,
                    name: b.name,
                    category: b.categories?.name,
                    address: b.address,
                    lat: b.lat,
                    lng: b.lng
                  }))} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
