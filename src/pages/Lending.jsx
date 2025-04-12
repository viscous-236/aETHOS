import React, { useState, useEffect } from 'react';

function Lending() {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalDeposited: '245.8',
    earnedInterest: '3.42',
    currentAPY: '4.2',
    protocolValue: '442,500',
    yourDeposits: '0',
    yourEarnings: '0'
  });

  // Simulate loading data from smart contract
  useEffect(() => {
    setTimeout(() => {
      setUsers([
        { address: '0x71C...92e1', amountDeposited: '24.5', interestEarned: '0.42', timestamp: '2 hours ago' },
        { address: '0x8fD...34A2', amountDeposited: '18.2', interestEarned: '0.31', timestamp: '5 hours ago' },
        { address: '0x3eB...F7c9', amountDeposited: '5.23', interestEarned: '0.09', timestamp: '9 hours ago' },
        { address: '0x2aA...45D1', amountDeposited: '42.1', interestEarned: '0.72', timestamp: '12 hours ago' },
        { address: '0xF12...B8c3', amountDeposited: '11.8', interestEarned: '0.20', timestamp: '1 day ago' }
      ]);
      setIsLoading(false);
    }, 1500);
  }, []);

  // Add new user updates at random intervals to simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        const randomAddress = `0x${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}...${Math.floor(Math.random() * 16777215).toString(16).padStart(4, '0')}`;
        const randomDeposit = (Math.random() * 10 + 2).toFixed(2);
        const randomInterest = (randomDeposit * 0.042 * (Math.random() * 0.5)).toFixed(3);
        
        setUsers(prevUsers => [
          { 
            address: randomAddress, 
            amountDeposited: randomDeposit, 
            interestEarned: randomInterest,
            timestamp: 'Just now'
          },
          ...prevUsers.slice(0, 4)
        ]);
        
        setDashboardStats(prev => ({
          ...prev,
          totalDeposited: (parseFloat(prev.totalDeposited) + parseFloat(randomDeposit)).toFixed(1),
          earnedInterest: (parseFloat(prev.earnedInterest) + parseFloat(randomInterest)).toFixed(2),
          protocolValue: (parseFloat(prev.protocolValue.replace(',', '')) + parseFloat(randomDeposit) * 1800).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        }));
      }
    }, 8000);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDeposit = (e) => {
    e.preventDefault();
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    // In a real app, this would interact with a wallet and smart contract
    alert(`Depositing ${amount} ETH to the lending pool. You will receive ${(parseFloat(amount) * 1800).toFixed(2)} aUSD.`);
    
    // Simulate successful deposit by updating stats
    setDashboardStats(prev => ({
      ...prev,
      yourDeposits: (parseFloat(prev.yourDeposits) + parseFloat(amount)).toFixed(2),
      totalDeposited: (parseFloat(prev.totalDeposited) + parseFloat(amount)).toFixed(1),
    }));
    
    // Add current user to the list
    setUsers(prevUsers => [
      { address: 'Your Deposit', amountDeposited: amount, interestEarned: '0.000', timestamp: 'Just now' },
      ...prevUsers
    ]);
    
    // Clear the form
    setAmount('');
  };

  const handleWithdraw = () => {
    alert('Withdrawal functionality would be implemented here');
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">LEND</h1>
          <p className="text-gray-300">Provide liquidity to the protocol and earn interest on your ETH deposits</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <section className="relative mb-12">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl blur-xl"></div>
              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl backdrop-blur-sm">
                <div className="text-center p-5">
                  <p className="text-3xl font-light text-white mb-2">{dashboardStats.totalDeposited} ETH</p>
                  <p className="text-gray-400">Total ETH Locked</p>
                </div>
                <div className="text-center p-5 border-l border-purple-500/10">
                  <p className="text-3xl font-light text-white mb-2">${dashboardStats.protocolValue}</p>
                  <p className="text-gray-400">Protocol Value</p>
                </div>
                <div className="text-center p-5 border-l border-purple-500/10">
                  <p className="text-3xl font-light text-white mb-2">{dashboardStats.earnedInterest} ETH</p>
                  <p className="text-gray-400">Total Interest Paid</p>
                </div>
                <div className="text-center p-5 border-l border-purple-500/10">
                  <p className="text-3xl font-light text-white mb-2">{dashboardStats.currentAPY}%</p>
                  <p className="text-gray-400">Current APY</p>
                </div>
              </div>
            </section>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Your Lending Info */}
              <div className="lg:col-span-1">
                <div className="bg-purple-900/10 backdrop-blur-sm border border-purple-500/10 rounded-xl p-8 h-full">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 w-fit mr-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-white">Your Lending</h3>
                  </div>
                  
                  <div className="space-y-6 text-gray-300 mb-8">
                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-4">
                      <span>Your Deposits</span>
                      <span className="text-white font-medium">{dashboardStats.yourDeposits} ETH</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-4">
                      <span>Interest Earned</span>
                      <span className="text-white font-medium">{dashboardStats.yourEarnings} ETH</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-4">
                      <span>Current APY</span>
                      <span className="text-green-400 font-medium">{dashboardStats.currentAPY}%</span>
                    </div>
                    <div className="flex justify-between items-center pb-4">
                      <span>Value in aUSD</span>
                      <span className="text-white font-medium">
                        ${(parseFloat(dashboardStats.yourDeposits) * 1800).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleWithdraw}
                    className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${parseFloat(dashboardStats.yourDeposits) === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={parseFloat(dashboardStats.yourDeposits) === 0}
                  >
                    Withdraw ETH
                  </button>
                </div>
              </div>
              
              {/* Deposit Form */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/10 rounded-xl p-8 h-full">
                  <h3 className="text-2xl font-semibold text-white mb-6">Deposit ETH</h3>
                  
                  <form onSubmit={handleDeposit} className="space-y-6">
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">ETH Amount</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount to deposit"
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                      
                      {amount && !isNaN(amount) && parseFloat(amount) > 0 && (
                        <div className="mt-3 text-sm text-gray-400">
                          You will receive approximately <span className="text-white font-medium">${(parseFloat(amount) * 1800).toFixed(2)}</span> aUSD
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/10">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300 text-sm">ETH Price</span>
                        <span className="text-white text-sm font-medium">$1,800.00</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300 text-sm">Current APY</span>
                        <span className="text-green-400 text-sm font-medium">{dashboardStats.currentAPY}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Protocol Fee</span>
                        <span className="text-white text-sm font-medium">0.1%</span>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                    >
                      Deposit ETH
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-purple-500/10 rounded-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-white">Recent Lending Activity</h3>
                <div className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm">Live updates</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount Deposited</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Interest Earned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map((user, index) => (
                      <tr key={index} className={index === 0 ? "bg-purple-900/20" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.address === 'Your Deposit' ? (
                            <span className="text-purple-400 font-medium">{user.address}</span>
                          ) : (
                            <span className="text-gray-300">{user.address}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.amountDeposited} ETH</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.interestEarned} ETH</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.timestamp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900/30 text-green-400">
                            Complete
                          </span>
                        </td>
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

export default Lending;