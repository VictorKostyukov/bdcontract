#! /usr/bin/env node

const confFile = "../../config/eos.conf";

class TaskConfig {
  constructor() {
    this._config = {
      cleos : "docker",
      symbol : "SYS",
      cleos_args : [ "exec", "eosio", "/opt/eosio/bin/cleos", "--url", "http://127.0.0.1:7777", "--wallet-url", "http://127.0.0.1:5555" ],
      wallet : "default",
      wallet_password : "PW5JnDVPytL3DyHxCp2zVD3dADat7gzYDS2LfRuxaEVdr6JCPrgBj",
      wallet_account : "eosio",
      token_contract : "eosio.token",
      action_issue: "issue",
      action_transfer: "transfer"
    };

    TaskConfig.loadConfig()
      .then(obj => {
        this._config = Object.assign({}, this._config, obj);
      })
      .catch(ex => {
      });
  }


  get config() {
    return this._config;
  }


  static async loadConfig() {
    return new Promise((resolve, reject) => {
      const fs = require("fs");
      const path = require("path");
      let obj = {};
      fs.readFile(path.join(__dirname, confFile), "utf8", (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            obj = JSON.parse(data);
            resolve(obj);
          } catch (ex) {
            reject(ex);
          }
        }
      });
    });
  }
}


var config = new TaskConfig().config;

module.exports = config;