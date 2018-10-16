#! /usr/bin/env node

const TaskManager = require("../TaskManager.js");


class TaskApi {
  constructor(request, response) {
  }


  async GetResult(id, validateEOS) {
    if (typeof(validateEOS) === "undefined" || validateEOS === null) {
      validateEOS = true;
    }

    return await TaskManager.getTaskResult(id, validateEOS);
  }
}


module.exports = TaskApi;