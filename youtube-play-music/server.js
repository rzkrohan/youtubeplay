const express = require("express");
const path = require("path");
const yt = require("./api/YouTube");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// Wrapper agar error selalu dikirim sebagai JSON
const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    res.status(500).json({ error: err.message || "Terjadi kesalahan" });
  }
};

app.get("/api/home", handle(() => yt.home()));

app.get(
  "/api/search",
  handle((req) => {
    const q = String(req.query.q || "").trim();
    return q ? yt.search(q) : [];
  })
);

app.get(
  "/api/audio",
  handle((req) => {
    const id = String(req.query.id || "");
    if (!/^[\w-]{11}$/.test(id)) throw new Error("ID video tidak valid");
    return yt.getAudio(id);
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`YouTube Play Music berjalan di http://localhost:${PORT}`);
});
