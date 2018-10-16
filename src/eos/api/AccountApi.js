#! /usr/bin/env node

const TaskManager = require("../TaskManager.js");

class AccountApi {
  constructor(request, response) {
  }


  async NewAccount() {
    return TaskManager.createTask("create_account");
  }


  async GetBalance(account) {
    return TaskManager.createTask("get_balance", { account: account });
  }


  async IssueTokens(account, amount) {
    return TaskManager.createTask("issue_tokens", { account: account, amount: amount });
  }


  async TransferTokens(from, to, amount) {
    return TaskManager.createTask("transfer_tokens", { from: from, to: to, amount: amount });
  }
}


module.exports = AccountApi;