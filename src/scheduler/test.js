#! /usr/bin/env node

const TaskQueue = require("./TaskQueue.js");

let queue = null;

function parseArgs() {
  const ArgumentParser = require("argparse").ArgumentParser;
  let parser = new ArgumentParser({
    version: "0.0.1",
    addHelp: true,
    description: "Drive Job Scheduler Test"
  });

  parser.addArgument(
    [ "--data" ],
    {
      help: "Data store location",
      defaultValue: "./.data"
    }
  );

  return parser.parseArgs();
}


function main() {
  let args = parseArgs();

  queue = new TaskQueue(__dirname + "/" + args.data);

  let exitcb = function(sig) {
    queue.stop(function() {
      console.log("Task queue closed successfully.");
      process.exit(0);
    });
  };

  process.once("SIGTERM", exitcb);
  process.once("SIGINT", exitcb);

  queue.init();

  queue._queue.on("task_finish", (id, result, stats) => {
    console.log("Complete: " + id);
    console.log(result.stdout);
  });

  queue._queue.on("task_failed", (id, err, stats) => {
    console.log("Failed: " + id);
    console.log(err);
  });

  for (let i = 0; i < 3; ++i) {
    queue.add({
      type : "bash",
      cmd : "ping",
      args : [ "-c", "5", "127.0.0.1" ]
    }, (result) => {
//      console.log("Task complete.");
//      console.log(result.stdout);
    });
  }

  console.log("All tasks added");
}


main();