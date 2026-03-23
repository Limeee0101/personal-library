import { useState } from 'react';
import { login, register } from '../services/api';
import toast from 'react-hot-toast';
import styles from './LoginPage.module.css';

function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('请输入用户名和密码');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await register({ username: username.trim(), password, nickname: nickname.trim() || username.trim() });
        toast.success('注册成功');
      } else {
        res = await login({ username: username.trim(), password });
        toast.success('登录成功');
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (error) {
      toast.error(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.logo}>📚</h1>
        <h2 className={styles.title}>个人图书馆</h2>
        <p className={styles.subtitle}>
          {isRegister ? '创建账号，开始你的阅读之旅' : '登录你的图书馆'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
            />
          </div>

          {isRegister && (
            <div className={styles.inputGroup}>
              <label>昵称（可选）</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="显示名称"
              />
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
          </button>
        </form>

        <div className={styles.switch}>
          <span>
            {isRegister ? '已有账号？' : '没有账号？'}
          </span>
          <button
            type="button"
            className={styles.switchBtn}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? '立即登录' : '立即注册'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
