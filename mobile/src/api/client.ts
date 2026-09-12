import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
 
// Resolution order:
//   1. app.json -> extra.apiBaseUrl (what real builds use — set this to your
//      deployed backend, e.g. https://your-app.onrender.com/api/v1)
//   2. Local-dev fallback per platform, for `expo start` during development.
//
// Changing extra.apiBaseUrl and running `eas update` pushes the change to
// your friend's installed app WITHOUT a new build/reinstall, since this is
// plain JS — only native config changes (permissions, package name, etc.)
// need a fresh `eas build`.
 
const LAN_IP = "192.168.1.18"; // <-- only used for local dev fallback below
 
function resolveDevHost() {
  if (Platform.OS === "ios") return "localhost";
  return LAN_IP;
}
 
 
export const API_BASE_URL = `http://${resolveDevHost()}:8000/api/v1`
 
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
 
apiClient.interceptors.request.use((config) => {
  const method = (config.method || 'GET').toUpperCase();
  const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
  console.log(`[Frontend] Request: ${method} ${fullUrl}`);
  if (config.data) {
    console.log(`[Frontend] Request Body:`, config.data);
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    const fullUrl = `${res.config.baseURL || ''}${res.config.url || ''}`;
    console.log(`[Frontend] Response: ${res.status} ${fullUrl}`);
    if (res.data) {
      console.log(`[Frontend] Response Data:`, res.data);
    }
    return res;
  },
  (error) => {
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    console.log(`[Frontend] Response Error: ${error.response?.status || 'Network Error'} ${fullUrl}`);
    if (error.response?.data) {
      console.log(`[Frontend] Error Data:`, error.response.data);
    }
    if (!error.response) {
      // Network-level failure — likely offline. Screens should catch this and
      // fall back to cached data via the offline layer (see src/store).
      return Promise.reject({ ...error, isOffline: true });
    }
    return Promise.reject(error);
  }
);