import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAds() {
      const { data, error } = await supabase
        .from('competitor_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setAds(data || []);
      }
      setLoading(false);
    }

    fetchAds();
  }, []);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <h1 style={{ color: '#1a202c', marginBottom: '20px' }}>📊 Rəqib Analizi Dashboard-u</h1>
      
      {loading ? (
        <p>Məlumatlar yüklənir...</p>
      ) : ads.length === 0 ? (
        <p>Hələ ki heç bir reklam tapılmadı.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {ads.map((ad) => (
            <div key={ad.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ color: '#2b6cb0', fontSize: '18px' }}>{ad.competitor_name}</strong>
                <span style={{ backgroundColor: '#c6f6d5', color: '#22543d', padding: '4px 8px', borderRadius: '5px', fontSize: '12px' }}>Aktiv</span>
              </div>
              <p style={{ color: '#4a5568', fontSize: '14px', lineHeight: '1.5' }}>{ad.ad_text}</p>
              <small style={{ color: '#a0aec0', display: 'block', marginTop: '15px' }}>
                Tarix: {new Date(ad.created_at).toLocaleDateString('az-AZ')}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
