
var numCalls = 0;
var maxCalls = 2000


var emptySet = function () {

};

emptySet.simplify = function () {
  return this;
};

emptySet.toString = function () {
  return "~";
};

emptySet.equals = function (other) {
  return this === other
};

function Atom(char) {
  this.exp = char;
};

function Word(word) {
  this.exp = word;
};

function Star(exp) {
  this.exp = exp;
};

function Union(left, right) {
  this.left = left;
  this.right = right;
};

function Concat(left, right) {
  this.left = left;
  this.right = right;
};

function Collect(block) {
  this.exp = block;
};

function Dot() {
};

function Choice(exp) {
  this.exp = exp;
};

function Pow(exp, e) {
  this.exp = exp;
  this.e = e;
}

function StarPlus(exp) {
  this.exp = exp;
}


function Regex(exp) {
  this.exp = exp;
};

Regex.prototype.simplify = function () {
  var prev = "";
  var current = this.exp;
  while (prev.toString() !== current.toString()) {
    prev = current
    current = current.simplify();
  };
  return current;
}

var asState = new State(function () {
  return {a: asState};
}, true);

var asDFA = new DFA(asState, ['a'])

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

Atom.prototype.simplify = function () {
  return this;
}

Atom.prototype.equals = function (other) {
  return other.exp && this.exp === other.exp;
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

Word.prototype.simplify = function () {
  return this;
};

Word.prototype.equals = function (other) {
  return other.constructor.name === "Word" && new Collect(this.exp).equals(new Collect(other.exp));
}

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




Regex.prototype.toDFA = function () {
  return this.exp.toNFA().toDFA();
};

Regex.prototype.toNFA = function () {
  return this.exp.toNFA();
};

Regex.prototype.toString = function () {
  return this.exp.toString();
};



Star.prototype.toDFA = function () {
  return this.exp.toDFA().star()
};

Star.prototype.toNFA = function () {
  return this.exp.toNFA()._star();
};

Star.prototype.toString = function () {

  var chance = getRandomInt(0, 2);
  // if (chance < 0) {
    return '(' + this.exp.toString() + ')*';
  // } else {
  //   return this.exp.toString() + '*'
  // }
};

Star.random = function (depth, alphabet) {
  var rand = getRandomInt(0, depth);
  if (rand <= 0 || numCalls > maxCalls) {
    return new Star(Atom.random(alphabet));
  } else {
    var newDepth = getRandomInt(0, depth - 1);
      numCalls++;
    return new Star(regexForms[getRandomInt(0, 6)].random(newDepth, alphabet));

  };

};

Star.prototype.simplify = function () {
  if (this.exp.exp === "_" || this.exp === emptySet) {
    return new Atom("_");
  }
  if (this.exp.constructor.name === "Choice") {
    return new Star((this.exp.exp).simplify());
  }
  if (this.exp.constructor.name === "Star") {
    return new Star(this.exp.exp.simplify());
  }
  return new Star(this.exp.simplify());
};

Star.prototype.equals = function (other) {
  return (other.constructor.name === "Star" && this.exp === other.exp)
};



Concat.prototype.toDFA = function () {
  return this.left.toDFA().concatenate(this.right.toDFA())
};

Concat.prototype.toNFA = function () {
  return this.left.toNFA()._concatenate(this.right.toNFA())
};

Concat.prototype.toString = function (noParens) {
  var chance = getRandomInt(0, 2);
    // if (chance === 0) {
      return '(' + this.left.toString() + this.right.toString()  + ')';
    // } else {
      // return this.left.toString() + this.right.toString();
    // }
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

Concat.prototype.simplify = function () {
  var leftIdentity = (this.left.exp === "_")
  var rightIdentity = (this.right.exp === "_")
  if (this.left === emptySet || this.right === emptySet) {
    return emptySet;
  }
  if (leftIdentity && this.right) {
    // this.right.simplify();
    return this.right.simplify();
  }
  if (rightIdentity && this.left) {
    // this.left.simplify();
    return this.left.simplify();
  }
  if (this.left.constructor.name === "Pow" && this.right.constructor.name === "Pow" && this.left.exp.equals(this.right.exp)) {
    return new Pow(this.left, this.left.e + this.right.e);
  }
  if (this.left.constructor.name === "Pow" && this.left.exp.equals(this.right)) {
    return new Pow(this.right, this.left.e + 1);
  }
  if (this.right.constructor.name === "Pow" && this.right.exp.equals(this.left)) {
    return new Pow(this.left, this.right.e + 1);
  }
  if (this.left.equals(this.right)) {
    return new Pow(this.left, 2);
  }
    // this.left.simplify();
    // this.right.simplify();
  return new Concat(this.left.simplify(), this.right.simplify());
};

Concat.prototype.equals = function (other) {
  return (other.constructor.name === "Concat" && this.left.equals(other.left) && this.right.equals(other.right));
}


Union.prototype.toDFA = function () {
  return this.left.toDFA().union(this.right.toDFA())
};

Union.prototype.toNFA = function () {
  return this.left.toNFA().union(this.right.toNFA())
};

Union.prototype.toString = function (noParens) {
  var chance = getRandomInt(0, 2);
  // if (chance === 0) {
    return '(' + this.left.toString() + '|' + this.right.toString()  + ')';
  // } else {
    // return this.left.toString() + '|' + this.right.toString();
  // }
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

Union.prototype.simplify = function () {
  var leftIdentity = (this.left.exp === "_")
  var rightIdentity = (this.right.exp === "_")
  if (this.left === emptySet) {
    return this.right;
  }
  if (this.right === emptySet) {
    return this.left;
  }
  if (leftIdentity && rightIdentity) {
    return new Atom("_");
  }
  if (leftIdentity) {
    // this.right.simplify();
    return new Choice(this.right.simplify());
  }
  if (rightIdentity) {
    // this.left.simplify();
    return new Choice(this.left.simplify());
  }
  // if (this.left.exp && (this.left.exp === this.right.exp)) {
  //   console.log(this.left.exp);
  //   console.log(this.right.exp);
  //   console.log("-");
  //   return this.left.simplify();
  // }
  if (this.left.equals(this.right)) {
    return this.left.simplify();
  }
  if (this.left.exp && this.right.exp && (typeof this.left.exp === "string") && (typeof this.right.exp === "string")) {
    return new Collect(this.left.exp.union(this.right.exp));
  }

  return new Union(this.left.simplify(), this.right.simplify());
}

String.prototype.union = function (other) {
  return this.split("").union(other.split("")).join("");
}

Union.prototype.equals = function (other) {
  return (other.constructor.name === "Union" && (this.left.equals(other.left) && this.right.equals(other.right) ||
  this.left.equals(other.right) && this.right.equals(other.left) ||
  this.right.equals(other.right) && this.left.equals(other.left)||
  this.right.equals(other.left) && this.left.equals(other.right)))
}

String.prototype.simplify = function () {
  return new Atom(this);
}


Collect.prototype.toString = function () {
  return '[' + this.exp + ']';
};

Collect.random = function (_, alphabet) {
  var start = getRandomInt(0, alphabet.length);
  var size = getRandomInt(1, Math.floor(alphabet.length / 3) + 1);
  var alph = "abcdefghijklmnopqrstuvwxyz"
  var block = alphabet.slice(start, start + size);
  return new Collect(block);
};

Collect.prototype.simplify = function () {
  return this;
}

Collect.prototype.equals = function (other) {
  //ok function since alphabet is of bounded size
  function anagrams(left, right) {
    return left.split("").all(function (char) {
      return right.split("").contains(char);
    }) && right.split("").all(function (char) {
      return left.split("").contains(char);
    });
  }
  return other.constructor.name === "Collect" && anagrams(this.exp, other.exp)
};


Dot.prototype.toString = function () {
  return '.';
}

Dot.prototype.toNFA = function () {
  return anything;
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
  // if (this.exp.exp === "_") {
  //   return ""
  // }
  // if (chance === 0) {
    return '(' + this.exp.toString() + ')?';
  // } else {
    // return this.exp.toString() + '?';
  // }
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

Choice.prototype.simplify = function () {
  if (this.exp.exp === "_" || this.exp === emptySet) {
    return new Atom("_");
  }
  if (this.exp.constructor.name === "Star") {
    return this.exp.simplify();
  }
  if (this.exp.constructor.name === "Choice") {
    return this.exp.simplify();
  }
  else {
    return new Choice(this.exp.simplify());
  }

}

Choice.prototype.equals = function (other) {
  return other.constructor.name === "Choice" && this.exp.equals(other.exp)
}



Pow.prototype.toString = function () {
  var chance = getRandomInt(0, 2);
  if (this.exp.exp === "_") {
    return ""
  }
  // if (chance <= 0) {
    return '(' + this.exp.toString() + ')' + '{' + this.e.toString() + '}';
  // } else {
  //  return this.exp.toString() + '{' + this.e.toString() + '}';
  // }
};

Pow.random = function (depth, alphabet) {
  var rand = getRandomInt(0, depth);
  if (rand <= 0 || numCalls > maxCalls) {
    return new Pow(Atom.random(alphabet), getRandomInt(2, 6))

  } else {
    var newDepth = getRandomInt(0, depth - 1);
    numCalls++;
    return new Pow(regexForms[getRandomInt(0, 6)].random(newDepth, alphabet), getRandomInt(2, 6));

    // return new Pow(Atom.random(alphabet), getRandomInt(1, 11));
  };
};

Pow.prototype.simplify = function () {

  if (this.exp.constructor.name === "Pow") {
    return new Pow(this.exp.exp, this.e * this.exp.e);
  }
  if (this.exp.constructor.name === "Star") {
    return new Star(this.exp.exp);
  }
  return new Pow(this.exp.simplify(),this.e);
}

Pow.prototype.equals = function (other) {
  return other.constructor.name === "Pow" && this.exp.equals(other.exp) && (this.e === other.e);
}


StarPlus.prototype.toString = function () {
  var chance = getRandomInt(0, 2);
  if (this.exp.exp === "_") {
    return "_";
  }
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


var c = 0;

Regex.random = function (depth, alphabet) {
  numCalls = 0;
  var result = regexForms[getRandomInt(0, 6)].random(depth, alphabet);
  if (result.toString().length > 100) {
    return Regex.random(depth, alphabet);
  } else {
    return result;
  }
};


DFA.random = function () {
  return Regex.random(100, "abcdefghijklmnopqrstuvwxyz").toNFA().toDFA();
}

Regex.toTree = function (str) {

}


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
