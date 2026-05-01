import { Toaster } from "react-hot-toast";
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import Common from "./Router/Common";

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <NotificationsProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#0f0f17",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: "0.85rem",
              },
              success: { iconTheme: { primary: "#C8FF00", secondary: "#000" } },
              error:   { iconTheme: { primary: "#ff5f56", secondary: "#fff" } },
            }}
          />
          <Common />
        </NotificationsProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
