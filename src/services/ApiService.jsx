import { API_CONFIG } from "../config";

const API_BASE_URL = API_CONFIG.AUTH_URL;

const ApiService = {
  getBaseUrl: () => API_BASE_URL,
};

export default ApiService;