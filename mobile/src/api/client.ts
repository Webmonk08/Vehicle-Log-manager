import axios from "axios";
import { Platform } from "react-native";

// TODO: move to app config / env (expo-constants) before shipping.
//
// "localhost" from a device/emulator refers to the device itself, not your
// computer running uvicorn — this is the #1 cause of ERR_NETWORK here.
//   - iOS Simulator            -> localhost works as-is
//   - Android Emulator         -> 10.0.2.2 is the special alias for the host machine
//   - Physical device / Expo Go -> must be your computer's LAN IP (same Wi-Fi)
//
// Replace LAN_IP below with your machine's IP (`ipconfig getifaddr en0` on Mac,
// or `ipconfig` on Windows) if you're testing on a physical device.
const LAN_IP = "192.168.1.100"; // <-- change this

function resolveHost() {
  if (Platform.OS === "android") return "172.30.206.179";
  if (Platform.OS === "ios") return "localhost";
  return LAN_IP; // physical device / web fallback
}

export const API_BASE_URL = `http://${resolveHost()}:8000/api/v1`;

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