function error() {

};

Regex.lexFirst = function (str, tree) {
  var special = ['*', '+', '?', '.', '@', '|', '(', ')', '[', ']', '{', '}'];
  var unaryOperators = ['*', '+', '?', '.'];
  var digits = '0123456789'.split('');
  var inputArr = str.split('');
  function isSpecial(char) {
    return special.contains(char);
  };

  function isDigit(char) {
    return digits.contains(char);
  };

  function isUnOp(char) {
    return unaryOperators.contains(char);
  }

  var result = [];
  var i = 0;
  while (i < str.length) {
    var block = '';
    if (!isSpecial(str[i])) {
      while (i < str.length && !isSpecial(str[i])) {
        block = block + str[i];
        i++;
      };
      if (str[i] === '*' | str[i] == '?' | str[i] == '+') {
        var atom = block[block.length - 1];
        block = block.slice(0, block.length - 1);
        if (block !== '') {
          if (tree) {
            result.push(new Word(block));
          } else {
           result.push(new Word(block).toNFA());
          }
        }
        if (str[i] === '*') {
          if (tree) {
            result.push(new Star(new Atom(atom)));
          } else {
          result.push(new Star(new Atom(atom)).toNFA());
          }
        } else if (str[i] === '?') {
          if (tree) {
            result.push(new Choice(new Atom(atom)));
          } else {
          result.push(new Choice(new Atom(atom)).toNFA());
          }
        } else if (str[i] === '+') {
          if (tree) {
              result.push(new Concat(new Atom(atom), new Star(new Atom(atom))));
          } else {
            result.push((new Atom(atom).toNFA())._concatenate(new Atom(atom).toNFA()._star()));
          }
        }
        i++;
      } else {
        if (tree) {
          result.push(new Word(block));
        } else {
          result.push(new Word(block).toNFA());
        }
      }
    } else if (str[i] === '{') {
      i++;
      var numString = '';
      if (!isDigit(str[i]) || str[i] === '0') {
        // throw 'invalid multiplier';
        return [error, 'invalid exponent'];
      };
      while (i < str.length && str[i] !== '}') {
        if ((!isDigit(str[i]) && str[i] !== ',') || isSpecial(str[i])) {
          // throw 'invalid multiplier';
            return [error, 'invalid exponent'];
        }
        numString = numString + str[i];
        i++;
      };
      if (i === str.length) {
        // throw 'unclosed multiplier bracket';
        return [error, 'unclosed exponent bracket'];
      }
      var range = numString.split(',')
      if (range.length > 2) {
        // throw 'invalid range';
        return [error, 'invalid range'];
      }
      i++;
      result.push(parseInt(numString));
    }
    else if (str[i] === '[') {
      var block = '';
      i++;
      while (1 < str.length && str[i] !== ']') {
        if (isSpecial(str[i])) {
          // throw 'invalid set'
          return [error, 'invalid set'];
        }
        block = block + str[i];
        i++;
      }
      if (i === str.length) {
        // throw "unclosed '['"
        return [error, 'unclosed "]"']
      };
      if (tree) {
        var union = block.split('').map(function (char) {
          return new Atom(char);
        }).reduce(function (left, right) {
          return new Union(left, right);
        });
        result.push(union);
      } else {
        var union = block.split('').map(function (char) {
          return new Atom(char).toNFA();
        }).reduce(function (left, right) {
          return left.union(right);;
        });
        result.push(union);
      }
      i++;
    }
    else if (str[i] === '.') {
      if (tree) {
        result.push(new Dot());
      } else {
        result.push(anything);
      }
      i++;
    }
    else if (str[i] === ']' || str[i] == '}') {
      // throw "unclosed '[' or '{'";
      return [error, 'unclosed "]" or "{"'];
    }
    else {
      result.push(str[i]);
      i++;
    }
  }
  return result;
};


