import { useState } from 'react';
import { searchBooks, getEditions, addBook } from '../services/api';
import toast from 'react-hot-toast';
import styles from './SearchPage.module.css';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await searchBooks(query);
      setResults(res.data.results);
      setSearched(true);
    } catch (error) {
      toast.error('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = async (book) => {
    if (book.editionCount > 1) {
      setLoadingVersions(true);
      setShowVersions(true);
      setSelectedBook(book);
      try {
        const res = await getEditions(book.openLibraryId);
        setVersions(res.data.editions);
      } catch (error) {
        toast.error('获取版本失败');
        setVersions([book]);
      } finally {
        setLoadingVersions(false);
      }
    } else {
      await addToBookshelf(book);
    }
  };

  const addToBookshelf = async (book) => {
    try {
      await addBook({
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        isbn: book.isbn,
        open_library_id: book.openLibraryId,
        cover_url: book.coverUrl,
        publish_year: book.publishYear,
        page_count: book.pageCount
      });
      toast.success(`《${book.title}》已添加到书架`);
      setShowVersions(false);
      setSelectedBook(null);
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('添加失败，请重试');
      }
    }
  };

  return (
    <div className={styles.searchPage}>
      <h1 className={styles.title}>搜索添加书籍</h1>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入书名搜索..."
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton} disabled={loading}>
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      {searched && results.length === 0 && (
        <div className={styles.noResults}>
          <p>未找到相关书籍</p>
          <p className={styles.hint}>尝试使用其他关键词</p>
        </div>
      )}

      <div className={styles.results}>
        {results.map((book, index) => (
          <div key={book.openLibraryId || index} className={styles.resultCard}>
            <div className={styles.coverWrapper}>
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className={styles.cover} />
              ) : (
                <div className={styles.coverPlaceholder}>📖</div>
              )}
            </div>
            <div className={styles.bookInfo}>
              <h3 className={styles.bookTitle}>{book.title}</h3>
              <p className={styles.bookAuthor}>{book.author}</p>
              {book.publishYear && (
                <p className={styles.bookMeta}>{book.publishYear}年</p>
              )}
              {book.editionCount > 1 && (
                <p className={styles.editionInfo}>{book.editionCount} 个版本</p>
              )}
            </div>
            <button
              className={styles.addButton}
              onClick={() => handleSelectBook(book)}
            >
              添加
            </button>
          </div>
        ))}
      </div>

      {showVersions && (
        <div className={styles.modal} onClick={() => setShowVersions(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>选择版本</h2>
              <button className={styles.closeButton} onClick={() => setShowVersions(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {loadingVersions ? (
                <p className={styles.loading}>加载版本中...</p>
              ) : (
                <div className={styles.versionList}>
                  {versions.map((version, index) => (
                    <div
                      key={version.openLibraryId || index}
                      className={styles.versionCard}
                      onClick={() => addToBookshelf(version)}
                    >
                      <div className={styles.versionCover}>
                        {version.coverUrl ? (
                          <img src={version.coverUrl} alt={version.title} />
                        ) : (
                          <span>📖</span>
                        )}
                      </div>
                      <div className={styles.versionInfo}>
                        <p className={styles.versionTitle}>{version.title}</p>
                        <p className={styles.versionMeta}>
                          {version.publisher && <span>{version.publisher}</span>}
                          {version.publishYear && <span>{version.publishYear}年</span>}
                          {version.isbn && <span>ISBN: {version.isbn}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
