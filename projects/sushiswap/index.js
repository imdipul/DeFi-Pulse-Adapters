const BigNumber = require('bignumber.js')

const exchangeTVL = require('./exchange');
const sdk = require('../../sdk');

const ETH = '0x0000000000000000000000000000000000000000'.toLowerCase();
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase();
const SUSHI = '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2'.toLowerCase();

async function tvl(timestamp, block) {
  const exchange = await exchangeTVL(timestamp, block);

  // replace WETH with ETH
  exchange[ETH] = exchange[WETH];
  delete exchange[WETH];

  let sushiBar = await sdk.api.erc20.balanceOf({
    target: SUSHI,
    owner: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272', // SushiBar
    block: block
  });

  const tokenAddresses = new Set(Object.keys(exchange));

  const balances = (
    Array
      .from(tokenAddresses)
      .reduce((accumulator, tokenAddress) => {
        const exchangeBalance = new BigNumber(exchange[tokenAddress] || '0');
        accumulator[tokenAddress] = exchangeBalance.toFixed();

        return accumulator
      }, {})
  );

  // Add SushiBar balance to exchange Sushi balance
  if (SUSHI in balances) {
    balances[SUSHI] += sushiBar.output;
  }
  else if (sushiBar.output > 0) {
    balances[SUSHI] = sushiBar.output;
  }

  console.log(balances)
  return balances;
}

module.exports = {
  name: 'SushiSwap',
  token: 'SUSHI',
  category: 'dexes',
  start: 10736094, // 08/26/2020 @ 12:28pm (UTC)
  tvl,
};
