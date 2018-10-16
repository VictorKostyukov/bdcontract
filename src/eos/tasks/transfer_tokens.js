#! /usr/bin/env node

const config = require("../TaskConfig.js");
const Util = require("../Util.js");


function parseArgs() {
  const ArgumentParser = require("argparse").ArgumentParser;
  let parser = new ArgumentParser({
    version: "0.0.1",
    addHelp: true,
    description: "DRV Get Balance Task"
  });

  parser.addArgument(
    [ "--from" ],
    {
      help: "From account name"
    }
  );

  parser.addArgument(
    [ "--to" ],
    {
      help: "To account name"
    }
  );

  parser.addArgument(
    [ "--amount" ],
    {
      help: "Amount of tokens to transfer",
      type: "float"
    }
  );

  parser.addArgument(
    [ "--memo" ],
    {
      help: "Memo for this transfer",
      defaultValue: "transfer"
    }
  );

  parser.addArgument(
    [ "--authorization" ],
    {
      help: "Authorized by account",
      defaultValue: ""
    }
  );

  return parser.parseArgs();
}


async function transferTokens(from, to, amount, memo, authorization) {
  let result = await Util.execEOSUnlock([
    "push",
    "action",
    config.token_contract,
    config.action_transfer,
    JSON.stringify([ from, to, `${amount.toFixed(config.symbol_precision)} ${config.symbol}`, memo]),
    "-p",
    `${authorization}@active`
  ]);

  if (result.code !== 0) {
    throw result;
  }

  return true;
}


async function run() {
  let args = parseArgs();
  let authorization = args.authorization;
  if (authorization === "") {
    authorization = args.from;
  }

  return await transferTokens(
    Util.parseArg(args.from),
    Util.parseArg(args.to),
    args.amount,
    Util.parseArg(args.memo),
    Util.parseArg(authorization));
}


run().then(rtn => {
  console.log(JSON.stringify(rtn));
}).catch(ex => {
  console.error(JSON.stringify({
    Type : "Error",
    Data : ex
  }));
  process.exit(1);
});

