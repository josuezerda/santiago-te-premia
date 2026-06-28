'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Redemption {
  created_at: string;
  tourists: { origin_province: string };
  promotions: { title: string };
}

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    total: 0,
    topPromo: '-',
    topOrigin: '-',
    chartData: [] as { date: string; count: number }[]
  });

  useEffect(() => {
    try {
      const b = localStorage.getItem('stp_business');
      if (b) {
        setBusinessId(JSON.parse(b).id);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchStats() {
      if (!businessId) return;
      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          created_at,
          tourists ( origin_province ),
          promotions ( title )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const redemptions = data as unknown as Redemption[];
        
        // 1. Total
        const total = redemptions.length;
        
        // 2. Top Promo
        const promoCounts: Record<string, number> = {};
        let topPromo = '-';
        let maxPromoCount = 0;
        
        // 3. Top Origin
        const originCounts: Record<string, number> = {};
        let topOrigin = '-';
        let maxOriginCount = 0;

        // 4. Chart Data (Last 7 days)
        const last7Days: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          last7Days[d.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })] = 0;
        }

        redemptions.forEach(r => {
          // Promo
          const promo = r.promotions?.title || 'Desconocido';
          promoCounts[promo] = (promoCounts[promo] || 0) + 1;
          if (promoCounts[promo] > maxPromoCount) {
            maxPromoCount = promoCounts[promo];
            topPromo = promo;
          }

          // Origin
          const origin = r.tourists?.origin_province || 'Desconocido';
          originCounts[origin] = (originCounts[origin] || 0) + 1;
          if (originCounts[origin] > maxOriginCount) {
            maxOriginCount = originCounts[origin];
            topOrigin = origin;
          }

          // Date
          const dateStr = new Date(r.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
          if (last7Days[dateStr] !== undefined) {
            last7Days[dateStr]++;
          }
        });

        setStats({
          total,
          topPromo,
          topOrigin,
          chartData: Object.entries(last7Days).map(([date, count]) => ({ date, count }))
        });
      }
      setLoading(false);
    }

    fetchStats();
  }, [businessId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando estadísticas...</div>;
  }

  const maxChartValue = Math.max(...stats.chartData.map(d => d.count), 1); // Avoid division by zero

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Estadísticas
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Métricas de impacto de tus beneficios.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card-static" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Total Canjes</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{stats.total}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>En todo el historial</div>
        </div>

        <div className="card-static" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Beneficio más popular</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: 'auto', marginBottom: 'auto' }}>{stats.topPromo}</div>
        </div>

        <div className="card-static" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Principal origen (Turistas)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: 'auto', marginBottom: 'auto' }}>{stats.topOrigin}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card-static">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>Canjes últimos 7 días</h3>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '250px', paddingBottom: '30px', position: 'relative' }}>
          {/* Y Axis lines */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0 }}>
            {[1, 0.75, 0.5, 0.25, 0].map(multiplier => (
              <div key={multiplier} style={{ borderTop: '1px dashed var(--border-color)', width: '100%', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-10px', right: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', paddingLeft: '4px' }}>
                  {Math.round(maxChartValue * multiplier)}
                </span>
              </div>
            ))}
          </div>

          {/* Bars */}
          {stats.chartData.map((data, index) => {
            const heightPercentage = (data.count / maxChartValue) * 100;
            return (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', zIndex: 1 }}>
                <div 
                  style={{ 
                    width: '100%', 
                    maxWidth: '40px', 
                    height: `${heightPercentage}%`, 
                    background: 'linear-gradient(to top, var(--accent-primary), var(--accent-secondary))',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 1s ease-out',
                    minHeight: data.count > 0 ? '4px' : '0'
                  }} 
                  title={`${data.count} canjes`}
                />
                <div style={{ position: 'absolute', bottom: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', transform: 'translateY(100%)', paddingTop: '8px' }}>
                  {data.date}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
