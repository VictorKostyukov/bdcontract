#! /usr/bin/env node

const TaskManager = require("../TaskManager.js");
const except = require("../Exception.js");

class AccountApi {
  constructor(request, response) {
  }


  async NewAccount() {
    let taskId = await TaskManager.addTask("create_account");
    return {
      Type : "Task",
      Id : taskId
    };
  }


  async GetNewAccountResult(id) {
    let task = await TaskManager.getAndVerifyTask(id);
    return JSON.parse(task.output);
  }
}


module.exports = AccountApi;