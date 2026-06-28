'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface StatCard {
  label: string;
  value: string;
  accent: string;
  icon: string;
}

interface TopComercio {
  name: string;
  category: string;
  canjes: number;
  trend: string;
}

interface RecentRegistration {
  name: string;
  origin: string;
  hotel: string;
  date: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: 'Total Turistas', value: '...', accent: '', icon: '👤' },
    { label: 'Registros Hoy', value: '...', accent: 'success', icon: '📈' },
    { label: 'Comercios Activos', value: '...', accent: '', icon: '🏪' },
    { label: 'Canjes Realizados', value: '...', accent: 'warning', icon: '🔄' },
    { label: 'Beneficios Activos', value: '...', accent: 'success', icon: '🎁' },
    { label: 'Campañas Enviadas', value: '...', accent: '', icon: '📢' },
  ]);
  const [topComercios, setTopComercios] = useState<TopComercio[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      // --- Fetch all stat counts in parallel ---
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [
        totalTouristsRes,
        touristsTodayRes,
        activeBusinessesRes,
        totalRedemptionsRes,
        activePromotionsRes,
        sentCampaignsRes,
      ] = await Promise.all([
        supabase.from('tourists').select('id', { count: 'exact', head: true }),
        supabase.from('tourists').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('redemptions').select('id', { count: 'exact', head: true }),
        supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'SENT'),
      ]);

      const fmt = (n: number | null) => n != null ? n.toLocaleString('es-AR') : '0';

      setStats([
        { label: 'Total Turistas', value: fmt(totalTouristsRes.count), accent: '', icon: '👤' },
        { label: 'Registros Hoy', value: fmt(touristsTodayRes.count), accent: 'success', icon: '📈' },
        { label: 'Comercios Activos', value: fmt(activeBusinessesRes.count), accent: '', icon: '🏪' },
        { label: 'Canjes Realizados', value: fmt(totalRedemptionsRes.count), accent: 'warning', icon: '🔄' },
        { label: 'Beneficios Activos', value: fmt(activePromotionsRes.count), accent: 'success', icon: '🎁' },
        { label: 'Campañas Enviadas', value: fmt(sentCampaignsRes.count), accent: '', icon: '📢' },
      ]);

      // --- Top comercios by redemptions ---
      // Fetch redemptions grouped by business, then fetch business details
      const { data: redemptionsData } = await supabase
        .from('redemptions')
        .select('business_id');

      if (redemptionsData) {
        // Count redemptions per business
        const countMap: Record<string, number> = {};
        redemptionsData.forEach((r: any) => {
          if (r.business_id) {
            countMap[r.business_id] = (countMap[r.business_id] || 0) + 1;
          }
        });

        // Sort and pick top 5
        const sorted = Object.entries(countMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        if (sorted.length > 0) {
          const businessIds = sorted.map(([id]) => id);
          const { data: businesses } = await supabase
            .from('businesses')
            .select('id, name, categories ( name )')
            .in('id', businessIds);

          if (businesses) {
            const bizMap: Record<string, any> = {};
            businesses.forEach((b: any) => { bizMap[b.id] = b; });

            const top: TopComercio[] = sorted.map(([id, count]) => {
              const biz = bizMap[id];
              return {
                name: biz?.name || 'Desconocido',
                category: biz?.categories?.name || 'Otro',
                canjes: count,
                trend: '-',
              };
            });
            setTopComercios(top);
          }
        }
      }

      // --- Recent registrations ---
      const { data: recentTourists } = await supabase
        .from('tourists')
        .select('name, last_name, province, country, created_at, points_of_interest ( name )')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentTourists) {
        const recent: RecentRegistration[] = recentTourists.map((t: any) => {
          const fullName = [t.name, t.last_name].filter(Boolean).join(' ') || 'Sin nombre';
          const origin = t.province || t.country || '-';
          const hotel = t.points_of_interest?.name || '-';
          const dateObj = new Date(t.created_at);
          const date = dateObj.toLocaleDateString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          }) + ' ' + dateObj.toLocaleTimeString('es-AR', {
            hour: '2-digit', minute: '2-digit',
          });
          return { name: fullName, origin, hotel, date };
        });
        setRecentRegistrations(recent);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Panel de Control
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Bienvenido, Súper Administrador — Vista general de la plataforma
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline btn-sm">
            📥 Exportar Reporte
          </button>
          <button className="btn btn-primary">
            + Nuevo Registro
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className={`stat-card ${stat.accent}`}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}>
              <span className="stat-label">{stat.label}</span>
              <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Two Column Section */}
      <div className="two-col-grid" style={{ marginTop: '8px' }}>
        {/* Left: Top Comercios */}
        <div className="card-static">
          <div className="section-title">
            <span>🏆 Comercios con más Canjes</span>
            <Link href="/admin/comercios" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
              Ver todos →
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Comercio</th>
                <th>Categoría</th>
                <th>Canjes</th>
                <th>Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {topComercios.map((c, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>
                    <span className="badge badge-neutral">{c.category}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.canjes}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 500, fontSize: '0.85rem' }}>
                    {c.trend}
                  </td>
                </tr>
              ))}
              {topComercios.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    Sin datos de canjes aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Recent Registrations */}
        <div className="card-static">
          <div className="section-title">
            <span>🕐 Últimos Registros</span>
            <Link href="/admin/turistas" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
              Ver todos →
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Turista</th>
                <th>Origen</th>
                <th>Hotel</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.origin}</td>
                  <td>{r.hotel}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.date}</td>
                </tr>
              ))}
              {recentRegistrations.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    Sin registros aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
