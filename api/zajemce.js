// Vercel serverless funkce: uloží e-mail zájemce do Supabase tabulky "zajemci".
// DIAGNOSTICKÁ VERZE: při chybě vrací i konkrétní důvod, ať vidíme, co je špatně.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  // kontrola, že proměnné vůbec dorazily do funkce
  if (!url || !key) {
    return res.status(500).json({
      error: 'Chybí env proměnné',
      hasUrl: !!url,
      hasKey: !!key,
    });
  }

  const email = ((req.body && req.body.email) || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Neplatný e-mail' });
  }

  try {
    const base = url.replace(/\/+$/, ''); // odstraní případné lomítko na konci
    const r = await fetch(base + '/rest/v1/zajemci', {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email }),
    });

    if (!r.ok) {
      const txt = await r.text();
      if (txt.includes('duplicate')) return res.status(200).json({ ok: true });
      // vrátíme konkrétní odpověď Supabase, ať víme důvod
      return res.status(500).json({
        error: 'Supabase odmítl zápis',
        status: r.status,
        detail: txt.slice(0, 300),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Vyjimka', detail: String(e).slice(0, 300) });
  }
}
