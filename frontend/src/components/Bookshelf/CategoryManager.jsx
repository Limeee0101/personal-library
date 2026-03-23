import { useState } from 'react';
import styles from './CategoryManager.module.css';

const COLORS = [
  '#2C3E50', '#E74C3C', '#3498DB', '#27AE60',
  '#F39C12', '#9B59B6', '#1ABC9C', '#34495E'
];

function CategoryManager({ allCategories, selectedCategories, onUpdate, onAddCategory, onClose }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [localSelected, setLocalSelected] = useState(selectedCategories || []);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (categoryId) => {
    if (localSelected.includes(categoryId)) {
      setLocalSelected(localSelected.filter(id => id !== categoryId));
    } else {
      setLocalSelected([...localSelected, categoryId]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(localSelected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const category = await onAddCategory(newCategoryName.trim(), newCategoryColor);
      setLocalSelected([...localSelected, category.id]);
      setNewCategoryName('');
      setShowNewForm(false);
    } catch (error) {
      alert('创建分类失败，可能名称已存在');
    }
  };

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h3 className={styles.title}>管理分类</h3>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.categoryList}>
        {allCategories.map((category) => (
          <label key={category.id} className={styles.categoryItem}>
            <input
              type="checkbox"
              checked={localSelected.includes(category.id)}
              onChange={() => toggleCategory(category.id)}
            />
            <span
              className={styles.colorDot}
              style={{ background: category.color }}
            />
            <span className={styles.categoryName}>{category.name}</span>
          </label>
        ))}
      </div>

      {showNewForm ? (
        <div className={styles.newForm}>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="分类名称"
            className={styles.input}
            autoFocus
          />
          <div className={styles.colorPicker}>
            {COLORS.map((color) => (
              <button
                key={color}
                className={`${styles.colorOption} ${newCategoryColor === color ? styles.selected : ''}`}
                style={{ background: color }}
                onClick={() => setNewCategoryColor(color)}
              />
            ))}
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowNewForm(false)}>
              取消
            </button>
            <button className={styles.createBtn} onClick={handleAddCategory}>
              创建
            </button>
          </div>
        </div>
      ) : (
        <button className={styles.addBtn} onClick={() => setShowNewForm(true)}>
          + 新建分类
        </button>
      )}

      <div className={styles.footer}>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

export default CategoryManager;
