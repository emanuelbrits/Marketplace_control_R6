const functions = require("firebase-functions");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require('cors');
const corsHandler = cors({ origin: true });

exports.valorMedio = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const itemId = req.query.itemId;

    if (!itemId) return res.status(400).json({ error: 'itemId é obrigatório' });

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
  });
});
