#! /usr/bin/env node

const confFile = "../../config/eos.conf";

class TaskConfig {
  constructor() {
    this._config = {
      cleos : "cleos",
      symbol : "SYS",
      wallet : "default",
      wallet_password : "PW5JnDVPytL3DyHxCp2zVD3dADat7gzYDS2LfRuxaEVdr6JCPrgBj",
      wallet_account : "eosio"
    };

    TaskConfig.loadConfig()
      .then(obj => {
        this._config = Object.assign({}, this._config, obj);
      })
      .catch(ex => {
        console.warn("Failed to load eos.conf. Use default configurations.");
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


let config = new TaskConfig().config;

module.exports = config;