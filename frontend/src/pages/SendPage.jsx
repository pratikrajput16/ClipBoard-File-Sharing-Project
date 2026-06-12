import { useState, useRef, useCallback } from 'react'
import axios from 'axios'
import styles from './SendPage.module.css'

const API = 'https://clipboard-8ia6.onrender.com'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function fileEmoji(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  const map = { pdf: '📕', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📊', pptx: '📊',
    zip: '🗜️', rar: '🗜️', '7z': '🗜️', mp4: '🎬', mov: '🎬', mp3: '🎵', wav: '🎵',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
    txt: '📄', js: '💻', ts: '💻', jsx: '💻', tsx: '💻', py: '💻', html: '💻', css: '💻', json: '💻' }
  return map[ext] || '📄'
}

function PINDisplay({ pin, expiry, onReset }) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(Math.round((expiry - Date.now()) / 1000))

  useState(() => {
    const t = setInterval(() => {
      const s = Math.round((expiry - Date.now()) / 1000)
      setTimeLeft(s)
      if (s <= 0) clearInterval(t)
    }, 1000)
    return () => clearInterval(t)
  })

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const pct = Math.max(0, (timeLeft / 600) * 100)

  const copy = () => {
    navigator.clipboard.writeText(pin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.pinResult}>
      <div className={styles.pinResultHeader}>
        <span className={styles.pinResultIcon}>✅</span>
        <div>
          <div className={styles.pinResultTitle}>Transfer ready</div>
          <div className={styles.pinResultSub}>Enter this PIN on the Receive page</div>
        </div>
      </div>

      <div className={styles.pinBoxes}>
        {pin.split('').map((d, i) => (
          <div key={i} className={styles.pinBox} style={{ animationDelay: `${i * 0.06}s` }}>{d}</div>
        ))}
      </div>

      <div className={styles.expiryRow}>
        <span className={styles.expiryLabel}>Expires in</span>
        <span className={styles.expiryTime} style={{ color: timeLeft < 60 ? 'var(--error)' : 'var(--text-2)' }}>
          {timeLeft > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : 'Expired'}
        </span>
      </div>
      <div className={styles.expiryBarWrap}>
        <div className={styles.expiryBar} style={{
          width: pct + '%',
          background: pct < 20 ? 'var(--error)' : 'var(--accent)'
        }} />
      </div>

      <div className={styles.pinActions}>
        <button className={styles.copyBtn} onClick={copy}>
          {copied ? '✓ Copied' : '⧉ Copy PIN'}
        </button>
        <button className={styles.anotherBtn} onClick={onReset}>Send another</button>
      </div>
    </div>
  )
}

export default function SendPage() {
  const [tab, setTab] = useState('file')
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const pickFile = (f) => { setFile(f); setError(''); setResult(null) }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }, [])

  const reset = () => { setFile(null); setText(''); setResult(null); setError(''); setProgress(0) }

  const send = async () => {
    setError(''); setResult(null)

    try {
      setUploading(true)
      let data

      if (tab === 'file') {
        if (!file) return setError('Please select a file.')
        const fd = new FormData()
        fd.append('file', file)
        const res = await axios.post(`${API}/api/upload/file`, fd, ... {
          onUploadProgress: e => setProgress(Math.round((e.loaded / e.total) * 100))
        })
        data = res.data
      } else {
        if (!text.trim()) return setError('Please enter some text.')
        const res = await axios.post('/api/upload/text', { text })
        data = res.data
      }

      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Is the server running?')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  if (result) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <PINDisplay pin={result.pin} expiry={result.expiry} onReset={reset} />
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Send</h1>
        <p className={styles.desc}>Upload a file or text — get a 6-digit PIN to share.</p>
      </div>

      <div className={styles.card}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'file' ? styles.activeTab : ''}`} onClick={() => { setTab('file'); reset() }}>
            📁 File
          </button>
          <button className={`${styles.tab} ${tab === 'text' ? styles.activeTab : ''}`} onClick={() => { setTab('text'); reset() }}>
            💬 Text
          </button>
        </div>

        {tab === 'file' ? (
          <>
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} ${file ? styles.hasFile : ''}`}
              onClick={() => !file && inputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {file ? (
                <div className={styles.filePreview}>
                  <div className={styles.fileThumb}>{fileEmoji(file.name)}</div>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileSize}>{formatSize(file.size)}</div>
                  </div>
                  <button className={styles.removeFile} onClick={e => { e.stopPropagation(); setFile(null) }}>✕</button>
                </div>
              ) : (
                <div className={styles.dropInner}>
                  <div className={styles.dropIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div className={styles.dropTitle}>Drop file here or click to browse</div>
                  <div className={styles.dropSub}>Any file up to 100 MB</div>
                </div>
              )}
            </div>
            <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={e => e.target.files[0] && pickFile(e.target.files[0])} />
          </>
        ) : (
          <div className={styles.textArea}>
            <textarea
              className={styles.textarea}
              placeholder="Paste your text, code snippet, link, note..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={9}
            />
            <div className={styles.charCount}>{text.length.toLocaleString()} / 50,000</div>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {uploading && tab === 'file' && (
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: progress + '%' }} />
            </div>
            <div className={styles.progressLabel}>Uploading… {progress}%</div>
          </div>
        )}

        <button
          className={styles.sendBtn}
          onClick={send}
          disabled={uploading || (tab === 'file' ? !file : !text.trim())}
        >
          {uploading ? 'Uploading…' : '⚡ Generate PIN & Send'}
        </button>
      </div>
    </div>
  )
}
