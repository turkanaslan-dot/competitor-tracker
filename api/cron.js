import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 60 };

const COMPETITORS = [
  { name: 'Birbank Biznes', pageId: '105337399287664' },
  { name: 'PASHA Bank', pageId: '210327156022645' },
  { name: 'Rabitabank', pageId: '122276604455876' },
  { name: 'Expressbank', pageId: '151990304851297' },
  { name: 'AccessBank Azerbaijan', pageId: '286598354683995' },
  { name: 'Bank Respublika', pageId: '1509447649321365' },
  { name: 'ABB', pageId: '226184444125006' },
  { name: 'Bank of Baku', pageId: '121234001260907' },
  { name: 'Unibank', pageId: '95588021237' },
];

const clean = (v) => (v || '').trim().replace(/^["']|["']$/g, '');

function mapItem(item, bankName) {
  const snap = item.snapshot || {};
  const adId = item.adArchiveID || item.ad_archive_id || item.adArchiveId || item.id;
  if (!adId) return null;

  const text =
    snap.body?.text ||
    item.adText || item.body || item.ad_creative_body || '';

  const media =
    snap.videos?.[0]?.video_hd_url ||
    snap.videos?.[0]?.video_sd_url ||
    snap.images?.[0]?.original_image_url ||
    snap.cards?.[0]?.video_hd_url ||
    snap.cards?.[0]?.original_image_url ||
    item.videoUrl || item.imageUrl || '';

  return {
    ad_id: String(adId),
    competitor_name: bankName,
    ad_text: String(text).slice(0, 1000),
    media_url: media,
    is_active: item.isActive !== false,
  };
}

export default async function handler(req, res) {
  try {
    const supabaseUrl = new URL(
      clean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
    ).origin;
    const supabaseKey = clean(
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const apifyToken = clean(process.env.APIFY_TOKEN);
    const actorId = clean(process.env.APIFY_ACTOR_ID);

    if (!apifyToken || !actorId) {
      return res.status(200).json({
        status: 'waiting',
        message: 'APIFY_TOKEN və APIFY_ACTOR_ID hələ Vercel-də təyin edilməyib.',
        banks: COMPETITORS.length,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const results = [];

    for (const bank of COMPETITORS) {
      try {
        const adLibraryUrl =
          `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AZ&view_all_page_id=${bank.pageId}`;

        const apifyRes = await fetch(
          `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startUrls: [{ url: adLibraryUrl }], count: 10 }),
          }
        );

        if (!apifyRes.ok) {
          results.push({ bank: bank.name, status: 'Apify xətası', code: apifyRes.status });
          continue;
        }

        const items = await apifyRes.json();
        const rows = (Array.isArray(items) ? items : [])
          .map((it) => mapItem(it, bank.name))
          .filter(Boolean);

        if (rows.length === 0) {
          results.push({ bank: bank.name, status: 'Reklam tapılmadı', received: items?.length || 0 });
          continue;
        }

        const { error } = await supabase
          .from('competitor_ads')
          .upsert(rows, { onConflict: 'ad_id' });

        results.push({
          bank: bank.name,
          status: error ? 'Baza xətası' : 'Uğurlu',
          count: error ? 0 : rows.length,
          error: error?.message,
        });
      } catch (err) {
        results.push({ bank: bank.name, status: 'Xəta', error: err.message });
      }
    }

    return res.status(200).json({ status: 'done', results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
