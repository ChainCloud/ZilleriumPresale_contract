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

var accountB;
var accountFund;

var initialBalanceBuyer;
var initialBalanceFund;
///////////////////////////////// 

var tokenContractAddress;
var tokenContract;

var contractAddress;
var contract;

// init BigNumber
var unit = new BigNumber(Math.pow(10,18));

///////////////////////////////////////////////
///////////////////////////////////////////////
function getTotalSupplyShouldBe(){
     var one = 500;
     var two = 250;
     var three = 500;

     return one + two + three;
}

function convertDaysToBlocks(days){
     var secPerBlock = 14;
     var addBlocks = ((60 * 60 * 24) * days) / secPerBlock;

     return Math.floor(addBlocks);
}

function deployContract1(cb){
     var file = './contracts/Token.sol';
     var contractName = 'ZilleriumToken';

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

          tempContract.new(
               {
                    from: creator, 
                    gas: 3000000, 
                    data: bytecode
               }, 
               function(err, c){
                    assert.equal(err, null);

                    web3.eth.getTransactionReceipt(c.transactionHash, function(err, result){
                         assert.equal(err, null);

                         tokenContractAddress = result.contractAddress;
                         tokenContract = web3.eth.contract(abi).at(tokenContractAddress);

                         console.log('Token Contract address: ');
                         console.log(tokenContractAddress);

                         if(!alreadyCalled){
                              alreadyCalled = true;

                              return cb(null);
                         }
                    });
               });
     });
}

function deployContract2(cb){
     var file = './contracts/Token.sol';
     var contractName = 'ZilleriumPresale';

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
          
          var maxIcoGoal = 2; // 2 ETH max

          tempContract.new(
               tokenContractAddress,
               maxIcoGoal,
               accountFund,
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
                              alreadyCalled = true;
                              return cb(null);
                         }
                    });
               });
     });
}