Regex.lexSecond = function (arr, tree) {
  if (arr[0] === error) {
    return arr;
  };
  var special = ['*', '+', '?', '@', '|', '(', ')', '[', ']', '{', '}'];
  var unaryOperators = ['*', '+', '?', '.'];
  var digits = '0123456789'.split('');
  function isSpecial(char) {
    return special.contains(char);
  };

  function isDigit(char) {
    return digits.contains(char);
  };

  function isUnOp(char) {
    return unaryOperators.contains(char) || (typeof char) === "number"
  }

  function isNumber(el) {
    return typeof el === "number"
  };

  function isRange(el) {
    return isArray(el);
  }

  var result = [arr[0]];
  for (var i = 1; i < arr.length; i++) {
    if (arr[i - 1] === ')' && arr[i] === '(') {
    result.push('@');
    result.push('(');
  } else if (arr[i] === '(' && (isUnOp(arr[i - 1]) || !isSpecial(arr[i - 1]))) {
    result.push('@');
    result.push('(')
  } else if (!isSpecial(arr[i]) && !isNumber(arr[i]) && arr[i - 1] === ')') {
    result.push('@');
    result.push(arr[i]);
  } else if (!isSpecial(arr[i]) && !isSpecial(arr[i - 1]) && !isNumber(arr[i])) {
    result.push('@');
    result.push(arr[i]);
  } else if (isUnOp(arr[i - 1]) && !isUnOp(arr[i]) && arr[i] !== ')' && arr[i] !== '|') {
    result.push('@');
    result.push(arr[i])
  } else {
    result.push(arr[i]);
  }
  };
  return result;
};

function process(operators, precedenceMap) {

};

Regex.lex = function (str, tree) {
  return Regex.lexSecond(Regex.lexFirst(str, tree), tree);
}

Regex.toRPN = function (str, tree) {
  var stream = Regex.lexFirst(str, tree);
  stream = Regex.lexSecond(stream, tree);
  if (stream[0] === error) {
    return stream;
  };
  var special = ['*', '+', '?', '@', '|', '(', ')', '[', ']', '{', '}'];
  var operators = ['*', '+', '?', '@', '|'];
  var unaryOperators = ['*', '+', '?', '.'];
  var digits = '0123456789'.split('');

  function isDigit(char) {
    return digits.contains(char);
  };

  function isNumber(el) {
    return typeof el === "number"
  };

  function isUnOp(char) {
    return unaryOperators.contains(char) || isNumber(char);
  }

  function isOperator(char) {
    return operators.contains(char) || isNumber(char);
  }

  function isSpecial(char) {
    return special.contains(char) || isNumber(char);
  };

  var precedenceMap = {};
  precedenceMap['*'] = 3;
  precedenceMap['+'] = 3;
  precedenceMap['?'] = 3;
  precedenceMap['@'] = 2;
  precedenceMap['|'] = 1;

  var functionMap = {};

  functionMap['*'] = function (nfa) {
    if (tree) {
      return new Star(nfa);
    }
      return nfa._star();

  };

  functionMap['+'] = function (nfa) {
    if (tree) {
      return new StarPlus(nfa);
    }
      return nfa._starPlus();
  };

  functionMap['?'] = function (nfa) {
    if (tree) {
      return new Choice(nfa);
    }
    return nfa.choice();
  };

  functionMap['@'] = function (left, right) {
    if (tree) {
      return new Concat(left, right);
    }
    return left._concatenate(right);
  };

  functionMap['|'] = function (left, right) {
    if (tree) {
      return new Union(left, right);
    }
    return left.union(right);
  };

  function getOperator(tok) {
    if (isNumber(tok)) {
      if (tree) {
        return function (nfa) {
          return new Pow(nfa, tok);
        }
      }
      return function (nfa) {
        return nfa.pow(tok)
      }
    } else {
      return functionMap[tok]
    }
  };

  function precedence(op) {
    if (isNumber(op)) {
      return 3;
    } else {
      return precedenceMap[op];
    }
  };

  var queue = [];
  var stack = [];
  var i = 0;
  while (i < stream.length) {
    if (!isSpecial(stream.reflect(i))) {
      queue.push(stream.reflect(i));
      i++;
    }

    else if (isOperator(stream.reflect(i))) {
      while (stack.length !== 0 && precedence(stack.last()) > precedence(stream.reflect(i))) {
        queue.push(stack.pop());
        // eval(stack.pop(), queue)
      };
      stack.push(stream.reflect(i));
      i++;
    }

    else if (stream.reflect(i) === ')') {
      stack.push(')')
      i++;
    } else {
      var prevTok = stack.last();
      while (stack.length !== 0 && stack.last() !== ')') {
        prevTok = stack.pop();
        queue.push(prevTok);
        // eval(prevTok, queue)
      }
      if (stack.length === 0) {
        // throw 'error'
        return [error, "unmatched parenthesis"]
      }
      stack.pop();
      i++;
    }
  }

  while (stack.length !== 0 && stack[stack.length - 1] !== '(') {
    queue.push(stack.pop())
  };
  return queue
};

