// config.js
const isGitHubPages = window.location.hostname.includes('github.io');

const API_BASE_URL =
  process.env.VUE_APP_API_URL ||
  (isGitHubPages ? '/' : 'https://fanum-backend.onrender.com');

export default {
  apiBaseUrl: API_BASE_URL,
  isGitHubPages
};