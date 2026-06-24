import React, { createContext, useContext, useState, useEffect } from "react";
import http from "../services/http";
import { useUser } from "./UserContext";

const NotificationsContext = createContext();
export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await http.get("/auth/notifications");
      const notifs = data || [];

      // Attempt to fetch announcements; silently ignore if endpoint not available
      let announcements = [];
      try {
        const annRes = await http.get("/auth/announcements").catch(() => ({ data: [] }));
        announcements = (annRes.data || []).map(a => ({
          id: `ann-${a.id}`,
          title: a.title,
          body: a.body ? a.body.slice(0, 120) : "",
          is_read: false,
          type: "announcement",
          action_url: null,
        }));
      } catch { /* announcements endpoint not available */ }

      const merged = [...announcements, ...notifs];
      setNotifications(merged);
      setUnreadCount(merged.filter(n => !n.is_read).length);
    } catch { /* silent — notifications are non-critical */ }
  };

  useEffect(() => { fetchNotifications(); }, [user?.email]);

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await http.patch(`/auth/notifications/${id}/read`, {});
    } catch { /* already updated optimistically */ }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await http.patch("/auth/notifications/read-all", {});
    } catch { /* already updated optimistically */ }
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};
