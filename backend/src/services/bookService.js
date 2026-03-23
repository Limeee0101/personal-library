const axios = require('axios');

// 豆瓣图书搜索API
async function searchBooks(query) {
  try {
    const response = await axios.get('https://book.douban.com/j/subject_suggest', {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://book.douban.com/'
      },
      timeout: 15000
    });

    const books = response.data || [];

    return books
      .filter(book => book.type === 'b') // 只要书籍类型
      .map(book => ({
        doubanId: book.id,
        title: book.title,
        author: book.author_name || '未知作者',
        publisher: null,
        coverUrl: book.pic,
        publishYear: book.year,
        isbn: null,
        editionCount: 1
      }));
  } catch (error) {
    console.error('豆瓣搜索失败:', error.message);
    throw new Error('搜索书籍失败: ' + error.message);
  }
}

// 获取版本（豆瓣通常只有一个版本）
async function getEditions(bookId) {
  return [];
}

module.exports = { searchBooks, getEditions };
