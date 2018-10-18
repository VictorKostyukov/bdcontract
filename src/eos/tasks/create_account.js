#! /usr/bin/env node

const config = require("../TaskConfig.js");
const Util = require("../Util.js");
const EOSError = require("../EOSError.js");


async function createWallet(name) {
  let result = await Util.execEOS([ "wallet", "create", "-n", name, "--to-console" ]);
  if (result.code === 0) {
    var lines = result.stdout.split("\n");
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].startsWith('"') && lines[i].endsWith('"')) {
        return lines[i].substr(1, lines[i].length - 2);
      }
    }
  }

  throw result;
}


async function createKeyPair() {
  let result = await Util.execEOS([ "create", "key", "--to-console" ]);
  if (result.code !== 0) {
    throw result;
  }

  let lines = result.stdout.split("\n");
  let rtn = {};
  for (let i = 0; i < lines.length; ++i) {
    let parts = lines[i].split(":");
    if (parts.length !== 2) {
      continue;
    }

    if (parts[0] === "Private key") {
      rtn.privateKey = parts[1].trim();
    } else if (parts[0] === "Public key") {
      rtn.publicKey = parts[1].trim();
    }
  }

  return rtn;
}


async function importKey(key, wallet, password) {
  let result = await Util.execEOSUnlock([ "wallet", "import", "--private-key", key, "-n", wallet ], wallet, password);
  if (result.code !== 0) {
    throw result;
  }

  return true;
}


async function createAccount(name, ownerKey, activeKey) {
  // TODO: add more options to stake tokens for CPU and net, and buy rams
  let result = await Util.execEOSUnlock([ "create", "account", config.wallet_account, name, ownerKey, activeKey ], config.wallet, config.wallet_password);
  if (result.code !== 0) {
    throw result;
  }

  return true;
}


async function run() {
  let ownerKeyPair = await createKeyPair();
  let activeKeyPair = await createKeyPair();

  let password = null;
  let name = null;

  while (!password) {
    try {
      name = Util.createAddress();
      password = await createWallet(name);
      await Util.unlockWallet(name, password);
      await importKey(activeKeyPair.privateKey, name, password);
      await createAccount(name, ownerKeyPair.publicKey, activeKeyPair.publicKey);
    } catch (err) {
      let code = Util.getError(err);
      if (code !== EOSError.WALLET_ALREADY_EXIST && code !== EOSError.ACCOUNT_ALREADY_EXIST) {
        throw err;
      }
    }
  }

  return {
    name : name,
    password : password,
    owner : ownerKeyPair.privateKey
  };
}


run().then(name => {
  console.log(JSON.stringify(name));
}).catch(ex => {
  console.error(Util.toErrorJSON(ex));
  process.exit(1);
});
