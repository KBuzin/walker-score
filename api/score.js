export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { communityName, location } = req.body
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const prompt = `You are a senior living location analyst. Based on the community name and/or location provided, estimate Walker Score values for each metric below. Return ONLY a valid JSON object with no explanation.

Community: ${communityName || 'Not specified'}
Location: ${location || 'Not specified'}

Return JSON in this exact format:
{
  "summary": "Brief 1-2 sentence description of location",
  "confidence": "High|Medium|Low",
  "scores": {
    "hospital": <0-8>,
    "primaryCare": <0-5>,
    "specialists": <0-6>,
    "pharmacy": <0-5>,
    "medTransport": <0-3>,
    "fireStation": <0-7>,
    "crimeIndex": <0-6>,
    "disasterRisk": <0-5>,
    "airQuality": <0-4>,
    "religious": <0-4>,
    "parks": <0-5>,
    "dining": <0-4>,
    "culture": <0-4>,
    "transit": <0-4>,
    "paratransit": <0-4>,
    "rideshare": <0-4>,
    "grocery": <0-4>,
    "produce": <0-3>,
    "mealsOnWheels": <0-3>,
    "schools": <0-3>,
    "volunteer": <0-3>,
    "temperature": <0-4>,
    "humidity": <0-2>
  }
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0])
    return res.status(200).json(parsed)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
