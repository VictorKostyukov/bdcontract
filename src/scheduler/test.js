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

  let start  = async () => {
    await queue.init();

    let id = await queue.add({
      type : "bash",
      cmd : "ping",
      args : [ "-c", "5", "127.0.0.1" ]
    });

    let checkStatus = () => {
      let worker = async () => {
        let result = await queue.getResult(id);
        if (result.status === "success" || result.status === "failed") {
          console.log(result.output);
        } else {
          setTimeout(checkStatus, 500);
        }
      };

      worker().catch(ex => { console.error(ex); });
    };

    checkStatus();
  };

  start().catch(ex => { console.error(ex); });
}


main();