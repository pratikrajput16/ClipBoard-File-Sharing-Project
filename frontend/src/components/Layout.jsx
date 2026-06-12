import { Link, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  const { pathname } = useLocation()

  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>ClipBoard⚡</span>
        </Link>
        <div className={styles.navLinks}>
          <Link to="/send" className={`${styles.navLink} ${pathname === '/send' ? styles.active : ''}`}>
            Send
          </Link>
          <Link to="/receive" className={`${styles.navLink} ${pathname === '/receive' ? styles.active : ''}`}>
            Receive
          </Link>
          <Link to="/history" className={`${styles.navLink} ${pathname === '/history' ? styles.active : ''}`}>
            History
          </Link>
        </div>
      </nav>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <span>FileBeam — Local network transfer · No cloud · No login</span>
      </footer>
    </div>
  )
}
