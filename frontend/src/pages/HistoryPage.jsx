import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './HistoryPage.module.css'

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function fileEmoji(name = '') {
  const ext = (name || '').split('.').pop().toLowerCase()
  const map = {
    pdf: '📕', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📊', pptx: '📊', zip: '🗜️', rar: '🗜️', '7z': '🗜️',
    mp4: '🎬', mov: '🎬', mp3: '🎵', wav: '🎵',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
    txt: '📄', js: '💻', ts: '💻', jsx: '💻', tsx: '💻',
    py: '💻', html: '💻', css: '💻', json: '💻'
  }
  return map[ext] || '📄'
}

const STATUS_MAP = {
  pending:  { label: 'Pending',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  received: { label: 'Received', color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)' },
  expired:  { label: 'Expired',  color: '#6B7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.expired
  return (
    <span className={styles.badge} style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  )
}

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | file | text
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get('/api/history')
      setHistory(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const deleteOne = async (id) => {
    await axios.delete(`/api/history/${id}`)
    setHistory(h => h.filter(e => e.id !== id))
  }

  const clearAll = async () => {
    if (!confirmClear) { setConfirmClear(true); return }
    setClearing(true)
    await axios.delete('/api/history')
    setHistory([])
    setClearing(false)
    setConfirmClear(false)
  }

  const filtered = history.filter(h => filter === 'all' || h.type === filter)

  const stats = {
    total: history.length,
    files: history.filter(h => h.type === 'file').length,
    texts: history.filter(h => h.type === 'text').length,
    received: history.filter(h => h.status === 'received').length,
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>History</h1>
          <p className={styles.desc}>All transfers sent from this device.</p>
        </div>
        {history.length > 0 && (
          <button
            className={`${styles.clearBtn} ${confirmClear ? styles.clearConfirm : ''}`}
            onClick={clearAll}
            disabled={clearing}
          >
            {confirmClear ? '⚠️ Confirm clear' : '🗑️ Clear all'}
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total },
          { label: 'Files', value: stats.files },
          { label: 'Texts', value: stats.texts },
          { label: 'Received', value: stats.received },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className={styles.filters}>
        {['all', 'file', 'text'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.activeFilter : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'file' ? '📁 Files' : '💬 Texts'}
          </button>
        ))}
        <span className={styles.filterCount}>{filtered.length} transfer{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.empty}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyTitle}>No transfers yet</div>
          <div className={styles.emptyDesc}>Files and texts you send will appear here.</div>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(entry => (
            <div key={entry.id} className={styles.row}>
              <div className={styles.rowIcon}>
                {entry.type === 'file' ? fileEmoji(entry.filename) : '💬'}
              </div>

              <div className={styles.rowMain}>
                <div className={styles.rowTop}>
                  <span className={styles.rowName}>
                    {entry.type === 'file' ? entry.filename : (entry.preview || 'Text message')}
                  </span>
                  <StatusBadge status={entry.status} />
                </div>
                <div className={styles.rowMeta}>
                  {entry.type === 'file' ? (
                    <>
                      <span className={styles.tag}>{entry.fileExtension}</span>
                      <span>{formatSize(entry.size)}</span>
                      <span>·</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.tag}>TEXT</span>
                      <span>{entry.length?.toLocaleString()} chars</span>
                      <span>·</span>
                    </>
                  )}
                  <span>PIN: <span className={styles.pin}>{entry.pin}</span></span>
                  <span>·</span>
                  <span>{formatDate(entry.createdAt)}</span>
                  {entry.sentAt && (
                    <><span>·</span><span className={styles.received}>Received {formatDate(entry.sentAt)}</span></>
                  )}
                </div>
              </div>

              <button className={styles.deleteBtn} onClick={() => deleteOne(entry.id)} title="Remove from history">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
