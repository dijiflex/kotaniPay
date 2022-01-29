// CElO init
const contractkit = require('@celo/contractkit');
const { privateToPublic, pubToAddress, toChecksumAddress } = require ('ethereumjs-util');
const bip39 = require('bip39-light');

const NODE_URL = 'https://celo-mainnet--rpc.datahub.figment.io/apikey/API_KEY/'; 
const kit = contractkit.newKit(NODE_URL);
kit.setFeeCurrency(contractkit.CeloContract.StableToken);
const web3 = kit.web3;

const impactUBI = require('../ABIs/ImpactUBI.json');

const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider(NODE_URL);
const axios = require("axios");
const moment = require('moment');

const trimLeading0x = (input) => (input.startsWith('0x') ? input.slice(2) : input);
const ensureLeading0x = (input) => (input.startsWith('0x') ? input : `0x${input}`);
const hexToBuffer = (input) => Buffer.from(trimLeading0x(input), 'hex');

exports.getContractKit = () => {
    return kit;
}

//CELOKIT FUNCTIONS
exports.getPublicAddress = async (mnemonic) => {
  let privateKey = await generatePrivKey(mnemonic);
  return new Promise(resolve => { 
      resolve (getAccAddress(getPublicKey(privateKey)));
  });
}

const generatePrivKey = async (mnemonic) => {
    return bip39.mnemonicToSeedHex(mnemonic).substr(0, 64);
}
exports.generatePrivKey = generatePrivKey;

const getPublicKey = (privateKey) => {
    let privToPubKey = hexToBuffer(privateKey);
    privToPubKey = privateToPublic(privToPubKey).toString('hex');
    privToPubKey = ensureLeading0x(privToPubKey);
    privToPubKey = toChecksumAddress(privToPubKey);
    return privToPubKey;
}

const getAccAddress = (publicKey) => {
    let pubKeyToAddress = hexToBuffer(publicKey);
    pubKeyToAddress = pubToAddress(pubKeyToAddress).toString('hex');
    pubKeyToAddress = ensureLeading0x(pubKeyToAddress);
    pubKeyToAddress = toChecksumAddress(pubKeyToAddress)
    return pubKeyToAddress;   
}

//0xe0c194103add2db24233f84e2ee7dd549fd79c39a0b23aa12b7b136a251ed304
exports.getTxAmountFromHash = async (hash) => {
  let _tx = await kit.web3.eth.getTransaction(hash);
  let amount = await weiToDecimal(_tx.value);
  console.log(amount);
  return amount;
}

const checksumAddress = (address) => {
  let checksumAddress = toChecksumAddress(address)
  return checksumAddress;   
}
exports.checksumAddress = checksumAddress;

const getTransactionBlock = async (txhash) => {
  let _res = await kit.web3.eth.getTransaction(txhash)
  return _res.blockNumber;
}
exports.getTransactionBlock = getTransactionBlock;

const weiToDecimal = async (valueInWei) => {
    return kit.web3.utils.fromWei(valueInWei.toString(), 'ether'); //value/1e+18 
    // return valueInWei/1e+18 ;
}
exports.weiToDecimal = weiToDecimal;

const decimaltoWei = async (valueInDecimal) => {
    return kit.web3.utils.toWei(valueInDecimal.toString(), 'ether'); //value*1e+18    
}
exports.decimaltoWei = decimaltoWei;

exports.sendcUSD = async (sender, receiver, cusdAmount, privatekey) => {        
  const cusdtoken = await kit.contracts.getStableToken()
  let cusdbalance = await cusdtoken.balanceOf(sender) // In cUSD
  let _cusdbalance = await weiToDecimal(cusdbalance)      //weiToDecimal(balance); 
  console.log('CUSD Balance: ',parseFloat(_cusdbalance, 4));

  //let _kesAmount = parseFloat(cusdAmount);
  //const oneGold = kit.web3.utils.toWei('1', 'ether')
  console.log('Amount transferred: ', cusdAmount)
  _cusdbalance = parseFloat(_cusdbalance, 4);
  if(cusdAmount < _cusdbalance){
    kit.addAccount(privatekey)
    // console.log(`${_cusdbalance} USD balance is sufficient to fulfil ${cusdAmount}`);
    let _cusdAmount = await decimaltoWei(`${parseFloat(cusdAmount, 4)}`);
    const tx = await cusdtoken.transfer(receiver, _cusdAmount).send({ from: sender, });

    const hash = await tx.getHash();
    const receipt = await tx.waitReceipt();
    // console.log('USD Transaction ID:..... ', JSON.stringify(hash));
    return receipt;
  }else{
    console.log('Insufficient CUSD Balance');
    return 'failed';
  }    
}

exports.approveTransferFrom = async (approvedAddress, approvedAmount, address, privatekey) => {
  try{
    kit.setFeeCurrency(contractkit.CeloContract.StableToken);
    kit.addAccount(privatekey);

    const cusdtoken = await kit.contracts.getStableToken();
    const approveTx = await cusdtoken.approve(approvedAddress, approvedAmount).send({ from: address })
    const approveReceipt = await approveTx.waitReceipt();
    return approveReceipt;
  }catch(e){
    console.log(e)
  }
};

