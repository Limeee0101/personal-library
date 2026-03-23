import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getBooks, getCategories } from '../services/api';
import styles from './HomePage.module.css';

function HomePage() {
  const [stats, setStats] = useState({ totalBooks: 0, totalCategories: 0 });
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [booksRes, categoriesRes] = await Promise.all([
          getBooks({ sort: 'added_date', order: 'desc' }),
          getCategories()
        ]);
        setStats({
          totalBooks: booksRes.data.total,
          totalCategories: categoriesRes.data.categories.length
        });
        setRecentBooks(booksRes.data.books.slice(0, 6));
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1 className={styles.title}>欢迎来到你的图书馆</h1>
        <p className={styles.subtitle}>记录阅读，沉淀思考</p>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.totalBooks}</span>
            <span className={styles.statLabel}>本书籍</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.totalCategories}</span>
            <span className={styles.statLabel}>个分类</span>
          </div>
        </div>
        <Link to="/search" className={styles.addButton}>
          添加新书
        </Link>
      </section>

      {recentBooks.length > 0 && (
        <section className={styles.recent}>
          <h2 className={styles.sectionTitle}>最近添加</h2>
          <div className={styles.bookGrid}>
            {recentBooks.map(book => (
              <Link to={`/book/${book.id}`} key={book.id} className={styles.bookCard}>
                <div className={styles.coverWrapper}>
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className={styles.cover} />
                  ) : (
                    <div className={styles.coverPlaceholder}>📖</div>
                  )}
                </div>
                <div className={styles.bookInfo}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <p className={styles.bookAuthor}>{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {stats.totalBooks === 0 && (
        <section className={styles.empty}>
          <p className={styles.emptyText}>你的书架空空如也</p>
          <p className={styles.emptyHint}>搜索并添加你的第一本书吧</p>
          <Link to="/search" className={styles.primaryButton}>
            开始搜索
          </Link>
        </section>
      )}
    </div>
  );
}

export default HomePage;
