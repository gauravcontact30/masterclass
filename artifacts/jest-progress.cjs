const path = require('node:path');
module.exports = class ProgressReporter {
  onTestStart(test) { process.stderr.write(`START ${path.relative(process.cwd(), test.path)}\n`); }
  onTestResult(test, result) { process.stderr.write(`DONE ${path.relative(process.cwd(), test.path)} ${result.numPassingTests} passed ${result.numFailingTests} failed\n`); }
};
