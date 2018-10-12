#! /usr/bin/env node

const TaskQueue = require("../scheduler/TaskQueue.js");
const except = require("./Exception.js");


function parseArgs() {
  const ArgumentParser = require("argparse").ArgumentParser;
  let parser = new ArgumentParser({
    version: "0.0.1",
    addHelp: true,
    description: "Drive EOS Bridge"
  });

  parser.addArgument(
    [ "-d", "--data" ],
    {
      help: "Data store location",
      defaultValue: "./.data"
    }
  );

  parser.addArgument(
    [ "-p", "--port" ],
    {
      help: "Port to listen on",
      defaultValue : 7810,
      type : "int"
    }
  );

  return parser.parseArgs();
}


async function initTaskQueue(file) {
  const path = require("path");
  if (!path.isAbsolute(file)) {
    file = path.join(__dirname, file);
  }

  global.g_taskQueue = new TaskQueue(file);

  let exitcb = function(sig) {
    g_taskQueue.stop(function() {
      console.log("Task queue closed successfully.");
      process.exit(0);
    });
  };

  process.once("SIGTERM", exitcb);
  process.once("SIGINT", exitcb);

  return await g_taskQueue.init();
}


function startWebService(port) {
  const ApiParser = require("./ApiParser.js");
  const apiParser = new ApiParser();
  apiParser.init();

  const express = require("express");
  const app = express();

  const bodyParser = require("body-parser");
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended : true }));

  const cookieParser = require("cookie-parser");
  app.use(cookieParser());

  let __call = async (type, action, args, request, response) => {
    const cls = require(`./api/${type}Api.js`);
    let api = new cls(request, response);
    if (action && action !== "") {
      let func = api[action];
      if (!func) {
        throw new except.NotSupportedException();
      }

      let declArgs = apiParser.getParameterList(api.constructor.name, action);
      let arglist = [];
      if (declArgs) {
        declArgs.forEach(name => { arglist.push(args[name]); });
      }

      return await func.apply(api, arglist);
    } else {
      return {
        Path : `eos://${type}`,
        Type : type
      };
    }
  };

  let __handler = (method, req, res) => {
    let handleError = ex => {
      res.json({
        Type : "Error",
        Code : ex.code ? ex.code : 1,
        Message : ex.message
      });
    };

    let parseUrl = uri => {
      let result = { url : uri };
      let components = uri.split("/"); // example: ["", "api", "eos", "type", "action"]
      if (components.length !== 5) {
        throw new except.InvalidArgumentException("uri");
      }

      result.type = components[3];
      result.action = components[4];

      if (result.action.startsWith("__") || (result.action.length > 0 && result.action[0].toUpperCase() !== result.action[0])) {
        throw new except.InvalidArgumentException("uri");
      }

      return result;
    };

    let parseArguments = () => {
      let normalize = function(obj) {
        let result = {};
        for (let name in obj) {
          try {
            result[name] = JSON.parse(obj[name]);
          } catch (ex) {
            result[name] = obj[name];
          }
        }
        return result;
      };
  
      let args = Object.assign({}, req.cookies, req.query);
  
      if (req.is("application/x-www-form-urlencoded")) {
        args = normalize(Object.assign(args, req.body));
      } else if (req.is("application/json")) {
        args = Object.assign(normalize(args), req.body);
      } else {
        args = normalize(args);
      }
  
      return args;
    };

    try {
      let uri = parseUrl(req.path);
      let args = parseArguments();
      let worker = async function() {
        let result = await method(uri.type, uri.action, args, req, res);
        if (!res.__customOutput) {
          res.json(result);
        }
        return true;
      };

      worker().catch(handleError);
    } catch(ex) {
      handleError(ex);
    }
  };

  app.all("/api/eos/*", (req, res) => { __handler(__call, req, res); });

  app.listen(port, () => {
    console.log("Server started.");
  });
}


function main() {
  let args = parseArgs();
  initTaskQueue(args.data)
    .then(() => {
      startWebService(args.port);
    })
    .catch(ex => {
      console.error(ex);
    });
}


main();