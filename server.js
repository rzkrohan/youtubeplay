// Untuk menjalankan di komputer sendiri (npm start).
// Di Vercel, file ini tidak dipakai; api/YouTube.js langsung menjadi function.
const express = require("express");
const path = require("path");
const handler = require("./api/YouTube");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.all("/api/YouTube", handler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`YouTube Play Music berjalan di http://localhost:${PORT}`);
});
