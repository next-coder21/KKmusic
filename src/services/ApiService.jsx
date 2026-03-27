import { API_CONFIG } from "../config";

const API_BASE_URL = API_CONFIG.AUTH_URL;

const ApiService = {
  getBaseUrl: () => API_BASE_URL,
};

export default ApiService;
// const API_BASE_URL = "http://localhost:5000/auth";

// const API_BASE_URL = "https://6e35-103-163-248-91.ngrok-free.app/auth";