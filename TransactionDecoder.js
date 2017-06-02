const assert = require('assert');

/**
 * Based on bitcoinjs-lib@1.7.5
 */
class TransactionDecoder {
  constructor (hex) {
    this._offset = 0;
    this._buffer = new Buffer(hex, 'hex');

    this._id = null;
    this._version = 1;
    this._vins = [];
    this._vouts =[];
  }

  decode () {
    this._version = this._getVersion();
    this._vins = this._getInputs();
    this._vouts = this._getOutputs();
    this._id = this._getId();
    return {
      txId: this._id,
      version: this._version,
      vins: this._vins,
      vouts: this._vouts
    }
  };

  // TODO:
  _getId() {
    return null;
  }

  /**
   * Handle scripts for coinbase and non-coinbase tx's
   * @returns {*}
   * @private
   */
  _readScript () {
    const scriptHash = this._readSlice(this._readVarInt());
    return scriptHash;
  }

  /**
   * https://bitcoin.org/en/developer-reference#outpoint
   * @returns {{}}
   */
  _getInput () {
    const hash = this._readSlice(32);
    const index = this._readUInt32();
    const script = this._readScript();
    const secuence = this._readUInt32();

    return { hash, index, script, secuence };
  }

  _getInputs () {
    let inputs = [];
    const vinLen = this._readVarInt();
    // Get each input
    for(let i = 0; i < vinLen; i++) {
      let input = this._getInput();
      inputs.push(input);
    }
    return inputs;
  }

  _getOutputs () {
    let outputs = [];
    const voutLen = this._readVarInt();
    for(let i = 0; i < voutLen; i++) {
      outputs.push(this._getOutput());
    }
    return outputs;
  }

  _getOutput () {
    const value = this._readUInt64();
    const script = this._readScript();
    return { value, script };
  }

  /**
   * Version no, 4 bytes
   * @returns {*}
   */
  _getVersion () {
    return this._readUInt32();
  }

  /**
   * Buffer helpers
   */
  _readUInt64 () {
    const i = this._readUInt64LE(this._buffer, this._offset);
    this._offset += 8;
    return i;
  }

  _readUInt32 () {
    const i = this._buffer.readUInt32LE(this._offset);
    this._offset += 4;
    return i
  }

  _readVarInt () {
    const vi = this._varInt(this._buffer, this._offset);
    this._offset += vi.size;
    return vi.number;
  }

  _readSlice (n) {
    this._offset += n;
    return this._buffer.slice(this._offset - n, this._offset);
  }

  // From buffer utils
  // Specification https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer
  _varInt (buffer, offset) {
    let t = buffer.readUInt8(offset);
    let number, size

    // 8 bit
    if (t < 253) {
      number = t;
      size = 1

    // 16 bit
    } else if (t < 254) {
      number = buffer.readUInt16LE(offset + 1);
      size = 3

    // 32 bit
    } else if (t < 255) {
      number = buffer.readUInt32LE(offset + 1);
      size = 5

    // 64 bit
    } else {
      number = this._readUInt64LE(buffer, offset + 1);
      size = 9
    }

    return {
      number: number,
      size: size
    }
  }

  _readUInt64LE (buffer, offset) {
    var a = buffer.readUInt32LE(offset);
    var b = buffer.readUInt32LE(offset + 4);
    b *= 0x100000000;

    this._verifuint(b + a, 0x001fffffffffffff);

    return b + a
  }

  // https://github.com/feross/buffer/blob/master/index.js#L1127
  _verifuint (value, max) {
    assert(typeof value === 'number', 'cannot write a non-number as a number');
    assert(value >= 0, 'specified a negative value for writing an unsigned value');
    assert(value <= max, 'value is larger than maximum value for type');
    assert(Math.floor(value) === value, 'value has a fractional component');
  }

}

module.exports = TransactionDecoder;
