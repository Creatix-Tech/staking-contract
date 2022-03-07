// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RewardToken is ERC20("Reward Token", "TKN") {
	uint public constant MAX_SUPPLY = 10000000 * 1e18;

	// @dev Creates `_amount` tokens to `_to` address.
	function mint(address _to, uint _amount) external {
		require(totalSupply() + _amount <= MAX_SUPPLY, "Max supply exceeded");
		_mint(_to, _amount);
	}

	function getMaxSupply() pure external returns(uint) {
		return MAX_SUPPLY;
	}
}
