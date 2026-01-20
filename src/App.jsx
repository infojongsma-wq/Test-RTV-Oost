import { useState, useEffect, useMemo } from 'react'
import './App.css'

// Party colors mapping
const PARTY_COLORS = {
  'vvd': '#FF6600',
  'pvda': '#E12B1A',
  'cda': '#007B5F',
  'd66': '#00AA4F',
  'groenlinks': '#00AA00',
  'gl': '#00AA00',
  'pvv': '#002F6C',
  'sp': '#EE0000',
  'christenunie': '#00AEEF',
  'cu': '#00AEEF',
  'bbb': '#95C11F',
  'volt': '#582C83',
  'pvdd': '#006B2D',
  'partij voor de dieren': '#006B2D',
  'fvd': '#8B1538',
  'forum voor democratie': '#8B1538',
  'ja21': '#1E3A5F',
  'denk': '#00C8C8',
  'bij1': '#FFE500',
  'sgp': '#F36F21',
  '50plus': '#92278F',
  'lokaal': '#FFA500',
  'nsc': '#003366',
  'nieuw sociaal contract': '#003366',
}

const DEFAULT_COLORS = ['#FFD700', '#9B59B6', '#E74C3C', '#3498DB', '#1ABC9C', '#F39C12', '#8E44AD', '#2ECC71']

function getPartyColor(partyName) {
  const normalized = partyName.toLowerCase().trim()

  // Check exact match
  if (PARTY_COLORS[normalized]) {
    return PARTY_COLORS[normalized]
  }

  // Check if party name contains known party
  for (const [key, color] of Object.entries(PARTY_COLORS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return color
    }
  }

  // Generate consistent color based on party name
  let hash = 0
  for (let i = 0; i < partyName.length; i++) {
    hash = partyName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length]
}

// Confetti component
function Confetti({ show }) {
  if (!show) return null

  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 6)]
  }))

  return (
    <div className="confetti">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            backgroundColor: piece.color
          }}
        />
      ))}
    </div>
  )
}

// Modal component
function Modal({ isOpen, onClose, title, children, onConfirm }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-content">
          {children}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Annuleren</button>
          <button onClick={onConfirm}>Bevestigen</button>
        </div>
      </div>
    </div>
  )
}

