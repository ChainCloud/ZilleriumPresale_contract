var sleep = require('sleep');
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
var daoFund;

var initialFoundersBalance;
var initialBuyerBalance;

var contractAddress;
var contract;

var startBlock;
var endBlock;

// init BigNumber
var unit = new BigNumber(Math.pow(10,18));

///////////////////////////////////////////////
///////////////////////////////////////////////
function convertDaysToBlocks(days){
     var secPerBlock = 14;
     var addBlocks = ((60 * 60 * 24) * days) / secPerBlock;

     return Math.floor(addBlocks);
}

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
               daoFund = accounts[4];
               
               web3.eth.getBlockNumber(function(err,result){
                    assert.equal(err,null);

                    //var startBlock =  2491935; // 10-23-2016 10:57 my local time 
                    startBlock =  result; 
                    endBlock   = startBlock + convertDaysToBlocks(35);

                    console.log('Start block: ' + startBlock);
                    console.log('End block: ' + endBlock);

                    done();
               });
          });
     });

     after("Deinitialize everything", function(done) {
          done();
     });


     it('should get buyer initial balance',function(done){
          initialBuyerBalance = web3.eth.getBalance(buyer);

          console.log('Buyer initial balance is: ');
          console.log(initialBuyerBalance.toString(10));

          done();
     });

     it('should get founders initial balance',function(done){
          initialFoundersBalance = web3.eth.getBalance(founders);

          console.log('Founders initial balance: ');
          console.log(initialFoundersBalance.toString(10));

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
               
               var isTestContract = true;

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

                              if(!alreadyCalled){
                                   done();
                              }
                              alreadyCalled = true;
                         });
                    });
          });
     });

     it('should get current token price',function(done){
          sleep.sleep(2);

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

     it('should get correct initial total supply',function(done){
          contract.totalSupply(function(err, result){
               assert.equal(err, null);

               console.log('Initial token supply: ');
               console.log(result.toString(10));

               assert.equal(result.toString(10),0);

               done();
          });
     });

     it('should buy some tokens',function(done){
          var amount = 0.005;

          var priceShouldBe = 200;
          var shouldBe = (amount * priceShouldBe);  // current price

          contract.getCurrentPrice(
               startBlock,

               {
                    from: buyer, 
                    gas: 1000000,
               },
               function(err, result){
                    assert.equal(err, null);
                    assert.equal(result.toString(10),priceShouldBe);

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

                                   console.log('Result: ');
                                   console.log(result.toString(10));

                                   assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(amount))), true);

                                   contract.totalSupply(function(err, result){
                                        assert.equal(err, null);

                                        assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(amount))), true);

                                        done();
                                   });
                              });
                         }
                    );
               }
          );
     });

     it('should fail if <stop> is called by creator',function(done){
          contract.stop(
               true,
               {
                    from: buyer,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },
               function(err,result){
                    assert.notEqual(err,null);
                    done();
               }
          );
     });

     // Test stopping, buying, and failing
     it('should stop ',function(done){
          var amount = 0.005;

          var priceShouldBe = 200;
          var shouldBe = (amount * priceShouldBe);  // current price

          contract.stop(
               true,
               {
                    from: creator,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },

               function(err,result){
                    assert.equal(err,null);

                    contract.buyTokens(
                         {
                              from: buyer,      // buyer
                              value: web3.toWei(amount, 'ether'),
                              //gasPrice: 2000000
                         },
                         function(err, result){
                              assert.notEqual(err, null);

                              contract.balanceOf(buyer, function(err, result){
                                   assert.equal(err, null);

                                   // balance should not be changed...
                                   assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(amount))), true);
                                   done();
                              });
                         }
                    );
               }
          );
     });

     it('should enable calls',function(done){
          contract.stop(
               false,
               {
                    from: creator,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },

               function(err,result){
                    assert.equal(err,null);

                    done();
               }
          );
     });

     it('should buy some tokens on behalf of user3',function(done){

          var priceShouldBe = 200;

          // accounts[2]
          var amount = 0.015;
          var amountWas = 0.005;

          contract.buyTokensFor(
               buyer,
               {
                    from: accounts[2],
                    value: web3.toWei(amount, 'ether'),
                    //gasPrice: 2000000
               },
               function(err, result){
                    assert.equal(err, null);

                    contract.balanceOf(buyer, function(err, result){
                         assert.equal(err, null);

                         assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(amount + amountWas))), true);


                         contract.balanceOf(accounts[2], function(err, result){
                              assert.equal(err, null);

                              assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(0))), true);
                              done();
                         });
                    });
               }
          );
     });

     it('buyers balance should be reduced',function(done){
          var balance = web3.eth.getBalance(buyer);

          console.log('Buyer balance: ');
          console.log(balance.toString(10));
          
          var diff = initialBuyerBalance - balance;

          console.log('Diff: ');
          console.log(diff.toString(10));

          // diff includes Gas fees
          // 0.005 ETH
          assert.equal((diff.toString() >= 5000000000000000) && (diff.toString() <= 5000000100000000),true);

          done();
     });

     it('should not allow allocate reward before ICO ends',function(done){
          contract.allocateRewardTokens(
               {
                    from: creator,
                    gas: 3000000
               },
               function(err, result){
                    assert.notEqual(err, null);

                    done();
               }
          );
     });

     it('should get correct total supply before ICO ends',function(done){
          contract.totalSupply(function(err, result){
               assert.equal(err, null);

               console.log('Total token supply: ');
               console.log(result.toString(10));

               var priceShouldBe = 200;

               var one = 0.005;
               var two = 0.015;
               var shouldBeTotal = one + two;

               assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(shouldBeTotal))), true);
               done();
          });
     });

     // sale ends...
     it('should set block num (for tests only)',function(done){
          var newBlockNum = endBlock + 1;    // plus one is just to make sure...

          console.log('Setting current block number: ' + newBlockNum);
          contract.setBlockNumber(
               newBlockNum,
               {
                    from: creator,
                    gas: 3000000
               },
               function(err, result){
                    assert.equal(err, null);

                    done();
               }
          );
     });

     it('should not allow to buy more tokens after ICO ended',function(done){
          var amount = 0.005;
          contract.buyTokens(
               {
                    from: buyer,      // buyer
                    value: web3.toWei(amount, 'ether'),
                    //gasPrice: 2000000
               },
               function(err, result){
                    assert.notEqual(err, null);
                    done();
               }
          );
     });

     it('should not allow allocate reward if called not by creator',function(done){
          contract.allocateRewardTokens(
               {
                    from: buyer,
                    gas: 3000000
               },
               function(err, result){
                    assert.notEqual(err, null);

                    done();
               }
          );
     });

     it('should allow to allocate reward',function(done){
          contract.allocateRewardTokens(
               {
                    from: creator,
                    gas: 3000000
               },
               function(err, result){
                    assert.equal(err, null);

                    done();
               }
          );
     });

     it('should get founders reward balance',function(done){
          var balance = web3.eth.getBalance(founders);

          console.log('Founders balance after reward allocated: ');
          console.log(balance.toString(10));

          var diff = initialFoundersBalance - balance;

          console.log('Diff: ');
          console.log(diff.toString(10));

          // TODO: 15000000000049152 is 0.015 ETH. Too much... 

          done();
     });

     /*
     it('should get correct total supply after ICO',function(done){
          contract.totalSupply(function(err, result){
               assert.equal(err, null);

               console.log('Total token supply: ');
               console.log(result.toString(10));

               var priceShouldBe = 200;

               var one = 0.005;
               var two = 0.015;
               var shouldBeTotal = one + two;

               assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(shouldBeTotal))), true);
               done();
          });
     });
     */

     // TODO:
     /*
     it('should get correct founders token balance',function(done){

          contract.balanceOf(founders, function(err, result){
               assert.equal(err, null);

               console.log('Founders token balance: ');
               console.log(result.toString(10));

               assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(amount))), true);
               done();
          });
     });
     */

});
