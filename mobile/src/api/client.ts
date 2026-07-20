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
const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
 
const LAN_IP = "192.168.1.100"; // <-- only used for local dev fallback below
 
function resolveDevHost() {
  if (Platform.OS === "android") return "10.0.2.2";
  if (Platform.OS === "ios") return "localhost";
  return LAN_IP;
}
 
const isPlaceholder = !configuredUrl || configuredUrl.includes("REPLACE_WITH");
 
export const API_BASE_URL = isPlaceholder
  ? `http://${resolveDevHost()}:8000/api/v1`
  : configuredUrl;
 
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
 
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      // Network-level failure — likely offline. Screens should catch this and
      // fall back to cached data via the offline layer (see src/store).
      return Promise.reject({ ...error, isOffline: true });
    }
    return Promise.reject(error);
  }
);