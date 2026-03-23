const axios = require('axios');

const OPEN_LIBRARY_BASE = 'https://openlibrary.org';

// 搜索书籍
async function searchBooks(query) {
  try {
    const response = await axios.get(`${OPEN_LIBRARY_BASE}/search.json`, {
      params: {
        q: query,
        limit: 20,
        fields: 'key,title,author_name,first_publish_year,publisher,isbn,cover_i,edition_count,number_of_pages_median'
      }
    });

    return response.data.docs.map(book => ({
      openLibraryId: book.key?.replace('/works/', ''),
      title: book.title,
      author: book.author_name?.join(', ') || '未知作者',
      publishYear: book.first_publish_year,
      publisher: book.publisher?.[0],
      isbn: book.isbn?.[0],
      coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
      editionCount: book.edition_count || 1,
      pageCount: book.number_of_pages_median
    }));
  } catch (error) {
    console.error('Open Library搜索失败:', error.message);
    throw new Error('搜索书籍失败');
  }
}

// 获取书籍的所有版本
async function getEditions(openLibraryId) {
  try {
    const response = await axios.get(`${OPEN_LIBRARY_BASE}/works/${openLibraryId}/editions.json`);
    const editions = response.data.entries || [];

    return editions.map(edition => ({
      openLibraryId: edition.key?.replace('/books/', ''),
      title: edition.title,
      author: edition.authors?.map(a => a.name).join(', ') || '未知作者',
      publisher: edition.publishers?.[0],
      publishYear: edition.publish_date?.match(/\d{4}/)?.[0],
      isbn: edition.isbn_13?.[0] || edition.isbn_10?.[0],
      coverUrl: edition.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-M.jpg`
        : null,
      pageCount: edition.number_of_pages
    }));
  } catch (error) {
    console.error('获取版本失败:', error.message);
    throw new Error('获取书籍版本失败');
  }
}

// 获取书籍详情
async function getBookDetails(openLibraryId) {
  try {
    const response = await axios.get(`${OPEN_LIBRARY_BASE}/works/${openLibraryId}.json`);
    const book = response.data;

    return {
      openLibraryId: openLibraryId,
      title: book.title,
      description: typeof book.description === 'string'
        ? book.description
        : book.description?.value || '',
      covers: book.covers,
      coverUrl: book.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
        : null
    };
  } catch (error) {
    console.error('获取书籍详情失败:', error.message);
    throw new Error('获取书籍详情失败');
  }
}

module.exports = { searchBooks, getEditions, getBookDetails };
