import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getCategories, getBooks, deleteBook } from '../services/api';
import toast from 'react-hot-toast';
import styles from './CategoryPage.module.css';

function CategoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [categoriesRes, booksRes] = await Promise.all([
        getCategories(),
        getBooks({ category: id })
      ]);

      const cat = categoriesRes.data.categories.find(c => c.id === parseInt(id));
      setCategory(cat);
      setBooks(booksRes.data.books);
    } catch (error) {
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('确定要删除这本书吗？')) return;

    try {
      await deleteBook(bookId);
      toast.success('删除成功');
      setBooks(books.filter(b => b.id !== bookId));
    } catch (error) {
      toast.error('删除失败');
    }
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (!category) {
    return <div className={styles.error}>分类不存在</div>;
  }

  return (
    <div className={styles.categoryPage}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/bookshelf')}>
          ← 返回书架
        </button>
        <h1 className={styles.title}>
          <span
            className={styles.colorDot}
            style={{ background: category.color }}
          />
          {category.name}
        </h1>
        <p className={styles.count}>{books.length} 本书</p>
      </div>

      {books.length === 0 ? (
        <div className={styles.empty}>
          <p>该分类下暂无书籍</p>
          <Link to="/search" className={styles.addButton}>添加书籍</Link>
        </div>
      ) : (
        <div className={styles.bookGrid}>
          {books.map((book) => (
            <div key={book.id} className={styles.bookCard}>
              <Link to={`/book/${book.id}`}>
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
              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteBook(book.id)}
              >
                移除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryPage;
