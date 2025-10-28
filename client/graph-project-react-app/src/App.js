// client/src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import QueryPage from './pages/QueryPage';
import PersonalPage from './pages/PersonalPage';
import './App.css';

// Main App component with routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QueryPage />} />
        <Route path="/personal" element={<PersonalPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;