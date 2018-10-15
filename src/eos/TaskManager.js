#! /usr/bin/env node

const except = require("./Exception.js");


class TaskManager {
  constructor() {
  }


  static async addTask(name, args) {
    let argsArr = [];

    const path = require("path");
    argsArr.push(path.join(__dirname, "tasks", `${name}.js`));

    if (args) {
      for (let key in args) {
        argsArr.push(`--${key}`);
        argsArr.push(JSON.stringify(args[key]));
      }
    }

    const definition = {
      type : "bash",
      cmd : "node",
      args : argsArr,
      cwd : path.join(__dirname, "tasks")
    };

    return await g_taskQueue.add(definition);
  }


  static async getTask(id) {
    return await g_taskQueue.getResult(id);
  }


  static async getAndVerifyTask(id) {
    let task = await TaskManager.getTask(id);
    if (!task) {
      throw new except.ObjectNotFoundException();
    }

    if (task.status === "failed") {
      throw new except.TaskFailureException(task.output);
    } else if (task.status !== "success") {
      throw new except.TaskNotCompleteException();
    }

    return task;
  }


  static async createTask(name, args) {
    let taskId = await TaskManager.addTask(name, args);
    return {
      Type : "Task",
      Id : taskId
    };
  }


  static async getTaskResult(id) {
    let task = await TaskManager.getAndVerifyTask(id);
    if (task.output.code !== 0) {
      throw new except.TaskFailureException(JSON.parse(task.output.stderr));
    }

    return JSON.parse(task.output.stdout);
  }
}


module.exports = TaskManager;