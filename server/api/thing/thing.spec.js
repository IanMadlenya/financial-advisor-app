'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /api/things', function() {

  /*
   * Test needs to be updated, as this is no longer true.
   * Should get 401 when accessing /api/things when not 
   * authenticated.
   */
  /*
  it('should respond with JSON array', function(done) {
    request(app)
      .get('/api/things')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array);
        done();
      });
  });
  */
});