exports.sendUBIClaim = async (sender, privatekey, UBISCADDRESS) => {
  // let impactMkt_KakumaCommunity_ContractAddress = "0x667973de162C7032e816041a1Eef42261901EbE3";
  let isBeneficiary = await checkIfBeneficiary(sender, UBISCADDRESS);
  if(isBeneficiary != 1){console.log('Not a valid beneficiary'); return {status: 'NOT_REGISTERED'}}
  let claimCountdown = await checkClaimCountdown(sender);
  let _timeStamp = moment().unix();
  console.log(`Beneficiary: ${sender} :: Last ClaimTime : ${claimCountdown} :: CurrentTime : ${_timeStamp} `);
  if(claimCountdown == 0){console.log('Invalid claim status'); return {'status': 'NOT_YET', 'claimTime': claimCountdown}}
  if(claimCountdown >= _timeStamp){console.log('Not yet time to claim'); return {'status': 'NOT_YET', 'claimTime': claimCountdown}}
  try {
      kit.addAccount(privatekey)
      // const tx = await cusdtoken.transfer(receiver, _cusdAmount).send({ from: sender, });
      let ubiContract = new web3.eth.Contract(
          impactUBI,
          UBISCADDRESS
      );

      // const receipt = await ubiContract.methods.claim().send({ from: sender });
      // console.log(`Impact Claim Transaction hash: ${receipt.transactionHash}`);
      
      const txObject = await ubiContract.methods.claim();
      let tx = await kit.sendTransactionObject(txObject, { from: sender });

      const hash = await tx.getHash();
      console.log('USD Transaction ID:..... ', JSON.stringify(hash));
      const receipt = await tx.waitReceipt();        
      // console.log('UBI Claim TxReceipt:..... ', JSON.stringify(receipt));
      return receipt;
      
  } catch (e) {
      console.log(e);
      return 'invalid';
  }
}

exports.checkIfBeneficiary = async (sender, UBISCADDRESS) => {
  try {
      let ubiContract = new web3.eth.Contract(
          impactUBI,
          UBISCADDRESS
      );

      let isBeneficiary =  await ubiContract.methods.beneficiaries(sender).call();
      return isBeneficiary;
  } catch (e) { console.log(e); return 'invalid'  }    
}

exports.addBeneficiary = async (manager, _beneficiary, privatekey, UBISCADDRESS) => {
  let isBeneficiary = await checkIfBeneficiary(_beneficiary, UBISCADDRESS);
  if(isBeneficiary == 1){console.log('Already added as a beneficiary'); return}
  
  try {
      kit.addAccount(privatekey)
      // const tx = await cusdtoken.transfer(receiver, _cusdAmount).send({ from: sender, });
      let ubiContract = new web3.eth.Contract(
          impactUBI,
          UBISCADDRESS
      );

      const receipt = await ubiContract.methods.addBeneficiary(_beneficiary).send({ from: manager });
      // console.log(`Transaction hash: ${receipt.transactionHash}`);
      
      // const txObject = await ubiContract.methods.addBeneficiary(_beneficiary);
      // let tx = await kit.sendTransactionObject(txObject, { from: manager });

      // const hash = await tx.getHash();
      // console.log('USD Transaction ID:..... ', JSON.stringify(hash));
      // const receipt = await tx.waitReceipt();        

      return {address: _beneficiary, txhash: receipt.transactionHash};
      
  } catch (e) {
      console.log(e);
      return 'invalid';
  }
}

exports.checkIfManager = async (signer, UBISCADDRESS) => {
  try {
      let ubiContract = new web3.eth.Contract(
          impactUBI,
          UBISCADDRESS
      );

      let isManager =  await ubiContract.methods.beneficiaries(signer).call();
      return isManager;
  } catch (e) { console.log(e); return 'invalid'  }    
}

exports.heckUbiScBalance = async (UBISCADDRESS) => {
  try {
      const stableToken =await kit._web3Contracts.getStableToken();
      let balanceOf =  await stableToken.methods.balanceOf(UBISCADDRESS).call();        
      return parseFloat(web3.utils.fromWei(balanceOf, 'ether')).toFixed(4);
  } catch (e) { console.log(e); return 'invalid' }    
}

exports.checkClaimCountdown = async (sender) => {
  try {
      let ubiContract = new web3.eth.Contract(
          impactUBI,
          UBISCADDRESS
      );

      let countdown =  await ubiContract.methods.cooldown(sender).call();
      return countdown;
  } catch (e) {
      console.log(e);
      return 'invalid';
  }    
}

