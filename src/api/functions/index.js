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
      const valorTexto = valores.eq(2).text().trim().replace(/[.,]/g, '');
      res.status(200).json({ valorMedio: valorTexto });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar valor médio' });
    }
  });
});

exports.getItem = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const itemId = req.query.itemId;

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
