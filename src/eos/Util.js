#! /usr/bin/env node

const config = require("./TaskConfig.js");
const EOSError = require("./EOSError.js");

class Util {
  constructor() {
  }


  static async exec(name, args, cwd, env) {
    const { spawn } = require("child_process");

    let options = {};
    if (cwd) {
      options.cwd = cwd;
    }

    if (env) {
      options.env = Object.assign({}, process.env, env);
    }

    const child = spawn(name, args, options);

    return new Promise((resolve, reject) => {
      let result = {
        stdout : "",
        stderr : "",
        code : 0
      };

      child.stdout.on("data", (data) => {
        result.stdout += data;
      });

      child.stderr.on("data", (data) => {
        result.stderr += data;
      });

      child.on("close", (code) => {
        result.code = code;
        resolve(result);
      });

      child.on("error", (error) => {
        reject(error);
      });
    });
  }


  static async execEOS(args, cwd, env) {
    return Util.exec(config.cleos, Util.appendArgs(args), cwd, env);
  }


  static createAddress() {
    const addrLen = 12; // EOS requires regular account name to be exactly 12 characters
    let allowed = "12345abcdefghijklmnopqrstuvwxyz";
    let address = "";

    for (let i = 0; i < addrLen; ++i) {
      address += allowed.charAt(Math.floor(Math.random() * allowed.length));
    }

    return address;
  }


  static getError(result) {
    let input = [ result.stdout, result.stderr ];
    for (let i = 0; i < input.length; ++i) {
      if (!input[i]) {
        continue;
      }

      let line = input[i].trim().split("\n", 1)[0];
      let match = line.match(/Error \d+:/g);
      if (match && match.length > 0) {
        return parseInt(match[0].substr("Error ".length, match[0].length - "Error ".length - 1));
      }
    }

    return null;
  }


  static hasWalletLockedError(result) {
    let error = Util.getError(result);
    return error === EOSError.WALLET_LOCKED || error === EOSError.ACCESS_DENIED;
  }


  static appendArgs(args) {
    if (!args) {
      return config.cleos_args;
    }

    return config.cleos_args.concat(args);
  }


  static async unlockWallet(account, password) {
    // TODO: put the password in temporary file and delete after usage instead of passing it through bash
    let result = await Util.execEOS([ "wallet", "open", "-n", account]);
    if (result.code !== 0) {
      return false;
    }

    result = await Util.execEOS([ "wallet", "unlock", "-n", account, "--password", password ]);
    return result.code === 0;
  }


  static async execEOSUnlock(args, account, password, cwd, env) {
    let result = await Util.execEOS(args, cwd, env);
    if (result.code !== 0) {
      if (Util.hasWalletLockedError(result)) {
        let unlocked = await Util.unlockWallet(account, password);
        if (unlocked) {
          result = await Util.execEOS(args, cwd, env);
        }
      }
    }

    return result;
  }


  static parseArg(arg) {
    try {
      return JSON.parse(arg);
    } catch (ex) {
      return arg;
    }
  }


  static toErrorJSON(result) {
    let rtn = {
      Type : "Error",
      Data : result
    };

    let code = Util.getError(result);
    if (code !== null) {
      rtn.Provider = "EOS";
      rtn.Code = code;
    }

    return JSON.stringify(rtn);
  }
}


module.exports = Util;