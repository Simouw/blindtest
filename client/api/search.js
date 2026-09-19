export default async function handler(req, res) {
  const { q, id, limit = '25' } = req.query;
  try {
    let url;
    if (id) {
      url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=song&limit=${limit}&country=US`;
    } else {
      url = `https://itunes.apple.com/search?term=${encodeURIComponent(q || 'Coldplay')}&entity=song&limit=${limit}&country=US`;
    }
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream error', status: response.status });
    }
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
