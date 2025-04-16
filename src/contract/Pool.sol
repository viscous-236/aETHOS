// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {Erc20} from "src/ERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**ERRORS */
error OnlyOwnerIsAllowedToDoThis();
error depositingAmountShouldBeGreaterThanZero();
error NotEnoughBalanceToDeposit();
error YouShouldDepositFirst();
error YouShouldWaitForLockupPeriod();
error NotEnoughLiquidity();
error SomeETHRequired();
error RepayFirst();

contract Pool {
    using SafeERC20 for Erc20;
    Erc20 public aETH;
    uint256 public totalLiquidity;
    uint256 public total_Lended;
    uint256 public totalCollateralETH;
    uint256 public constant LOCKUP_PERIOD = 30 days;
    uint256 public constant INTEREST_RATE = 4;
    address public owner;
    AggregatorV3Interface internal priceFeed;
    uint256 constant collateral_factor = 6667;
    LenderI[] public lenders_array;
    BorrowerI[] public borrowers_array;

    struct LenderI {
        address lender;
        uint256 amount;
        uint256 depositTime;
    }

    struct BorrowerI {
        address borrower;
        uint256 collateralamount;
        uint256 aETHBorrowed;
    }

    struct Lender {
        uint256 amount;
        uint256 depositTime;
    }

    struct Borrower {
        uint256 collateralamount;
        uint256 aETHBorrowed;
    }

    mapping(address => Lender) public lenders;
    mapping(address => Borrower) public borrowers;
    mapping(address => uint256) public receivedTokens;
    mapping(address => uint256) public borrowedTokens;

    /** Events */
    event Deposited(address indexed lender, uint256 amount);
    event Withdrawn(address indexed lender, uint256 amount);
    event UserMinted(address indexed user, uint256 amount);
    event Borrowed(address indexed borrower, uint256 amountBorrowed);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert OnlyOwnerIsAllowedToDoThis();
        }
        _;
    }

    constructor(address _aETH) {
        owner = msg.sender;
        aETH = Erc20(_aETH);
        priceFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
    }

    function getLatestPrice() public view returns (uint256) {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        return uint256(answer * 1e10);
    }

    function getETHPrice(uint256 amount) internal view returns (uint256) {
        uint256 price = getLatestPrice();
        return (amount * price);
    }

    function getYourToken() external payable {
        if (msg.value <= 0) {
            revert SomeETHRequired();
        }

        uint256 ethAmountInUSD = getETHPrice(msg.value);
        uint256 aETHToMint = ethAmountInUSD / getAETHPrice();

        aETH.mint(msg.sender, aETHToMint);
        receivedTokens[msg.sender] += aETHToMint;

        emit UserMinted(msg.sender, aETHToMint);
    }

    function deposit(uint256 amount) public {
        if (amount <= 0) {
            revert depositingAmountShouldBeGreaterThanZero();
        }
        if (aETH.balanceOf(msg.sender) < amount) {
            revert NotEnoughBalanceToDeposit();
        }

        aETH.safeTransferFrom(msg.sender, address(this), amount);
        total_Lended += amount;
        lenders[msg.sender].amount += amount;
        lenders[msg.sender].depositTime = block.timestamp;
        totalLiquidity += amount;
        lenders_array.push(LenderI(msg.sender, amount, block.timestamp));
        emit Deposited(msg.sender, amount);
    }

    function withDraw() public {
        uint256 amount = lenders[msg.sender].amount;
        uint256 interest = (amount * INTEREST_RATE) / 100;
        uint256 totalAmount = amount + interest;
        if (amount <= 0) {
            revert YouShouldDepositFirst();
        }
        if (block.timestamp < lenders[msg.sender].depositTime + LOCKUP_PERIOD) {
            revert YouShouldWaitForLockupPeriod();
        }
        if (totalLiquidity < totalAmount) {
            revert NotEnoughLiquidity();
        }
        lenders[msg.sender].amount = 0;
        lenders[msg.sender].depositTime = 0;
        totalLiquidity -= amount;

        aETH.safeTransfer(msg.sender, amount);
        aETH.mint(msg.sender, interest);

        emit Withdrawn(msg.sender, totalAmount);
    }

    function borrow() external payable {
        if (msg.value <= 0) {
            revert SomeETHRequired();
        }
        if (borrowers[msg.sender].aETHBorrowed > 0) {
            revert RepayFirst();
        }
        uint256 userCollateral = msg.value;
        uint256 ethAmountInUSD = getETHPrice(userCollateral);
        uint256 maxBorrowableValue = (ethAmountInUSD * collateral_factor) /
            10000;
        uint256 maxBorrowableTokens = maxBorrowableValue / getAETHPrice();

        require(
            totalLiquidity >= maxBorrowableTokens,
            "Insufficient liquidity in pool"
        );
        borrowers[msg.sender].collateralamount = userCollateral;
        borrowers[msg.sender].aETHBorrowed = maxBorrowableTokens;
        totalCollateralETH += userCollateral;
        borrowers_array.push(
            BorrowerI(msg.sender, userCollateral, maxBorrowableTokens)
        );

        totalLiquidity -= maxBorrowableTokens;

        aETH.transfer(msg.sender, maxBorrowableTokens);

        emit Borrowed(msg.sender, maxBorrowableTokens);
    }

    function HealthofLiquidity(
        address borrower
    ) public view returns (bool liquid, uint256 cr) {
        uint256 collateral = borrowers[borrower].collateralamount;
        uint256 changedETHPrice = (collateral * getLatestPrice());

        if (borrowers[borrower].aETHBorrowed == 0) {
            return (false, 0);
        }

        uint256 collateralRatio = (changedETHPrice * 100) /
            (borrowers[borrower].aETHBorrowed * getAETHPrice());

        if (collateralRatio < 150) {
            return (true, collateralRatio);
        } else {
            return (false, collateralRatio);
        }
    }

    /**GETTERS */
    function getAETHPrice() public pure returns (uint256) {
        return 1e18;
    }

    function getLenderInfo(
        address lender
    ) public view returns (uint256 amount, uint256 depositTime) {
        return (lenders[lender].amount, lenders[lender].depositTime);
    }

    function getBorrowerInfo(
        address borrower
    ) public view returns (uint256 collateral, uint256 borrowedammount) {
        return (
            borrowers[borrower].collateralamount,
            borrowers[borrower].aETHBorrowed
        );
    }

    function getTotalLiquidity() public view returns (uint256) {
        return totalLiquidity;
    }

    function getTotalLended() public view returns (uint256) {
        return total_Lended;
    }

    function getTotalCollateralETH() public view returns (uint256) {
        return totalCollateralETH;
    }

    function getProtocolValue() public view returns (uint256) {
        return getETHPrice(totalCollateralETH);
    }

    function getUserToken(address account) public view returns (uint256) {
        return receivedTokens[account];
    }

    function getTimeAgo(address lender) public view returns (uint256 time) {
        return block.timestamp - lenders[lender].depositTime;
    }

    function getLenders() public view returns (LenderI[] memory) {
        return lenders_array;
    }

    function getBorrowers() public view returns (BorrowerI[] memory) {
        return borrowers_array;
    }
}
