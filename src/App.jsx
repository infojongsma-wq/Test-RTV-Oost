import { useState, useEffect } from 'react'
import './App.css'
import { jsPDF } from 'jspdf'

// User needs voor nieuwsverhalen
const USER_NEEDS = [
  'Informeren',
  'Duiden',
  'Waarschuwen',
  'Verbinden',
  'Inspireren',
  'Entertainen',
  'Activeren'
]

function App() {
  const [ideas, setIdeas] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingIdea, setEditingIdea] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    location: '',
    contact: '',
    phone: '',
    rating: 0,
    mediaTypes: [],
    userNeed: '',
    comments: '',
    attachments: [],
    pitchLine: '',
    createdAt: null
  })

  // Load ideas from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('newsIdeas')
    if (saved) {
      try {
        setIdeas(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading ideas:', e)
      }
    }
  }, [])

  // Save ideas to localStorage
  useEffect(() => {
    if (ideas.length > 0) {
      localStorage.setItem('newsIdeas', JSON.stringify(ideas))
    }
  }, [ideas])

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      location: '',
      contact: '',
      phone: '',
      rating: 0,
      mediaTypes: [],
      userNeed: '',
      comments: '',
      attachments: [],
      pitchLine: '',
      createdAt: null
    })
    setEditingIdea(null)
  }

  const openModal = (idea = null) => {
    if (idea) {
      setEditingIdea(idea.id)
      setFormData(idea)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMediaTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      mediaTypes: prev.mediaTypes.includes(type)
        ? prev.mediaTypes.filter(t => t !== type)
        : [...prev.mediaTypes, type]
    }))
  }

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, {
            name: file.name,
            type: file.type,
            data: reader.result,
            size: file.size
          }]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const generatePitchLine = () => {
    const { title, summary, location, userNeed, mediaTypes } = formData

    let pitch = ''

    if (userNeed && title) {
      const needVerbs = {
        'Informeren': 'informeert',
        'Duiden': 'duidt',
        'Waarschuwen': 'waarschuwt',
        'Verbinden': 'verbindt',
        'Inspireren': 'inspireert',
        'Entertainen': 'entertainet',
        'Activeren': 'activeert'
      }

      const verb = needVerbs[userNeed] || 'vertelt'
      const locationText = location ? ` in ${location}` : ''
      const mediaText = mediaTypes.length > 0
        ? ` - Perfect voor ${mediaTypes.join(' & ')}`
        : ''

      if (summary) {
        pitch = `Dit verhaal ${verb} over ${summary}${locationText}.${mediaText}`
      } else {
        pitch = `"${title}"${locationText} - ${userNeed} je publiek met dit unieke verhaal.${mediaText}`
      }
    } else if (title) {
      pitch = `Waarom "${title}" nu gemaakt moet worden: Dit verhaal raakt de kern van wat ons publiek bezighoudt.`
    } else {
      pitch = 'Vul eerst minstens een titel en user need in om een pitch line te genereren.'
    }

    setFormData(prev => ({ ...prev, pitchLine: pitch }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      alert('Titel is verplicht')
      return
    }

    if (editingIdea) {
      setIdeas(prev => prev.map(idea =>
        idea.id === editingIdea ? { ...formData, id: editingIdea } : idea
      ))
    } else {
      const newIdea = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      }
      setIdeas(prev => [newIdea, ...prev])
    }

    closeModal()
  }

  const deleteIdea = (id) => {
    if (confirm('Weet je zeker dat je dit idee wilt verwijderen?')) {
      setIdeas(prev => prev.filter(idea => idea.id !== id))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    return '📎'
  }

  const exportToPDF = () => {
    if (ideas.length === 0) {
      alert('Er zijn geen ideeën om te exporteren')
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - (margin * 2)
    let yPosition = margin

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Nieuwsverhaal Ideeën', margin, yPosition)

    yPosition += 8
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('RTV Oost', margin, yPosition)

    yPosition += 10
    doc.setFontSize(10)
    doc.text(`Gegenereerd op: ${formatDate(new Date().toISOString())}`, margin, yPosition)

    yPosition += 5
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Ideas
    ideas.forEach((idea, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      // Title and Rating
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${idea.title}`, margin, yPosition)

      const stars = '★'.repeat(idea.rating) + '☆'.repeat(5 - idea.rating)
      const titleWidth = doc.getTextWidth(`${index + 1}. ${idea.title}`)
      doc.setFontSize(12)
      doc.text(stars, margin + titleWidth + 5, yPosition)

      yPosition += 7

      // Summary
      if (idea.summary) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        const summaryLines = doc.splitTextToSize(idea.summary, maxWidth)
        doc.text(summaryLines, margin, yPosition)
        yPosition += summaryLines.length * 5 + 3
      }

      // Meta information
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      if (idea.location) {
        doc.text(`Plaats: ${idea.location}`, margin, yPosition)
        yPosition += 5
      }

      if (idea.userNeed) {
        doc.text(`User Need: ${idea.userNeed}`, margin, yPosition)
        yPosition += 5
      }

      if (idea.mediaTypes.length > 0) {
        doc.text(`Media: ${idea.mediaTypes.join(', ')}`, margin, yPosition)
        yPosition += 5
      }

      if (idea.contact) {
        doc.text(`Contact: ${idea.contact}${idea.phone ? ` - ${idea.phone}` : ''}`, margin, yPosition)
        yPosition += 5
      }

      // Content
      if (idea.content) {
        yPosition += 3
        doc.setFont('helvetica', 'bold')
        doc.text('Beschrijving:', margin, yPosition)
        yPosition += 5

        doc.setFont('helvetica', 'normal')
        const contentLines = doc.splitTextToSize(idea.content, maxWidth)
        doc.text(contentLines, margin, yPosition)
        yPosition += contentLines.length * 5 + 3
      }

      // Pitch Line
      if (idea.pitchLine) {
        // Check if we need a new page for pitch line
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = margin
        }

        doc.setFillColor(255, 249, 230)
        doc.rect(margin - 2, yPosition - 3, maxWidth + 4, 8 + (doc.splitTextToSize(idea.pitchLine, maxWidth - 10).length * 5), 'F')

        doc.setFont('helvetica', 'bold')
        doc.text('Pitch:', margin, yPosition)
        yPosition += 5

        doc.setFont('helvetica', 'italic')
        const pitchLines = doc.splitTextToSize(idea.pitchLine, maxWidth - 10)
        doc.text(pitchLines, margin + 5, yPosition)
        yPosition += pitchLines.length * 5 + 3
      }

      // Comments
      if (idea.comments) {
        yPosition += 2
        doc.setFont('helvetica', 'bold')
        doc.text('Opmerkingen:', margin, yPosition)
        yPosition += 5

        doc.setFont('helvetica', 'normal')
        const commentLines = doc.splitTextToSize(idea.comments, maxWidth)
        doc.text(commentLines, margin, yPosition)
        yPosition += commentLines.length * 5 + 3
      }

      // Attachments
      if (idea.attachments && idea.attachments.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.text(`Bijlagen: ${idea.attachments.length} bestand(en)`, margin, yPosition)
        yPosition += 5

        doc.setFont('helvetica', 'normal')
        idea.attachments.forEach(att => {
          doc.text(`  - ${att.name}`, margin, yPosition)
          yPosition += 4
        })
        yPosition += 3
      }

      // Date
      if (idea.createdAt) {
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Aangemaakt: ${formatDate(idea.createdAt)}`, margin, yPosition)
        doc.setTextColor(0, 0, 0)
        yPosition += 5
      }

      // Separator
      yPosition += 5
      if (index < ideas.length - 1) {
        doc.setLineWidth(0.3)
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10
      }
    })

    // Save PDF
    const filename = `nieuwsideeen_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📰 Nieuwsverhaal Ideeën</h1>
        <p>RTV Oost</p>
      </header>

      <div className="action-buttons">
        <button className="add-button" onClick={() => openModal()}>
          + Nieuw Idee
        </button>
        {ideas.length > 0 && (
          <button className="export-button" onClick={exportToPDF}>
            📄 Exporteer naar PDF
          </button>
        )}
      </div>

      <div className="ideas-list">
        {ideas.length === 0 ? (
          <div className="empty-state">
            <p>Nog geen ideeën genoteerd</p>
            <p>Klik op "+ Nieuw Idee" om te beginnen</p>
          </div>
        ) : (
          ideas.map(idea => (
            <div key={idea.id} className="idea-card">
              <div className="idea-header">
                <h3>{idea.title}</h3>
                <div className="rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={star <= idea.rating ? 'star filled' : 'star'}>
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {idea.summary && (
                <p className="idea-summary">{idea.summary}</p>
              )}

              <div className="idea-meta">
                {idea.location && (
                  <span className="meta-tag">📍 {idea.location}</span>
                )}
                {idea.userNeed && (
                  <span className="meta-tag">🎯 {idea.userNeed}</span>
                )}
                {idea.mediaTypes.length > 0 && (
                  <div className="media-types">
                    {idea.mediaTypes.map(type => (
                      <span key={type} className="media-badge">{type}</span>
                    ))}
                  </div>
                )}
              </div>

              {idea.contact && (
                <p className="contact-info">👤 {idea.contact} {idea.phone && `- ${idea.phone}`}</p>
              )}

              {idea.attachments && idea.attachments.length > 0 && (
                <div className="attachments-preview">
                  {idea.attachments.map((att, idx) => (
                    <span key={idx} className="attachment-badge">
                      {getFileIcon(att.type)} {att.name}
                    </span>
                  ))}
                </div>
              )}

              {idea.pitchLine && (
                <div className="pitch-line">
                  <strong>💡 Pitch:</strong> {idea.pitchLine}
                </div>
              )}

              <div className="idea-footer">
                <span className="date">{formatDate(idea.createdAt)}</span>
                <div className="actions">
                  <button onClick={() => openModal(idea)} className="btn-edit">
                    Bewerken
                  </button>
                  <button onClick={() => deleteIdea(idea.id)} className="btn-delete">
                    Verwijderen
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingIdea ? 'Idee Bewerken' : 'Nieuw Idee'}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-content">
              <div className="form-group">
                <label htmlFor="title">Titel *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Titel van het nieuwsidee"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="summary">Korte Inhoud</label>
                <input
                  type="text"
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="Korte samenvatting in één zin"
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">Uitgebreide Beschrijving</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Uitgebreide beschrijving van het idee"
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Plaats</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Plaats of locatie"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="userNeed">User Need</label>
                  <select
                    id="userNeed"
                    name="userNeed"
                    value={formData.userNeed}
                    onChange={handleInputChange}
                  >
                    <option value="">Selecteer...</option>
                    {USER_NEEDS.map(need => (
                      <option key={need} value={need}>{need}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Beoordeling</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={star <= formData.rating ? 'star filled' : 'star'}
                      onClick={() => handleRatingChange(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Media Type</label>
                <div className="media-type-buttons">
                  {['TV', 'Radio', 'Social', 'Online'].map(type => (
                    <button
                      key={type}
                      type="button"
                      className={formData.mediaTypes.includes(type) ? 'media-btn active' : 'media-btn'}
                      onClick={() => handleMediaTypeToggle(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact">Contactpersoon</label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="Naam contactpersoon"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Telefoonnummer</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+31 6 12345678"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="comments">Algemene Opmerkingen</label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="Extra notities of opmerkingen"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="file-upload">Foto of Bijlage Toevoegen</label>
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  multiple
                  onChange={handleFileUpload}
                  className="file-input"
                />
                {formData.attachments.length > 0 && (
                  <div className="attachments-list">
                    {formData.attachments.map((att, idx) => (
                      <div key={idx} className="attachment-item">
                        <span>{getFileIcon(att.type)} {att.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="remove-attachment"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group pitch-section">
                <div className="pitch-header">
                  <label htmlFor="pitchLine">Pitch Line voor Eindredacteur</label>
                  <button
                    type="button"
                    onClick={generatePitchLine}
                    className="btn-generate-pitch"
                  >
                    ✨ Genereer Pitch Line
                  </button>
                </div>
                <textarea
                  id="pitchLine"
                  name="pitchLine"
                  value={formData.pitchLine}
                  onChange={handleInputChange}
                  placeholder="Klik op 'Genereer Pitch Line' om een overtuigende pitch te maken"
                  rows="3"
                  className="pitch-textarea"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Annuleren
                </button>
                <button type="submit" className="btn-submit">
                  {editingIdea ? 'Opslaan' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
