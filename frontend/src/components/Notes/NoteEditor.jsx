import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { addNote, updateNote } from '../../services/api';
import toast from 'react-hot-toast';
import styles from './NoteEditor.module.css';

function NoteEditor({ bookId, notes, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setIsAdding(false);
    setTitle(note.title);
    setContent(note.content || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setTitle('');
    setContent('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入笔记标题');
      return;
    }

    try {
      if (editingId) {
        await updateNote(bookId, editingId, { title, content });
        toast.success('笔记已更新');
      } else {
        await addNote(bookId, { title, content });
        toast.success('笔记已保存');
      }
      cancelEdit();
      onUpdate();
    } catch (error) {
      toast.error('保存失败');
    }
  };

  return (
    <div className={styles.noteEditor}>
      {!isAdding && !editingId && (
        <button className={styles.addButton} onClick={startAdd}>
          + 新建笔记
        </button>
      )}

      {(isAdding || editingId) && (
        <div className={styles.editorContainer}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="笔记标题"
            className={styles.titleInput}
          />
          <div className={styles.editorWrapper}>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="开始记录你的笔记..."
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
      )}

      <div className={styles.noteList}>
        {notes.length === 0 && !isAdding && (
          <p className={styles.emptyHint}>暂无笔记，点击上方按钮创建</p>
        )}

        {notes.map((note) => (
          <div key={note.id} className={styles.noteCard}>
            {editingId === note.id ? null : (
              <>
                <div className={styles.noteHeader}>
                  <h3 className={styles.noteTitle}>{note.title}</h3>
                  <span className={styles.noteDate}>
                    {new Date(note.updated_date).toLocaleDateString()}
                  </span>
                </div>
                <div
                  className={styles.noteContent}
                  dangerouslySetInnerHTML={{ __html: note.content || '' }}
                />
                <div className={styles.noteActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => startEdit(note)}
                  >
                    编辑
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => onDelete(note.id)}
                  >
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NoteEditor;
