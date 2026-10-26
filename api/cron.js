import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    // Bazaya test reklamı yazaraq əlaqəni yoxlayırıq
    const { data, error } = await supabase
      .from('competitor_ads')
      .insert([
        { 
          competitor_name: 'Test Bank', 
          ad_text: 'Bu sistemin işləkliyini yoxlamaq üçün test reklamıdır.', 
          media_url: '', 
          is_active: true 
        }
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      status: 'success', 
      message: 'Sistem uğurla işlədi və baza ilə əlaqə quruldu!' 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