// Half circle seat visualization
function SeatVisualization({ parties, coalition, totalSeats }) {
  const seats = useMemo(() => {
    if (totalSeats === 0 || parties.length === 0) return []

    // Create array of all seats with party info
    const allSeats = []
    parties.forEach(party => {
      for (let i = 0; i < party.seats; i++) {
        allSeats.push({
          partyId: party.id,
          partyName: party.name,
          color: getPartyColor(party.name),
          inCoalition: coalition.includes(party.id)
        })
      }
    })

    // Sort seats: coalition parties first for better visual grouping
    allSeats.sort((a, b) => {
      if (a.inCoalition && !b.inCoalition) return -1
      if (!a.inCoalition && b.inCoalition) return 1
      return 0
    })

    // Calculate positions in half circle
    const centerX = 50
    const centerY = 100
    const rows = Math.ceil(Math.sqrt(totalSeats / 2))
    const minRadius = 25
    const maxRadius = 95

    let seatIndex = 0
    const positionedSeats = []

    for (let row = 0; row < rows && seatIndex < allSeats.length; row++) {
      const radius = minRadius + (maxRadius - minRadius) * (row / Math.max(1, rows - 1))
      const circumference = Math.PI * radius
      const seatsInRow = Math.min(
        Math.floor(circumference / 6),
        allSeats.length - seatIndex
      )

      for (let i = 0; i < seatsInRow && seatIndex < allSeats.length; i++) {
        const angle = Math.PI - (Math.PI * (i + 0.5)) / seatsInRow
        const x = centerX + radius * Math.cos(angle)
        const y = centerY - radius * Math.sin(angle)

        positionedSeats.push({
          ...allSeats[seatIndex],
          x,
          y,
          size: Math.max(3, 8 - rows * 0.5)
        })
        seatIndex++
      }
    }

    return positionedSeats
  }, [parties, coalition, totalSeats])

  if (totalSeats === 0 || parties.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏛️</div>
        <p>Voeg partijen toe om de zetelverdeling te zien</p>
      </div>
    )
  }

  return (
    <div className="visualization-container">
      <div className="half-circle">
        {seats.map((seat, index) => (
          <div
            key={index}
            className={`seat ${seat.inCoalition ? 'active' : 'inactive'}`}
            style={{
              left: `${seat.x}%`,
              top: `${seat.y}%`,
              width: `${seat.size}%`,
              height: `${seat.size * 2}%`,
              backgroundColor: seat.color,
              transform: 'translate(-50%, -50%)'
            }}
            title={`${seat.partyName}`}
          />
        ))}
      </div>
      <div className="legend">
        {parties.map(party => (
          <div key={party.id} className="legend-item">
            <div
              className="legend-color"
              style={{
                backgroundColor: getPartyColor(party.name),
                opacity: coalition.includes(party.id) ? 1 : 0.3
              }}
            />
            <span>{party.name} ({party.seats})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main App
function App() {
  // State
  const [municipalities, setMunicipalities] = useState(() => {
    const saved = localStorage.getItem('coalitieBuilder_municipalities')
    return saved ? JSON.parse(saved) : []
  })

  const [currentMunicipalityId, setCurrentMunicipalityId] = useState(() => {
    return localStorage.getItem('coalitieBuilder_currentMunicipality') || null
  })

  const [coalition, setCoalition] = useState([])
  const [activeTab, setActiveTab] = useState('builder')
  const [showAddMunicipalityModal, setShowAddMunicipalityModal] = useState(false)
  const [showAddPartyModal, setShowAddPartyModal] = useState(false)
  const [showEditPartyModal, setShowEditPartyModal] = useState(false)
  const [editingParty, setEditingParty] = useState(null)
  const [newMunicipalityName, setNewMunicipalityName] = useState('')
  const [newMunicipalitySeats, setNewMunicipalitySeats] = useState('')
  const [newPartyName, setNewPartyName] = useState('')
  const [newPartySeats, setNewPartySeats] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [prevHadMajority, setPrevHadMajority] = useState(false)

  // Current municipality
  const currentMunicipality = municipalities.find(m => m.id === currentMunicipalityId)
  const parties = currentMunicipality?.parties || []
  const totalSeats = currentMunicipality?.totalSeats || 0

  // Coalition calculations
  const coalitionSeats = parties
    .filter(p => coalition.includes(p.id))
    .reduce((sum, p) => sum + p.seats, 0)

  const majorityNeeded = Math.ceil(totalSeats / 2) + 1
  const hasMajority = coalitionSeats >= majorityNeeded

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('coalitieBuilder_municipalities', JSON.stringify(municipalities))
  }, [municipalities])

  useEffect(() => {
    if (currentMunicipalityId) {
      localStorage.setItem('coalitieBuilder_currentMunicipality', currentMunicipalityId)
    }
  }, [currentMunicipalityId])

  // Reset coalition when changing municipality
  useEffect(() => {
    setCoalition([])
    setPrevHadMajority(false)
  }, [currentMunicipalityId])

  // Confetti effect when reaching majority
  useEffect(() => {
    if (hasMajority && !prevHadMajority && coalitionSeats > 0) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
    setPrevHadMajority(hasMajority)
  }, [hasMajority, coalitionSeats, prevHadMajority])

  // Handlers
  const addMunicipality = () => {
    if (!newMunicipalityName.trim() || !newMunicipalitySeats) return

    const newMunicipality = {
      id: Date.now().toString(),
      name: newMunicipalityName.trim(),
      totalSeats: parseInt(newMunicipalitySeats),
      parties: []
    }

    setMunicipalities([...municipalities, newMunicipality])
    setCurrentMunicipalityId(newMunicipality.id)
    setNewMunicipalityName('')
    setNewMunicipalitySeats('')
    setShowAddMunicipalityModal(false)
  }

  const deleteMunicipality = (id) => {
    if (confirm('Weet je zeker dat je deze gemeente wilt verwijderen?')) {
      setMunicipalities(municipalities.filter(m => m.id !== id))
      if (currentMunicipalityId === id) {
        setCurrentMunicipalityId(municipalities[0]?.id || null)
      }
    }
  }

  const updateTotalSeats = (seats) => {
    setMunicipalities(municipalities.map(m =>
      m.id === currentMunicipalityId
        ? { ...m, totalSeats: parseInt(seats) || 0 }
        : m
    ))
  }

  const addParty = () => {
    if (!newPartyName.trim() || !newPartySeats) return

    const newParty = {
      id: Date.now().toString(),
      name: newPartyName.trim(),
      seats: parseInt(newPartySeats)
    }

    setMunicipalities(municipalities.map(m =>
      m.id === currentMunicipalityId
        ? { ...m, parties: [...m.parties, newParty] }
        : m
    ))

    setNewPartyName('')
    setNewPartySeats('')
    setShowAddPartyModal(false)
  }

  const deleteParty = (partyId) => {
    setMunicipalities(municipalities.map(m =>
      m.id === currentMunicipalityId
        ? { ...m, parties: m.parties.filter(p => p.id !== partyId) }
        : m
    ))
    setCoalition(coalition.filter(id => id !== partyId))
  }

  const startEditParty = (party) => {
    setEditingParty(party)
    setNewPartyName(party.name)
    setNewPartySeats(party.seats.toString())
    setShowEditPartyModal(true)
  }

  const saveEditParty = () => {
    if (!newPartyName.trim() || !newPartySeats) return

    setMunicipalities(municipalities.map(m =>
      m.id === currentMunicipalityId
        ? {
            ...m,
            parties: m.parties.map(p =>
              p.id === editingParty.id
                ? { ...p, name: newPartyName.trim(), seats: parseInt(newPartySeats) }
                : p
            )
          }
        : m
    ))

    setEditingParty(null)
    setNewPartyName('')
    setNewPartySeats('')
    setShowEditPartyModal(false)
  }

  const toggleCoalition = (partyId) => {
    setCoalition(prev =>
      prev.includes(partyId)
        ? prev.filter(id => id !== partyId)
        : [...prev, partyId]
    )
  }

  const clearCoalition = () => {
    setCoalition([])
  }

  return (
    <div className="iphone-container">
      <Confetti show={showConfetti} />

      <header className="app-header">
        <h1>Coalitie Bouwer</h1>
        <p>Gemeenteraadsverkiezingen Overijssel</p>
      </header>

      <div className="content">
        {/* Municipality Selection */}
        <div className="card">
          <div className="card-header">
            <h2>Gemeente</h2>
            <button
              className="btn btn-primary btn-small"
              onClick={() => setShowAddMunicipalityModal(true)}
            >
              + Nieuw
            </button>
          </div>
          <div className="card-content">
            {municipalities.length === 0 ? (
              <div className="empty-state">
                <p>Voeg een gemeente toe om te beginnen</p>
              </div>
            ) : (
              <div className="select-wrapper">
                <select
                  value={currentMunicipalityId || ''}
                  onChange={(e) => setCurrentMunicipalityId(e.target.value)}
                >
                  <option value="" disabled>Selecteer gemeente...</option>
                  {municipalities.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.totalSeats} zetels)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {currentMunicipality && (
          <>
            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'builder' ? 'active' : ''}`}
                onClick={() => setActiveTab('builder')}
              >
                Coalitie Bouwen
              </button>
              <button
                className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
                onClick={() => setActiveTab('manage')}
              >
                Beheren
              </button>
            </div>

            {activeTab === 'builder' ? (
              <>
                {/* Coalition Status */}
                <div className={`coalition-status ${hasMajority ? 'has-majority' : ''}`}>
                  <div className="coalition-seats">{coalitionSeats}</div>
                  <div className="coalition-label">
                    van {totalSeats} zetels in coalitie
                  </div>
                  <div className="coalition-majority">
                    {hasMajority
                      ? '✓ Meerderheid bereikt!'
                      : `Nog ${majorityNeeded - coalitionSeats} zetels nodig voor meerderheid`
                    }
                  </div>
                </div>

                {/* Seat Visualization */}
                <SeatVisualization
                  parties={parties}
                  coalition={coalition}
                  totalSeats={totalSeats}
                />

                {/* Party Buttons */}
                {parties.length > 0 && (
                  <div className="card" style={{ marginTop: 16 }}>
                    <div className="card-header">
                      <h2>Partijen</h2>
                      {coalition.length > 0 && (
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={clearCoalition}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="card-content">
                      <div className="party-buttons">
                        {parties.map(party => (
                          <button
                            key={party.id}
                            className={`party-button ${coalition.includes(party.id) ? 'selected' : ''}`}
                            style={{
                              backgroundColor: coalition.includes(party.id)
                                ? getPartyColor(party.name)
                                : undefined,
                              color: coalition.includes(party.id) ? 'white' : undefined
                            }}
                            onClick={() => toggleCoalition(party.id)}
                          >
                            {party.name}
                            <span className="seats-badge">{party.seats}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Manage Municipality */}
                <div className="card">
                  <div className="card-header">
                    <h2>Gemeente Instellingen</h2>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => deleteMunicipality(currentMunicipalityId)}
                    >
                      Verwijder
                    </button>
                  </div>
                  <div className="card-content">
                    <div className="input-group">
                      <label>Totaal aantal zetels</label>
                      <input
                        type="number"
                        value={totalSeats}
                        onChange={(e) => updateTotalSeats(e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Manage Parties */}
                <div className="card">
                  <div className="card-header">
                    <h2>Partijen</h2>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => setShowAddPartyModal(true)}
                    >
                      + Partij
                    </button>
                  </div>
                  <div className="card-content">
                    {parties.length === 0 ? (
                      <div className="empty-state">
                        <p>Nog geen partijen toegevoegd</p>
                      </div>
                    ) : (
                      <ul className="party-list">
                        {parties.map(party => (
                          <li key={party.id} className="party-item">
                            <div
                              className="party-color"
                              style={{ backgroundColor: getPartyColor(party.name) }}
                            />
                            <div className="party-info">
                              <div className="party-name">{party.name}</div>
                              <div className="party-seats">{party.seats} zetels</div>
                            </div>
                            <div className="party-actions">
                              <button
                                className="btn btn-secondary btn-icon"
                                onClick={() => startEditParty(party)}
                              >
                                ✎
                              </button>
                              <button
                                className="btn btn-danger btn-icon"
                                onClick={() => deleteParty(party.id)}
                              >
                                ✕
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Add Municipality Modal */}
      <Modal
        isOpen={showAddMunicipalityModal}
        onClose={() => setShowAddMunicipalityModal(false)}
        title="Nieuwe Gemeente"
        onConfirm={addMunicipality}
      >
        <div className="input-group">
          <label>Naam gemeente</label>
          <input
            type="text"
            value={newMunicipalityName}
            onChange={(e) => setNewMunicipalityName(e.target.value)}
            placeholder="bijv. Enschede"
          />
        </div>
        <div className="input-group">
          <label>Totaal aantal zetels</label>
          <input
            type="number"
            value={newMunicipalitySeats}
            onChange={(e) => setNewMunicipalitySeats(e.target.value)}
            placeholder="bijv. 39"
            min="1"
          />
        </div>
      </Modal>

      {/* Add Party Modal */}
      <Modal
        isOpen={showAddPartyModal}
        onClose={() => setShowAddPartyModal(false)}
        title="Nieuwe Partij"
        onConfirm={addParty}
      >
        <div className="input-group">
          <label>Naam partij</label>
          <input
            type="text"
            value={newPartyName}
            onChange={(e) => setNewPartyName(e.target.value)}
            placeholder="bijv. VVD"
          />
        </div>
        <div className="input-group">
          <label>Aantal zetels</label>
          <input
            type="number"
            value={newPartySeats}
            onChange={(e) => setNewPartySeats(e.target.value)}
            placeholder="bijv. 8"
            min="1"
          />
        </div>
      </Modal>

      {/* Edit Party Modal */}
      <Modal
        isOpen={showEditPartyModal}
        onClose={() => {
          setShowEditPartyModal(false)
          setEditingParty(null)
          setNewPartyName('')
          setNewPartySeats('')
        }}
        title="Partij Bewerken"
        onConfirm={saveEditParty}
      >
        <div className="input-group">
          <label>Naam partij</label>
          <input
            type="text"
            value={newPartyName}
            onChange={(e) => setNewPartyName(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Aantal zetels</label>
          <input
            type="number"
            value={newPartySeats}
            onChange={(e) => setNewPartySeats(e.target.value)}
            min="1"
          />
        </div>
      </Modal>
    </div>
  )
}

export default App
