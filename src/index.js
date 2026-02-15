import express from 'express';

import { env } from './env.js';
import { verifyMetaSignature } from './crypto.js';
import { extractIncomingMessages, sendWhatsAppText } from './whatsapp.js';
import { generateReply } from './openai.js';

const app = express();

// Capture raw body for signature verification.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

const seenMessageIds = new Set();
setInterval(() => {
  // Simple bounded cache; good enough for small business scale.
  if (seenMessageIds.size > 5000) {
    const keep = Array.from(seenMessageIds).slice(-2000);
    seenMessageIds.clear();
    for (const id of keep) seenMessageIds.add(id);
  }
}, 60_000).unref();

app.get('/health', (_req, res) => res.status(200).send('ok'));

// Meta webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.whatsappVerifyToken) {
    return res.status(200).send(String(challenge || ''));
  }
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  const sig = req.get('X-Hub-Signature-256');
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const verified = verifyMetaSignature({ appSecret: env.metaAppSecret, rawBody, header: sig });

  if (!verified.ok) {
    return res.status(401).json({ ok: false, error: 'invalid-signature', reason: verified.reason });
  }

  // Acknowledge quickly; do processing async-ish.
  res.sendStatus(200);

  try {
    const incoming = extractIncomingMessages(req.body);
    for (const msg of incoming) {
      if (seenMessageIds.has(msg.id)) continue;
      seenMessageIds.add(msg.id);

      const reply = await generateReply({
        apiKey: env.openaiApiKey,
        model: env.openaiModel,
        systemPrompt: env.defaultSystemPrompt,
        userText: msg.text,
        businessName: env.businessName,
      });

      await sendWhatsAppText({
        graphApiVersion: env.graphApiVersion,
        phoneNumberId: env.phoneNumberId,
        accessToken: env.whatsappAccessToken,
        to: msg.from,
        text: reply,
      });
    }
  } catch (err) {
    // Don't crash webhook server. Log and keep going.
    console.error(err);
  }
});

app.listen(env.port, () => {
  console.log(`WhatsApp AI bot listening on ${env.publicBaseUrl} (port ${env.port})`);
});
