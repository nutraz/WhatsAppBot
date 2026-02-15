function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT || 3000),

  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,

  whatsappVerifyToken: requireEnv('WHATSAPP_VERIFY_TOKEN'),
  metaAppSecret: process.env.META_APP_SECRET || '',
  graphApiVersion: process.env.GRAPH_API_VERSION || 'v20.0',
  phoneNumberId: requireEnv('WHATSAPP_PHONE_NUMBER_ID'),
  whatsappAccessToken: requireEnv('WHATSAPP_ACCESS_TOKEN'),

  openaiApiKey: requireEnv('OPENAI_API_KEY'),
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',

  businessName: process.env.BUSINESS_NAME || 'Business',
  defaultSystemPrompt:
    process.env.DEFAULT_SYSTEM_PROMPT ||
    'You are a helpful WhatsApp assistant for a small business. Be concise and accurate.',
};
