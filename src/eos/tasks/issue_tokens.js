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
    JSON.stringify([ account, `${amount.toFixed(config.symbol_precision)} ${config.symbol}`, memo ]),
    "-p",
    `${config.wallet_account}@active`
  ], config.wallet, config.wallet_password);

  if (result.code !== 0) {
    throw result;
  }

  return true;
};


async function run() {
  let args = parseArgs();

  return await issueTokens(
    Util.parseArg(args.account),
    args.amount,
    Util.parseArg(args.memo));
}


run().then(rtn => {
  console.log(JSON.stringify(rtn));
}).catch(ex => {
  console.error(Util.toErrorJSON(ex));
  process.exit(1);
});

