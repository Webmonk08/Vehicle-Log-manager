import axios from "axios";
import { Platform } from "react-native";
 
const LAN_IP = "10.181.238.179";

function resolveDevHost() {
  if (Platform.OS === "android") return "10.0.2.2"; // Android Emulator
  if (Platform.OS === "ios") return "localhost";    // iOS Simulator
  return LAN_IP;                                    // Physical Device
}

// __DEV__ is true when running `expo start` locally.
// __DEV__ is false when the app is built into an APK (EAS Build).
export const API_BASE_URL = __DEV__
  ? `http://${LAN_IP}:8000/api/v1`
  : "https://vehicle-log-manager.onrender.com/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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