const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/api/valor-medio/:itemId', async (req, res) => {
  const { itemId } = req.params;

  try {
    const url = `https://stats.cc/pt/siege/marketplace/${itemId}`;
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const valores = $('.leading-none');
    const valorTexto = valores.eq(2).text().trim();

    res.json({ valorMedio: valorTexto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar valor médio' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
