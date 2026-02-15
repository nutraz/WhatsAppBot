export async function generateReply({ apiKey, model, systemPrompt, userText, businessName }) {
  const prompt = `${systemPrompt}\n\nBusiness: ${businessName}`;

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: prompt }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userText }],
        },
      ],
      // Keep it short for WhatsApp
      max_output_tokens: 250,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI error: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }

  const data = await res.json();
  // Responses API convenience field
  const out = data.output_text;
  if (typeof out === 'string' && out.trim()) return out.trim();

  // Fallback: attempt to extract from output array
  const chunks = [];
  for (const item of data.output || []) {
    for (const c of item.content || []) {
      if (c.type === 'output_text' && c.text) chunks.push(c.text);
    }
  }
  const joined = chunks.join('').trim();
  if (!joined) throw new Error('OpenAI returned empty output');
  return joined;
}
