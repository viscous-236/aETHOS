import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "./Borrowing.jsx";
import "./Lending.jsx";
import { getContracts } from '../contract/Pool.js';
import { ethers } from 'ethers';

function Home() {
  const [lendedAmount, setLendedAmount] = useState('0');
  const [totalLiquidity, setTotalLiquidity] = useState('0');
  const [protocolValue, setProtocolValue] = useState('0');
  const [collateralLocked, setCollateralLocked] = useState('0');
  const [avgCollateralRatio, setAvgCollateralRatio] = useState('150');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data when component mounts
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { pool } = await getContracts();
      if (pool) {
        await Promise.all([
          fetchTotalLendedAmount(pool),
          fetchTotalLiquidity(pool),
          fetchProtocolValue(pool),
          fetchCollateralLocked(pool)
        ]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalLendedAmount = async (contract) => {
    try {
      const totalLended = await contract.getTotalLended();
      setLendedAmount(ethers.formatUnits(totalLended, 18));
    } catch (error) {
      console.error("Error fetching total lended amount:", error);
    }
  };

  const fetchTotalLiquidity = async (contract) => {
    try {
      const totalLiq = await contract.getTotalLiquidity();
      setTotalLiquidity(ethers.formatUnits(totalLiq, 18));
    } catch (error) {
      console.error("Error fetching total liquidity:", error);
    }
  };

  const fetchProtocolValue = async (contract) => {
    try {
      const value = await contract.getProtocolValue();
      console.log("Protocol Value:", value);
      const valueInEth = ethers.formatUnits(value, 36);
      console.log("Protocol Value in ETH:", valueInEth);
      setProtocolValue(valueInEth);
    } catch (error) {
      console.error("Error fetching protocol value:", error);
    }
  };

  const fetchCollateralLocked = async (contract) => {
    try {
      const totalCollateral = await contract.getTotalCollateralETH();
      console.log("Total Collateral Locked:", totalCollateral);
      const totalCollateralInEth = ethers.formatUnits(totalCollateral, 18);
      console.log("Total Collateral Locked in ETH:", totalCollateralInEth);
      setCollateralLocked(totalCollateralInEth);
    } catch (error) {
      console.error("Error fetching collateral locked:", error);
    }
  }

  // Format numbers for display
  const formatValue = (value, isUSD = false) => {
    const num = parseFloat(value);
    if (isNaN(num)) return isUSD ? '$0' : '0 ETH';

    if (isUSD) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(num);
    }

    return `${num.toFixed(1)} ETH`;
  };

  // Calculate USD value
  const calculateUSD = (ethAmount) => {
    // Assuming an ETH price of $1800 for demonstration
    // In a real app, you would fetch the current price from an API
    const ethPrice = 1800;
    return ethAmount * ethPrice;
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-16 py-12 px-4">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center">
          <div className="mb-10">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400">
               ReFi
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-light">
              Lending and borrowing, secured by ETH collateral
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* Lender Card */}
            <Link to="/Lending" className="group">
              <div className="h-full bg-purple-900/10 backdrop-blur-sm border border-purple-500/10 rounded-xl p-8 hover:bg-purple-900/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 w-fit mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Lend ETH</h3>
                <p className="text-gray-300 mb-6 flex-grow">
                  Provide liquidity to the protocol and receive aETH tokens. Earn interest as borrowers utilize the pool.
                </p>
                <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-all">
                  <span className="mr-2 font-medium">Lend</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-300">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>
            </Link>

            {/* Borrower Card */}
            <Link to="/Borrowing" className="group">
              <div className="h-full bg-blue-900/10 backdrop-blur-sm border border-blue-500/10 rounded-xl p-8 hover:bg-blue-900/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 w-fit mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Borrow aETH</h3>
                <p className="text-gray-300 mb-6 flex-grow">
                  Deposit ETH as collateral and borrow aETH tokens while maintaining a healthy collateralization ratio.
                </p>
                <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-all">
                  <span className="mr-2 font-medium">Borrow</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-300">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Metrics Section */}
        <section className="relative max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl blur-xl"></div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-2xl backdrop-blur-sm border border-purple-500/10 hover:border-purple-500/20 transition-colors duration-300">
            <div className="text-center p-6">
              <p className="text-4xl font-light text-white mb-2">
                {loading ? "Loading..." : (collateralLocked) + " ETH"}
              </p>
              <p className="text-gray-400">Total Collateral Locked</p>
            </div>
            <div className="text-center p-6 border-y md:border-y-0 md:border-x border-purple-500/10">
              <p className="text-4xl font-light text-white mb-2">
                {loading ? "Loading..." : "$" + (Math.floor(protocolValue * 100) / 100).toFixed(2)}
              </p>
              <p className="text-gray-400">Protocol Value</p>
            </div>
            <div className="text-center p-6">
              <p className="text-4xl font-light text-white mb-2">{avgCollateralRatio}%</p>
              <p className="text-gray-400">Average Collateral Ratio</p>
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-8 mt-6 rounded-2xl backdrop-blur-sm border border-blue-500/10 hover:border-blue-500/20 transition-colors duration-300">
            <div className="text-center p-6">
              <p className="text-4xl font-light text-white mb-2">
                {loading ? "Loading..." : (Math.floor(lendedAmount * 100) / 100).toFixed(2) + " aETH"}
              </p>
              <p className="text-gray-400">Total Lended aETH</p>
            </div>
            <div className="text-center p-6">
              <p className="text-4xl font-light text-white mb-2">
                {loading ? "Loading..." : (Math.floor(totalLiquidity * 100) / 100).toFixed(2) + " aETH"}
              </p>
              <p className="text-gray-400">Total Liquidity</p>
            </div>
          </div>
        </section>

        {/* Protocol Overview */}
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white mb-4">Simple by Design</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
             ReFi simplifies DeFi lending and borrowing without sacrificing security or usability. The protocol operates with a clear set of principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mr-3 shadow-md shadow-purple-500/20">
                  <span className="text-white font-medium">1</span>
                </div>
                Single-Asset Simplicity
              </h3>
              <p className="text-gray-300 pl-11">
                Our protocol focuses on ETH collateral for clarity and security. This single-asset approach simplifies risk assessment and liquidation processes.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mr-3 shadow-md shadow-purple-500/20">
                  <span className="text-white font-medium">2</span>
                </div>
                Dollar-Pegged aETH
              </h3>
              <p className="text-gray-300 pl-11">
                Lenders receive aETH tokens pegged to the US Dollar, providing a stable representation of their deposited value regardless of ETH price fluctuations.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mr-3 shadow-md shadow-purple-500/20">
                  <span className="text-white font-medium">3</span>
                </div>
                150% Collateralization
              </h3>
              <p className="text-gray-300 pl-11">
                All positions must maintain at least 150% collateralization. This protects lenders while giving borrowers reasonable leverage on their ETH positions.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mr-3 shadow-md shadow-purple-500/20">
                  <span className="text-white font-medium">4</span>
                </div>
                Liquidation Protection
              </h3>
              <p className="text-gray-300 pl-11">
                Our interface provides clear warnings when collateral ratios approach the minimum threshold, giving borrowers time to adjust their positions.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white mb-4">How ReFi Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Lenders Card */}
            <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-8 hover:bg-purple-900/20 transition-all duration-300">
              <h3 className="text-2xl font-semibold text-white mb-6">For Lenders</h3>

              <ul className="space-y-6">
                <li className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-4 shadow-sm shadow-purple-500/10">
                    <span className="text-purple-300 font-medium">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Deposit ETH</h4>
                    <p className="text-gray-300 text-sm mt-1">Supply ETH to the protocol's smart contract pool.</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-4 shadow-sm shadow-purple-500/10">
                    <span className="text-purple-300 font-medium">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Receive aETH</h4>
                    <p className="text-gray-300 text-sm mt-1">Get dollar-pegged aETH tokens at the current ETH value.</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-4 shadow-sm shadow-purple-500/10">
                    <span className="text-purple-300 font-medium">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Earn Interest</h4>
                    <p className="text-gray-300 text-sm mt-1">Interest accrues automatically as borrowers use the pool.</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-4 shadow-sm shadow-purple-500/10">
                    <span className="text-purple-300 font-medium">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Withdraw with interest</h4>
                    <p className="text-gray-300 text-sm mt-1">Withdraw your aETH with interest after the lockup period.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* For Borrowers Card */}
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-8 hover:bg-blue-900/20 transition-all duration-300">
              <h3 className="text-2xl font-semibold text-white mb-6">For Borrowers</h3>

              <ul className="space-y-6">
                <li className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-4 shadow-sm shadow-blue-500/10">
                    <span className="text-blue-300 font-medium">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Deposit Collateral</h4>
                    <p className="text-gray-300 text-sm mt-1">Lock ETH as collateral in the protocol's smart contract.</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-4 shadow-sm shadow-blue-500/10">
                    <span className="text-blue-300 font-medium">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Borrow aETH</h4>
                    <p className="text-gray-300 text-sm mt-1">Borrow up to 66% of your collateral's value in aETH tokens.</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-4 shadow-sm shadow-blue-500/10">
                    <span className="text-blue-300 font-medium">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Monitor Position</h4>
                    <p className="text-gray-300 text-sm mt-1">Keep your collateralization ratio above 150% to avoid liquidation.</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-4 shadow-sm shadow-blue-500/10">
                    <span className="text-blue-300 font-medium">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Interface Warning</h4>
                    <p className="text-gray-300 text-sm mt-1">Clear indication on platform's interface whether you collateral is at risk or not. </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Simple Footer */}
      <footer className="bg-black/50 backdrop-blur-md border-t border-purple-500/20 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h5 className="font-medium text-white mb-4">ReFi</h5>
              <p className="text-gray-400 text-sm">
                Lending and borrowing protocol secured by ETH collateral.
              </p>
            </div>

            <div>
              <h5 className="font-medium text-white mb-4">Protocol</h5>
              <ul className="space-y-2">
                <li><Link to="/Lending" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Lend ETH</Link></li>
                <li><Link to="/Borrowing" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Borrow aETH</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-white mb-4">Resources</h5>
              <ul className="space-y-2">
                <li><Link to="/docs" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Documentation</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-white mb-4">Connect</h5>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zm-7.2 0v1L2 17V7l6.4 4.5z"></path>
                    <path d="M22 17l-6.4-4.5L9.2 17l-7.2-4.5v1L9.2 19l6.4-4.5 6.4 4.5v-1z"></path>
                    <path d="M9.2 8l6.4 4.5L22 8V7l-6.4 4.5L9.2 7v1z"></path>
                    <path d="M2 8l6.4 4.5L15.6 8V7L9.2 11.5 2 7v1z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-purple-500/10 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 ReFi Protocol. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;