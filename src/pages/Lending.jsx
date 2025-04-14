import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContracts } from '../contract/Pool.js';

function Lending() {
  const [amount, setAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState('');
  const [lendingActivity, setLendingActivity] = useState([]);
  const [lockupComplete, setLockupComplete] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalDeposited: '0',
    earnedInterest: '0',
    protocolValue: '0',
    yourDeposits: '0',
    yourEarnings: '0',
    aEthBalance: '0'
  });

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);
          await fetchData();
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      } else {
        console.error("Ethereum wallet not detected");
        setIsLoading(false);
      }
    };

    init();


    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
        fetchData();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, [account]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!account) {
        console.warn("Wallet account is not set yet.");
        setIsLoading(false);
        return;
      }
      const { aETH, pool } = await getContracts();
      if (!aETH || !pool) {
        setIsLoading(false);
        return;
      }


      const [amount, depositTime] = await pool.getLenderInfo(account);
      const aEthBalance = await aETH.balanceOf(account);
      const userTokens = await pool.getUserToken(account);


      const totalLiquidity = await pool.getTotalLiquidity();
      const totalLended = await pool.getTotalLended();
      const protocolValue = await pool.getProtocolValue();
      const totalCollateral = await pool.getTotalCollateralETH();

      let timeAgoInSeconds = 0;
      if (amount > 0n) {
        timeAgoInSeconds = await pool.getTimeAgo(account);
      }


      const isLockupComplete = timeAgoInSeconds >= 2592000n;
      setLockupComplete(isLockupComplete);

      let potentialInterest = "0";

      if (amount && amount > 0n) {
        const amountInEth = parseFloat(ethers.formatEther(amount));
        const interestInEth = amountInEth * 0.05;
        potentialInterest = interestInEth.toFixed(4);
      }


      setDashboardStats({
        totalDeposited: ethers.formatEther(totalLended),
        earnedInterest: '0',
        protocolValue: ethers.formatUnits(protocolValue, 36),
        yourDeposits: ethers.formatEther(amount),
        yourEarnings: potentialInterest,
        aEthBalance: ethers.formatEther(aEthBalance),
      });


      const lendersData = await pool.getLenders();


      const activeLendingActivity = [];


      if (amount > 0n) {
        const formattedTimeAgo = formatTimeAgo(timeAgoInSeconds);

        activeLendingActivity.push({
          address: shortenAddress(account),
          amountDeposited: ethers.formatEther(amount),
          interestEarned: isLockupComplete ? "Available" : "Pending",
          timestamp: formattedTimeAgo,
          status: isLockupComplete ? 'Ready to Withdraw' : 'Locked',
          isUser: true
        });
      }

      for (let i = 0; i < lendersData.length; i++) {
        const lenderData = lendersData[i];
        const lenderAddress = lenderData[0];
        if (lenderAddress.toLowerCase() === account.toLowerCase()) continue;
        const lenderAmount = lenderData[1];
        const lenderDepositTime = lenderData[2];

        if (lenderAmount === 0n) continue;

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const secondsSinceDeposit = BigInt(currentTimestamp) - lenderDepositTime;
        const lenderLockupComplete = secondsSinceDeposit >= 2592000n;

        activeLendingActivity.push({
          address: `${shortenAddress(lenderAddress)}`,
          amountDeposited: ethers.formatEther(lenderAmount),
          interestEarned: lenderLockupComplete ? "Available" : "Pending",
          timestamp: formatTimeAgo(secondsSinceDeposit),
          status: lenderLockupComplete ? 'Ready to Withdraw' : 'Locked',
          isUser: false
        });
      }

      setLendingActivity(activeLendingActivity);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetTokens = async (e) => {
    e.preventDefault();

    if (!ethAmount || isNaN(ethAmount) || parseFloat(ethAmount) <= 0) {
      alert('Please enter a valid amount of ETH');
      return;
    }

    try {
      setIsLoading(true);
      const { aETH, pool } = await getContracts();

      const weiAmount = ethers.parseEther(ethAmount);

      const tx = await pool.getYourToken({ value: weiAmount });
      await tx.wait();
      const aEthBalance = await aETH.balanceOf(account);
      console.log("aETH Balance:", ethers.formatEther(aEthBalance));
      alert(`Successfully minted aETH tokens!`);
      await fetchData();
      setEthAmount('');
    } catch (error) {
      console.error("Error getting tokens:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount of aETH tokens');
      return;
    }

    try {
      setIsLoading(true);
      const { aETH, pool } = await getContracts();


      const amountInWei = ethers.parseEther(amount);
      const aEthBalance = await aETH.balanceOf(account);

      if (amountInWei > aEthBalance) {
        alert("You don't have enough aETH tokens to deposit");
        return;
      }


      const approveTx = await aETH.approve(pool.target, amountInWei);
      await approveTx.wait();

      // Then call the deposit function with the converted amount
      const depositTx = await pool.deposit(amountInWei);
      await depositTx.wait();

      alert(`Successfully deposited ${amount} aETH tokens to the lending pool!`);
      await fetchData();
      setAmount('');
    } catch (error) {
      console.error("Error depositing:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      const { pool } = await getContracts();


      const tx = await pool.withDraw();
      await tx.wait();

      alert(`Successfully withdrawn aETH tokens plus 4% interest!`);
      await fetchData();
    } catch (error) {
      console.error("Error withdrawing:", error);
      if (error.message.includes("YouShouldWaitForLockupPeriod")) {
        alert("You need to wait at least 30 days before withdrawing");
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };


  const formatTimeAgo = (seconds) => {

    const secondsNum = Number(seconds);

    if (secondsNum < 60) {
      return 'Just now';
    } else if (secondsNum < 3600) {
      return `${Math.floor(secondsNum / 60)} minutes ago`;
    } else if (secondsNum < 86400) {
      return `${Math.floor(secondsNum / 3600)} hours ago`;
    } else {
      return `${Math.floor(secondsNum / 86400)} days ago`;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">LEND</h1>
          <p className="text-gray-300">Provide liquidity to the protocol and earn 4% interest after 30 days on your aETH deposits</p>
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
                  <p className="text-3xl font-light text-white mb-2">{parseFloat(dashboardStats.totalDeposited).toFixed(2)} aETH</p>
                  <p className="text-gray-400">Total aETH Locked</p>
                </div>
                <div className="text-center p-5 border-l border-purple-500/10">
                  <p className="text-3xl font-light text-white mb-2">${parseFloat(dashboardStats.protocolValue).toFixed(2)}</p>
                  <p className="text-gray-400">Protocol Value</p>
                </div>
                <div className="text-center p-5 border-l border-purple-500/10">
                  <p className="text-3xl font-light text-white mb-2">{parseFloat(dashboardStats.earnedInterest).toFixed(2)} aETH</p>
                  <p className="text-gray-400">Total Interest Paid</p>
                </div>
                <div className="text-center p-5 border-l border-purple-500/10">
                  <p className="text-3xl font-light text-white mb-2">4%</p>
                  <p className="text-gray-400">Interest Rate (30 days)</p>
                </div>
              </div>
            </section>

            {/* Main Content - 3 columns for aETH, Deposit, and Your Lending */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Get aETH Tokens */}
              <div className="lg:col-span-1">
                <div className="bg-blue-900/10 backdrop-blur-sm border border-blue-500/10 rounded-xl p-8 h-full">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 w-fit mr-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-white">Get aETH Tokens</h3>
                  </div>

                  <form onSubmit={handleGetTokens} className="space-y-6">
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">ETH Amount</label>
                      <input
                        type="number"
                        value={ethAmount}
                        onChange={(e) => setEthAmount(e.target.value)}
                        placeholder="Enter ETH amount"
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/10">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300 text-sm">Current aETH Balance</span>
                        <span className="text-white text-sm font-medium">{parseFloat(dashboardStats.aEthBalance).toFixed(2)} aETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">1 aETH Value</span>
                        <span className="text-white text-sm font-medium">$1.00</span>
                      </div>
                    </div>

                    <button
  type="submit"
  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 cursor-pointer"
>
  Get aETH Tokens
</button>
                  </form>
                </div>
              </div>

              {/* Deposit Form */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/10 rounded-xl p-8 h-full">
                  <h3 className="text-2xl font-semibold text-white mb-6">Deposit aETH</h3>

                  <form onSubmit={handleDeposit} className="space-y-6">
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">aETH Amount</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount to deposit"
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/10">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300 text-sm">Interest Rate</span>
                        <span className="text-green-400 text-sm font-medium">4% after 30 days</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300 text-sm">Lockup Period</span>
                        <span className="text-white text-sm font-medium">30 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Available aETH</span>
                        <span className="text-white text-sm font-medium">{parseFloat(dashboardStats.aEthBalance).toFixed(2)}</span>
                      </div>
                    </div>

                    <button
  type="submit"
  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 cursor-pointer"
>
  Deposit aETH
</button>
                  </form>
                </div>
              </div>

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
                      <span className="text-white font-medium">{parseFloat(dashboardStats.yourDeposits).toFixed(2)} aETH</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-4">
                      <span>Potential Interest</span>
                      <span className="text-white font-medium">{parseFloat(dashboardStats.yourEarnings).toFixed(2)} aETH</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-4">
                      <span>Interest Rate</span>
                      <span className="text-green-400 font-medium">4% after 30 days</span>
                    </div>
                    <div className="flex justify-between items-center pb-4">
                      <span>Status</span>
                      <span className={`font-medium ${lockupComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                        {lockupComplete ? 'Ready to Withdraw' : 'Lockup Period Active'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-4">
                      <span>Value in USD</span>
                      <span className="text-white font-medium">
                        ${(parseFloat(dashboardStats.yourDeposits) + parseFloat(dashboardStats.yourEarnings)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
  onClick={handleWithdraw}
  className={`w-full ${lockupComplete ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600'} text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${parseFloat(dashboardStats.yourDeposits) === 0 || !lockupComplete ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  disabled={parseFloat(dashboardStats.yourDeposits) === 0 || !lockupComplete}
>
  {lockupComplete ? 'Withdraw aETH + Interest' : 'Wait for Lockup Period'}
</button>
                </div>
              </div>
            </div>

            {/* Lending Activity Table */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-purple-500/10 rounded-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-white">All Lending Activity</h3>
                {account && (
                  <div className="text-sm text-gray-400">
                    Connected: {shortenAddress(account)}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                {lendingActivity.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount Deposited</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Interest Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Deposited</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {lendingActivity.map((activity, index) => (
                        <tr key={index} className={activity.isUser ? "bg-purple-900/30" : "bg-gray-800/40"}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={activity.isUser ? "text-purple-400 font-medium" : "text-gray-300"}>
                              {activity.address} {activity.isUser && "(You)"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{activity.amountDeposited} aETH</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{activity.interestEarned}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{activity.timestamp}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${activity.status === 'Ready to Withdraw'
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-yellow-900/30 text-yellow-400'
                              }`}>
                              {activity.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No lending activity found. Deposit aETH to start earning interest!
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Lending;