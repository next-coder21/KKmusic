import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import ApiService from "../services/ApiService";
import { API_CONFIG } from "../config";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { withCredentials: true };
        if (token) {
          headers.headers = { Authorization: `Bearer ${token}` };
        }
        
        const response = await axios.get(`${API_CONFIG.AUTH_URL}/check-auth`, headers);
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
