import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContracts } from '../contract/Pool.js';

function Borrowing() {
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState('');
  const [borrowers, setBorrowers] = useState([]);
  const [borrowingActivity, setBorrowingActivity] = useState([]);
  
  const [dashboardStats, setDashboardStats] = useState({
    totalCollateral: '0',
    availableLiquidity: '0', 
    yourCollateral: '0', 
    yourBorrowed: '0',
    yourHealthFactor: 'N/A'
  });

  // Connect to wallet and load data
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (window.ethereum) {
        try {
          // Check if account is already connected to prevent multiple requests
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' // Use eth_accounts instead of eth_requestAccounts to avoid prompting
          });
          
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            if (isMounted) {
              fetchData(accounts[0]); // Pass the account to fetchData
            }
          } else {
            // Only request if no accounts are connected
            try {
              const newAccounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
              });
              if (isMounted) {
                setAccount(newAccounts[0]);
                fetchData(newAccounts[0]);
              }
            } catch (requestError) {
              console.error("Error requesting accounts:", requestError);
              if (isMounted) setIsLoading(false);
            }
          }
        } catch (error) {
          console.error("Error connecting to wallet:", error);
          if (isMounted) setIsLoading(false);
        }
      } else {
        console.error("Ethereum wallet not detected");
        if (isMounted) setIsLoading(false);
      }
    };

    init();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (isMounted) {
          setAccount(accounts[0]);
          fetchData(accounts[0]);
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        isMounted = false;
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  const checkHealthWithEvent = async (userAccount) => {
    try {
      const { pool } = await getContracts();
      if (!pool) return "Unknown";
  
      // Get borrower info to check if they have any borrowed amount
      const [collateral, borrowedAmount] = await pool.getBorrowerInfo(userAccount);
      
      // If they haven't borrowed anything, return N/A
      if (borrowedAmount === 0n) {
        return "N/A - No active loans";
      }
      
      // Call the HealthofLiquidity function - it returns [liquid, collateralRatio]
      const [liquid, collateralRatio] = await pool.HealthofLiquidity(userAccount);
      
      // If liquid is true, it means the collateral ratio is BELOW 150% (at risk)
      // If liquid is false, it means the collateral ratio is ABOVE 150% (healthy)
      return liquid ? 
        `At Risk, Ratio: ${collateralRatio.toString()}%` : 
        `Healthy, Ratio: ${collateralRatio.toString()}%`;
    } catch (error) {
      console.error("Error in health check:", error);
      return "Unknown - " + error.message;
    }
  };
  

  const fetchData = async (userAccount) => {
    if (!userAccount) {
      userAccount = account; // Use state if not passed
      if (!userAccount) {
        console.warn("Wallet account is not set yet.");
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const { aETH, pool } = await getContracts();
      if (!aETH || !pool) {
        setIsLoading(false);
        return;
      }
      
      //data from the contract for borrowing 
      const [collateral, borrowedAmount] = await pool.getBorrowerInfo(userAccount);
      const aEthBalance = await aETH.balanceOf(userAccount);

      // Protocol Data 
      const totalLiquidity = await pool.getTotalLiquidity();
      const totalCollateral = await pool.getTotalCollateralETH();
      
      const healthFactor = borrowedAmount > 0n
        ? await checkHealthWithEvent(userAccount)
        : 'N/A';

      setDashboardStats({
        totalCollateral: ethers.formatEther(totalCollateral),
        availableLiquidity: ethers.formatEther(totalLiquidity),
        yourCollateral: ethers.formatEther(collateral),
        yourBorrowed: ethers.formatEther(borrowedAmount),
        yourHealthFactor: healthFactor
      });

      // Get all borrowers data
      const borrowersArray= await pool.getBorrowers();
      
      const activeBorrowingActivity = [];

      if (collateral > 0n) {
        activeBorrowingActivity.push({
          address: 'Your Position',
          collateralAmount: ethers.formatEther(collateral),
          borrowedAmount: ethers.formatEther(borrowedAmount),
          isUser: true
        });
      }

      for (let i = 0; i < borrowersArray.length; i++) {
        // Extract data carefully, checking the structure
        let borrowerAddress, borrowerCollateral, borrowerAmountBorrowed;
        
        // Log each item to debug
        console.log(`Borrower ${i}:`, borrowersArray[i]);
        
        // Handle different potential return structures
        if (Array.isArray(borrowersArray[i])) {
          // If it's an array format
          [borrowerAddress, borrowerCollateral, borrowerAmountBorrowed] = borrowersArray[i];
        } else {
          // If it's an object with properties
          borrowerAddress = borrowersArray[i].borrower;
          borrowerCollateral = borrowersArray[i].collateralamount;
          borrowerAmountBorrowed = borrowersArray[i].aETHBorrowed;
        }
        
        // Skip if it's the current user or has no collateral
        if (borrowerAddress.toLowerCase() === userAccount.toLowerCase()) continue;
        if (borrowerCollateral === 0n) continue;
        
        activeBorrowingActivity.push({
          address: shortenAddress(borrowerAddress),
          collateralAmount: ethers.formatEther(borrowerCollateral),
          borrowedAmount: ethers.formatEther(borrowerAmountBorrowed),
        });
      
      }
      
      setBorrowers(activeBorrowingActivity);
      setBorrowingActivity(activeBorrowingActivity);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const handleHealthCheck = async () => {
    try {
      setIsLoading(true);
  
      if (!account) {
        alert("Wallet not connected");
        setIsLoading(false);
        return;
      }
  
      const result = await checkHealthWithEvent(account);
      alert(`Your Health Status: ${result}`);
      
    } catch (error) {
      console.error("Error during health check:", error);
      alert("Failed to perform health check: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBorrow = async (e) => {
    e.preventDefault();
    
    if (!collateralAmount || isNaN(collateralAmount)) {
      alert("Please enter a valid collateral amount");
      return;
    }
    
    try {
      setIsLoading(true);
      const { pool } = await getContracts();
      
      if (!pool) {
        alert("Unable to connect to the contract");
        setIsLoading(false);
        return;
      }
      
      // Convert ETH to Wei
      const collateralWei = ethers.parseEther(collateralAmount);
      
      console.log("Borrowing with collateral:", collateralWei.toString());
      
      // Call the borrow function with just the ETH value
      const tx = await pool.borrow({
        value: collateralWei
      });
      
      console.log("Transaction sent:", tx.hash);
      alert(`Transaction submitted! Hash: ${tx.hash}`);
      
      await tx.wait();
      console.log("Transaction confirmed!");
      
      // Refresh data after successful transaction
      await fetchData(account);
      
      // Reset form
      setCollateralAmount('');
      setBorrowAmount('');
      
    } catch (error) {
      console.error("Error during borrowing:", error);
      alert("Failed to borrow: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-gray-950">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">BORROW</h1>
          <p className="text-gray-300">Deposit ETH as collateral and borrow aUSD against it</p>
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
              <div className="relative grid grid-cols-2 md:grid-cols-2 gap-6 p-8 rounded-2xl backdrop-blur-sm border border-purple-500/20">
                <div className="text-center p-5">
                  <p className="text-3xl font-light text-white mb-2">{dashboardStats.totalCollateral} ETH</p>
                  <p className="text-gray-400">Total Collateral Locked</p>
                </div>
                <div className="text-center p-5 border-l border-purple-500/10">
                  <p className="text-3xl font-light text-white mb-2">${dashboardStats.availableLiquidity}</p>
                  <p className="text-gray-400">Available Liquidity</p>
                </div>
              </div>
            </section>
  
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Your Borrowing Info */}
              <div className="lg:col-span-1">
                <div className="bg-indigo-950/40 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8 h-full transition duration-300 hover:border-purple-500/30">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 w-fit mr-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-white">Your Borrowing</h3>
                  </div>
                  
                  <div className="space-y-6 text-gray-300 mb-8">
                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-4 hover:border-purple-500/30 transition-colors duration-200">
                      <span>Your Collateral</span>
                      <span className="text-white font-medium">{dashboardStats.yourCollateral} ETH</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-4 hover:border-purple-500/30 transition-colors duration-200">
                      <span>Amount Borrowed</span>
                      <span className="text-white font-medium">${dashboardStats.yourBorrowed}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-4 hover:border-purple-500/30 transition-colors duration-200">
                      <span>Health Status</span>
                      <span className={`font-medium ${
                        dashboardStats.yourHealthFactor === 'N/A'
                          ? 'text-gray-400'
                          : dashboardStats.yourHealthFactor.includes('At Risk')
                            ? 'text-red-400'
                            : 'text-green-400'
                      }`}>
                        {dashboardStats.yourHealthFactor}
                      </span>
                    </div>
                  </div>
<button 
  onClick={handleHealthCheck}
  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
>
  Check Health Factor
</button>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-indigo-950/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8 h-full transition duration-300 hover:border-purple-500/30">
                  <h3 className="text-2xl font-semibold text-white mb-6">Borrow aUSD</h3>
                  
                  <form onSubmit={handleBorrow} className="space-y-6">
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">ETH Collateral</label>
                      <input
                        type="number"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        placeholder="Enter collateral amount"
                        className="w-full bg-indigo-950/50 text-white rounded-lg p-3 border border-purple-500/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Liquidation Threshold</span>
                        <span className="text-red-400 text-sm font-medium">150%</span>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Borrow aUSD'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          
            {/* Recent Activity */}
            <div className="bg-indigo-950/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8 transition duration-300 hover:border-purple-500/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-white">Recent Borrowing Activity</h3>
                <div className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm">Live updates</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-purple-500/10">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Borrower</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Collateral</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Borrowed Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {borrowers.length > 0 ? (
                      borrowers.map((borrower, index) => (
                        <tr key={index} className={`${borrower.isUser ? "bg-purple-900/20" : ""} hover:bg-indigo-900/20 transition-colors duration-200`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {borrower.isUser ? (
                              <span className="text-purple-400 font-medium">{borrower.address}</span>
                            ) : (
                              <span className="text-gray-300">{borrower.address}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{borrower.collateralAmount} ETH</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${borrower.borrowedAmount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/30 text-yellow-400">Locked</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-400">No borrowing activity yet</td>
                      </tr>
                    )}
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