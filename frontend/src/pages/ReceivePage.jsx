import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import styles from './ReceivePage.module.css'

const API = 'https://clipboard-8ia6.onrender.com'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function fileEmoji(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  const map = { pdf: '📕', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    zip: '🗜️', rar: '🗜️', mp4: '🎬', mp3: '🎵',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
    txt: '📄', js: '💻', ts: '💻', py: '💻', json: '💻' }
  return map[ext] || '📄'
}

export default function ReceivePage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [preview, setPreview] = useState(null)
  const [received, setReceived] = useState(null)
  const [status, setStatus] = useState(null) // { type, msg }
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const refs = useRef([])

  const pin = digits.join('')

  // Auto-check when 6 digits entered
  useEffect(() => {
    if (pin.length === 6) checkPin(pin)
    else { setPreview(null); setStatus(null) }
  }, [pin])

  const checkPin = async (p) => {
    try {
      setLoading(true); setStatus(null); setPreview(null)
      const { data } = await axios.get(`${API}/api/check/${p}`)
      setPreview(data)
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Invalid or expired PIN' })
    } finally {
      setLoading(false)
    }
  }

  const receive = async () => {
    try {
      setLoading(true); setStatus(null)

      if (preview?.type === 'text') {
        const { data } = await axios.get(`${API}/api/receive/${pin}`)
        setReceived(data)
        setPreview(null)
      } else {
        // File download — trigger via link
        window.location.href = `/api/receive/${pin}`
        setTimeout(() => {
          setStatus({ type: 'success', msg: '✅ Download started. File deleted from server.' })
          resetAll()
        }, 1500)
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Receive failed.' })
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setDigits(['', '', '', '', '', ''])
    setPreview(null); setReceived(null); setLoading(false)
    setTimeout(() => refs.current[0]?.focus(), 50)
  }

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const d = [...digits]; d[i] = ''; setDigits(d)
      } else if (i > 0) {
        refs.current[i - 1]?.focus()
      }
    }
  }

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const d = [...digits]; d[i] = v; setDigits(d)
    if (v && i < 5) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const d = ['', '', '', '', '', '']
    p.split('').forEach((c, i) => { d[i] = c })
    setDigits(d)
    refs.current[Math.min(p.length, 5)]?.focus()
  }

  const copyText = () => {
    navigator.clipboard.writeText(received.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Receive</h1>
        <p className={styles.desc}>Enter the 6-digit PIN to download a file or view text.</p>
      </div>

      <div className={styles.card}>
        {!received ? (
          <>
            <div className={styles.pinLabel}>Enter PIN</div>
            <div className={styles.pinRow}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => refs.current[i] = el}
                  className={`${styles.pinInput} ${d ? styles.filled : ''} ${loading && pin.length === 6 ? styles.checking : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKey(i, e)}
                  onPaste={handlePaste}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {loading && pin.length === 6 && (
              <div className={styles.checking}>Checking PIN…</div>
            )}

            {status && (
              <div className={`${styles.statusMsg} ${styles[status.type]}`}>{status.msg}</div>
            )}

            {preview && (
              <div className={styles.preview}>
                <div className={styles.previewBadge}>
                  {preview.type === 'file' ? '📁 File ready' : '💬 Text message ready'}
                </div>

                {preview.type === 'file' ? (
                  <div className={styles.fileRow}>
                    <div className={styles.fileThumb}>{fileEmoji(preview.filename)}</div>
                    <div className={styles.fileDetails}>
                      <div className={styles.fileName}>{preview.filename}</div>
                      <div className={styles.fileMeta}>
                        {formatSize(preview.size)} · expires in {Math.floor(preview.expiresIn / 60)}:{(preview.expiresIn % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.textPreview}>
                    <div className={styles.textPreviewContent}>
                      {preview.preview}{preview.length > 120 ? '…' : ''}
                    </div>
                    <div className={styles.textMeta}>{preview.length.toLocaleString()} characters</div>
                  </div>
                )}

                <button className={styles.receiveBtn} onClick={receive} disabled={loading}>
                  {preview.type === 'file' ? '⬇️ Download File' : '📋 Get Text'}
                </button>
              </div>
            )}

            {pin.length > 0 && (
              <button className={styles.clearBtn} onClick={resetAll}>Clear</button>
            )}
          </>
        ) : (
          // Text received view
          <div className={styles.textReceived}>
            <div className={styles.textReceivedHeader}>
              <span>💬</span>
              <div>
                <div className={styles.textReceivedTitle}>Text received</div>
                <div className={styles.textReceivedSub}>Deleted from server · {received.text.length.toLocaleString()} characters</div>
              </div>
            </div>
            <pre className={styles.textContent}>{received.text}</pre>
            <div className={styles.textActions}>
              <button className={styles.copyTextBtn} onClick={copyText}>
                {copied ? '✓ Copied!' : '⧉ Copy'}
              </button>
              <button className={styles.clearBtn2} onClick={resetAll}>Receive another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
