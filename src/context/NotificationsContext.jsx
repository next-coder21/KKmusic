import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import ApiService from "../services/ApiService";
import { API_CONFIG } from "../config";
import { useUser } from "./UserContext";

const NotificationsContext = createContext();
export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  const BASE = API_CONFIG.AUTH_URL; 

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      // FIX: was /auth/auth/notifications — BASE already includes /auth
      const { data } = await axios.get(`${BASE}/notifications`, { withCredentials: true });
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch { /* silent — notifications are non-critical */ }
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      // FIX: was /auth/auth/notifications/:id/read
      await axios.patch(`${BASE}/notifications/${id}/read`, {}, { withCredentials: true });
    } catch { /* already updated optimistically */ }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      // FIX: was /auth/auth/notifications/read-all
      await axios.patch(`${BASE}/notifications/read-all`, {}, { withCredentials: true });
    } catch { /* already updated optimistically */ }
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};
