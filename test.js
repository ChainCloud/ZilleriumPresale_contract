var solc = require('solc');
var Web3 = require('web3');
//var web3 = new Web3(new Web3.providers.HttpProvider("http://52.16.72.86:8545"));
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9090"));

var fs = require('fs');
var assert = require('assert');

var accounts;
var creator;
var buyer;
var contract;

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

               var abi = JSON.parse(output.contracts[contractName].interface);
               var bytecode = output.contracts[contractName].bytecode;
               var tempContract = web3.eth.contract(abi);

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

                              contract = web3.eth.contract(abi).at(result.contractAddress);
                              done();
                         });
                    });
          });
     });

     it('Should buy some tokens',function(done){
          var amount = 1;

          //console.log('CON: ');
          //console.log(contract);

          /*
          web3.eth.getBalance(creator, function(err, result){
               assert.equal(err,null);
               console.log('RESULT: ', result);
          */

               contract.buyTokens(
                    {
                         from: buyer, 
                         value: web3.toWei(amount, "ether")
                    },
                    function(err, result){
                         assert.equal(err, null);

                         done();
                    }
               );

          //});
     });
});
