import { Route, Routes } from "react-router-dom";

import PandaSkiingPage from "@/pages/pandaskiing";

function App() {
  return (
    <Routes>
      <Route element={<PandaSkiingPage />} path="/" />
    </Routes>
  );
}

export default App;
