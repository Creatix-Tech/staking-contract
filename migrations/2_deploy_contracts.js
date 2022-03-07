const { addresses } = require('../config');
const StakingRewards = artifacts.require('StakingRewards.sol');
const StakingTokenMock = artifacts.require('StakingToken');
const RewardTokenMock = artifacts.require('RewardToken');

module.exports = async function(deployer, network) {
    if (network === 'test') {
        await deployer.deploy(StakingTokenMock);
        await deployer.deploy(RewardTokenMock);

        const stakingTokenMock = await StakingTokenMock.deployed();
        addresses.stakingToken = stakingTokenMock.address;

        const rewardTokenMock = await RewardTokenMock.deployed();
        addresses.rewardToken = rewardTokenMock.address;
    }
    await deployer.deploy(StakingRewards, addresses.stakingToken, addresses.rewardToken);
};
