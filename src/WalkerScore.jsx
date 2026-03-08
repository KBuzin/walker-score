import React, { useState, useCallback } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

const CATEGORIES = [
  {
    id: 'medical', label: 'Medical Services', maxPoints: 27, color: '#ef4444',
    inputs: [
      { id: 'hospital', label: 'Distance to nearest hospital with emergency services', max: 8 },
      { id: 'primaryCare', label: 'Density of primary care physicians within 3 miles', max: 5 },
      { id: 'specialists', label: 'Access to specialists (neurology, cardiology, geriatrics)', max: 6 },
      { id: 'pharmacy', label: 'Proximity to pharmacy (within 1 mile)', max: 5 },
      { id: 'medTransport', label: 'Availability of medical transport / ambulance response', max: 3 },
    ],
  },
  {
    id: 'safety', label: 'Safety & Emergency Preparedness', maxPoints: 22, color: '#f97316',
    inputs: [
      { id: 'fireStation', label: 'Distance to fire station & emergency response time', max: 7 },
      { id: 'crimeIndex', label: 'Crime index for surrounding area', max: 6 },
      { id: 'disasterRisk', label: 'Natural disaster / climate risk (flood, wildfire, heat)', max: 5 },
      { id: 'airQuality', label: 'Air quality index (annual average)', max: 4 },
    ],
  },
  {
    id: 'social', label: 'Social & Recreational Amenities', maxPoints: 17, color: '#8b5cf6',
    inputs: [
      { id: 'religious', label: 'Proximity to religious institutions', max: 4 },
      { id: 'parks', label: 'Access to parks and low-intensity nature', max: 5 },
      { id: 'dining', label: 'Proximity to family-friendly dining and retail', max: 4 },
      { id: 'culture', label: 'Access to libraries, theaters, cultural venues', max: 4 },
    ],
  },
  {
    id: 'transportation', label: 'Transportation Infrastructure', maxPoints: 12, color: '#06b6d4',
    inputs: [
      { id: 'transit', label: 'Public transit frequency & accessibility within 0.5 miles', max: 4 },
      { id: 'paratransit', label: 'Availability of paratransit or demand-responsive transit', max: 4 },
      { id: 'rideshare', label: 'Ride-share availability and pickup accessibility', max: 4 },
    ],
  },
  {
    id: 'food', label: 'Food & Nutrition Access', maxPoints: 10, color: '#22c55e',
    inputs: [
      { id: 'grocery', label: 'Proximity to full-service grocery store', max: 4 },
      { id: 'produce', label: 'Access to fresh produce / farmers market', max: 3 },
      { id: 'mealsOnWheels', label: 'Meals on Wheels coverage area', max: 3 },
    ],
  },
  {
    id: 'intergenerational', label: 'Intergenerational & Community Access', maxPoints: 6, color: '#f59e0b',
    inputs: [
      { id: 'schools', label: 'Proximity to schools / youth activity centers', max: 3 },
      { id: 'volunteer', label: 'Access to volunteer organizations & community engagement', max: 3 },
    ],
  },
  {
    id: 'climate', label: 'Climate & Environmental Comfort', maxPoints: 6, color: '#64748b',
    inputs: [
      { id: 'temperature', label: 'Annual temperature range and extreme heat/cold days', max: 4 },
      { id: 'humidity', label: 'Humidity and overall livability index', max: 2 },
    ],
  },
]

const TIERS = [
  { min: 90, label: "Walker's Paradise", color: '#16a34a', desc: 'Exceptional across all family-relevant categories' },
  { min: 75, label: 'Senior Sanctuary', color: '#65a30d', desc: 'Strong fundamentals; minor gaps in 1-2 categories' },
  { min: 55, label: 'Family Friendly', color: '#ca8a04', desc: 'Solid but requires community to compensate in weak areas' },
  { min: 35, label: 'Care Dependent', color: '#ea580c', desc: 'Relies heavily on on-site resources; limited external support' },
  { min: 0, label: 'Isolated', color: '#dc2626', desc: 'Significant access gaps; community must be largely self-sufficient' },
]

