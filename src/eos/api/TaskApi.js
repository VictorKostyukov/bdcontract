#! /usr/bin/env node

const TaskManager = require("../TaskManager.js");
const except = require("../Exception.js");


class TaskApi {
  constructor(request, response) {
  }


  async GetResult(id, validateEOS) {
    if (!id || id === "") {
      throw new except.InvalidArgumentException("id");
    }

    if (typeof(validateEOS) === "undefined" || validateEOS === null) {
      validateEOS = true;
    }

    return await TaskManager.getTaskResult(id, validateEOS);
  }
}


module.exports = TaskApi;