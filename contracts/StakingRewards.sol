// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingRewards is ReentrancyGuard {
  IERC20 public rewardsToken;
  IERC20 public stakingToken;

  uint public rewardRate = 100;
  uint public lastUpdateTime;
  uint public rewardPerTokenStored;

  mapping(address => uint) public userRewardPerTokenPaid;
  mapping(address => uint) public rewards;

  uint private _totalSupply;
  mapping(address => uint) private _balances;

  event Staked(address indexed user, uint256 amount);
  event Unstaked(address indexed user, uint256 amount);
  event Rewarded(address indexed user, uint256 reward);

  constructor(address _stakingToken, address _rewardsToken) {
    stakingToken = IERC20(_stakingToken);
    rewardsToken = IERC20(_rewardsToken);
  }

  modifier updateReward(address account) {
    rewardPerTokenStored = rewardPerToken();
    lastUpdateTime = block.timestamp;

    rewards[account] = earned(account);
    userRewardPerTokenPaid[account] = rewardPerTokenStored;
    _;
  }

  function rewardPerToken() private view returns (uint) {
    if (_totalSupply == 0) {
      return 0;
    }
    return rewardPerTokenStored + (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / _totalSupply);
  }

  function earned(address account) private view returns (uint) {
    return ((_balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) + rewards[account];
  }

  function totalSupply() external view returns (uint) {
    return _totalSupply;
  }

  function balanceOf(address account) external view returns (uint) {
    return _balances[account];
  }

  function stake(uint _amount) external nonReentrant updateReward(msg.sender) {
    require(_amount > 0, "Stake amount should be positive");

    _totalSupply += _amount;
    _balances[msg.sender] += _amount;
    stakingToken.transferFrom(msg.sender, address(this), _amount);

    emit Staked(msg.sender, _amount);
  }

  function unstake(uint _amount) external nonReentrant updateReward(msg.sender) {
    require(_amount > 0, "Unstake amount should be positive");
    require(_totalSupply >= _amount, "Unstake amount exceeds totalSupply");
    require(_balances[msg.sender] >= _amount, "Unstake amount exceeds balance");

    _totalSupply -= _amount;
    _balances[msg.sender] -= _amount;
    stakingToken.transfer(msg.sender, _amount);

    emit Unstaked(msg.sender, _amount);
  }

  function getReward() external nonReentrant updateReward(msg.sender) {
    uint reward = rewards[msg.sender];
    if (reward > 0) {
      rewards[msg.sender] = 0;
      rewardsToken.transfer(msg.sender, reward);

      emit Rewarded(msg.sender, reward);
    }
  }
}
