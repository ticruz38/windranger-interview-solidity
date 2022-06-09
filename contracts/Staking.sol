pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract Staking is Ownable {
    using SafeERC20 for ERC20;

    uint256 private constant _SHARE_SCALE = 1e18;

    uint256 public timestampDeposit;
    uint256 public timestampWithdraw;

    ERC20 public rewardsToken;

    uint256 public totalDeposited;

    uint256 public totalRewards;

    mapping(address => uint256) public depositors;

    constructor(
        ERC20 rewardsToken_,
        uint256 timestampDeposit_,
        uint256 timestampWithdraw_
    ) {
        timestampDeposit = timestampDeposit_;
        timestampWithdraw = timestampWithdraw_;
        rewardsToken = rewardsToken_;
    }

    function deposit() external payable {
        require(block.timestamp < timestampDeposit, "TOO_LATE");

        depositors[msg.sender] = msg.value;
        totalDeposited += msg.value;
    }

    function claimAndHarvest() external {
        require(block.timestamp > timestampWithdraw, "TOO_SOON");

        uint256 shares = (depositors[msg.sender] * totalRewards) /
            totalDeposited;

        depositors[msg.sender] = 0;

        rewardsToken.safeTransfer(msg.sender, shares);

        (bool result, ) = payable(msg.sender).call{
            value: depositors[msg.sender]
        }("");

        require(result == true, "TRANSFER_FAILED");
    }

    function increaseRewards(uint256 amount) external onlyOwner {
        rewardsToken.safeTransferFrom(msg.sender, address(this), amount);
        totalRewards += amount;
    }
}
