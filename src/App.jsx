import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Lending from './pages/Lending';
import Borrowing from './pages/Borrowing';

function App() {
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  return (
    <Router>
      <div className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar isConnected={isConnected} onConnect={connectWallet} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lending" element={<Lending />} />
              <Route path="/borrowing" element={<Borrowing />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;