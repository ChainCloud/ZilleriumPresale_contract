
contract SafeMath 
{
     function safeMul(uint a, uint b) internal returns (uint) 
     {
          uint c = a * b;
          assert(a == 0 || c / a == b);
          return c;
     }

     function safeSub(uint a, uint b) internal returns (uint) 
     {
          assert(b <= a);
          return a - b;
     }

     function safeAdd(uint a, uint b) internal returns (uint) 
     {
          uint c = a + b;
          assert(c>=a && c>=b);
          return c;
     }

     function assert(bool assertion) internal 
     {
          if (!assertion) throw;
     }
}

// Standard token interface (ERC 20)
// https://github.com/ethereum/EIPs/issues/20
contract Token 
{
// Functions:
    /// @return total amount of tokens
    function totalSupply() constant returns (uint256 supply) {}

    /// @param _owner The address from which the balance will be retrieved
    /// @return The balance
    function balanceOf(address _owner) constant returns (uint256 balance) {}

    /// @notice send `_value` token to `_to` from `msg.sender`
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transfer(address _to, uint256 _value) returns (bool success) {}

    /// @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
    /// @param _from The address of the sender
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {}

    /// @notice `msg.sender` approves `_addr` to spend `_value` tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _value The amount of wei to be approved for transfer
    /// @return Whether the approval was successful or not
    function approve(address _spender, uint256 _value) returns (bool success) {}

    /// @param _owner The address of the account owning tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens allowed to spent
    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {}

// Events:
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

contract StdToken is Token 
{
// Fields:
     mapping(address => uint256) balances;
     mapping (address => mapping (address => uint256)) allowed;

// Functions:
     function transfer(address _to, uint256 _value) returns (bool success) 
     {
          if((balances[msg.sender] >= _value) && (balances[_to] + _value > balances[_to])) 
          {
               balances[msg.sender] -= _value;
               balances[_to] += _value;

               Transfer(msg.sender, _to, _value);
               return true;
          } 
          else 
          { 
               return false; 
          }
     }

     function transferFrom(address _from, address _to, uint256 _value) returns (bool success) 
     {
          if((balances[_from] >= _value) && (allowed[_from][msg.sender] >= _value) && (balances[_to] + _value > balances[_to])) 
          {
               balances[_to] += _value;
               balances[_from] -= _value;
               allowed[_from][msg.sender] -= _value;

               Transfer(_from, _to, _value);
               return true;
          } 
          else 
          { 
               return false; 
          }
     }

     function balanceOf(address _owner) constant returns (uint256 balance) 
     {
          return balances[_owner];
     }

     function approve(address _spender, uint256 _value) returns (bool success) 
     {
          allowed[msg.sender][_spender] = _value;
          Approval(msg.sender, _spender, _value);

          return true;
     }

     function allowance(address _owner, address _spender) constant returns (uint256 remaining) 
     {
          return allowed[_owner][_spender];
     }
}

contract Crowdsale is StdToken, SafeMath
{
     string public name = "Zillerium Token";
     uint public decimals = 18;
     string public symbol = "ZTK";

     // Will allow changing the block number if set to true
     bool public isTestContract = false;
     uint public blockNumber = 0;  // only if isTestContract
     bool public isStop = false;

     // used in 'refund'
     mapping(address => uint256) balancesEth;

     uint256 public allSupply = 0;
     uint public presaleTokenSupply = 0; //this will keep track of the token supply created during the crowdsale
     uint public presaleEtherRaised = 0; //this will keep track of the Ether raised during the crowdsale

     bool rewardAllocated = false;

// Parameters:
     uint public startBlock = 0;
     uint public endBlock = 0; 

     uint public constant allocationA = 0.25 * 10**18; 
     uint public constant allocationB = 0.25 * 10**18; 
     uint public constant allocationC = 0.25 * 10**18;

     uint public minIcoEth = 0 * 10**18;
     uint public maxIcoEth = 0 * 10**18;
     uint public icoTotalEth = 0;

     address public creator = 0x0;
     
     address public rewardA = 0x0;
     address public rewardB = 0x0;
     address public rewardC = 0x0;
     address public fund = 0x0;

     // Please see our whitepaper for details
     // The default block time is 14 seconds. See - https://etherscan.io/chart/blocktime
     function getCurrentPrice(uint currentBlock) constant returns (uint out)
     {
          // 1 ETH is 
          // 
          // 200 tokens on the first power day
          // 190 tokens: days 2-3
          // 180 tokens: days 4-5
          // 170 tokens: days 6-7 
          // 160 tokens: days 8-9 
          // 150 tokens: days 10-11 
          // 140 tokens: days 12-13 
          out = 200;

          //uint blocksPerDay = (24 * 60 * 60) / 14;
          uint blocksPerDay = 6171;
          uint currentIcoDay = uint((currentBlock - startBlock) / blocksPerDay);

          if(currentIcoDay>=1){
               out = 190;
          }
          if(currentIcoDay>=3){
               out = 180;
          }
          if(currentIcoDay>=5){
               out = 170;
          }
          if(currentIcoDay>=7){
               out = 160;
          }
          if(currentIcoDay>=9){
               out = 150;
          }
          if(currentIcoDay>=11){
               out = 140;
          }
          return;
     }

     function getCurrentBlock()returns(uint blockOut)
     {
          if(isTestContract)
          {
               // return block number that we passed here from tests...
               blockOut = blockNumber;
               return;
          }

          blockOut = block.number;
          return;
     }

     function rewardTeam() 
     {
          // Only by creator
          if(msg.sender!=creator) throw;
          // This method should be called after ICO ends
          if(getCurrentBlock()<=endBlock) throw;
          // Only once
          if(rewardAllocated) throw;
          // If min was reached only
          if(icoTotalEth<minIcoEth) throw;

          presaleTokenSupply = allSupply;

          // A 
          /*
          var a = presaleTokenSupply * allocationA / (1 ether);
          balances[rewardA] = safeAdd(balances[rewardA], a);
          allSupply = safeAdd(allSupply, a);

          // B 
          var b = presaleTokenSupply * allocationB / (1 ether);
          balances[rewardB] = safeAdd(balances[rewardB], b);
          allSupply = safeAdd(allSupply, b);

          // C 
          var c = presaleTokenSupply * allocationC / (1 ether);
          balances[rewardC] = safeAdd(balances[rewardC], c);
          allSupply = safeAdd(allSupply, c);

          rewardAllocated = true;
          */
     }
}

contract ZilleriumToken is Crowdsale
{
// Events:
     event Buy(address indexed sender, uint eth, uint fbt);
     event Refund(address indexed sender, uint eth, uint fbt);


// Functions:
     function ZilleriumToken(
          bool isTestContract_,
          uint startBlock_, uint endBlock_, 
          uint minIcoEth_, uint maxIcoEth_,
          address rewardA_, address rewardB_, address rewardC_, address fundAddress_)  
     {
          creator = msg.sender;
          
          isTestContract = isTestContract_;

          startBlock = startBlock_;
          if(isTestContract)
          {
               blockNumber = startBlock;     // for tests only...
          }
          endBlock = endBlock_;

          minIcoEth = minIcoEth_ * 10**18;
          maxIcoEth = maxIcoEth_ * 10**18;

          rewardA = rewardA_;
          rewardB = rewardB_;
          rewardC = rewardC_;
          fund = fundAddress_;
     }

     function transfer(address _to, uint256 _value) returns (bool success) 
     {
          if((getCurrentBlock() <= endBlock) && (msg.sender!=creator)) {
               throw;
          }

          return super.transfer(_to, _value);
     }
     
     function transferFrom(address _from, address _to, uint256 _value) returns (bool success) 
     {
          if((getCurrentBlock() <= endBlock) && (msg.sender!=creator)) {
               throw;
          }

          return super.transferFrom(_from, _to, _value);
     }

     function stop(bool _stop)
     {
          if(msg.sender!=creator) throw;
          isStop = _stop;
     }

     function totalSupply() constant returns (uint256 supplyOut) 
     {
          supplyOut = allSupply;
          return;
     }

     function buyTokens()
     {
          address to = msg.sender;
          buyTokensFor(to);
     }

     function buyTokensFor(address to)
     {
          if (msg.value==0) throw;
          if(isStop) throw;
          if((getCurrentBlock()<startBlock) || (getCurrentBlock()>endBlock)) throw;
          if(icoTotalEth>=maxIcoEth) throw;

          uint pricePerWei = getCurrentPrice(getCurrentBlock());
          uint tokens = safeMul(msg.value, pricePerWei);

          balances[to] = safeAdd(balances[to], tokens);
          balancesEth[to] = safeAdd(balancesEth[to], msg.value);

          allSupply = safeAdd(allSupply, tokens);
          icoTotalEth = safeAdd(icoTotalEth, msg.value);

          Buy(to, msg.value, tokens);
     }

     //FOR TESTING PURPOSES:
     function setBlockNumber(uint blockNum) {
          if(msg.sender!=creator) throw;

          if(!isTestContract) throw;

          blockNumber = blockNum;
     }


     // See - https://blog.golemproject.net/gnt-crowdfunding-contract-in-pictures-d6b5a2e69150
     // for more details
     function refund() 
     {
          // only if crowdsale finished, but failed
          if((getCurrentBlock()>startBlock) && (getCurrentBlock()<endBlock)) throw;
          if(icoTotalEth>=minIcoEth) throw;

          var tokens = balances[msg.sender];
          var ethValue = balancesEth[msg.sender];

          if(tokens==0) throw;
          if(ethValue==0) throw;

          balancesEth[msg.sender] = 0;
          balances[msg.sender] = 0;

          allSupply-=tokens;

          Refund(msg.sender, ethValue, tokens);

          // TODO: throws!!! 
          //if(!msg.sender.send(ethValue)) throw;

          // TODO: uncomment line above
          msg.sender.send(ethValue);
     }

     /// This function is called when someone sends money to this contract directly.
     function() 
     {
          throw;
     }
}
