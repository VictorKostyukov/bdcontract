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
    [ "--account" ],
    {
      help: "Account name"
    }
  );

  parser.addArgument(
    [ "--amount" ],
    {
      help: "Amount of tokens to issue",
      type: "float"
    }
  );

  parser.addArgument(
    [ "--memo" ],
    {
      help: "Memo text",
      defaultValue: "issue"
    }
  );

  return parser.parseArgs();
}


async function issueTokens(account, amount, memo) {
  let result = await Util.execEOSUnlock([
    "push",
    "action",
    config.token_contract,
    config.action_issue,
    JSON.stringify([ account, `${amount} ${config.symbol}`, memo ]),
    "-p",
    `${config.wallet_account}@active`
  ]);

  if (result.code !== 0) {
    throw result;
  }

  return true;
};


async function run() {
  let args = parseArgs();
  return await issueTokens(args.account, args.amount, args.memo);
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

