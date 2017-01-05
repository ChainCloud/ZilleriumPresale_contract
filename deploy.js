var fs = require('fs');
var solc = require('solc');
var Web3 = require('web3');
var assert = require('assert');

var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// 1 - initialize
var Web3 = require('web3');
var web3;
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  if (config.environment == "live")
    web3 = new Web3(new Web3.providers.HttpProvider(config.rpc.live));
  else (config.environment == "dev")
    web3 = new Web3(new Web3.providers.HttpProvider(config.rpc.test));
}

  //Config
var file = './contracts/Token.sol';
var contractName = 'ZilleriumToken';

console.log('Reading contract file');
fs.readFile(file, function(err, result){
     assert.equal(err,null);

     var source = result.toString();
     assert.notEqual(source.length,0);

     var output = solc.compile(source, 1); // 1 activates the optimiser

     //console.log('OUTPUT: ');
     //console.log(output);

     abi = JSON.parse(output.contracts[contractName].interface);
     var bytecode = output.contracts[contractName].bytecode;
     var tempContract = web3.eth.contract(abi);

     var alreadyCalled = false;
     var isTestContract = true;

     var creator = accounts[0];
     var buyer = accounts[1];
     var foundation = accounts[2];
     var founders = accounts[3];
     var devs = accounts[4];
     var daoFund = accounts[5];

     console.log('Deploy contract');
     tempContract.new(
          isTestContract,

          startBlock,
          endBlock,

          daoFund,

          foundation,
          founders,
          devs,
          {
               from: creator, 
               gas: 3000000, 
               data: bytecode
          }, 
          function(err, c){
               assert.equal(err, null);

               web3.eth.getTransactionReceipt(c.transactionHash, function(err, result){
                    assert.equal(err, null);

                    console.log('Contract address: ');
                    console.log(result.contractAddress);

                    contractAddress = result.contractAddress;
                    contract = web3.eth.contract(abi).at(result.contractAddress);

                    //console.log('Contract: ');
                    //console.log(contract);

               });
          });
});


