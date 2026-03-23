import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBook, deleteBook, getCategories, updateBookCategories, addCategory, deleteNote } from '../services/api';
import toast from 'react-hot-toast';
import NoteEditor from '../components/Notes/NoteEditor';
import ReviewEditor from '../components/Review/ReviewEditor';
import CategoryManager from '../components/Bookshelf/CategoryManager';
import styles from './BookDetailPage.module.css';

function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('notes');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      const [bookRes, categoriesRes] = await Promise.all([
        getBook(id),
        getCategories()
      ]);
      setBook(bookRes.data.book);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      toast.error('获取书籍信息失败');
      navigate('/bookshelf');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这本书吗？相关笔记和书评也会被删除。')) {
      return;
    }

    try {
      await deleteBook(id);
      toast.success('删除成功');
      navigate('/bookshelf');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('确定要删除这条笔记吗？')) {
      return;
    }

    try {
      await deleteNote(id, noteId);
      toast.success('删除成功');
      fetchBook();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleUpdateCategories = async (categoryIds) => {
    try {
      await updateBookCategories(id, categoryIds);
      toast.success('分类已更新');
      fetchBook();
    } catch (error) {
      toast.error('更新分类失败');
    }
  };

  const handleAddCategory = async (name, color) => {
    try {
      const res = await addCategory({ name, color });
      setCategories([...categories, res.data.category]);
      return res.data.category;
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (!book) {
    return null;
  }

  return (
    <div className={styles.detailPage}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        ← 返回
      </button>

      <div className={styles.bookHeader}>
        <div className={styles.coverSection}>
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className={styles.cover} />
          ) : (
            <div className={styles.coverPlaceholder}>📖</div>
          )}
        </div>

        <div className={styles.infoSection}>
          <h1 className={styles.title}>{book.title}</h1>
          <p className={styles.author}>{book.author}</p>

          <div className={styles.meta}>
            {book.publisher && <span>{book.publisher}</span>}
            {book.publish_year && <span>{book.publish_year}年</span>}
            {book.page_count && <span>{book.page_count}页</span>}
          </div>

          {book.description && (
            <p className={styles.description}>{book.description}</p>
          )}

          <div className={styles.categories}>
            {book.categories?.map((cat) => (
              <span
                key={cat.id}
                className={styles.categoryTag}
                style={{ background: cat.color + '20', color: cat.color }}
              >
                {cat.name}
              </span>
            ))}
            <button
              className={styles.editCategoryButton}
              onClick={() => setShowCategoryManager(true)}
            >
              管理分类
            </button>
          </div>

          <button className={styles.deleteButton} onClick={handleDelete}>
            删除此书
          </button>
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'notes' ? styles.active : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            笔记 ({book.notes?.length || 0})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'review' ? styles.active : ''}`}
            onClick={() => setActiveTab('review')}
          >
            书评
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'notes' && (
            <NoteEditor
              bookId={id}
              notes={book.notes || []}
              onDelete={handleDeleteNote}
              onUpdate={fetchBook}
            />
          )}
          {activeTab === 'review' && (
            <ReviewEditor
              bookId={id}
              review={book.review}
              onUpdate={fetchBook}
            />
          )}
        </div>
      </div>

      {showCategoryManager && (
        <div className={styles.modal} onClick={() => setShowCategoryManager(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <CategoryManager
              allCategories={categories}
              selectedCategories={book.categories?.map(c => c.id) || []}
              onUpdate={handleUpdateCategories}
              onAddCategory={handleAddCategory}
              onClose={() => setShowCategoryManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default BookDetailPage;
