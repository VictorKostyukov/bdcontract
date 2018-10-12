#! /usr/bin/env node

const config = require("../TaskConfig.js");
const Util = require("../Util.js")


async function createKey() {
  let result = await Util.tryExecUnlock(config.cleos, [ "wallet", "create_key", "-n", config.wallet ]);
  if (result.code !== 0) {
    throw result;
  }

  let match = result.stdout.match(/\".+\"/g);
  if (!match || match.length < 1) {
    throw result;
  }

  return match[0].substr(1, match[0].length - 2);
}


async function run() {
  let pubKey = await createKey();
  let name = Util.createAddress();
  
  let result = await Util.tryExecUnlock(config.cleos, [ "create", "account", config.wallet_account, name, pubKey ]);
  if (result.code !== 0) {
    throw result;
  }

  return name;
}


run().then(name => {
  console.log(JSON.stringify(name));
}).catch(ex => {
  console.error(JSON.stringify({
    Type : "Error",
    Data : ex
  }));
  process.exit(1);
});