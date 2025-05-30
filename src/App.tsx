import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationForm from './Components/RegistrationForm';
import Lobby from './Components/Lobby';
import Game from './Components/Game';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/register" element={<RegistrationForm />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game/:roomId" element={<Game />} />
        <Route path="/" element={<RegistrationForm />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
