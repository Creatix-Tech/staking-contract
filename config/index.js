require('dotenv').config();

module.exports = {
    addresses: {
        stakingToken: process.env.STAKING_TOKEN_ADDRESS,
        rewardToken: process.env.REWARD_TOKEN_ADDRESS,
    },
    infuraURL: process.env.INFURA_URL,
    mnemonic: process.env.MNEMONIC
};