Regex.evaluate = function (stream, tree) {
  if (stream[0] === error) {
    return stream;
  };
  var special = ['*', '+', '?', '@', '|', '(', ')', '[', ']', '{', '}'];
  var operators = ['*', '+', '?', '@', '|'];
  var unaryOperators = ['*', '+', '?', '.'];
  var digits = '0123456789'.split('');

  function isDigit(char) {
    return digits.contains(char);
  };

  function isNumber(el) {
    return typeof el === "number"
  };

  function isUnOp(char) {
    return unaryOperators.contains(char) || isNumber(char);
  }

  function isOperator(char) {
    return operators.contains(char) || isNumber(char);
  }

  function isSpecial(char) {
    return special.contains(char) || isNumber(char);
  };

  var precedenceMap = {};
  precedenceMap['*'] = 3;
  precedenceMap['+'] = 3;
  precedenceMap['?'] = 3;
  precedenceMap['@'] = 2;
  precedenceMap['|'] = 1;

  var functionMap = {};

  functionMap['*'] = function (nfa) {
    if (tree) {
      return new Star(nfa);
    }
    return nfa._star();
  };

  functionMap['+'] = function (nfa) {
    if (tree) {
      return new StarPlus(nfa);
    }
    return nfa._starPlus();
  };

  functionMap['?'] = function (nfa) {
    if (tree) {
      return new Choice(nfa);
    }
    return nfa.choice();
  };

  functionMap['@'] = function (left, right) {
    if (tree) {
      return new Concat(left, right);
    }
    return left._concatenate(right);
  };

  functionMap['|'] = function (left, right) {
    if (tree) {
      return new Union(left, right);
    }
    return left.union(right);
  };

  function getOperator(tok) {
    if (isNumber(tok)) {
      if (tree) {
        return function (nfa) {
          return new Pow(nfa, tok);
        }
      }
      return function (nfa) {
        return nfa.pow(tok)
      }
    } else {
      return functionMap[tok]
    }
  };

  function eval(tok) {
    if (isSpecial(stack.last())) {
      // throw 'syntax error'
      return [error, "invalid use of binary operator"];
    }
    if (!isUnOp(tok)) {
      var left = stack.pop();
      var right = stack.pop();
      stack.push(getOperator(tok)(left, right));
    } else {
      var arg = stack.pop();
      stack.push(getOperator(tok)(arg));
    }
  };
  var stack = [];
  while (stream.length !== 0) {
    var tok = stream.shift()
    if (!isSpecial(tok)) {
      stack.push(tok)
    } else {
      eval(tok);
    };
  }
  if (tree) {
    return stack[0];
  }
  return stack[0].toDFA();
}

Regex.parse = function (str, tree) {
  var base = Regex.evaluate(Regex.toRPN(str, tree), tree);
  if (base[0] === error) {
    return base[1]
  }
  if (tree) {
    return base
  } else {
    if (str.split('').contains('.')) {
      return base
    } else {
      return base.minimize()
    }
  }
}

Regex.toTree = function (str) {
  return Regex.parse(str, true);
}
