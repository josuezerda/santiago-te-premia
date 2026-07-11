const mapUrl = 'https://maps.app.goo.gl/WuNhfJ4LU9VPHE85A';
fetch(mapUrl, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
  .then(r => console.log(r.url))
  .catch(console.error);
