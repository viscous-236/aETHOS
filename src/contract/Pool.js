import { ethers } from "ethers";

const AETH_ADDRESS =  "0x73CeF2964375f32fe10E6eD7D971fA43465f8E0D";

const POOL_ADDRESS = "0xdecdae0A5aaCDA856693d1151E64003573BcC8d6";

const AETH_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
];

const POOL_ABI = [
  "function getYourToken() payable",
  "function deposit(uint256 amount)",
  "function withDraw()",
  "function borrow() payable",
  "function HealthofLiquidity(address) view returns (bool liquid,uint256 cr)",
  "function getLenderInfo(address) view returns (uint256 amount, uint256 depositTime)",
  "function getBorrowerInfo(address) view returns (uint256 collateral, uint256 borrowedammount)",
  "function getTotalLiquidity() view returns (uint256)",
  "function getTotalLended() view returns (uint256)",
  "function getProtocolValue() view returns (uint256)",
  "function getAETHPrice() view returns (uint256)",
  "function getUserToken(address) view returns (uint256)",
  "function getTotalCollateralETH() view returns (uint256)",
  "function getTimeAgo(address lender) view returns (uint256)",
  "function getLenders() view returns (tuple(address lender,uint256 amount, uint256 depositTime)[])",
  "function getBorrowers() view returns (tuple(address borrower,uint256 collateralamount, uint256 aETHBorrowed)[])",
];

export const getContracts = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const aETH = new ethers.Contract(AETH_ADDRESS, AETH_ABI, signer);
  const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, signer);

  return { aETH, pool };
};