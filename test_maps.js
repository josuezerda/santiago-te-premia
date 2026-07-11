const mapUrl = 'https://maps.app.goo.gl/PmYmUDMd8imypLYF8?g_st=ic';
fetch(mapUrl, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
  .then(r => console.log(r.url))
  .catch(console.error);
