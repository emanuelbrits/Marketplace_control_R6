const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

app.use(cors());

app.get("/", (req, res) => res.send("Express on Vercel"));

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

module.exports = async (req, res) => {
  const {
    query: { itemId },
  } = req;

  if (!itemId) {
    return res.status(400).json({ error: 'itemId é obrigatório' });
  }

  try {
    const url = `https://stats.cc/pt/siege/marketplace/${itemId}`;
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const valores = $('.leading-none');
    const valorTexto = valores.eq(2).text().trim();

    res.status(200).json({ valorMedio: valorTexto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar valor médio' });
  }
};