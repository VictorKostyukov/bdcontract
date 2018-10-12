#! /usr/bin/env node

const Queue = require("better-queue");
const Task = require("./Task.js");
const cache = require("node-persist");

const defaultTTL = 30 * 60 * 1000;

class TaskQueue {
  constructor(dir) {
    this._path = dir;
    this._queue = null;
    this._activeCount = 0;
    this._initialized = false;
    this._stopCallback = null;
  }


  get path() {
    return this._path;
  }


  get initialized() {
    return this._initialized;
  }


  async init() {
    const mkdirp = require("mkdirp");
    const Path = require("path");
    mkdirp(this._path);

    const cacheDir = Path.join(this._path, "tasks.cache");
    mkdirp(cacheDir);

    await cache.init({
      dir : cacheDir,
      ttl : defaultTTL,
      forgiveParseErrors: true
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
      let handler = async () => {
        try {
          let task = await cache.getItem(taskId);
          if (!task) {
            task = { id : taskId };
          } else {
            await cache.removeItem(taskId);
          }

          task.__status = "success";
          task.__output = result;
          await cache.setItem(taskId, task, { ttl : defaultTTL });
        } catch (ex) {
          console.error(ex);
        }

        oncomplete();
      };

      handler().catch(ex => { console.error(ex); });
    });

    this._queue.on("task_failed", (taskId, err, stats) => {
      let handler = async () => {
        try {
          let task = await cache.getItem(taskId);
          if (!task) {
            task = { id : taskId };
          } else {
            await cache.removeItem(taskId);
          }

          task.__status = "failed";
          task.__output = err;
          await cache.setItem(taskId, task, { ttl : defaultTTL });
        } catch (ex) {
          console.error(ex);
        }

        oncomplete();
      };

      handler().catch(ex => { console.error(ex); });
    });

    this._initialized = true;
  }


  async add(task, onsuccess, onerror) {
    if (!task.id) {
      task.id = require("shortid").generate();
    }

    await cache.setItem(task.id, task, { ttl : defaultTTL });

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

  
  async getResult(id) {
    let task = await cache.getItem(id);
    if (!task) {
      return undefined;
    }

    if (task.__status) {
      return {
        task : task,
        status : task.__status,
        output : task.__output
      };
    } else {
      return {
        task : task,
        status : "ongoing"
      };
    }
  }


  async isComplete(id) {
    let task = await cache.getItem(id);
    if (!task) {
      return undefined;
    }

    if (task.__status) {
      return true;
    } else {
      return false;
    }
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