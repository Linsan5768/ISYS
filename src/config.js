// Get API URL from environment variable or use default
const API_BASE_URL = process.env.VUE_APP_API_URL || window.location.origin;  // Will use the same origin in production

// Determine if we're running on GitHub Pages
const isGitHubPages = window.location.hostname.includes('github.io');

// Export configuration
export default {
  apiBaseUrl: API_BASE_URL,
  isGitHubPages: isGitHubPages
};