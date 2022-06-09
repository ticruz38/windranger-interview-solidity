pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RewardToken is ERC20("RewardToken", "RT") {
    constructor() {
        _mint(msg.sender, 1000 ether);
    }
}