describe('Price Check', function() {
     before("Initialize everything", function(done) {
          web3.eth.getAccounts(function(err, as) {
               if(err) {
                    done(err);
                    return;
               }

               accounts = as;

               creator = accounts[0];
               buyer = accounts[1];
               accountB = accounts[2];

               accountFund = accounts[5];


               done();
          });
     });

     after("Deinitialize everything", function(done) {
          done();
     });

     it('Should deploy contract 1', function(done) {
          deployContract1(function(err){
               done(err);
          });
     });

     it('Should deploy contract 2', function(done) {
          deployContract2(function(err){
               done(err);
          });
     });

     it('should get current token price',function(done){
          contract.getCurrentTokenPriceWei(
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
     });

});

describe('Smart Contracts', function() {
     before("Initialize everything", function(done) {
          web3.eth.getAccounts(function(err, as) {
               if(err) {
                    done(err);
                    return;
               }

               accounts = as;

               creator = accounts[0];
               buyer = accounts[1];
               accountB = accounts[2];

               accountFund = accounts[5];
               
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

     it('should get initial buyer balance',function(done){
          initialBalanceBuyer = web3.eth.getBalance(buyer);

          console.log('Buyer initial balance is: ');
          console.log(initialBalanceBuyer.toString(10));

          done();
     });

     it('should get accountFund initial balance',function(done){
          initialBalanceFund = web3.eth.getBalance(accountFund);

          console.log('Fund initial balance is: ');
          console.log(initialBalanceFund.toString(10));

          done();
     });

     it('Should deploy contract 1', function(done) {
          deployContract1(function(err){
               done(err);
          });
     });

     it('Should deploy contract 2', function(done) {
          deployContract2(function(err){
               done(err);
          });
     });

     it('Should get contract 1 address', function(done) {
          var file = './contracts/Token.sol';
          var contractName = 'ZilleriumToken';

          fs.readFile(file, function(err, result){
               assert.equal(err,null);

               var source = result.toString();
               assert.notEqual(source.length,0);

               var output = solc.compile(source, 1); // 1 activates the optimiser
               abi = JSON.parse(output.contracts[contractName].interface);
               tokenContract = web3.eth.contract(abi).at(tokenContractAddress);

               done();
          });
     });

     it('should set client',function(done){
          sleep.sleep(5);

          tokenContract.changeClient(
               contractAddress,
               {
                    from: creator, 
                    gas: 1000000,
               },
               function(err, result){
                    assert.equal(err, null);

                    done();
               }
          );
     });

     it('should get correct initial total supply',function(done){
          tokenContract.totalSupply(function(err, result){
               assert.equal(err, null);

               console.log('Initial token supply: ');
               console.log(result.toString(10));

               assert.equal(result.toString(10),0);

               done();
          });
     });

     it('Should get contract 2 address', function(done) {
          var file = './contracts/Token.sol';
          var contractName = 'ZilleriumPresale';

          fs.readFile(file, function(err, result){
               assert.equal(err,null);

               var source = result.toString();
               assert.notEqual(source.length,0);

               var output = solc.compile(source, 1); // 1 activates the optimiser
               abi = JSON.parse(output.contracts[contractName].interface);
               contract = web3.eth.contract(abi).at(contractAddress);

               done();
          });
     });

     it('should not buy if not enough Wei for 1 token',function(done){
          var priceShouldBe = 2000000000000000;
          var amount = 2000000000000000 - 10;

          var shouldBe = 0;

          contract.getCurrentTokenPriceWei(
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
                              value: amount,
                              //gasPrice: 2000000
                         },
                         function(err, result){
                              assert.notEqual(err, null);

                              tokenContract.balanceOf(buyer, function(err, result){
                                   assert.equal(err, null);

                                   assert.equal(result.equals(shouldBe), true);

                                   tokenContract.totalSupply(function(err, result){
                                        assert.equal(err, null);

                                        assert.equal(result.equals(shouldBe), true);

                                        done();
                                   });
                              });
                         }
                    );
               }
          );
     });

     it('should buy some tokens',function(done){
          var amount = web3.toWei(1, 'ether');
          var priceShouldBe = 2000000000000000;

          var shouldBe = (amount / priceShouldBe);  // current price

          contract.getCurrentTokenPriceWei(
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
                              value: amount,
                              //gasPrice: 2000000
                         },
                         function(err, result){
                              assert.equal(err, null);

                              tokenContract.balanceOf(buyer, function(err, result){
                                   assert.equal(err, null);

                                   console.log('Result: ');
                                   console.log(result.toString(10));

                                   assert.equal(result.equals(shouldBe), true);

                                   tokenContract.totalSupply(function(err, result){
                                        assert.equal(err, null);

                                        assert.equal(result.equals(shouldBe), true);

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
          var amount = web3.toWei(0.5, 'ether');
          var priceShouldBe = 2000000000000000;

          var shouldBe = (amount / priceShouldBe);  // current price

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
                              value: amount,
                              //gasPrice: 2000000
                         },
                         function(err, result){
                              assert.notEqual(err, null);

                              tokenContract.balanceOf(buyer, function(err, result){
                                   assert.equal(err, null);

                                   // balance should not be changed...
                                   assert.equal(result.equals(500), true);
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

     it('should buy some tokens on behalf of buyer',function(done){
          var amount = web3.toWei(0.5, 'ether');
          var priceShouldBe = 2000000000000000;

          contract.buyTokensFor(
               buyer,
               {
                    from: accountB,               
                    value: amount,
               },
               function(err, result){
                    assert.equal(err, null);

                    tokenContract.balanceOf(buyer, function(err, result){
                         assert.equal(err, null);

                         assert.equal(result.equals(500 + 250), true);

                         tokenContract.balanceOf(accountB, function(err, result){
                              assert.equal(err, null);

                              assert.equal(result.equals(0), true);
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
          
          var diff = initialBalanceBuyer - balance;

          console.log('Diff: ');
          console.log(diff.toString(10));

          // diff includes Gas fees
          // 0.005 ETH
          assert.equal((diff.toString() >= 1000000000000000000) && (diff.toString() <= 10000000000100000000),true);

          done();
     });

     it('should get correct total supply before ICO ends',function(done){
          tokenContract.totalSupply(function(err, result){
               assert.equal(err, null);

               console.log('Total token supply: ');
               console.log(result.toString(10));

               var priceShouldBe = 200;

               var one = 500;
               var two = 250;
               var shouldBeTotal = one + two;

               assert.equal(result.equals(shouldBeTotal), true);
               done();
          });
     });

     it('should buy more to end presale',function(done){
          // already bought 1.5 ETH. needs at least 0.5 more

          var amount = web3.toWei(1, 'ether');
          var priceShouldBe = 2000000000000000;

          var shouldBe = 500 + 250 + (amount / priceShouldBe);  // current price

          contract.getCurrentTokenPriceWei(
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
                              value: amount,
                              //gasPrice: 2000000
                         },
                         function(err, result){
                              assert.equal(err, null);

                              tokenContract.balanceOf(buyer, function(err, result){
                                   assert.equal(err, null);

                                   console.log('Result: ');
                                   console.log(result.toString(10));

                                   assert.equal(result.equals(shouldBe), true);

                                   tokenContract.totalSupply(function(err, result){
                                        assert.equal(err, null);

                                        assert.equal(result.equals(500 + 250 + 500), true);

                                        done();
                                   });
                              });
                         }
                    );
               }
          );
     });

     it('should return that the presale has ended',function(done){
          contract.presaleEnded(
               {
                    from: buyer,
                    gas: 3000000, 
               },
               function(err, result){
                    assert.equal(err, null);
                    done();
               }
          );
     });

     it('should not allow to buy more tokens after ICO ended',function(done){
          var amount = web3.toWei(1, 'ether');

          contract.buyTokens(
               {
                    from: buyer,      // buyer
                    value: amount
                    //gasPrice: 2000000
               },
               function(err, result){
                    assert.notEqual(err, null);

                    done();
               }
          );
     });

     it('should get correct total supply before the ICO',function(done){
          tokenContract.totalSupply(function(err, result){
               assert.equal(err, null);

               var totalSupplyShouldBe = getTotalSupplyShouldBe();

               console.log('Total token supply should be: ' + totalSupplyShouldBe);

               assert.equal(result.equals(totalSupplyShouldBe), true);
               done();
          });
     });

     it('accountFund balance should be increased',function(done){
          var balance = web3.eth.getBalance(accountFund);

          console.log('Fund balance: ');
          console.log(balance.toString(10));
          
          var diff = balance - initialBalanceFund;

          console.log('Diff: ');
          console.log(diff.toString(10));

          // diff includes Gas fees
          // 0.005 + 0.015 ETH = 0.02
          // 1 + 0.5 + 1 = 2.5 ETH
          assert.equal((diff.toString() >= 2500000000000000000) && (diff.toString() <= 2500000001000000000),true);

          done();
     });
});