// Location scoring profiles by type
const LOCATION_PROFILES = {
  major_urban: {
    label: 'Major Urban Metro',
    confidence: 'High',
    scores: { hospital:7, primaryCare:5, specialists:6, pharmacy:5, medTransport:3, fireStation:6, crimeIndex:3, disasterRisk:4, airQuality:3, religious:4, parks:4, dining:4, culture:4, transit:4, paratransit:4, rideshare:4, grocery:4, produce:3, mealsOnWheels:3, schools:3, volunteer:3, temperature:3, humidity:2 }
  },
  large_suburban: {
    label: 'Large Suburban Area',
    confidence: 'High',
    scores: { hospital:6, primaryCare:5, specialists:5, pharmacy:5, medTransport:3, fireStation:6, crimeIndex:5, disasterRisk:4, airQuality:4, religious:4, parks:4, dining:4, culture:3, transit:2, paratransit:3, rideshare:4, grocery:4, produce:2, mealsOnWheels:3, schools:3, volunteer:3, temperature:3, humidity:2 }
  },
  small_suburban: {
    label: 'Small Suburban / Outer Suburb',
    confidence: 'Medium',
    scores: { hospital:5, primaryCare:4, specialists:4, pharmacy:4, medTransport:2, fireStation:5, crimeIndex:5, disasterRisk:4, airQuality:4, religious:4, parks:4, dining:3, culture:2, transit:1, paratransit:2, rideshare:3, grocery:3, produce:2, mealsOnWheels:2, schools:2, volunteer:2, temperature:3, humidity:2 }
  },
  small_city: {
    label: 'Small City',
    confidence: 'Medium',
    scores: { hospital:5, primaryCare:4, specialists:3, pharmacy:4, medTransport:2, fireStation:5, crimeIndex:4, disasterRisk:4, airQuality:4, religious:4, parks:3, dining:3, culture:3, transit:2, paratransit:2, rideshare:3, grocery:3, produce:2, mealsOnWheels:2, schools:2, volunteer:2, temperature:3, humidity:2 }
  },
  rural: {
    label: 'Rural / Small Town',
    confidence: 'Low',
    scores: { hospital:2, primaryCare:2, specialists:1, pharmacy:2, medTransport:1, fireStation:3, crimeIndex:6, disasterRisk:3, airQuality:4, religious:3, parks:4, dining:1, culture:1, transit:0, paratransit:1, rideshare:1, grocery:2, produce:2, mealsOnWheels:1, schools:1, volunteer:2, temperature:2, humidity:2 }
  }
}

// State climate adjustments
const STATE_CLIMATE = {
  FL: { temperature: 1, humidity: 0 }, TX: { temperature: 1, humidity: 1 },
  AZ: { temperature: 2, humidity: 2 }, CA: { temperature: 4, humidity: 2 },
  CO: { temperature: 3, humidity: 2 }, NC: { temperature: 3, humidity: 1 },
  SC: { temperature: 2, humidity: 1 }, GA: { temperature: 2, humidity: 1 },
  WA: { temperature: 3, humidity: 1 }, OR: { temperature: 3, humidity: 2 },
  MN: { temperature: 1, humidity: 2 }, WI: { temperature: 1, humidity: 2 },
  IL: { temperature: 2, humidity: 2 }, OH: { temperature: 2, humidity: 2 },
  PA: { temperature: 3, humidity: 2 }, NY: { temperature: 3, humidity: 2 },
  MA: { temperature: 3, humidity: 2 }, VA: { temperature: 3, humidity: 1 },
}

// Known major cities -> profile
const CITY_PROFILES = {
  // Major metros
  'new york': 'major_urban', 'chicago': 'major_urban', 'los angeles': 'major_urban',
  'houston': 'major_urban', 'phoenix': 'major_urban', 'philadelphia': 'major_urban',
  'san antonio': 'major_urban', 'san diego': 'major_urban', 'dallas': 'major_urban',
  'san jose': 'major_urban', 'austin': 'major_urban', 'jacksonville': 'major_urban',
  'fort worth': 'major_urban', 'columbus': 'major_urban', 'charlotte': 'major_urban',
  'indianapolis': 'large_suburban', 'san francisco': 'major_urban', 'seattle': 'major_urban',
  'denver': 'major_urban', 'boston': 'major_urban', 'washington': 'major_urban',
  'dc': 'major_urban', 'nashville': 'major_urban', 'memphis': 'large_suburban',
  'portland': 'major_urban', 'las vegas': 'major_urban', 'louisville': 'large_suburban',
  'baltimore': 'major_urban', 'milwaukee': 'large_suburban', 'albuquerque': 'large_suburban',
  'tucson': 'large_suburban', 'fresno': 'large_suburban', 'sacramento': 'major_urban',
  'mesa': 'large_suburban', 'kansas city': 'large_suburban', 'atlanta': 'major_urban',
  'omaha': 'large_suburban', 'colorado springs': 'large_suburban', 'raleigh': 'large_suburban',
  'long beach': 'large_suburban', 'virginia beach': 'large_suburban', 'miami': 'major_urban',
  'tampa': 'large_suburban', 'orlando': 'large_suburban',
  // Notable suburban/smaller cities
  'naperville': 'large_suburban', 'scottsdale': 'large_suburban', 'henderson': 'large_suburban',
  'plano': 'large_suburban', 'chandler': 'large_suburban', 'gilbert': 'large_suburban',
  'irvine': 'large_suburban', 'fremont': 'large_suburban', 'boise': 'small_city',
  'spokane': 'small_city', 'richmond': 'large_suburban', 'des moines': 'small_city',
  'salt lake city': 'large_suburban', 'little rock': 'small_city', 'jackson': 'small_city',
  'birmingham': 'small_city', 'rochester': 'small_city', 'buffalo': 'small_city',
  'worcester': 'small_city', 'hartford': 'small_city', 'providence': 'small_city',
}

