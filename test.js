var solc = require('solc');
var Web3 = require('web3');
//var web3 = new Web3(new Web3.providers.HttpProvider("http://52.16.72.86:8545"));
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8989"));

var fs = require('fs');
var assert = require('assert');
var async = require('async');
var BigNumber = require('bignumber.js');

var abi;
var accounts;
var creator;
var buyer;
var foundation;
var founders;
var devs;

var contractAddress;
var contract;

// init BigNumber
var unit = new BigNumber(Math.pow(10,18));


///////////////////////////////////////////////
///////////////////////////////////////////////
function convertDaysToBlocks(days){
     var secPerBlock = 14;
     var addBlocks = ((60 * 60 * 24) * days) / secPerBlock;

     return Math.floor(addBlocks);
}

var startBlock =  2491935; // 10-23-2016 10:57 my local time 
var endBlock   = startBlock + convertDaysToBlocks(10);

console.log('Start block: ' + startBlock);
console.log('End block: ' + endBlock);

describe('Smart Contracts', function() {
     before("Initialize everything", function(done) {
          web3.eth.getAccounts(function(err, as) {
               if(err) {
                    done(err);
                    return;
               }

               accounts = as;

               //console.log('ACC: ');
               //console.log(accounts);

               creator = accounts[0];
               buyer = accounts[1];

               foundation = creator;
               founders = accounts[2];
               devs = accounts[3];

               done();
          });
     });

     after("Deinitialize everything", function(done) {
          done();
     });

     it('Should compile contract', function(done) {
          var file = './contracts/Token.sol';
          var contractName = 'DaoCasinoToken';

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

               //var startDate = 1477206494;  // Sun, 23 Oct 2016 07:08:14 GMT
               //var endDate = 1479884887;    // Wed, 23 Nov 2016 07:08:07 GMT

               tempContract.new(
                    startBlock,
                    endBlock,
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

                              if(!alreadyCalled){
                                   done();
                              }
                              alreadyCalled = true;
                         });
                    });
          });
     });

     it('should get current token price',function(done){
          var next1  = startBlock + convertDaysToBlocks(1);
          var next10 = startBlock + convertDaysToBlocks(10);
          var from16 = startBlock + convertDaysToBlocks(17);
          var from20 = startBlock + convertDaysToBlocks(21);
          var from23 = startBlock + convertDaysToBlocks(24);
          var from27 = startBlock + convertDaysToBlocks(28);
          var from29 = startBlock + convertDaysToBlocks(29);
          var from30 = startBlock + convertDaysToBlocks(29);


          var tests = [
               // first day - power day
               {addDays: 0, price: 200},

               // 190 next 14 days
               {addDays: 1, price: 190},
               {addDays: 10, price: 190},

               // 180 from 16 to 18 days
               {addDays: 17, price: 180},
               // 170 tokens: days 20 to 22 (3 days total)
               {addDays: 21, price: 170},
               // 160 tokens: days 23 to 26 (3 days total)
               {addDays: 24, price: 160},
               // 150 tokens: days 27 to 28 (2 days total)
               {addDays: 28, price: 150},
               // 140 tokens: days 29 to 30 (2 days total)
               {addDays: 29, price: 140},
               // 140 tokens: days 29 to 30 (2 days total)
               {addDays: 30, price: 140},
               {addDays: 31, price: 140},
               {addDays: 40, price: 140},
          ];
          
          console.log('Starting block: ' + startBlock);

          async.mapSeries(
               tests,
               function(testCase, callback) {
                    var thisBlock = startBlock + convertDaysToBlocks(testCase.addDays);
                    console.log('Testing price for block: ' + thisBlock);

                    contract.getCurrentPrice(
                         thisBlock,

                         {
                              from: buyer, 
                              gas: 1000000,
                         },
                         function(err, result){
                              assert.equal(err, null);

                              console.log('Result: ');
                              console.log(result.toString(10));

                              assert.equal(result.toString(10),testCase.price);
                              callback(err);
                         }
                    );
               },

               function(err){
                    done();
               }
          );
     });

     /*
     it('should buy some tokens',function(done){
          var amount = 0.005;

          contract.buyTokens(
               {
                    from: buyer,      // buyer
                    value: web3.toWei(amount, 'ether'),
                    //gasPrice: 2000000
               },
               function(err, result){
                    assert.equal(err, null);

                    contract.balanceOf(buyer, function(err, result){
                         assert.equal(err, null);
                         assert.equal(result.equals(unit.times(new BigNumber(200)).times(new BigNumber(amount))), true);
                         done();
                    });
               }
          );
     });
     */
});
