import React, { useState, useEffect } from 'react';

function Borrowing() {
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [borrowers, setBorrowers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalCollateral: '0',
    totalBorrowed: '0',
    availableLiquidity: '0',
    yourCollateral: '0', 
    yourBorrowed: '0',
    yourHealthFactor: 'N/A'
  });

  // Calculate max borrowable amount
  const calculateMaxBorrowable = (ethAmount) => {
    if (!ethAmount || isNaN(ethAmount) || parseFloat(ethAmount) <= 0) return 0;
    const ethPrice = 1800;
    const collateralValue = parseFloat(ethAmount) * ethPrice;
    return (collateralValue * 0.75).toFixed(2); // 75% of collateral value
  };

  // Calculate health factor
  const calculateHealthFactor = (collateralETH, borrowedUSD) => {
    if (!borrowedUSD || parseFloat(borrowedUSD) === 0) return "∞";
    const ethPrice = 1800;
    const collateralValue = parseFloat(collateralETH) * ethPrice;
    return ((collateralValue / parseFloat(borrowedUSD)) * 100).toFixed(0);
  };

  // Simulate loading data
  useEffect(() => {
    setTimeout(() => {
      setBorrowers([
        { address: '0x62F...A8e3', collateralAmount: '15.8', borrowedAmount: '21,250', healthFactor: '175%', timestamp: '3 hours ago' },
        { address: '0x9aB...C2d4', collateralAmount: '8.2', borrowedAmount: '9,800', healthFactor: '195%', timestamp: '7 hours ago' },
        { address: '0x4dE...F5b2', collateralAmount: '22.5', borrowedAmount: '30,200', healthFactor: '162%', timestamp: '11 hours ago' },
        { address: '0x1cD...34A7', collateralAmount: '5.4', borrowedAmount: '6,480', healthFactor: '190%', timestamp: '18 hours ago' },
        { address: '0xE67...B9c1', collateralAmount: '12.3', borrowedAmount: '14,760', healthFactor: '140%', timestamp: '1 day ago' }
      ]);
      setIsLoading(false);
    }, 1500);
  }, []);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        const randomAddress = `0x${Math.floor(Math.random() * 16777215).toString(16).padStart(4, '0')}...${Math.floor(Math.random() * 16777215).toString(16).padStart(4, '0')}`;
        const randomCollateral = (Math.random() * 15 + 2).toFixed(2);
        const randomBorrowed = Math.floor(parseFloat(randomCollateral) * 1800 * 0.7).toFixed(0);
        const formattedBorrowed = randomBorrowed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const randomHealth = ((parseFloat(randomCollateral) * 1800 / randomBorrowed) * 100).toFixed(0);
        
        setBorrowers(prev => [
          { 
            address: randomAddress, 
            collateralAmount: randomCollateral, 
            borrowedAmount: formattedBorrowed,
            healthFactor: `${randomHealth}%`,
            timestamp: 'Just now'
          },
          ...prev.slice(0, 4)
        ]);
        
        setDashboardStats(prev => ({
          ...prev,
          totalCollateral: (parseFloat(prev.totalCollateral) + parseFloat(randomCollateral)).toFixed(1),
          totalBorrowed: (parseFloat(prev.totalBorrowed.replace(/,/g, '')) + parseFloat(randomBorrowed)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
          availableLiquidity: (parseFloat(prev.availableLiquidity.replace(/,/g, '')) - parseFloat(randomBorrowed)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        }));
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleBorrow = (e) => {
    e.preventDefault();
    
    if (!collateralAmount || isNaN(collateralAmount) || parseFloat(collateralAmount) <= 0) {
      alert('Please enter a valid collateral amount');
      return;
    }
    if (!borrowAmount || isNaN(borrowAmount) || parseFloat(borrowAmount) <= 0) {
      alert('Please enter a valid borrow amount');
      return;
    }
    
    const maxBorrowable = calculateMaxBorrowable(collateralAmount);
    if (parseFloat(borrowAmount) > parseFloat(maxBorrowable)) {
      alert(`You can only borrow up to $${maxBorrowable} based on your collateral`);
      return;
    }
    
    alert(`Depositing ${collateralAmount} ETH as collateral and borrowing $${borrowAmount} aUSD.`);
    
    const newHealthFactor = calculateHealthFactor(collateralAmount, borrowAmount);
    
    setDashboardStats(prev => ({
      ...prev,
      yourCollateral: (parseFloat(prev.yourCollateral) + parseFloat(collateralAmount)).toFixed(2),
      yourBorrowed: (parseFloat(prev.yourBorrowed) + parseFloat(borrowAmount)).toFixed(2),
      yourHealthFactor: `${newHealthFactor}%`,
      totalCollateral: (parseFloat(prev.totalCollateral) + parseFloat(collateralAmount)).toFixed(1),
      totalBorrowed: (parseFloat(prev.totalBorrowed.replace(/,/g, '')) + parseFloat(borrowAmount)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      availableLiquidity: (parseFloat(prev.availableLiquidity.replace(/,/g, '')) - parseFloat(borrowAmount)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }));
    
    setBorrowers(prev => [
      { 
        address: 'Your Position', 
        collateralAmount: collateralAmount, 
        borrowedAmount: borrowAmount,
        healthFactor: `${newHealthFactor}%`,
        timestamp: 'Just now'
      },
      ...prev.slice(0, 4)
    ]);
    
    setCollateralAmount('');
    setBorrowAmount('');
  };

  const handleHealthCheck = () => {
    if (parseFloat(dashboardStats.yourCollateral) === 0 || parseFloat(dashboardStats.yourBorrowed) === 0) {
      alert('You have no active borrowing position to check.');
      return;
    }
    
    const currentRatio = calculateHealthFactor(dashboardStats.yourCollateral, dashboardStats.yourBorrowed);
    
    if (parseInt(currentRatio) < 150) {
      alert(`⚠️ LIQUIDATION RISK! Your current health factor is ${currentRatio}%, which is below the safe threshold of 150%.`);
    } else {
      alert(`Your position is healthy. Current health factor: ${currentRatio}%`);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">BORROW</h1>
          <p className="text-gray-300">Deposit ETH as collateral and borrow aUSD against it</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <section className="relative mb-12">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl blur-xl"></div>
              <div className="relative grid grid-cols-2 md:grid-cols-3 gap-6 p-8 rounded-2xl backdrop-blur-sm">
                <div className="text-center p-5">
                  <p className="text-3xl font-light text-white mb-2">{dashboardStats.totalCollateral} ETH</p>
                  <p className="text-gray-400">Total Collateral Locked</p>
                </div>
                <div className="text-center p-5 border-l border-blue-500/10">
                  <p className="text-3xl font-light text-white mb-2">${dashboardStats.totalBorrowed}</p>
                  <p className="text-gray-400">Total Borrowed</p>
                </div>
                <div className="text-center p-5 border-l border-blue-500/10">
                  <p className="text-3xl font-light text-white mb-2">${dashboardStats.availableLiquidity}</p>
                  <p className="text-gray-400">Available Liquidity</p>
                </div>
              </div>
            </section>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Your Borrowing Info */}
              <div className="lg:col-span-1">
                <div className="bg-blue-900/10 backdrop-blur-sm border border-blue-500/10 rounded-xl p-8 h-full">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 w-fit mr-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-white">Your Borrowing</h3>
                  </div>
                  
                  <div className="space-y-6 text-gray-300 mb-8">
                    <div className="flex justify-between items-center border-b border-blue-500/10 pb-4">
                      <span>Your Collateral</span>
                      <span className="text-white font-medium">{dashboardStats.yourCollateral} ETH</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-blue-500/10 pb-4">
                      <span>Amount Borrowed</span>
                      <span className="text-white font-medium">${dashboardStats.yourBorrowed}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-blue-500/10 pb-4">
                      <span>Health Factor</span>
                      <span className={`font-medium ${
                        dashboardStats.yourHealthFactor === 'N/A' 
                          ? 'text-gray-400' 
                          : parseInt(dashboardStats.yourHealthFactor) < 150 
                            ? 'text-red-400' 
                            : 'text-green-400'
                      }`}>
                        {dashboardStats.yourHealthFactor}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-4">
                      <span>Collateral Value</span>
                      <span className="text-white font-medium">
                        ${(parseFloat(dashboardStats.yourCollateral) * 1800).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleHealthCheck}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${
                      parseFloat(dashboardStats.yourBorrowed) === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={parseFloat(dashboardStats.yourBorrowed) === 0}
                  >
                    Check Health Status
                  </button>
                </div>
              </div>
              
              {/* Borrow Form */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/10 rounded-xl p-8 h-full">
                  <h3 className="text-2xl font-semibold text-white mb-6">Borrow aUSD</h3>
                  
                  <form onSubmit={handleBorrow} className="space-y-6">
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">ETH Collateral</label>
                      <input
                        type="number"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        placeholder="Enter collateral amount"
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      
                      {collateralAmount && !isNaN(collateralAmount) && parseFloat(collateralAmount) > 0 && (
                        <div className="mt-2 text-sm text-gray-400">
                          Maximum borrowable: <span className="text-white font-medium">${calculateMaxBorrowable(collateralAmount)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">Borrow Amount (aUSD)</label>
                      <input
                        type="number"
                        value={borrowAmount}
                        onChange={(e) => setBorrowAmount(e.target.value)}
                        placeholder="Enter amount to borrow"
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      
                      {collateralAmount && borrowAmount && !isNaN(collateralAmount) && !isNaN(borrowAmount) && 
                       parseFloat(collateralAmount) > 0 && parseFloat(borrowAmount) > 0 && (
                        <div className="mt-2 text-sm">
                          Estimated health factor: 
                          <span className={`ml-1 font-medium ${
                            calculateHealthFactor(collateralAmount, borrowAmount) < 150 
                              ? 'text-red-400' 
                              : 'text-green-400'
                          }`}>
                            {calculateHealthFactor(collateralAmount, borrowAmount)}%
                            {calculateHealthFactor(collateralAmount, borrowAmount) < 150 && (
                              <span className="ml-2">⚠️ Liquidation Risk!</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/10">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300 text-sm">ETH Price</span>
                        <span className="text-white text-sm font-medium">$1,800.00</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300 text-sm">Collateral Factor</span>
                        <span className="text-white text-sm font-medium">75%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Liquidation Threshold</span>
                        <span className="text-red-400 text-sm font-medium">150%</span>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                    >
                      Borrow aUSD
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-blue-500/10 rounded-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-white">Recent Borrowing Activity</h3>
                <div className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm">Live updates</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Borrower</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Collateral</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Borrowed Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Health Factor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {borrowers.map((borrower, index) => (
                      <tr key={index} className={index === 0 ? "bg-blue-900/20" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {borrower.address === 'Your Position' ? (
                            <span className="text-blue-400 font-medium">{borrower.address}</span>
                          ) : (
                            <span className="text-gray-300">{borrower.address}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{borrower.collateralAmount} ETH</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${borrower.borrowedAmount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            parseInt(borrower.healthFactor) < 150 
                              ? 'text-red-400' 
                              : 'text-green-400'
                          }`}>
                            {borrower.healthFactor}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{borrower.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Borrowing;