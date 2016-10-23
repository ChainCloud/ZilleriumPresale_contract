

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

contract Crowdsale
{
     uint public startBlock = 0;
     uint public endBlock = 0; 

     // Please see our whitepaper here - 

     function getCurrentPrice(uint currentBlock) constant returns (uint out)
     {
          // 1 ETH is 
          // 
          // 200 tokens on the first power day
          // 190 tokens: days 2 to 15 (14 days total)
          // 180 tokens: days 16 to 19 (3 days total)
          // 170 tokens: days 20 to 22 (3 days total)
          // 160 tokens: days 23 to 26 (3 days total)
          // 150 tokens: days 27 to 28 (2 days total)
          // 140 tokens: days 29 to 30 (2 days total)

          out = 200;

          //uint blocksPerDay = (24 * 60 * 60) / 14;
          uint blocksPerDay = 6171;
          uint currentIcoDay = (currentBlock - startBlock) / blocksPerDay;

          if(currentIcoDay>=1){
               out = 190;
          }
          if(currentIcoDay>=16){
               out = 180;
          }
          if(currentIcoDay>=20){
               out = 170;
          }
          if(currentIcoDay>=23){
               out = 160;
          }
          if(currentIcoDay>=27){
               out = 150;
          }
          if(currentIcoDay>=29){
               out = 140;
          }
          return;
     }
}

contract DaoCasinoToken is SafeMath, StdToken, Crowdsale
{
// Events:
     event Buy(address indexed sender, uint eth, uint fbt);

// Fields:
     address public creator = 0x0;
     bool public isStop = false;
     uint256 public supply = 0;

// Functions:
     function DaoCasinoToken(uint startBlock_, uint endBlock_)  
     {
          creator = msg.sender;

          startBlock = startBlock_;
          endBlock = endBlock_;
     }

     // Do not allow transfers until freeze period is over
     function transfer(address _to, uint256 _value) returns (bool success) 
     {
          if((block.number <= endBlock) && (msg.sender!=creator)) {
               throw;
          }

          return super.transfer(_to, _value);
     }
     
     // Do not allow transfers until freeze period is over
     function transferFrom(address _from, address _to, uint256 _value) returns (bool success) 
     {
          if((block.number <= endBlock) && (msg.sender!=creator)) {
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
          supplyOut = supply;
          return;
     }

     function buyTokens()
     {
          if (msg.value==0) 
               throw;

          var to = msg.sender;
          uint tokens = safeMul(msg.value, getCurrentPrice(block.number));
          balances[to] = safeAdd(balances[to], tokens);
          supply = safeAdd(supply, tokens);

          //creator.call.value(msg.value)();

          Buy(to, msg.value, tokens);
     }

     /// This function is called when someone send money to this contract directly.
     function() 
     {
          throw;
     }
}
