import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase URL və ya Key tapılmadı! Vercel Environment Variables hissəsini yoxlayın.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('competitor_ads')
      .insert([
        { 
          competitor_name: 'Test Bank', 
          ad_text: 'Sistem uğurla işlədi!', 
          media_url: '', 
          is_active: true 
        }
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ status: 'success', message: 'Baza əlaqəsi quruldu və test məlumatı yazıldı!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
