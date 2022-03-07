# Staking Contract

## Description

Staking Rewards Contract allows users to stake a token to a system and receive a reward.

## Project Main Structure
This is the project main structure:
* contracts
* migrations
* config
* test


**contracts** directory contains smart contracts containing a system functionality.
* *mock* - directory contains ERC20 mock token smart contracts (staking and reward). They are used only when running tests - in this case mock tokens are deployed and used in unit tests. For testnet and mainnet pre-deployed token contracts are used (the addressed should be specified in .env file).


**config** directory contains configurations - addressed of pre-deployed staking and reward token contracts (for testnet and mainnet), infura URL and mnemonic.


**test** directory contains unit tests of the Staking Contract functions.

## Installation

```bash
$ npm install
```

## Local Development

A local *.env* file should be created with environment variables. Here is a template:

``` text
STAKING_TOKEN_ADDRESS=<The address of deployed Staking Token Contract>
REWARD_TOKEN_ADDRESS=<The address of deployed Reward Token Contract>
INFURA_URL=<The URL of infura for the project>
MNEMONIC=<the user account mnemonic>
```

Run the following command to compile project smart contracts:

```bash
truffle compile
```

Run the following command to run unit tests on test env:

```bash
truffle test
```