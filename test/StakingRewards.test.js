const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { constants, BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const StakingToken = artifacts.require('StakingToken.sol');
const RewardToken = artifacts.require('RewardToken.sol');
const StakingRewards = artifacts.require('./StakingRewards.sol');

require('chai')
    .use(require('chai-as-promised'))
    .should();

contract('StakingRewards', accounts => {
    let stakingToken;
    let rewardToken;
    let stakingRewards;

    const advanceBlockAtTime = (time) => {
        return new Promise((resolve, reject) => {
            web3.currentProvider.send(
                {
                    jsonrpc: "2.0",
                    method: "evm_mine",
                    params: [time],
                    id: new Date().getTime(),
                },
                (err, _) => {
                    if (err) {
                        return reject(err);
                    }
                    const newBlockHash = web3.eth.getBlock("latest").hash;

                    return resolve(newBlockHash);
                },
            );
        });
    };

    before(async () => {
        StakingRewards.defaults({ gasPrice: 0 });
        StakingToken.defaults({ gasPrice: 0 });
        RewardToken.defaults({ gasPrice: 0 });

        stakingToken = await StakingToken.deployed();
        rewardToken = await RewardToken.deployed();
        stakingRewards = await StakingRewards.deployed();
    });

    describe('Deployment', async () => {
        it('deploys successfully', async () => {
            const address = await stakingRewards.address;
            assert.notEqual(address, constants.ZERO_ADDRESS);
            assert.notEqual(address, '');
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        });
        it('should have 0 totalSupply initially', async () => {
            const totalSupply = await stakingRewards.totalSupply.call();
            assert.equal(totalSupply, 0);
        });
    });

    describe('Stake', async () => {
        it('should fail if 0 amount is specified', async () => {
            await expectRevert(
                stakingRewards.stake(0),
                'Stake amount should be positive'
            );
        });
        it('should successfully stake a valid amount', async () => {
            const account = accounts[1];
            const totalSupplyBefore = await stakingRewards.totalSupply.call();
            const accountBalanceBefore = await stakingRewards.balanceOf.call(account);

            const stakingMaxSupply = await stakingToken.getMaxSupply();
            const mintCount = stakingMaxSupply / 10;
            const amountToStake = new BN(web3.utils.toWei('100', 'ether'));

            await stakingToken.mint(account, BigInt(mintCount));
            await stakingToken.increaseAllowance(stakingRewards.address, stakingMaxSupply, { from:  account })

            const accountTokenBalanceBefore = await stakingToken.balanceOf.call(account);
            const contractTokenBalanceBefore = await stakingToken.balanceOf.call(stakingRewards.address);

            const receipt = await stakingRewards.stake(amountToStake, { from: account });

            expectEvent(receipt, 'Staked', {
                user: account,
                amount: amountToStake.toString()
            });

            const totalSupply = await stakingRewards.totalSupply.call();
            assert.equal(totalSupply, +totalSupplyBefore + +amountToStake);

            let balance = await stakingRewards.balanceOf.call(account);
            assert.equal(balance, +accountBalanceBefore + +amountToStake);

            balance = await stakingToken.balanceOf.call(account);
            assert.equal(balance, accountTokenBalanceBefore - amountToStake);

            balance = await stakingToken.balanceOf.call(stakingRewards.address);
            assert.equal(balance, +contractTokenBalanceBefore + +amountToStake);
        });
    });

    describe('Unstake', async () => {
        it('should fail if 0 amount is specified', async () => {
            await expectRevert(
                stakingRewards.unstake(0),
                'Unstake amount should be positive'
            );
        });
        it('should fail if unstake amount exceeds balance', async () => {
            await expectRevert(
                stakingRewards.unstake(new BN(web3.utils.toWei('50', 'ether'))),
                'Unstake amount exceeds balance'
            );
        });
        it('should successfully unstake a valid amount', async () => {
            const account = accounts[1];
            const amountToUnstake = new BN(web3.utils.toWei('50', 'ether'));

            const accountTokenBalanceBefore = await stakingToken.balanceOf.call(account);
            const contractTokenBalanceBefore = await stakingToken.balanceOf.call(stakingRewards.address);

            const totalSupplyBefore = await stakingRewards.totalSupply.call();
            const accountBalanceBefore = await stakingRewards.balanceOf.call(account);

            const receipt = await stakingRewards.unstake(amountToUnstake, { from: account });

            expectEvent(receipt, 'Unstaked', {
                user: account,
                amount: amountToUnstake.toString()
            });

            const totalSupply = await stakingRewards.totalSupply.call();
            assert.equal(totalSupply, totalSupplyBefore - amountToUnstake);

            let balance = await stakingRewards.balanceOf.call(account);
            assert.equal(balance, accountBalanceBefore - amountToUnstake);

            balance = await stakingToken.balanceOf.call(account);
            assert.equal(balance, +accountTokenBalanceBefore + +amountToUnstake);

            balance = await stakingToken.balanceOf.call(stakingRewards.address);
            assert.equal(balance, contractTokenBalanceBefore - amountToUnstake);
        });
    });

    describe('Reward', async () => {
        it('should successfully get reward', async () => {
            const account = accounts[2];
            const stakingMaxSupply = await stakingToken.getMaxSupply();
            const stakingMintCount = stakingMaxSupply / 10;

            const rewardMaxSupply = await rewardToken.getMaxSupply();
            const rewardMintCount = rewardMaxSupply / 10;

            await stakingToken.mint(account, BigInt(stakingMintCount));
            await stakingToken.increaseAllowance(stakingRewards.address, stakingMaxSupply, { from:  account })

            await rewardToken.mint(stakingRewards.address, BigInt(rewardMintCount));

            const accountInitialBalance = await rewardToken.balanceOf.call(account);

            const stakeAmount = new BN(web3.utils.toWei('100', 'ether'));

            await stakingRewards.stake(stakeAmount, { from: account });

            let block = await web3.eth.getBlock('latest');
            await advanceBlockAtTime(block.timestamp + 10);

            const receipt = await stakingRewards.getReward({ from: account });
            expectEvent(receipt, 'Rewarded', {
                user: account,
            });

            const balance = await rewardToken.balanceOf.call(account);
            assert.isAbove(balance - accountInitialBalance, 0);
        });
    });
});
