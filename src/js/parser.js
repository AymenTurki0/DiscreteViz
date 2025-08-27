// src/js/parser.js
(function () {
  function parseTransferFunction(str) {
    // very basic parser demo (just split numerator/denominator)
    const match = str.match(/G\(z\)\s*=\s*\((.+)\)\s*\/\s*\((.+)\)/i);
    if (!match) {
      throw new Error("Invalid transfer function format. Use G(z) = (N(z)) / (D(z))");
    }
    return {
      numerator: match[1].trim(),
      denominator: match[2].trim(),
    };
  }

  window.Parser = {
    parseTransferFunction,
  };
})();
