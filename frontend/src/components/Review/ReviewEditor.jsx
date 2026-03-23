import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { addReview, updateReview, deleteReview } from '../../services/api';
import toast from 'react-hot-toast';
import styles from './ReviewEditor.module.css';

function ReviewEditor({ bookId, review, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (review) {
      setContent(review.content || '');
      setRating(review.rating || 0);
      setStartDate(review.reading_start_date || '');
      setEndDate(review.reading_end_date || '');
    }
  }, [review]);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet',
    'blockquote', 'code-block'
  ];

  const startEdit = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (review) {
      setContent(review.content || '');
      setRating(review.rating || 0);
      setStartDate(review.reading_start_date || '');
      setEndDate(review.reading_end_date || '');
    } else {
      setContent('');
      setRating(0);
      setStartDate('');
      setEndDate('');
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        content,
        rating: rating || null,
        reading_start_date: startDate || null,
        reading_end_date: endDate || null
      };

      if (review) {
        await updateReview(bookId, data);
        toast.success('书评已更新');
      } else {
        await addReview(bookId, data);
        toast.success('书评已保存');
      }

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这篇书评吗？')) {
      return;
    }

    try {
      await deleteReview(bookId);
      setContent('');
      setRating(0);
      setStartDate('');
      setEndDate('');
      setIsEditing(false);
      toast.success('书评已删除');
      onUpdate();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const renderStars = (value, interactive = false) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`${styles.star} ${star <= value ? styles.filled : ''} ${interactive ? styles.interactive : ''}`}
        onClick={interactive ? () => setRating(star) : undefined}
      >
        ★
      </span>
    ));
  };

  return (
    <div className={styles.reviewEditor}>
      {!review && !isEditing && (
        <button className={styles.addButton} onClick={startEdit}>
          开始写书评
        </button>
      )}

      {isEditing ? (
        <div className={styles.editorContainer}>
          <div className={styles.metaFields}>
            <div className={styles.field}>
              <label className={styles.label}>评分</label>
              <div className={styles.stars}>{renderStars(rating, true)}</div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>开始阅读</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>读完日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </div>
          </div>

          <div className={styles.editorWrapper}>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="写下你的读后感..."
              theme="snow"
            />
          </div>

          <div className={styles.editorActions}>
            <button className={styles.cancelButton} onClick={cancelEdit}>
              取消
            </button>
            <button className={styles.saveButton} onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
      ) : review ? (
        <div className={styles.reviewContent}>
          <div className={styles.reviewHeader}>
            <div className={styles.stars}>{renderStars(rating)}</div>
            {(startDate || endDate) && (
              <div className={styles.readingDates}>
                {startDate && <span>开始: {startDate}</span>}
                {endDate && <span>读完: {endDate}</span>}
              </div>
            )}
          </div>

          {content && (
            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          <div className={styles.reviewActions}>
            <button className={styles.editBtn} onClick={startEdit}>
              编辑
            </button>
            <button className={styles.deleteBtn} onClick={handleDelete}>
              删除
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ReviewEditor;
