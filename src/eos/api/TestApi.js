#! /usr/bin/env node

class TestApi {
  constructor(request, response) {
  }

  async Test(arg1, arg2) {
    return arg1 + arg2;
  }
}


module.exports = TestApi;