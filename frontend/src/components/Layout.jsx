import { Outlet, NavLink } from 'react-router-dom';
import styles from './Layout.module.css';

function Layout({ user, onLogout }) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.container}>
          <NavLink to="/" className={styles.logo}>
            <span className={styles.logoIcon}>📚</span>
            <span className={styles.logoText}>个人图书馆</span>
          </NavLink>
          <nav className={styles.nav}>
            <NavLink
              to="/search"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              搜索添加
            </NavLink>
            <NavLink
              to="/bookshelf"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              我的书架
            </NavLink>
          </nav>
          <div className={styles.userSection}>
            <span className={styles.userInfo}>👤 {user?.nickname || user?.username}</span>
            <button className={styles.logoutBtn} onClick={onLogout}>
              退出
            </button>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
