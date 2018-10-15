#! /usr/bin/env node

const TaskManager = require("../TaskManager.js");
const except = require("../Exception.js");

class AccountApi {
  constructor(request, response) {
  }


  async NewAccount() {
    return TaskManager.createTask("create_account");
  }


  async NewAccountResult(id) {
    return TaskManager.getTaskResult(id);
  }


  async GetBalance(account) {
    return TaskManager.createTask("get_balance", { account: account });
  }


  async GetBalanceResult(id) {
    return TaskManager.getTaskResult(id);
  }


  async IssueTokens(account, amount) {
    return TaskManager.createTask("issue_tokens", { account: account, amount: amount });
  }


  async IssueTokensResult(id) {
    return TaskManager.getTaskResult(id);
  }


  async TransferTokens(from, to, amount) {
    return TaskManager.createTask("transfer_tokens", { from: from, to: to, amount: amount });
  }


  async TransferTokensResult(id) {
    return TaskManager.getTaskResult(id);
  }
}


module.exports = AccountApi;