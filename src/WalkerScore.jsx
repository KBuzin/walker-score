import React, { useState, useCallback } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const CATEGORIES = [
  {
    id: 'medical',
    label: 'Medical Services',
    maxPoints: 27,
    color: '#ef4444',
    inputs: [
      { id: 'hospital', label: 'Distance to nearest hospital with emergency services', max: 8 },
      { id: 'primaryCare', label: 'Density of primary care physicians within 3 miles', max: 5 },
      { id: 'specialists', label: 'Access to specialists (neurology, cardiology, geriatrics)', max: 6 },
      { id: 'pharmacy', label: 'Proximity to pharmacy (within 1 mile)', max: 5 },
      { id: 'medTransport', label: 'Availability of medical transport / ambulance response', max: 3 },
    ],
  },
  {
    id: 'safety',
    label: 'Safety & Emergency Preparedness',
    maxPoints: 22,
    color: '#f97316',
    inputs: [
      { id: 'fireStation', label: 'Distance to fire station & emergency response time', max: 7 },
      { id: 'crimeIndex', label: 'Crime index for surrounding area', max: 6 },
      { id: 'disasterRisk', label: 'Natural disaster / climate risk (flood, wildfire, heat)', max: 5 },
      { id: 'airQuality', label: 'Air quality index (annual average)', max: 4 },
    ],
  },
  {
    id: 'social',
    label: 'Social & Recreational Amenities',
    maxPoints: 17,
    color: '#8b5cf6',
    inputs: [
      { id: 'religious', label: 'Proximity to religious institutions', max: 4 },
      { id: 'parks', label: 'Access to parks and low-intensity nature', max: 5 },
      { id: 'dining', label: 'Proximity to family-friendly dining and retail', max: 4 },
      { id: 'culture', label: 'Access to libraries, theaters, cultural venues', max: 4 },
    ],
  },
  {
    id: 'transportation',
    label: 'Transportation Infrastructure',
    maxPoints: 12,
    color: '#06b6d4',
    inputs: [
      { id: 'transit', label: 'Public transit frequency & accessibility within 0.5 miles', max: 4 },
      { id: 'paratransit', label: 'Availability of paratransit or demand-responsive transit', max: 4 },
      { id: 'rideshare', label: 'Ride-share availability and pickup accessibility', max: 4 },
    ],
  },
  {
    id: 'food',
    label: 'Food & Nutrition Access',
    maxPoints: 10,
    color: '#22c55e',
    inputs: [
      { id: 'grocery', label: 'Proximity to full-service grocery store', max: 4 },
      { id: 'produce', label: 'Access to fresh produce / farmers market', max: 3 },
      { id: 'mealsOnWheels', label: 'Meals on Wheels coverage area', max: 3 },
    ],
  },
  {
    id: 'intergenerational',
    label: 'Intergenerational & Community Access',
    maxPoints: 6,
    color: '#f59e0b',
    inputs: [
      { id: 'schools', label: 'Proximity to schools / youth activity centers', max: 3 },
      { id: 'volunteer', label: 'Access to volunteer organizations & community engagement', max: 3 },
    ],
  },
  {
    id: 'climate',
    label: 'Climate & Environmental Comfort',
    maxPoints: 6,
    color: '#64748b',
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
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityName, location }),
      })
      if (!res.ok) throw new Error('API request failed')
      const data = await res.json()
      if (data.scores) {
        setScores(prev => ({ ...prev, ...data.scores }))
        setLookupResult(data)
      }
    } catch (e) {
      setError('Unable to auto-score this location. Please adjust sliders manually.')
    } finally {
      setIsLoading(false)
    }
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
        <h3 style={{ margin: '0 0 12px', color: '#1e293b' }}>AI-Powered Location Lookup</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            value={communityName}
            onChange={e => setCommunityName(e.target.value)}
            placeholder="Community name (e.g., Sunrise Senior Living)"
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
          />
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="City, State (e.g., Naperville, IL)"
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
          />
          <button
            onClick={handleLookup}
            disabled={isLoading || (!communityName && !location)}
            style={{ padding: '10px 20px', background: isLoading ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: isLoading ? 'default' : 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            {isLoading ? 'Analyzing...' : 'Generate Score →'}
          </button>
        </div>
        {error && <p style={{ color: '#ef4444', marginTop: 8, fontSize: 13 }}>{error}</p>}
        {lookupResult && (
          <div style={{ marginTop: 12, padding: 12, background: '#f0f9ff', borderRadius: 8, fontSize: 13, color: '#0369a1' }}>
            <strong>Confidence: {lookupResult.confidence}</strong> — {lookupResult.summary}
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
            <div
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, background: activeCategory === cat.id ? '#f0f9ff' : 'transparent', border: activeCategory === cat.id ? '1px solid #bae6fd' : '1px solid transparent' }}
            >
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '2px solid', borderColor: activeCategory === cat.id ? cat.color : '#e2e8f0', background: activeCategory === cat.id ? cat.color : '#fff', color: activeCategory === cat.id ? '#fff' : '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}
            >
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
                <input
                  type="range"
                  min={0}
                  max={inp.max}
                  step={1}
                  value={scores[inp.id] || 0}
                  onChange={e => handleSlider(inp.id, e.target.value)}
                  style={{ width: '100%', accentColor: activeCat.color }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 24 }}>Walker Score — Senior Living Assessment Tool</p>
    </div>
  )
}
