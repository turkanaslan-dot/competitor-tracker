import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cədvəldəki bütün banklar və onların Meta Page ID-ləri
const COMPETITORS = [
  { name: 'Birbank Biznes', pageId: '105337399287664' },
  { name: 'PASHA Bank', pageId: '210327156022645' },
  { name: 'Rabitabank', pageId: '122276604455876' },
  { name: 'Expressbank', pageId: '151990304851297' },
  { name: 'AccessBank Azerbaijan', pageId: '286598354683995' },
  { name: 'Bank Respublika', pageId: '1509447649321365' },
  { name: 'ABB', pageId: '226184444125006' },
  { name: 'Bank of Baku', pageId: '121234001260907' },
  { name: 'Unibank', pageId: '95588021237' }
];

export default async function handler(req, res) {
  try {
    let totalAdsInserted = 0;

    for (const competitor of COMPETITORS) {
      const targetUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${competitor.pageId}`;
      
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const adsFound = [];

      $('div').each((i, elem) => {
        const adText = $(elem).find('span').text().trim();
        if (adText && adText.length > 20) {
          adsFound.push({
            competitor_name: competitor.name,
            ad_text: adText.slice(0, 500),
            media_url: '',
            is_active: true
          });
        }
      });

      if (adsFound.length > 0) {
        // Hər bank üzrə tapılan son 5 reklamı bazaya əlavə edirik
        const uniqueAds = adsFound.slice(0, 5);
        const { error } = await supabase.from('competitor_ads').insert(uniqueAds);
        if (!error) {
          totalAdsInserted += uniqueAds.length;
        }
      }
    }

    return res.status(200).json({ 
      status: 'success', 
      message: `${COMPETITORS.length} bank üzrə ümumi ${totalAdsInserted} reklam bazaya əlavə olundu!` 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
