const { ytmp3 } = require("yt-downld");

// youtubei.js adalah ESM, jadi di-import secara dinamis dan dibuat sekali saja
let ytPromise = null;
function getYT() {
  if (!ytPromise) {
    ytPromise = import("youtubei.js").then(({ Innertube }) => Innertube.create());
  }
  return ytPromise;
}

const textOf = (v) => (typeof v === "string" ? v : v?.text || "");

function toTrack(v) {
  const id = v.video_id || v.id;
  const thumbs = v.thumbnails || v.thumbnail?.thumbnails || [];
  return {
    id,
    title: textOf(v.title),
    artist: textOf(v.author?.name || v.author),
    duration: textOf(v.duration),
    thumbnail: thumbs.length
      ? thumbs[thumbs.length - 1].url
      : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

async function search(query) {
  const yt = await getYT();
  const res = await yt.search(query, { type: "video" });
  return (res.videos || []).filter((v) => v.video_id).map(toTrack);
}

const HOME_QUERIES = [
  { label: "Populer di Indonesia", q: "lagu indonesia populer" },
  { label: "Top Hits", q: "top hits terbaru" },
  { label: "Pop Barat Terbaru", q: "lagu pop barat terbaru" },
  { label: "Santai untuk Belajar", q: "lagu santai untuk belajar" },
  { label: "Lagu Galau", q: "lagu galau" },
];

async function home() {
  return Promise.all(
    HOME_QUERIES.map(async ({ label, q }) => {
      try {
        return { label, items: (await search(q)).slice(0, 10) };
      } catch {
        return { label, items: [] };
      }
    })
  );
}

const cache = new Map();

async function getAudio(id) {
  if (cache.has(id)) return cache.get(id);

  let r;
  try {
    r = await ytmp3(`https://youtu.be/${id}`);
  } catch (err) {
    console.error("ytmp3 error:", err);
    throw new Error("Gagal mengambil audio: " + (err?.message || String(err)));
  }

  console.log("ytmp3 result:", JSON.stringify(r));
  if (!r || !r.download) {
    throw new Error("Gagal mengambil audio. Respons: " + JSON.stringify(r));
  }

  const data = { title: r.title, duration: r.duration, download: r.download };
  cache.set(id, data);
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  return data;
}

const send = (res, status, data) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

// Satu endpoint: /api/YouTube?action=home | search&q=... | audio&id=...
module.exports = async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const action = url.searchParams.get("action");

  try {
    if (action === "home") {
      return send(res, 200, await home());
    }

    if (action === "search") {
      const q = (url.searchParams.get("q") || "").trim();
      return send(res, 200, q ? await search(q) : []);
    }

    if (action === "audio") {
      const id = url.searchParams.get("id") || "";
      if (!/^[\w-]{11}$/.test(id)) {
        return send(res, 400, { error: "ID video tidak valid" });
      }
      return send(res, 200, await getAudio(id));
    }

    return send(res, 400, { error: "Action tidak dikenal" });
  } catch (err) {
    send(res, 500, { error: err.message || "Terjadi kesalahan" });
  }
};
