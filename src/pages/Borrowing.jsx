import React, { useState } from 'react';

function Borrowing() {
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const collateralRatio = 180; // Example value

  const handleBorrow = (e) => {
    e.preventDefault();
    // Implement borrow logic
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8">
        <h2 className="text-3xl font-bold text-white mb-6">Borrowing Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-700/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Your Borrowing Stats</h3>
            <div className="space-y-3">
              <p className="text-gray-300">Collateral Deposited: 0 ETH</p>
              <p className="text-gray-300">Amount Borrowed: 0 USD</p>
              <p className={`font-bold ${collateralRatio < 150 ? 'text-red-500' : 'text-green-500'}`}>
                Collateral Ratio: {collateralRatio}%
                {collateralRatio < 150 && (
                  <span className="ml-2 text-red-500">⚠️ Liquidation Risk!</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Borrow Tokens</h3>
            <form onSubmit={handleBorrow} className="space-y-4">
              <div>
                <input
                  type="number"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  placeholder="Collateral Amount (ETH)"
                  className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 mb-3"
                />
                <input
                  type="number"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  placeholder="Borrow Amount (USD)"
                  className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              >
                Borrow
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Borrowing;