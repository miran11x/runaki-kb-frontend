import axios from 'axios';

const api = axios.create({ baseURL: 'https://runaki-kb-fsftl9g3m-miran11xs-projects.vercel.app/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('rk_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rk_token');
      localStorage.removeItem('rk_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;