require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose');
const bodyParser = require("body-parser");
const { Schema } = mongoose;
const dns = require("dns");

// Basic Configuration
const port = process.env.PORT || 3000;
let uri = 'mongodb+srv://Per:<password>@cluster0.4ch8y.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.urlencoded());
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})
const urlModel = mongoose.model("URL", urlSchema);

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  let url = req.body.url
  if (!/(https?:\/\/)/.test(url)) return res.send({ error: "invalid url" })
  let urlDns = url.replace(url.match(/(https?:\/\/)/)[0], "")
  dns.lookup(new URL(url).hostname, async (e) => {
    if (!e) {
      const numUrl = await urlModel.estimatedDocumentCount();
      let urlDoc = new urlModel({
        original_url: url,
        short_url: numUrl + 1
      })
      urlDoc.save()
      res.json({ original_url: urlDoc.original_url, short_url: Number(urlDoc.short_url) });
    } else {
      res.status(404).send({ error: "invalid HostName" })
    }
  })
})

app.get("/api/shorturl/:id", async (req, res) => {
  let id = req.params.id
  let url = await urlModel.findOne({ short_url: id })

  res.redirect(url.original_url)
})
app.get("/api", async (req, res) => {
  const urls = await urlModel.find({})
  res.json(urls)
})

app.get("/api/delete", async (req, res) => {
  await urlModel.deleteMany({})
  res.send("La base de datos ha sido eliminada")
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
