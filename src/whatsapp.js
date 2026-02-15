export function extractIncomingMessages(payload) {
  const out = [];
  const entries = payload?.entry || [];
  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const ch of changes) {
      const value = ch?.value;
      const messages = value?.messages || [];
      for (const m of messages) {
        const from = m.from;
        const id = m.id;
        const text = m?.text?.body;
        if (from && id && typeof text === 'string' && text.trim()) {
          out.push({ from, id, text: text.trim() });
        }
      }
    }
  }
  return out;
}

export async function sendWhatsAppText({
  graphApiVersion,
  phoneNumberId,
  accessToken,
  to,
  text,
}) {
  const url = `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`WhatsApp send error: ${res.status} ${res.statusText}${body ? ` - ${body}` : ''}`);
  }

  return res.json().catch(() => ({}));
}
