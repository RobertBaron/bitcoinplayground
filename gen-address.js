/* How to create Bitcoin Address
 * https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses
 */
const crypto = require('crypto');
const ecurve = require('ecurve');
const BigInteger = require('bigi');
const bs58 = require('bs58');

const ecparams = ecurve.getCurveByName('secp256k1');

// 0 - Having a private ECDSA key
const privateKey = crypto.randomBytes(65);
const curvePt = ecparams.G.multiply(BigInteger.fromBuffer(privateKey));
console.log("0", privateKey.toString('hex'));

// 1 - Take the corresponding public key generated with it (65 bytes, 1 byte 0x04, 32 bytes corresponding to X coordinate, 32 bytes corresponding to Y coordinate)
const x = curvePt.affineX.toBuffer(32);
const y = curvePt.affineY.toBuffer(32);

const publicKey = Buffer.concat([new Buffer([0x04]), x, y]);
console.log("1", publicKey.toString('hex'));

// 2 - Perform SHA-256 hashing on the public key
const sha = crypto.createHash('sha256').update(publicKey).digest();
console.log("2", sha.toString('hex'));

// 3 - Perform RIPEMD-160 hashing on the result of SHA-256
const pubkeyHash =  crypto.createHash('rmd160').update(sha).digest();
console.log("3", pubkeyHash.toString('hex'));

// 4 - Add version byte in front of RIPEMD-160 hash (0x00 for Main Network)
const pubkeyHashWithVersion = new Buffer.concat([new Buffer([0x00]), pubkeyHash]);
console.log("4", pubkeyHashWithVersion.toString('hex'));

// 5 - Perform SHA-256 hash on the extended RIPEMD-160 result
const shaExtended = crypto.createHash('sha256').update(pubkeyHashWithVersion).digest();
console.log("5", shaExtended.toString('hex'));

// 6 - Perform SHA-256 hash on the result of the previous SHA-256 hash
const shaExtended2 = crypto.createHash('sha256').update(shaExtended).digest();
console.log("6", shaExtended2.toString('hex'));

// 7 - Take the first 4 bytes of the second SHA-256 hash. This is the address checksum
const addressChecksum = shaExtended2.slice(0, 4);
console.log("7", addressChecksum.toString('hex'));

// 8 - Add the 4 checksum bytes from stage 7 at the end of extended RIPEMD-160 hash from stage 4. This is the 25-byte binary Bitcoin Address.
const binary =  Buffer.concat([pubkeyHashWithVersion, addressChecksum]);
console.log("8", binary.toString('hex'));

// 9 - Convert the result from a byte string into a base58 string using Base58Check encoding. This is the most commonly used Bitcoin Address format
const out = bs58.encode(binary);
console.log("9", out);
