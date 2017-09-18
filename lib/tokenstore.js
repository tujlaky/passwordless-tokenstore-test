'use strict';

var expect = require('chai').expect;
var uuid = require('uuid');
var chance = new require('chance')();

/**
 * Runs the standardized tests for any TokenStore implementation
 * @param  {Object}   A new, completely initalized instance of the TokenStore
 * @param  {Function} function(done) Function that will be executed before 
 * every test (e.g. to setup demo records). done() has to be called after
 * all steps have been finalized
 * @param  {Function} function(done) Function that will be executed after 
 * every test (e.g. to clear all records). done() has to be called after
 * all steps have been finalized
 * @param  {Number} optional. Timeout in ms. Used as a baseline for all
 * timeout-sensitive tests to allow the testing of slower systems / DBs.
 * Defaults to 200.
 */
module.exports = function(TokenStoreFactory, beforeEachTest, afterEachTest, defaultTimeout) {
	defaultTimeout = defaultTimeout || 200;
	describe('General TokenStore tests (no need to modify)', function() {

		beforeEach(function(done) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeout;
			beforeEachTest(done);
		})

		afterEach(function(done) {
			afterEachTest(done);
		})

		describe('Tests', function() {
			describe('storeOrUpdate()', function() {
				it('should allow the storage of a new token', function () {
					expect(function() { TokenStoreFactory().storeOrUpdate(uuid(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {}) }).not.toThrow();
				})

				it('should allow the update of details if the same UID is provided', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token1 = uuid(), token2 = uuid();
					// Storage of first token for uid
					store.storeOrUpdate(token1, uid, 
						1000*60, 'http://www.example.com/alice', function(err) {
							expect(err).not.toBeDefined();

							// Update of uid with new details (incl. new token)
							store.storeOrUpdate(token2, uid, 
								1000*60, 'http://www.example.com/tom', function(err) {
									expect(err).not.toBeDefined();

									// the old token should not be valid anymore
									store.authenticate(token1, uid, function(err, valid, ret_ref) {
										expect(err).not.toBeDefined();
										expect(valid).toEqual(false);
										expect(ret_ref).not.toBeDefined();

										// but the new token should be valid and also return the new referrer
										store.authenticate(token2, uid, function(err, valid, ret_ref) {
											expect(err).not.toBeDefined();
											expect(valid).toEqual(true);
											expect(ret_ref).toEqual('http://www.example.com/tom')
											done();
										});
									})
								})
						});
				})

				it('should throw exceptions for missing data', function () {
					var store = TokenStoreFactory();
					expect(function() { store.storeOrUpdate('', chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {})}).toThrowError();
					expect(function() { store.storeOrUpdate(uuid(), '', 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {})}).toThrowError();
					expect(function() { store.storeOrUpdate(uuid(), chance.email(), 
						'', 'http://' + chance.domain() + '/page.html', function() {})}).toThrowError();
					expect(function() { store.storeOrUpdate(uuid(), chance.email(), 
						1000*60, '', function() {})}).not.toThrow();
					expect(function() { store.storeOrUpdate(uuid(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html')}).toThrowError();
				})

				it('should callback in the format of callback() in case of success', function (done) {
					TokenStoreFactory().storeOrUpdate(uuid(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function(err) {
							expect(err).not.toBeDefined();
							done();
						});
				})
			})

			describe('authenticate()', function() {
				it('should allow the authentication of a token / uid combination', function () {
					expect(function() { TokenStoreFactory().authenticate(uuid(), chance.email(),
						 function() {}) }).not.toThrow();
				})

				it('should throw exceptions for missing data', function () {
					var store = TokenStoreFactory();
					expect(function() { store.authenticate('', chance.email(), function() {})}).toThrowError();
					expect(function() { store.authenticate(uuid(), '', function() {})}).toThrowError();
					expect(function() { store.authenticate(uuid(), chance.email()) }).toThrowError();
					expect(function() { store.authenticate(uuid()) }).toThrowError();
				})

				it('should not authenticate a valid token for the wrong uid: callback(null, false, null)', function (done) {
					var store = TokenStoreFactory();
					var uid1 = chance.email(), uid2 = chance.email();
					var token1 = uuid(), token2 = uuid();
					var ref1 = 'http://www.example.com/path', ref2 = 'http://www.example.com/other';

					store.storeOrUpdate(token1, uid1, 
						1000*60, ref1, function(err) {
							expect(err).not.toBeDefined();

							store.storeOrUpdate(token2, uid2, 
								1000*60, ref2, function(err2) {
									expect(err2).not.toBeDefined();

									store.authenticate(token1, uid2, function(err, valid, ret_ref) {
										expect(err).not.toBeDefined();
										expect(valid).toEqual(false);
										expect(ret_ref).not.toBeDefined();
										done();
									})
								})
						});
				})

				it('should callback in the format of callback(null, true, referrer) in case of success', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid();
					var ref = 'http://www.example.com/path';

					store.storeOrUpdate(token, uid, 
						1000*60, ref, function(err) {
							expect(err).not.toBeDefined();

							store.authenticate(token, uid, function(err, valid, ret_ref) {
								expect(err).not.toBeDefined();
								expect(valid).toEqual(true);
								expect(ret_ref).toEqual(ref);
								done();
							})
						});
				})

				it('should callback in the format of callback(null, true, "") in case of a null referrer', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid();
					var ref = null;

					store.storeOrUpdate(token, uid, 
						1000*60, ref, function(err) {
							expect(err).not.toBeDefined();

							store.authenticate(token, uid, function(err, valid, ret_ref) {
								expect(err).not.toBeDefined();
								expect(valid).toEqual(true);
								expect(ret_ref).toEqual("");
								done();
							})
						});
				})

				it('should callback with callback(null, false, null) in case of an unknown token / uid', function (done) {
					TokenStoreFactory().authenticate(uuid(), chance.email(), function(err, valid, ret_ref) {
							expect(err).not.toBeDefined();
							expect(valid).toEqual(false);
							expect(ret_ref).not.toBeDefined();
							done();
						});
				})
			})

			describe('invalidateUser()', function() {
				it('should fail silently for uids that do not exist', function (done) {
					var store = TokenStoreFactory();
					store.invalidateUser(chance.email(), function(err) {
						expect(err).not.toBeDefined();
						done();
					});
				})

				it('should invalidate an existing user', function (done) {
					var store = TokenStoreFactory();
					var token = uuid();
					var uid = chance.email();
					store.storeOrUpdate(token, uid, 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {
							store.invalidateUser(uid, function(err) {
								expect(err).not.toBeDefined();
								store.authenticate(token, uid, function(err, valid, ref) {
									expect(err).not.toBeDefined();
									expect(valid).toEqual(false);
									expect(ref).not.toBeDefined();
									done();
								})
							})
						})
				})

				it('should throw exceptions for missing data', function () {
					var store = TokenStoreFactory();
					expect(function() { store.invalidateUser(chance.email())}).toThrowError();
					expect(function() { store.invalidateUser()}).toThrowError();
				})
			})

			describe('clear()', function() {
				it('should remove all data', function (done) {
					var store = TokenStoreFactory();
					store.storeOrUpdate(uuid(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {	
						store.storeOrUpdate(uuid(), chance.email(), 
							1000*60, 'http://' + chance.domain() + '/page.html', function() {
							store.clear(function(err) {
								expect(err).not.toBeDefined();
								store.length(function(err, length) {
									expect(err).not.toBeDefined();
									expect(length).toEqual(0);
									done();
								})
							})	
						})
					})
				})

				it('should run smoothly for an empty TokenStore', function (done) {
					var store = TokenStoreFactory();
					store.clear(function(err) {
						expect(err).not.toBeDefined();
						store.length(function(err, length) {
							expect(err).not.toBeDefined();
							expect(length).toEqual(0);
							done();
						})
					})
				})

				it('should throw exceptions for missing data', function () {
					var store = TokenStoreFactory();
					expect(function() { store.clear()}).toThrowError();
				})
			})

			describe('length()', function() {
				it('should return 0 for an empty TokenStore', function (done) {
					var store = TokenStoreFactory();
					store.length(function(err, count) {
						expect(count).toEqual(0);
						done();
					});
				})

				it('should return 2 after 2 tokens have been stored', function (done) {
					var store = TokenStoreFactory();
					store.storeOrUpdate(uuid(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {
							store.storeOrUpdate(uuid(), chance.email(), 
								1000*60, 'http://' + chance.domain() + '/page.html', function() {
									store.length(function(err, count) {
										expect(count).toEqual(2);
										done();
									});
								})
						});
				})
			})

			describe('flow', function() {
				it('should validate an existing token / uid combination', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, 1000*60, referrer, function(err) {
						expect(err).not.toBeDefined();
						store.authenticate(token, uid, function(error, valid, ref) {
							expect(valid).toEqual(true);
							expect(ref).toEqual(referrer);
							expect(error).not.toBeDefined();
							done()
						})
					})
				})

				it('should validate an existing token / uid several times if still valid', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, 1000*60, referrer, function(err) {
						expect(err).not.toBeDefined();
						store.authenticate(token, uid, function(error, valid, ref) {
							expect(valid).toEqual(true);
							expect(ref).toEqual(referrer);
							expect(error).not.toBeDefined();

							store.authenticate(token, uid, function(error, valid, ref) {
								expect(valid).toEqual(true);
								expect(ref).toEqual(referrer);
								expect(error).not.toBeDefined();
								done();
							})
						})
					})
				})

				it('should not validate a not existing token / uid combination', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, 1000*60, referrer, function(err) {
						expect(err).not.toBeDefined();
						store.authenticate(uuid(), uid, function(error, valid, ref) {
							expect(valid).toEqual(false);
							expect(ref).not.toBeDefined();
							expect(error).not.toBeDefined();
							done();
						})
					})
				})

				it('should not validate a token / uid combination which time has run up', function (done) {
          jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeout * 10;
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, defaultTimeout, referrer, function(err) {
						expect(err).not.toBeDefined();

						setTimeout(function() {
							store.authenticate(token, uid, function(error, valid, ref) {
								expect(valid).toEqual(false);
								expect(ref).not.toBeDefined();
								expect(error).not.toBeDefined();
								done();
							})					
						}, defaultTimeout*2);
					})
				})

				it('should validate token/uid if still valid, but not validate anymore if time has run up', function (done) {
          jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeout * 10;

					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, defaultTimeout, referrer, function(err) {
						expect(err).not.toBeDefined();

						store.authenticate(token, uid, function(error, valid, ref) {
							expect(valid).toEqual(true);
							expect(ref).toEqual(referrer);
							expect(error).not.toBeDefined();

							setTimeout(function() {
								store.authenticate(token, uid, function(error, valid, ref) {
									expect(valid).toEqual(false);
									expect(ref).not.toBeDefined();
									expect(error).not.toBeDefined();
									done();
								})					
							}, defaultTimeout*2);
						})
					})
				})

				it('should allow the extension of time for a token/uid combination', function (done) {
          jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeout * 10;
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token1 = uuid(), token2 = uuid();
					var referrer = 'http://' + chance.domain() + '/page.html';
					// First storage of a token for uid
					store.storeOrUpdate(token1, uid, defaultTimeout, referrer, function(err) {
						expect(err).not.toBeDefined();

						// should authenticate
						store.authenticate(token1, uid, function(error, valid, ref) {
							expect(valid).toEqual(true);
							expect(ref).toEqual(referrer);
							expect(error).not.toBeDefined();

							// update of uid token with a new one, which is valid for much longer
							store.storeOrUpdate(token2, uid, defaultTimeout*5*60, referrer, function(err) {
								expect(err).not.toBeDefined();

								// authenticate with the new token after 200ms which is beyond the validity of token1
								setTimeout(function() {
									store.authenticate(token2, uid, function(error, valid, ref) {
										expect(valid).toEqual(true);
										expect(ref).toEqual(referrer);
										expect(error).not.toBeDefined();

										// ... but token1 shouldn't work anymore
										store.authenticate(token1, uid, function(error, valid, ref) {
											expect(valid).toEqual(false);
											expect(ref).not.toBeDefined();
											expect(error).not.toBeDefined();
											done();
										})	
									})					
								}, defaultTimeout*2);
							})
						})
					})
				})
			})
		})
	})
};
