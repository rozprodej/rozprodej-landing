// Vercel serverless funkce: uloží e-mail zájemce do Supabase tabulky "zajemci".
// Potřebuje env proměnné SUPABASE_URL a SUPABASE_SERVICE_KEY (nastavíš ve Vercelu).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const email = (req.body && req.body.email || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Neplatný e-mail' });
  }
  try {
    const r = await fetch(process.env.SUPABASE_URL + '/rest/v1/zajemci', {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email }),
    });
    if (!r.ok) {
      const txt = await r.text();
      // duplicitní e-mail vracíme jako úspěch, ať formulář nehlásí chybu
      if (txt.includes('duplicate')) return res.status(200).json({ ok: true });
      return res.status(500).json({ error: 'Uložení selhalo' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
