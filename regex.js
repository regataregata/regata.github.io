(function (){
var numCalls = 0;
var maxCalls = 2000

function Atom(char) {
  this.exp = char;
}

Atom.prototype.toDFA = function () {
  var start = new State(function () {
    var t = {};
    t[this.exp] = final;
    return t;
  }.bind(this), false);

  var final = new State(function () {
    var t = {};
    t[this.exp] = sink;
    return t;
  }.bind(this), true);

  var sink = new State(function () {
    var t = {};
    t[this.exp] = sink;
    return t;
  }.bind(this), false);

  return new DFA(start, [this.exp]);
};

Atom.prototype.toNFA = function () {
  var start = new State(function () {
    var t = {}
    t[this.exp] = [last];
    return t;
  }.bind(this), false);

  var last = new State(function () {
    return {};
  }, true);
  return new NFA(start, [this.exp]);
};

function Word(word) {
  this.exp = word;
}

Atom.prototype.toString = function () {
    return this.exp;
};

Atom.random = function (alphabet) {
  var chance = getRandomInt(0,3);
  if (chance === 4) {
     return new Dot();
 } else {
   return new Atom(alphabet[getRandomInt(0, alphabet.length)])
 }
}


Word.prototype.toNFA = function () {
  var word = this.exp
  var last = new State();
  var arr = this.exp.split('');
  last.accept = true;
  last.transition = {};
  var cache = {'0': last};

  for (var i = 1; i <= word.length; i++) {
    var state = new State();
    state.accept = false;
    var t = {};
    t[word[word.length - i]] = [cache[i - 1]];
    state.transition = t
    cache[i] = state;
  };
  return new NFA(cache[word.length], arr.uniq());
};

Word.prototype.toString = function () {
    return this.exp;
};

var one = new Atom("1").toDFA();
var zero = new Atom("0").toDFA();

// var ones = one.star();
//
// var zeros = zero.star();
//
// var onesThenZeros = ones.concatenate(zeros)
//
// var oneThenZero = one.concatenate(zero);
//
// var oneNFA = one.toNFA();
//
// var zeroNFA = zero.toNFA();
//
// var oneThenZeroNFA = oneNFA._concatenate(zeroNFA)

function Star(exp) {
  this.exp = exp;
};

function Regex(exp) {
  this.exp = exp;
};

Regex.prototype.toDFA = function () {
  return this.exp.toNFA().toDFA();
};

Regex.prototype.toNFA = function () {
  return this.exp.toNFA();
}

Regex.prototype.toString = function () {
  return this.exp.toString();
}

Star.prototype.toDFA = function () {
  return this.exp.toDFA().star()
}

Star.prototype.toNFA = function () {
  return this.exp.toNFA()._star();
}

Star.prototype.toString = function () {
  var chance = getRandomInt(0, 2);
  if (chance < 0) {
    return '(' + this.exp.toString() + ')*';
  } else {
    return this.exp.toString() + '*'
  }
};

Star.random = function (depth, alphabet) {
  var rand = getRandomInt(0, depth);
  if (rand <= 0 || numCalls > maxCalls) {
      console.log('star');
    return new Star(Atom.random(alphabet));
  } else {
    var newDepth = getRandomInt(0, depth - 1);
      console.log('star');
      numCalls++;
    return new Star(regexForms[getRandomInt(0, 6)].random(newDepth, alphabet));

  };

};

Concat.prototype.toDFA = function () {
  return this.left.toDFA().concatenate(this.right.toDFA())
}

Concat.prototype.toNFA = function () {
  return this.left.toNFA()._concatenate(this.right.toNFA())
}

Concat.prototype.toString = function (noParens) {
  var chance = getRandomInt(0, 2);
  if (chance < 0) {
    return '(' + this.left.toString() + this.right.toString()  + ')';
  } else {
        return this.left.toString() + this.right.toString();
    }
};

Concat.random = function (depth, alphabet) {
  var randLeft = getRandomInt(0, 6);
  var randRight = getRandomInt(0, 6);
  var leftDepth = getRandomInt(0, depth - 1)
  var rightDepth = getRandomInt(0, depth - 1)
  var left;
  var right;
  if (leftDepth <= 0 || numCalls > maxCalls) {
        // console.log('concat1:');
    left = Atom.random(alphabet);
    // console.log(left);
  }
  if (rightDepth <= 0 || numCalls > maxCalls ){
      // console.log('concat2:');
    right = Atom.random(alphabet);
    // console.log(right);
  }
  if (leftDepth !== 0 && numCalls <= maxCalls) {
    left = regexForms[randLeft].random(leftDepth, alphabet);
      // console.log('concat3');
      // console.log(left);
    numCalls++;
  }
  if (rightDepth !== 0 && numCalls <= maxCalls) {
    right = regexForms[randRight].random(rightDepth, alphabet);
      // console.log('concat4');
      // console.log(right);
    numCalls++;
  };
  if (!(right && left)) {
    console.log('fail concat');
  }
  // console.log('concat');
  return new Concat(left, right);
};

function Union(left, right) {
  this.left = left;
  this.right = right;
};

Union.prototype.toDFA = function () {
  return this.left.toDFA().union(this.right.toDFA())
};

Union.prototype.toNFA = function () {
  return this.left.toNFA().union(this.right.toNFA())
};

Union.prototype.toString = function (noParens) {
  var chance = getRandomInt(0, 2);
  if (chance <= 0) {
    return '(' + this.left.toString() + '|' + this.right.toString()  + ')';
  } else {
    return this.left.toString() + '|' + this.right.toString();
  }
};


Union.random = function (depth, alphabet) {
  var randLeft = getRandomInt(0, 6);
  var randRight = getRandomInt(0, 6);
  var leftDepth = getRandomInt(0, depth - 1)
  var rightDepth = getRandomInt(0, depth - 1)
  var left;
  var right;
  if (leftDepth <= 0|| numCalls > maxCalls) {
    left = Atom.random(alphabet);
  }
  if (rightDepth < 0|| numCalls > maxCalls ){
    right = Atom.random(alphabet);
  }
  if (leftDepth >= 0 && numCalls <= maxCalls) {
    left = regexForms[randLeft].random(leftDepth, alphabet);
    numCalls++;
  }
  if (rightDepth >= 0 && numCalls <= maxCalls) {
    right = regexForms[randRight].random(rightDepth, alphabet);
    numCalls++;
  };
  if (!(right && left)) {
    console.log('union fail');
  }
  return new Union(left, right);
};

function Collect(block) {
  this.block = block;
};

Collect.prototype.toString = function () {
  return '[' + this.block + ']';
};

Collect.random = function (_, alphabet) {
  var start = getRandomInt(0, alphabet.length);
  var size = getRandomInt(1, Math.floor(alphabet.length / 3) + 1);
  var alph = "abcdefghijklmnopqrstuvwxyz"
  var block = alphabet.slice(start, start + size);
  return new Collect(block);
};

function Dot() {
};

Dot.prototype.toString = function () {
  return '.';
}

Dot.prototype.toNFA = function () {
  return anything;
};

function Choice(exp) {
  this.exp = exp;
};

Dot.random = function () {
  return new Dot();
}

var dot = new Dot();

Choice.prototype.toNFA = function () {
  return this.exp.toNFA().choice();
};

Choice.prototype.toString = function () {
  var chance = getRandomInt(0, 2);
  if (chance <= 0) {
    return '(' + this.exp.toString() + ')?';
  } else {
    return this.exp.toString() + '?';
  }
};

Choice.random = function (depth, alphabet) {
  var rand = getRandomInt(0, depth);
  if (rand <= 0 || numCalls > maxCalls) {
    return new Choice(new Atom(alphabet[getRandomInt(0, 25)]));
  } else {
    var newDepth = getRandomInt(0, depth - 1);
      numCalls++;
    return new Choice(regexForms[getRandomInt(0, 6)].random(newDepth, alphabet));

  };
};

function Pow(exp, e) {
  this.exp = exp;
  this.e = e;
}

Pow.prototype.toString = function () {
  var chance = getRandomInt(0, 2);
  if (chance <= 0) {
    return '(' + this.exp.toString() + ')' + '{' + this.e.toString() + '}';
  } else {
   return this.exp.toString() + '{' + this.e.toString() + '}';
  }
};

Pow.random = function (depth, alphabet) {
  var rand = getRandomInt(0, depth);
  if (rand <= 0 || numCalls > maxCalls) {
    return new Pow(Atom.random(alphabet), getRandomInt(2, 6))

  } else {
    var newDepth = getRandomInt(0, depth - 1);
    numCalls++;
    return new Pow(regexForms[getRandomInt(0, 6)].random(newDepth, alphabet), getRandomInt(1, 6));

    // return new Pow(Atom.random(alphabet), getRandomInt(1, 11));
  };
};

function StarPlus(exp) {
  this.exp = exp;
}

StarPlus.prototype.toString = function () {
  var chance = getRandomInt(0, 2);
  if (chance <= 0) {
    return '(' + this.exp.toString() + ')+';
  } else {
    return this.exp.toString() + '+'
  }
};

StarPlus.random = function (depth, alphabet) {
  var rand = getRandomInt(0, depth);
  if (rand <= 0 || numCalls > maxCalls) {
    return new StarPlus(new Atom("abcdefghijklmnopqrstuvwxyz"[getRandomInt(0, 25)]));
  } else {
    var newDepth = getRandomInt(0, depth - 1);
      numCalls++;
    return new StarPlus(regexForms[getRandomInt(0, 6)].random(newDepth, alphabet));

  };
};

function Concat(left, right) {
  this.left = left;
  this.right = right;
};
var c = 0;

Regex.random = function (depth, alphabet) {
  numCalls = 0;
  var result = regexForms[getRandomInt(0, 6)].random(depth, alphabet);
  if (result.toString().length > 100) {
  } else {
    return result;
  }
};


var regexForms = {
  "0": Union,
  "1": Concat,
  "2": Star,
  "3": Choice,
  "4": Pow,
  "5": Collect,
  "6": StarPlus,
  "7": Dot
}
})();
