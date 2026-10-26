import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const COMPETITORS = [
  { name: 'Rəqib A', pageId: '100000000000000' }, // Buraya rəqibin Meta Page ID-sini yazacaqsınız
];

export default async function handler(req, res) {
  try {
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
        const uniqueAds = adsFound.slice(0, 5);
        await supabase.from('competitor_ads').insert(uniqueAds);
      }
    }

    return res.status(200).json({ status: 'success', message: 'Məlumatlar yeniləndi!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
