#!/usr/bin/env node

global.fetch = require('node-fetch')
const config = require('config');
const assert = require('assert');
const debug = require('debug')('taxes');
const etherscan = require('etherscan-api').init(config.get('etherscan_key'));
const yargs = require('yargs');
const cc = require('cryptocompare');

async function getTxsForAddr(address, minBlock, currentBlockNumber) {
  /* Get all the transactions from etherscan */
  var txs = [];
  var page = 1;
  while (true) {
    debug(`Querying ${address} page ${page} from etherscan`);
    var resp;
    try {
      resp = await etherscan.account.txlist(address, minBlock, currentBlockNumber, page, 1000, "desc");
    } catch (e) {
      if (typeof(e) !== "string") {
        throw e;
      }

      if (e.startsWith('No transactions found')) {
        break;
      }

      throw e;
    }
    assert.equal(resp.status, '1');
    assert.equal(resp.message, 'OK');

    txs.push(...resp.result);
    page++;
  }

  return txs;
}

async function getEtherPrice(date, memo) {

  if (memo != undefined && memo[date] != undefined) {
    return memo[date];
  }

  /* Query cryptocompare's price history api */
  const price = await cc.priceHistorical('ETH', ['USD'], new Date(date));
  memo[date] = price.USD;
  return price.USD;
}

(async () => {
  const argv = yargs
    .command('csv <address...>', 'Print transactions with gas fees as csv')
    .command('monthly <address...>', 'Print transactions with gas fees broken down by month')
    .help('help')
    .string('address')
    .argv

  if (argv._.length == 0 || argv.address == undefined)
    return yargs.showHelp()

  cc.setApiKey(config.get("cryptocompare_key"));

  const addrs = argv.address;
  var txs = [];

  for (const addr of addrs) {
    var addr_txs = await getTxsForAddr(addr, 0, await etherscan.proxy.eth_blockNumber());

    // Filter out inbound transactions
    addr_txs = addr_txs.filter(tx => {
      return tx.from.toLowerCase() == addr.toLowerCase();
    });

    // Map to a new object with the relevant fields (nonce, hash, gasPrice * gasUsed, timestamp)
    addr_txs = addr_txs.map(tx => {
      const out =
        {
          "nonce": tx.nonce,
          "sender": addr,
          "hash": tx.hash,
          "feeWei": tx.gasPrice * tx.gasUsed,
          "date": (new Date(1000*parseInt(tx.timeStamp))).toISOString().slice(0,10)
        }
      return out;
    });
    txs = txs.concat(addr_txs);
  };

  if (txs.length == 0)
    return console.log("No transactions found");

  // Find pricing and deduplicate
  var d = {}
  // Save on calls to the price api by memoizing results
  var priceMemo = {}
  for (tx of txs) {
    tx['ethPriceUSD'] = await getEtherPrice(tx.date, priceMemo);
    tx['gasCostUSD'] = (tx['feeWei'] / 1000000000000000000) * tx['ethPriceUSD']
    d[tx.hash] = tx;
  }

  txs = Object.values(d);
  txs.sort((a,b) => { return a.nonce - b.nonce });

  if (argv._[0] == 'csv') {
    console.log("date,nonce,sender,hash,feeWei,ethPriceUSD,gasCostUSD");
    const rows = txs.map(tx => { return `${tx["date"]},${tx["nonce"]},${tx["sender"]},${tx["hash"]},${tx["feeWei"]},${tx["ethPriceUSD"]},${tx["gasCostUSD"]}` });
    console.log(rows.join("\n"));
    return;
  }

  // Summarize based on month with an upsert into a dict
  var digest = {}
  for (tx of txs) {
    const key = tx.date.slice(0,7);

    if (digest[key] != undefined) {
      digest[key]['feesEth'] += tx['feeWei'] / 1000000000000000000;
      digest[key]['feesUSD'] += tx['gasCostUSD'];
      continue;
    };
    digest[key] = {};
    digest[key]['month'] = key;
    digest[key]['feesEth'] = tx['feeWei'] / 1000000000000000000;
    digest[key]['feesUSD'] = tx['gasCostUSD'];
  }

  digest = Object.values(digest);
  digest.sort((a,b) => { return a.month > b.month ? 1 : -1 });
  console.log("month,feesEth,feesUSD");
  const rows = digest.map(m => { return `${m["month"]},${m["feesEth"]},${m["feesUSD"]}` });
  console.log(rows.join("\n"));
})()
