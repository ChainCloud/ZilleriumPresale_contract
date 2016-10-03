var solc = require('solc');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://52.16.72.86:8545"));

var fs = require('fs');
var assert = require('assert');

describe('Smart Contracts', function() {
     before("Initialize everything", function(done) {
          done();
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
               var contract = web3.eth.contract(abi);

               done();
          });
     });
});
