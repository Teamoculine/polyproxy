const express = require("express");
const app = express();

app.use(express.json());

// Fuck CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.post("/", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).send("Missing 'url' in request body.");
  }

  // Strip headers that would break the outgoing request
  const blocklist = ["host", "content-length", "connection", "transfer-encoding", "content-type"];
  const forwardHeaders = Object.fromEntries(
    Object.entries(req.headers).filter(([k]) => !blocklist.includes(k.toLowerCase()))
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: forwardHeaders,
      redirect: "follow",
    });

    const body = await response.arrayBuffer();

    // Forward the content-type back so the client knows what it got
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    res.status(response.status).send(Buffer.from(body));
  } catch (err) {
    res.status(500).send(`Fetch failed: ${err.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
