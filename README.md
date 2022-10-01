# Etherscan Gas Digest

This project aims to scrape a wallet's transaction data from Etherscan and create CSV outputs representing the transaction fees.

## Setup

Clone the repository:
```
git clone https://github.com/jshufro/etherscangasdigest.git
cd etherscangasdigest
```

Install dependencies:
```
npm install
```

Get an [Etherscan API Key](https://etherscan.io/) and a [CryptoCompare API Key](https://www.cryptocompare.com/).

Copy the sample config and edit it with a text editor to add your keys:
```
cp config/default.json.example config/default.json
```

## Usage

To run see the usage output, run `./main.js`:

```shell
$ ./main.js 
main.js [command]

Commands:
  main.js csv <address...>      Print transactions with gas fees as csv
  main.js monthly <address...>  Print transactions with gas fees broken down by
                                month

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## CSV
To generate CSV of the transactions with daily USD gas pricing, run...
```
./main.js csv <address>
```

Sample output:
```
date,nonce,hash,feeWei,ethPriceUSD,gasCostUSD
2021-11-29,0,0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,4941212152610499,4448.49,21.98093284876628
2021-11-30,1,0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,12929874904211328,4631.1,59.879543668893085
2021-11-30,2,0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,6377393896620000,4631.1,29.534348874636883
2021-11-30,3,0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,2325619605750000,4631.1,10.770176956188827
2021-11-30,4,0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,2794441519758000,4631.1,12.941338122151276
2021-11-30,5,0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,13742648537005850,4631.1,63.64357963972779
```

## Monthly CSV
To generate monthly digest data, run...
```
./main.js monthly <address>
```

Sample output:
```
month,feesEth,feesUSD
2021-11,0.04895096843696719,225.7945151772506
2021-12,0.11175195012100389,436.61441893842436
2022-01,0.014741309281023704,35.75991029318573
2022-04,0.05196124782880768,156.1049774340965
2022-05,0.000940805395782,2.6160317076733026
```
