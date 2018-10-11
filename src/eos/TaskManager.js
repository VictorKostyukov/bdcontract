#! /usr/bin/env node

class TaskManager {
  constructor() {
  }


  static addTask(name, args) {
    let argsArr = [];

    const path = require("path");
    argsArr.push(path.join(__dirname, "..", "tasks", `${name}.js`));

    for (let key in args) {
      argsArr.push(`--${key}`);
      argsArr.push(JSON.stringify(args[key]));
    }

    const definition = {
      id : require("shortid").generate(),
      type : "bash",
      cmd : "node",
      args : argsArr,
      cwd : path.join(__dirname, "../tasks")
    };

  }
}


module.exports = TaskManager;