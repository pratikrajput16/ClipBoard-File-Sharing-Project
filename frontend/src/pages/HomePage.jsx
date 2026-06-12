import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'

function BeamCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 18 }, (_, i) => ({
      progress: i / 18,
      speed: 0.004 + Math.random() * 0.003,
      size: 1.5 + Math.random() * 2,
      opacity: 0.4 + Math.random() * 0.6
    }))

    const draw = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2, cy = h / 2
      const r = Math.min(w, h) * 0.32

      // Glow ring
      const grad = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.1)
      grad.addColorStop(0, 'rgba(79,70,229,0.07)')
      grad.addColorStop(1, 'rgba(79,70,229,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Orbit track
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(79,70,229,0.15)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Center dot
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20)
      cg.addColorStop(0, 'rgba(79,70,229,0.5)')
      cg.addColorStop(1, 'rgba(79,70,229,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 20, 0, Math.PI * 2)
      ctx.fillStyle = cg
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#6366F1'
      ctx.fill()

      // Particles on orbit
      particles.forEach(p => {
        p.progress = (p.progress + p.speed) % 1
        const angle = p.progress * Math.PI * 2 - Math.PI / 2
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r

        // Tail
        const tailLen = 0.06
        const tailAngle = angle - tailLen
        const tx = cx + Math.cos(tailAngle) * r
        const ty = cy + Math.sin(tailAngle) * r
        const tailGrad = ctx.createLinearGradient(tx, ty, x, y)
        tailGrad.addColorStop(0, `rgba(79,70,229,0)`)
        tailGrad.addColorStop(1, `rgba(99,102,241,${p.opacity * 0.7})`)
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(x, y)
        ctx.strokeStyle = tailGrad
        ctx.lineWidth = p.size * 0.8
        ctx.stroke()

        // Particle dot
        const pg = ctx.createRadialGradient(x, y, 0, x, y, p.size * 2)
        pg.addColorStop(0, `rgba(99,102,241,${p.opacity})`)
        pg.addColorStop(1, 'rgba(79,70,229,0)')
        ctx.beginPath()
        ctx.arc(x, y, p.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = pg
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, p.size * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,180,255,${p.opacity})`
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} />
}

const features = [
  { icon: '📁', title: 'File Transfer', desc: 'Send any file up to 100MB over your local network instantly.' },
  { icon: '💬', title: 'Text Snippets', desc: 'Share code, links, notes, or any text with a 6-digit PIN.' },
  { icon: '🔐', title: 'One-Time PIN', desc: 'Each transfer generates a unique PIN that expires after use.' },
  { icon: '⚡', title: 'Zero Cloud', desc: 'Everything stays on your local network. Nothing hits the internet.' },
  { icon: '🗑️', title: 'Auto-Delete', desc: 'Files are wiped from the server immediately after download.' },
  { icon: '📱', title: 'Cross-Device', desc: 'Works between any devices on the same Wi-Fi. No app needed.' },
]

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.badge}>Local Network · Zero Cloud · Instant</div>
          <h1 className={styles.headline}>
            Transfer anything<br />
            <span className={styles.accent}>without a trace.</span>
          </h1>
          <p className={styles.sub}>
            Send files and text from your phone to your PC using a 6-digit PIN.
            No login. No internet. No storage. Just your local network.
          </p>
          <div className={styles.cta}>
            <Link to="/send" className={styles.btnPrimary}>Start Sending →</Link>
            <Link to="/receive" className={styles.btnSecondary}>Enter a PIN</Link>
          </div>
        </div>
        <div className={styles.heroViz}>
          <BeamCanvas />
          <div className={styles.vizLabel}>
            <span className={styles.vizDot} />
            Live on your network
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howSection}>
        <div className={styles.sectionLabel}>How it works</div>
        <div className={styles.steps}>
          {[
            { n: '01', title: 'Upload on mobile', desc: 'Open FileBeam on your phone and send a file or text.' },
            { n: '02', title: 'Get your PIN', desc: 'A unique 6-digit PIN is generated instantly. No account needed.' },
            { n: '03', title: 'Receive on PC', desc: 'Enter the PIN on your PC. Your content downloads and the PIN is gone.' },
          ].map(s => (
            <div key={s.n} className={styles.step}>
              <div className={styles.stepNum}>{s.n}</div>
              <div className={styles.stepTitle}>{s.title}</div>
              <div className={styles.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionLabel}>Features</div>
        <div className={styles.featuresGrid}>
          {features.map(f => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
