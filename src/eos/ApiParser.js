#! /usr/bin/env node

const _exceptions = require("./Exception.js");
const NotSupportedException = _exceptions.NotSupportedException;


class ApiParser {
  constructor() {
    this.data = {};
  }

  // TODO: save this to a file during build and load from that to avoid parsing every time
  init() {
    const FN_ARGS = /^\s*[^\(]*\(\s*([^\)]*)\)/m
    const FN_ARGS_ASYNC = /^async\s*[^\(]*\(\s*([^\)]*)\)/m
    const FN_ARGS_SPLIT = /,/;
    const FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

    let annotate = function(fn, isAsync) {
      let ___members, fnText, argDecl, last;
      if (typeof(fn) === "function") {
        ___members = fn.___members;
        if (!___members) {
          ___members = [];
          fnText = fn.toString().replace(STRIP_COMMENTS, '');
          argDecl = fnText.match(isAsync ? FN_ARGS_ASYNC : FN_ARGS);
          argDecl[1].split(FN_ARGS_SPLIT).forEach(function(arg) {
            arg.replace(FN_ARG, function(all, underscore, name) {
              ___members.push(name);
            });
          });
        }
        fn.___members = ___members;
      }
      return ___members;
    }

    let _this = this;
    let process = function(className, classDef, isAsync) {
      if (className in _this.data) {
        return;
      }

      _this.data[className] = {};
      let members = _this.data[className];

      while (classDef && classDef.prototype) {
        console.log(`Processing members for ${className}`);

        let names = Object.getOwnPropertyNames(classDef.prototype);
        names.forEach(function(name) {
          if (!name.startsWith("__") && name.length > 0 && name[0].toUpperCase() === name[0]) {
            if (!(name in members)) {
              members[name] = annotate(classDef.prototype[name], isAsync);
            }
          }
        });

        classDef = Object.getPrototypeOf(classDef);
        className = classDef.name;
      }
    }

    const fs = require("fs");
    fs.readdirSync(__dirname + "/api").forEach(file => {
      if (!file.endsWith("Api.js")) {
        return;
      }

      let className = file.substr(0, file.length - ".js".length);
      let classDef = require("./api/" + file);
      process(className, classDef, true);
    });
  }


  getParameterList(className, functionName) {
    if (!(className in this.data)) {
      throw new NotSupportedException();
    }

    if (!functionName || functionName === "") {
      return [];
    }

    const members = this.data[className];
    if (!(functionName in members)) {
      throw new NotSupportedException();
    }

    return members[functionName];
  }
}


module.exports = ApiParser;
