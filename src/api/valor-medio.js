const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const corsHandler = cors({ origin: true });
const { supabase } = require('../supabase-client');

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

app.get('/api/addItem/:itemId', async (req, res) => {
  corsHandler(req, res, async () => {
    const itemId = req.params.itemId;

    if (!itemId) return res.status(400).json({ error: 'itemId é obrigatório' });

    try {
      const url = `https://stats.cc/pt/siege/marketplace/${itemId}`;
      const { data: html } = await axios.get(url);
      const $ = cheerio.load(html);

      const nomeTexto = $('.leading-none').first().text().trim().toUpperCase();
      const url_fotoTexto = $('img').first().attr('src');
      let tipoTexto = $('div.bg-base-900').eq(2).text().trim().toUpperCase();
      if (tipoTexto.length === 0) {
        tipoTexto = $('div.bg-base-900').eq(1).text().trim().toUpperCase();
      }
      const arma_operadorTexto = $('div.bg-base-900').eq(0).text().trim().toUpperCase();

      res.status(200).json({
        nome: nomeTexto,
        url_foto: url_fotoTexto,
        tipo: tipoTexto.toUpperCase(),
        arma_operador: arma_operadorTexto.toUpperCase()
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro ao adicionar item' });
    }
  });
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