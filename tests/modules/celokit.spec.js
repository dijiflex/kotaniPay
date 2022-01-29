var assert = require('chai').assert;
var celokit =  require('../../modules/celokit');

var expect = require('chai').expect;
var should = require('chai').should();

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised).should();


describe('Celokit', () => {

  describe('weiToDecimal', () => {
    it('weiToDecimal should return value in Decimal', async () => {
      var valueInDecimal = await celokit.weiToDecimal('2500000000000000000');
      assert.equal(valueInDecimal, 2.5);
    });
  });

  describe('decimalToWei', () => {
    it('decimalToWei should return value in Wei', async () => {
        var valueInWei = await celokit.decimaltoWei('2.5');
        assert.equal(valueInWei, '2500000000000000000');
    });
  });

  describe('getTxAmountFromHash', () => {
    it('getTxAmountFromHash should return Amount transfered in a tx', async () => {
        let txhash = '0xe0c194103add2db24233f84e2ee7dd549fd79c39a0b23aa12b7b136a251ed304';
        let amount = await celokit.getTxAmountFromHash(txhash);
        assert.equal(amount, 52.355);
    });
  });

});
