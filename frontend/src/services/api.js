import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 请求拦截器：自动添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理认证错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);

// 搜索书籍
export const searchBooks = (query) => api.get(`/search?q=${encodeURIComponent(query)}`);

// 获取书籍版本
export const getEditions = (openLibraryId) => api.get(`/search/editions/${openLibraryId}`);

// 书籍相关
export const getBooks = (params) => api.get('/books', { params });
export const getBook = (id) => api.get(`/books/${id}`);
export const addBook = (data) => api.post('/books', data);
export const updateBook = (id, data) => api.put(`/books/${id}`, data);
export const deleteBook = (id) => api.delete(`/books/${id}`);
export const updateBookCategories = (id, categoryIds) => api.put(`/books/${id}/categories`, { categoryIds });

// 分类相关
export const getCategories = () => api.get('/categories');
export const addCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// 笔记相关
export const getNotes = (bookId) => api.get(`/books/${bookId}/notes`);
export const getNote = (bookId, noteId) => api.get(`/books/${bookId}/notes/${noteId}`);
export const addNote = (bookId, data) => api.post(`/books/${bookId}/notes`, data);
export const updateNote = (bookId, noteId, data) => api.put(`/books/${bookId}/notes/${noteId}`, data);
export const deleteNote = (bookId, noteId) => api.delete(`/books/${bookId}/notes/${noteId}`);

// 书评相关
export const getReview = (bookId) => api.get(`/books/${bookId}/review`);
export const addReview = (bookId, data) => api.post(`/books/${bookId}/review`, data);
export const updateReview = (bookId, data) => api.put(`/books/${bookId}/review`, data);
export const deleteReview = (bookId) => api.delete(`/books/${bookId}/review`);

export default api;