function classifyLocation(locationStr) {
  if (!locationStr) return null
  const lower = locationStr.toLowerCase()
  // Check known cities
  for (const [city, profile] of Object.entries(CITY_PROFILES)) {
    if (lower.includes(city)) return profile
  }
  // Heuristic: if contains state abbreviation only with small word, guess rural
  const words = lower.split(/[,\s]+/).filter(w => w.length > 2)
  if (words.length <= 1) return 'small_city'
  return 'small_suburban' // default reasonable guess
}

function getStateCode(locationStr) {
  if (!locationStr) return null
  const match = locationStr.match(/\b([A-Z]{2})\b/)
  return match ? match[1] : null
}

function generateScores(communityName, location) {
  const profileKey = classifyLocation(location) || 'small_suburban'
  const profile = LOCATION_PROFILES[profileKey]
  const stateCode = getStateCode(location)
  const climateAdj = stateCode ? (STATE_CLIMATE[stateCode] || {}) : {}
  
  const scores = { ...profile.scores }
  // Apply climate adjustments
  if (climateAdj.temperature !== undefined) scores.temperature = Math.min(4, climateAdj.temperature)
  if (climateAdj.humidity !== undefined) scores.humidity = Math.min(2, climateAdj.humidity)
  
  // Community name hints
  const nameLower = (communityName || '').toLowerCase()
  if (nameLower.includes('medical') || nameLower.includes('health')) scores.hospital = Math.min(8, scores.hospital + 1)
  if (nameLower.includes('village') || nameLower.includes('gardens')) scores.parks = Math.min(5, scores.parks + 1)
  if (nameLower.includes('resort') || nameLower.includes('luxury')) {
    scores.dining = Math.min(4, scores.dining + 1)
    scores.culture = Math.min(4, scores.culture + 1)
  }
  
  const cityName = location ? location.split(',')[0].trim() : ''
  const displayLocation = [cityName, stateCode].filter(Boolean).join(', ') || location || 'this area'
  
  const descriptions = {
    major_urban: `${communityName || 'This community'} is located in a major urban metro near ${displayLocation}, offering excellent access to healthcare, transit, and amenities.`,
    large_suburban: `${communityName || 'This community'} sits in a well-developed suburban area near ${displayLocation} with good services and moderate transit options.`,
    small_suburban: `${communityName || 'This community'} is in a smaller suburban area near ${displayLocation} with adequate local services and limited public transit.`,
    small_city: `${communityName || 'This community'} is located in a smaller city near ${displayLocation} with reasonable access to healthcare and community services.`,
    rural: `${communityName || 'This community'} is in a rural or small-town setting near ${displayLocation} — residents rely heavily on on-site resources.`,
  }
  
  return {
    scores,
    confidence: profile.confidence,
    summary: descriptions[profileKey],
    locationType: profile.label,
  }
}

function getTier(score) {
  return TIERS.find(t => score >= t.min) || TIERS[TIERS.length - 1]
}

function initScores() {
  const s = {}
  CATEGORIES.forEach(cat => cat.inputs.forEach(inp => { s[inp.id] = 0 }))
  return s
}