exports.buyCelo = async (address, cusdAmount, privatekey) => {
  kit.setFeeCurrency(contractkit.CeloContract.StableToken);
  kit.addAccount(privatekey)

  const cusdtoken = await kit.contracts.getStableToken()
  const exchange = await kit.contracts.getExchange()

  cusdbalance = `${await cusdtoken.balanceOf(address)}`
  console.log(`CUSD Balance: ${kit.web3.utils.fromWei(cusdbalance)}`)

  const tx = await cusdtoken.approve(exchange.address, cusdAmount).send({ from: address, })
  // console.log(tx)
  const receipt = await tx.waitReceipt()
  // console.log(receipt)

  const celoAmount = `${await exchange.quoteUsdSell(cusdAmount)}`
  console.log(`You will receive ${kit.web3.utils.fromWei(celoAmount, 'ether')} CELO`)
  const buyCeloTx = await exchange.sellDollar(cusdAmount, celoAmount).send({ from: address, })
  const buyCeloReceipt = await buyCeloTx.waitReceipt()
  console.log(buyCeloReceipt)

  return {"celoAmount" : `${kit.web3.utils.fromWei(celoAmount, 'ether')}`, "symbol" : "CELO", "txid" : buyCeloReceipt };
}

exports.sellCelo = async (address, celoAmount, privatekey) => {
  kit.setFeeCurrency(contractkit.CeloContract.StableToken);
  kit.addAccount(privatekey)
  // const _amount = amount*1e+18    //kit.web3.utils.toWei(amount.toString(), 'ether')

  const celotoken = await kit.contracts.getGoldToken()
  const cusdtoken = await kit.contracts.getStableToken()
  const exchange = await kit.contracts.getExchange()
  
  const celobalance = `${await celotoken.balanceOf(address)}`
  console.log(`CELO Balance: ${kit.web3.utils.fromWei(celobalance, 'ether')}`)

  const tx = await celotoken.approve(exchange.address, celoAmount).send({ from: address, })
  // console.log(tx)
  const receipt = await tx.waitReceipt()
  // console.log(receipt)

  const cusdAmount = `${await exchange.quoteGoldSell(celoAmount)}`
  console.log(`You will receive ${kit.web3.utils.fromWei(cusdAmount)} CUSD`)
  const sellCeloTx = await exchange.sellGold(celoAmount, cusdAmount).send({ from: address, })
  const sellCeloReceipt = await sellCeloTx.waitReceipt()
  console.log(sellCeloReceipt)
  //}
}

// getLatestBlock().then(_res=>console.log(_res.number))
//working
exports.getLatestBlock = async () => {
  return await kit.web3.eth.getBlock('latest');
}

exports.sendCELO = async(sender, receiver, amount, privatekey) => {
    kit.addAccount(privatekey)
    const celotoken = await kit.contracts.getGoldToken()
    const balance = await celotoken.balanceOf(sender)

    let _balance = balance/1e+18;      //weiToDecimal(balance); 
    console.log('CELO Balance: ',_balance)
    _balance = parseFloat(_balance);
    if(amount < _balance){
      console.log(`${_balance} CELO balance is sufficient`);
      let _amount = await decimaltoWei(amount);
      const tx = await celotoken.transfer(receiver, _amount).send({ from: sender, });

      const hash = await tx.getHash();
      const receipt = await tx.waitReceipt();

      console.log('CELO Transaction ID:..... ', JSON.stringify(receipt.transactionHash));
      return receipt;
    }else{
      console.log('Insufficient CELO Balance');
      return 'failed';
    }
}

exports.validateWithdrawHash = async (hash, escrowAddress) => {
  try{
    const tx = await provider.getTransactionReceipt(hash);
    console.log('FROM: ',tx.from)
    
    let response  = await axios.get(`https://explorer.celo.org/api?module=account&action=tokentx&address=${tx.from}#`)
    // console.log(response.data.result.hash);
    let txhashes = response.data.result;
    var kotanitxns =  await txhashes.filter(function(txns) {
        return txns.hash == hash;
    });
    // console.log(kotanitxns);
    var tokotani =  await kotanitxns.filter(function(txns) {
        return txns.to == escrowAddress;
    });
    // console.log(JSON.stringify(tokotani));
    let txvalues = {
      "status" : "ok",
      "from" : tokotani[0].from,
      "to": tokotani[0].to,
      "value" : kit.web3.utils.fromWei(tokotani[0].value),
      "txblock" : tokotani[0].blockNumber
    };

    console.log(`Tx Values: `,JSON.stringify(txvalues));
    return txvalues;
      
  }catch(e){
    console.log("Cant process Invalid Hash");
    let txvalues = {
      "status" : "invalid",
      "message" : "Cant process Invalid Hash"
    }
    return txvalues;
  }
}

exports.getWithdrawerBalance = async (publicAddress) => {
  const cusdtoken = await kit.contracts.getStableToken();
  const cusdbalance = await cusdtoken.balanceOf(publicAddress); // In cUSD 
  //cUSDBalance = kit.web3.utils.fromWei(cUSDBalance.toString(), 'ether'); 
  let _cusdbalance = await weiToDecimal(cusdbalance);
  console.info(`Account balance of ${_cusdbalance} CUSD`);
  let cusdBalance = parseFloat(_cusdbalance).toFixed(4);
  console.log('Numeric Balance: ', cusdBalance)
  return cusdBalance;
}
