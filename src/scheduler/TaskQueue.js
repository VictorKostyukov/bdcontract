#! /usr/bin/env node

const Queue = require("better-queue");
const Task = require("./Task.js");
const Cache = require("persistent-cache");

class TaskQueue {
  constructor(dir) {
    this._path = dir;
    this._queue = null;
    this._activeCount = 0;
    this._initialized = false;
    this._stopCallback = null;
    this._cache = null;
  }


  get path() {
    return this._path;
  }


  get initialized() {
    return this._initialized;
  }


  init() {
    const mkdirp = require("mkdirp");
    const Path = require("path");
    mkdirp(this._path);

    this._cache = cache({
      base : this._path,
      name : "tasks",
      duration : 3600 * 1000 // one hour
    });

    this._queue = new Queue((input, cb) => {
      this.__onProcessTask(input)
        .then(result => {
          cb(null, result);
        })
        .catch(ex => {
          cb(ex, null);
        });
    }, {
      store : {
        type : "sql",
        dialect : "sqlite",
        path : Path.join(this._path, "tasks.sqlite")
      },
      maxTimeout : 60000
    });

    this._queue.on("task_started", () => {
      ++this._activeCount;
    });

    let oncomplete = () => {
      if (--this._activeCount === 0) {
        this.__onStopped();
      }
    };

    this._queue.on("task_finish", (taskId, result, stats) => {
      this._cache.put(taskId, result);
      oncomplete();
    });

    this._queue.on("task_failed", (taskId, err, stats) => {
      this._cache.put(taskId, { Type : "Error", Data : err });
      oncomplete();
    });

    this._initialized = true;
  }


  add(task, onsuccess, onerror) {
    if (!task.id) {
      task.id = require("shortid").generate();
    }

    this._queue.push(task)
      .on("finish", (result) => {
        if (onsuccess) {
          onsuccess(result);
        }
      })
      .on("failed", (err) => {
        if (onerror) {
          onerror(err);
        }
      });
    
    return task.id;
  }


  getResult(id) {
    return this._cache.getSync(id);
  }


  stop(onstopped) {
    this._stopCallback = onstopped;

    if (!this._initialized) {
      this.__onStopped();
    } else {
      this._queue.pause();
      if (this._activeCount === 0) {
        this.__onStopped();
      }
    }
  }


  async __onProcessTask(definition) {
    let task = Task.create(definition);
    return task.execute();
  }


  __onStopped() {
    if (this._stopCallback) {
      let cb = this._stopCallback;
      this._stopCallback = null;
      cb();
    }
  }
}


module.exports = TaskQueue