import React, { useState } from 'react';

function Lending() {
  const [amount, setAmount] = useState('');

  const handleDeposit = (e) => {
    e.preventDefault();
    // Implement deposit logic
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8">
        <h2 className="text-3xl font-bold text-white mb-6">Lending Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-700/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Your Lending Stats</h3>
            <div className="space-y-3 text-gray-300">
              <p>Total Deposited: 0 ETH</p>
              <p>Earned Interest: 0 USD</p>
              <p>Current APY: 0%</p>
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Deposit ETH</h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount in ETH"
                  className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              >
                Deposit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lending;