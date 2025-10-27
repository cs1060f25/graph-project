// client/src/App.js
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import PersonalPage from './pages/PersonalPage';
import logo from './logo.svg';
import './App.css';

// Home page component (your original App content)
function HomePage() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        
        {/* Add link to Personal Page */}
        <div style={{ marginTop: '2rem' }}>
          <Link 
            to="/personal" 
            style={{ 
              color: '#61dafb', 
              fontSize: '1.2rem',
              textDecoration: 'none',
              border: '2px solid #61dafb',
              padding: '10px 20px',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            Go to My Saved Papers →
          </Link>
        </div>
      </header>
    </div>
  );
}

// Main App component with routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/personal" element={<PersonalPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;