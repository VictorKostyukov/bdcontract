#! /usr/bin/env node

const config = require("../TaskConfig.js");
const Util = require("../Util.js");


function parseArgs() {
  const ArgumentParser = require("argparse").ArgumentParser;
  let parser = new ArgumentParser({
    version: "0.0.1",
    addHelp: true,
    description: "DRV Get Transfer History Task"
  });

  parser.addArgument(
    [ "--account" ],
    {
      help: "Account name"
    }
  );

  parser.addArgument(
    [ "--pos" ],
    {
      help: "End Position",
      type: "int",
      defaultValue: -1
    }
  );

  parser.addArgument(
    [ "--limit" ],
    {
      help: "Action limit",
      type: "int",
      defaultValue: 20
    }
  );

  return parser.parseArgs();
}


async function getActions(account, pos, offset) {
  let result = await Util.execEOS([ "get", "actions", account, pos, offset, "-j" ]);
  if (result.code !== 0) {
    throw result;
  }

  if (result.stdout === "") {
    return 0;
  }

  let rtn = [];
  let actions = JSON.parse(result.stdout).actions;
  if (actions.length === 0) {
    return rtn; 
  }

  for (let i = actions.length - 1; i >= 0; --i) {
    let trace = actions[i].action_trace;
    if (trace.act.account !== config.token_contract ||
        (trace.act.data.from !== account && trace.act.data.to !== account) ||
        trace.act.data.to !== trace.receipt.receiver) {
      // This is an action signed by this account but not the actual transfer transaction
      continue;
    }

    let obj = {
      Id : actions[i].account_action_seq,
      Time : Math.floor(new Date(actions[i].block_time) / 1000),
      From : trace.act.data.from,
      To : trace.act.data.to,
      Amount : trace.act.data.quantity
    };

    rtn.push(obj);
  }

  return rtn;
}


function getOffset(pos, limit) {
  if (limit < config.min_action_history) {
    limit = config.min_action_history;
  }

  if (pos >= 0) {
    return -limit + 1;
  } else {
    return -limit;
  }
}


async function getHistory(account, pos, limit) {
  let rtn = [];

  while (rtn.length < limit) {
    let actions = await getActions(account, pos, getOffset(pos, limit));
    if (actions.length === 0) {
      break;
    }

    rtn = rtn.concat(actions);
    pos = rtn[rtn.length - 1].Id - 1;
    if (pos < 0) {
      break;
    }
  }

  if (rtn.length > limit) {
    rtn = rtn.slice(0, limit);
  }

  return rtn;
}


async function run() {
  let args = parseArgs();
  return await getHistory(Util.parseArg(args.account), args.pos, args.limit);
}


run().then(balance => {
  console.log(JSON.stringify(balance));
}).catch(ex => {
  console.error(Util.toErrorJSON(ex));
  process.exit(1);
});
