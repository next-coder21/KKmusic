import { PlayerProvider } from "./context/PlayerContext";
import { UserProvider } from "./context/UserContext";
import Common from "./Router/Common";

function App() {
  return (
    <UserProvider> {/* Ensuring the user context wraps the entire app */}
    
      <Common />
      
    </UserProvider>
  );
}

export default App;