export default function WalkerScore() {
  const [communityName, setCommunityName] = useState('')
  const [location, setLocation] = useState('')
  const [scores, setScores] = useState(initScores)
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
  const [isLoading, setIsLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState(null)
  const [error, setError] = useState(null)

  const catScores = CATEGORIES.map(cat => ({
    ...cat,
    earned: cat.inputs.reduce((sum, inp) => sum + (scores[inp.id] || 0), 0),
  }))
  const totalScore = catScores.reduce((sum, cat) => sum + cat.earned, 0)
  const tier = getTier(totalScore)

  const handleSlider = useCallback((inputId, value) => {
    setScores(prev => ({ ...prev, [inputId]: Number(value) }))
  }, [])

  const handleLookup = async () => {
    if (!communityName && !location) return
    setIsLoading(true)
    setError(null)
    setLookupResult(null)
    
    // Simulate brief loading for UX
    await new Promise(r => setTimeout(r, 800))
    
    try {
      const result = generateScores(communityName, location)
      setScores(prev => ({ ...prev, ...result.scores }))
      setLookupResult(result)
    } catch (e) {
      setError('Unable to auto-score this location. Please adjust sliders manually.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLookup()
  }

  const radarData = catScores.map(cat => ({
    subject: cat.label.split(' ')[0],
    score: Math.round((cat.earned / cat.maxPoints) * 100),
    fullMark: 100,
  }))

  const activeCat = CATEGORIES.find(c => c.id === activeCategory)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 1100, margin: '0 auto', padding: '24px 16px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: 0 }}>Walker Score</h1>
        <p style={{ color: '#64748b', marginTop: 8 }}>Senior Living Community Assessment Tool</p>
      </div>

      {/* Lookup */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 4px', color: '#1e293b' }}>Location Lookup</h3>
        <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13 }}>Enter a community name and location to auto-populate scores based on area characteristics.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            value={communityName}
            onChange={e => setCommunityName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Community name (e.g., Sunrise Senior Living)"
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
          />
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="City, State (e.g., Naperville, IL)"
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
          />
          <button
            onClick={handleLookup}
            disabled={isLoading || (!communityName && !location)}
            style={{ padding: '10px 20px', background: isLoading ? '#94a3b8' : ((!communityName && !location) ? '#94a3b8' : '#3b82f6'), color: '#fff', border: 'none', borderRadius: 8, cursor: isLoading ? 'default' : 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            {isLoading ? 'Analyzing...' : 'Generate Score →'}
          </button>
        </div>
        {error && <p style={{ color: '#ef4444', marginTop: 8, fontSize: 13 }}>{error}</p>}
        {lookupResult && (
          <div style={{ marginTop: 12, padding: 12, background: '#f0f9ff', borderRadius: 8, fontSize: 13, color: '#0369a1', borderLeft: '3px solid #0ea5e9' }}>
            <div><strong>Location Type:</strong> {lookupResult.locationType} &nbsp;|&nbsp; <strong>Confidence:</strong> {lookupResult.confidence}</div>
            <div style={{ marginTop: 4, color: '#334155' }}>{lookupResult.summary}</div>
            <div style={{ marginTop: 6, color: '#64748b', fontSize: 12 }}>Scores auto-populated below. Adjust sliders to fine-tune based on your site visit.</div>
          </div>
        )}
      </div>

      {/* Score Display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: 72, fontWeight: 800, color: tier.color, lineHeight: 1 }}>{totalScore}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tier.color, marginTop: 4 }}>{tier.label}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{tier.desc}</div>
          {(communityName || location) && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#f1f5f9', borderRadius: 8, fontSize: 13, color: '#475569' }}>
              {[communityName, location].filter(Boolean).join(' — ')}
            </div>
          )}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Bars */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Category Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {catScores.map(cat => (
            <div key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '8px 12px', borderRadius: 8,
                background: activeCategory === cat.id ? '#f0f9ff' : 'transparent',
                border: activeCategory === cat.id ? '1px solid #bae6fd' : '1px solid transparent' }}>
              <span style={{ fontSize: 13, color: '#475569', width: 220, flexShrink: 0 }}>{cat.label}</span>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                <div style={{ width: `${(cat.earned / cat.maxPoints) * 100}%`, background: cat.color, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: cat.color, width: 60, textAlign: 'right' }}>{cat.earned}/{cat.maxPoints}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#1e293b' }}>Fine-Tune Scores</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '2px solid',
                borderColor: activeCategory === cat.id ? cat.color : '#e2e8f0',
                background: activeCategory === cat.id ? cat.color : '#fff',
                color: activeCategory === cat.id ? '#fff' : '#475569',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}>
              {cat.label.split(' ')[0]} ({catScores.find(c => c.id === cat.id)?.earned}/{cat.maxPoints})
            </button>
          ))}
        </div>
        {activeCat && (
          <div>
            <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>{activeCat.label}</h3>
            {activeCat.inputs.map(inp => (
              <div key={inp.id} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, color: '#475569' }}>{inp.label}</label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{scores[inp.id] || 0} / {inp.max}</span>
                </div>
                <input type="range" min={0} max={inp.max} step={1} value={scores[inp.id] || 0}
                  onChange={e => handleSlider(inp.id, e.target.value)}
                  style={{ width: '100%', accentColor: activeCat.color }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 24 }}>
        Walker Score — Senior Living Assessment Tool
      </p>
    </div>
  )
       }
