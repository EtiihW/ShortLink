
let linkDatabase = {
    'abc123': 'https://example.com/очень-длинная-ссылка',
    'test': 'https://google.com'
  };
  
  export default function handler(req, res) {
    const { code } = req.query;
    const originalUrl = linkDatabase[code];
    if (originalUrl) {
      res.redirect(301, originalUrl);
    } else {
      res.status(404).json({ error: 'Ссылка не найдена' });
    }
  }