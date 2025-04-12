import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Lending from './pages/Lending';
import Borrowing from './pages/Borrowing';
import { ethers } from 'ethers';

function App() {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = await provider.getSigner();
        const address = signer.address;
        setAccount(address);
        console.log(`Connected to wallet: ${address}`);
        setIsConnected(true);
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    console.log('Wallet disconnected');
  };

  // Listen for account changes from MetaMask
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        // User disconnected their wallet from the dApp
        disconnectWallet();
      } else {
        // User switched accounts
        setAccount(accounts[0]);
      }
    });
  }

  return (
    <Router>
      <div className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar
            isConnected={isConnected}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            account={account}
          />
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