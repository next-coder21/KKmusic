import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import Common from "./Router/Common";

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <NotificationsProvider>
          <Common />
        </NotificationsProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
