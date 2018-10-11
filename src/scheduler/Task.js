#! /usr/bin/env node

class Task {
  constructor(definition) {
    this._definition = definition;
  }


  get definition() {
    return this._definition;
  }


  async execute() {
    throw Error("Not Implemented");
  }


  static create(definition) {
    switch (definition.type) {
      case "bash":
        return new BashTask(definition);

      default:
        throw new Error("Not Supported");
    }
  }
}


class BashTask extends Task {
  constructor(definition) {
    super(definition);
  }


  async execute() {
    const { spawn } = require("child_process");

    let cmd = this.definition.cmd;
    let args = this.definition.args;
    if (typeof(args) === "undefined") {
      args = [];
    }

    let options = {};
    if (this.definition.cwd) {
      options.cwd = this.definition.cwd;
    }

    if (this.definition.env) {
      options.cwd = Object.assign({}, process.env, this.definition.env);
    }

    const child = spawn(cmd, args, options);

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
        if (resolve) {
          resolve(result);
        }
      });
    });
  }
}


module.exports = Task;