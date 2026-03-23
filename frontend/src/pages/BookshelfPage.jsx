import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBooks, getCategories, updateBookCategories, addCategory, deleteCategory } from '../services/api';
import toast from 'react-hot-toast';
import styles from './BookshelfPage.module.css';

const COLORS = [
  '#2C3E50', '#E74C3C', '#3498DB', '#27AE60',
  '#F39C12', '#9B59B6', '#1ABC9C', '#34495E'
];

function BookshelfPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('added_date');
  const [loading, setLoading] = useState(true);
  const [taggingBook, setTaggingBook] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(COLORS[0]);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [managingTags, setManagingTags] = useState(false);

  useEffect(() => {
    fetchData();
  }, [sortBy]);

  const fetchData = async () => {
    try {
      const [booksRes, categoriesRes] = await Promise.all([
        getBooks({ sort: sortBy, order: 'desc' }),
        getCategories()
      ]);
      setBooks(booksRes.data.books);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  const openTagModal = (book, e) => {
    e.preventDefault();
    e.stopPropagation();
    setTaggingBook(book);
  };

  const closeTagModal = () => {
    setTaggingBook(null);
    setNewTagName('');
    setShowNewTagForm(false);
  };

  const toggleTag = async (categoryId) => {
    if (!taggingBook) return;

    const currentTags = taggingBook.categories?.map(c => c.id) || [];
    let newTags;

    if (currentTags.includes(categoryId)) {
      newTags = currentTags.filter(id => id !== categoryId);
    } else {
      newTags = [...currentTags, categoryId];
    }

    try {
      await updateBookCategories(taggingBook.id, newTags);
      toast.success('标签已更新');
      fetchData();
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const res = await addCategory({ name: newTagName.trim(), color: newTagColor });
      setCategories([...categories, res.data.category]);
      setNewTagName('');
      setShowNewTagForm(false);
      toast.success('标签已创建');
    } catch (error) {
      toast.error('创建失败，标签名可能已存在');
    }
  };

  const handleDeleteCategory = async (categoryId, e) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这个标签吗？书籍不会被删除，只是移除标签关联。')) return;

    try {
      await deleteCategory(categoryId);
      setCategories(categories.filter(c => c.id !== categoryId));
      toast.success('标签已删除');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  return (
    <div className={styles.bookshelf}>
      <div className={styles.header}>
        <h1 className={styles.title}>我的书架</h1>
        <div className={styles.controls}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.select}
          >
            <option value="added_date">按添加时间</option>
            <option value="title">按书名</option>
            <option value="author">按作者</option>
          </select>
        </div>
      </div>

      {categories.length > 0 && (
        <div className={styles.categorySection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>分类标签</h3>
            <button
              className={styles.manageBtn}
              onClick={() => setManagingTags(!managingTags)}
            >
              {managingTags ? '完成' : '管理'}
            </button>
          </div>
          <div className={styles.categoryTags}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={styles.categoryTag}
                style={{ background: cat.color + '15', borderColor: cat.color }}
                onClick={() => !managingTags && handleCategoryClick(cat.id)}
              >
                <span className={styles.tagDot} style={{ background: cat.color }} />
                <span className={styles.tagName}>{cat.name}</span>
                <span className={styles.tagCount}>{cat.book_count}</span>
                {managingTags && (
                  <button
                    className={styles.deleteTagBtn}
                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {books.length === 0 ? (
        <div className={styles.empty}>
          <p>书架空空如也</p>
          <Link to="/search" className={styles.link}>
            去添加一些书籍吧
          </Link>
        </div>
      ) : (
        <div className={styles.bookGrid}>
          {books.map((book) => (
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
                {book.categories && book.categories.length > 0 && (
                  <div className={styles.bookTags}>
                    {book.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className={styles.miniTag}
                        style={{ background: cat.color + '20', color: cat.color }}
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                className={styles.tagBtn}
                onClick={(e) => openTagModal(book, e)}
              >
                🏷️
              </button>
            </Link>
          ))}
        </div>
      )}

      {/* 标签弹窗 */}
      {taggingBook && (
        <div className={styles.modal} onClick={closeTagModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>为《{taggingBook.title}》添加标签</h3>
              <button className={styles.closeBtn} onClick={closeTagModal}>×</button>
            </div>

            <div className={styles.tagList}>
              {categories.map((cat) => {
                const isSelected = taggingBook.categories?.some(c => c.id === cat.id);
                return (
                  <button
                    key={cat.id}
                    className={`${styles.tagItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggleTag(cat.id)}
                  >
                    <span className={styles.tagDot} style={{ background: cat.color }} />
                    {cat.name}
                    {isSelected && <span className={styles.checkMark}>✓</span>}
                  </button>
                );
              })}
            </div>

            {showNewTagForm ? (
              <div className={styles.newTagForm}>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="标签名称"
                  className={styles.input}
                  autoFocus
                />
                <div className={styles.colorPicker}>
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`${styles.colorOption} ${newTagColor === color ? styles.selected : ''}`}
                      style={{ background: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
                <div className={styles.formActions}>
                  <button className={styles.cancelBtn} onClick={() => setShowNewTagForm(false)}>
                    取消
                  </button>
                  <button className={styles.createBtn} onClick={handleAddTag}>
                    创建
                  </button>
                </div>
              </div>
            ) : (
              <button className={styles.addTagBtn} onClick={() => setShowNewTagForm(true)}>
                + 创建新标签
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BookshelfPage;
