

var DFA = function (start, alphabet) {
  this.start = start;
  this.alphabet = alphabet;

  this.currentState = this.start;
  this.alphabetHash = {};
  this.alphabet.forEach(function(char) {
    this.alphabetHash[char] = true;
  }.bind(this));
}

DFA.set = function (states) {
  states.forEach(function (state) {
    state.set();
  });
}

DFA.prototype.eachState = function (callback) {
  var queue = [];
  var cache = {};
  queue.push(this.start);
  cache[this.start.id] = true;
  while (queue.length !== 0) {
    var state = queue.shift();
    state.set();
    callback(state);
    this.alphabet.union(['$']).forEach(function (char) {
      var destState = state.transition[char];
      if (destState && !cache[destState.id]) {
        queue.push(state.transition[char]);
        cache[destState.id] = true;
      }
    });
  };
  return this;
};

DFA.prototype.getStates = function () {
  if (!this.states) {
  var states = [];
  this.eachState(function (state) {
    states.push(state);
  });
  this.states = states;
}
  return this.states
};

DFA.prototype.getAcceptStates = function () {
    if (!this.acceptStated) {
       this.getStates();
       var acceptStates = [];
       this.states.forEach(function(state) {
           if (state.accept) {
               acceptStates.push(state);
           };
       });
       this.acceptStates = acceptStates
    };
    return this.acceptStates;
};

DFA.prototype.transition = function (char, wild) {
    // var inAlphabet = true;
    // this.alphabet.forEach(function(char) {
    //   if (!this.currentState.trans(char)) {
    //     inAlphabet = false;
    //     return;
    //   }
    // }.bind(this))
    // if (!inAlphabet) {
    //   this.currentState = this.start;
    //   throw 'missing transition';
    // }
    // this.currentState = this.currentState.trans(char);

    var nextState = this.currentState.trans(char, wild);
     if (nextState) {
       this.currentState = this.currentState.trans(char, wild);
     } else {
       throw 'missing transition'
     }
}

DFA.prototype.evaluate = function (str) {
  var outsideAlphabet = false;
  str.split('').forEach(function(char) {
    this.currentState.set();
    if(!this.alphabetHash[char] && !this.currentState.transition.$) {
      outsideAlphabet = true;
      return;
    }
    this.transition(char);
  }.bind(this));
  if (outsideAlphabet) {
    this.currentState = this.start;
    // throw 'input outside of alphabet';
    return false
  };
  var accepting = this.currentState.accept;
  this.currentState = this.start;
  return accepting;
};

DFA.prototype.path = function (str) {
  // var result = [this.start];
  // var outsideAlphabet = false;
  // // str.split('').forEach(function(char) {
  // for (var k = 0; k < str.length; k++) {
  //   this.currentState.set();
  //   if(!this.alphabetHash[str[k]] && !this.currentState.transition.$) {
  //     // outsideAlphabet = true;
  //     result.push({accept: false});
  //     return result;
  //   }
  //   this.transition(str[k]);
  //   result.push(this.currentState);
  // // }.bind(this));
  // }
  // // if (outsideAlphabet) {
  // //   this.currentState = this.start;
  // //   // throw 'input outside of alphabet';
  // //   return
  // // };
  // this.currentState = this.start;
  // return result;
  //


  var result = [this.start];

  for (var k = 0; k < str.length; k++) {
    var hasWildTrans = this.currentState.transition.$;
    var outsideAlphabet = !this.alphabetHash[str[k]]
    this.currentState.set();
    if (outsideAlphabet && !hasWildTrans) {
      result.push({accept: false});
      return result;
    }
    if (outsideAlphabet) {
      this.transition('$', 'wild');
    } else {
      this.transition(str[k]);
    }
    result.push(this.currentState);
  }

  this.currentState = this.start;
  return result;
}


DFA.prototype.reverse = function () {
  var nfa = this.toNFA();
  var states = nfa.getStates();
  var cache = {};

  states.forEach(function (state) {
    var transition = state.transition;
    for (k in transition) {
      transition[k][0].transition[k].push(state);
    }
  })

  states.forEach(function (state) {
    var transition = states.transition;
    for (k in transition) {
      state.transition[k].shift();
    }
  });
  return nfa.toDFA().minimize();
};

DFA.prototype.refine = function () {
this.set();
var alphabet = this.alphabet;
  function nonEmpty() {

  };

  function doSplit(element, splitter) {
    var split = [[], []];
    var char = splitter[0];
    var splitterContainer = splitter[1].keyify()
    element.forEach(function (state) {
      if (splitterContainer.contains(state.transition[char].id)) {
        split[0].push(state);
      } else {
        split[1].push(state)
      };
    });
    if ((split[0].length * split[1].length) !== 0 ) {
      return split;
    } else {
      return false
    }
  };

  function take(waiting) {
    for (k in waiting) {
      var char = k;
      var kys = waiting[k].keys();
      for (var i = 0; i < kys.length; i++) {
        if (waiting[char].get(kys[i])) {
          waiting[char].put(kys[i], false);
          return [char, kys[i]]
        };
      };
    };
    return false
  };

var wildStates = [];

this.eachState(function (state) {
  if (state.transition.$) {
    wildStates.push(state);
  }
});

var acceptStates = this.getAcceptStates();
var rejectStates = this.getStates().takeAwayById(acceptStates);

var wildRejectStates = wildStates.takeAwayById(acceptStates);
var wildAcceptStates = wildStates.takeAwayById(wildRejectStates);

acceptStates = acceptStates.takeAwayById(wildStates);
rejectStates = rejectStates.takeAwayById(wildStates);


var partition = [];


if (acceptStates.length * rejectStates.length !== 0) {

  partition = [acceptStates, rejectStates];

  var splitterBase = acceptStates;
  if (rejectStates.length < acceptStates.length) {
    splitterBase = acceptStates
  };
  var waitingSet = {};
  this.alphabet.forEach(function (char) {
    waitingSet[char] = [];
    var subsets = new SuperStateHash();
    subsets.put(splitterBase, true);
    waitingSet[char] = subsets;
  });
  var splitter = take(waitingSet);
  var split;
  while (splitter) {
    var length = partition.length
    var element;
    var i = 0;
    while (i < length) {
      element = partition.shift();
      split = doSplit(element, splitter);
      if (split) {
        partition.push(split[0]);
        partition.push(split[1]);
        i++;
        alphabet.forEach(function (char) {
          if (waitingSet[char].get(element)) {
            waitingSet[char].put(element, false);
            waitingSet[char].put(split[0], true);
            waitingSet[char].put(split[1], true);
          } else if (split[0].length < split[1].length){
            waitingSet[char].put(split[0], true)
          } else {
            waitingSet[char].put(split[1], true)
          }
        })
      } else {
        partition.push(element);
      }
      i++;
    };
    splitter = take(waitingSet);
  };


} else {
  if (acceptStates.length !== 0) {
    partition.push(acceptStates)
  };
  if (rejectStates.length !== 0) {
    partition.push(rejectStates);
  }
}




  var wildPartition = [wildAcceptStates, wildRejectStates];

  if (wildAcceptStates.length * wildRejectStates.length !== 0) {

  var splitterBase = wildRejectStates;
  if (wildRejectStates.length < wildAcceptStates.length) {
    splitterBase = wildAcceptStates
  };
  var waitingSet = {};
    var subsets = new SuperStateHash();
    subsets.put(splitterBase, true);
    waitingSet.$ = subsets;
  var splitter = take(waitingSet);
  var split;
  while (splitter) {
    var length = partition.length
    var element;
    var i = 0;
    while (i < length) {
      element = wildPartition.shift();
      split = doSplit(element, splitter);
      if (split) {
        wildPartition.push(split[0]);
        wildPartition.push(split[1]);
        i++;
        // alphabet.forEach(function (char) {
          if (waitingSet.$.get(element)) {
            waitingSet.$.put(element, false);
            waitingSet.$.put(split[0], true);
            waitingSet.$.put(split[1], true);
          } else if (split[0].length < split[1].length){
            waitingSet.$.put(split[0], true)
          } else {
            waitingSet.$.put(split[1], true)
          }
        // })
      } else {
        wildPartition.push(element);
      }
      i++;
    };
    splitter = take(waitingSet);
  };
  partition.concat(wildPartition)

} else {
    wildPartition.forEach(function (el) {
      if (el.length !== 0) {
        partition.push(el);
      };
    });
  }
  return partition
}





//   return partition
// };

DFA.prototype.minimize = function () {
  this.set();
  var partition = this.refine();
  var starter;
  var hashArray = [];
  partition.forEach(function (element, i) {
    if (element.contains(this.start)) {
      starter = i
    };
    hashArray[i] = new StateHash();
    element.forEach(function (state) {
      hashArray[i].put(state, true);
    });
  }.bind(this));

  return MachineDerivative({
    alphabet: this.alphabet,
    startStates: [partition[starter][0]],
    cache: new SuperStateHash(),
    predicate: function (x, y) {
      return x;
    },
    span: function (states, char) {
      var dest = states[0].transition[char]
      for (var i = 0; i < partition.length; i++) {
        if (dest && hashArray[i].get(dest)) {
          return [partition[i][0]];
        }
      };
    },
    wild: function (states, destinations) {
      var dest = states[0].transition.$
      for (var i = 0; i < partition.length; i++) {
        if (hashArray[i].get(dest)) {
          destinations._unionById([partition[i][0]]);
        };
      };
    },
    close: function () {},
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = cache.get(pair[1]);
    },
    machineType: DFA,
    enqueue: function (queue, states, cache) {
      if (!cache.get(states)) {
      queue.push(states);
    }
    }
  });
};

DFA.prototype.cyNodes = function () {
  return this.algebraify().cyNodes();
};

DFA.prototype.cyEdges = function () {
  return this.algebraify().cyEdges();
};


var span = function (states, char) {
  var destinations = [];
  states.forEach(function (state) {
    if (state.transition[char]) {
      destinations.push(state.transition[char]);
    }
  });
  return destinations;
};

DFA.prototype.toNFA = function () {
  return MachineDerivative({
    alphabet: this.alphabet,
    startStates: [this.start],
    cache: new SuperStateHash(),
    predicate: function () {},
    span: function (state, char) {
      state[0].set();
      if (state[0].transition[char]) {
      return [state[0].transition[char]];
    } else {
      return false
    }
    // else {
    //   return [];
    // }
    },
    wild: function (state, destinations) {
      destinations.push(state[0].transition.$);
    },
    close: function () {},
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = [cache.get(pair[1])];
    },
    machineType: NFA,
    enqueue: function (queue, states, cache) {
      if (!cache.get(states)) {
      queue.push(states);
    }
    }
  });
};

DFA.prototype.set = function () {
  this.eachState(function (state) {
    // state.set();
  });
};

DFA.prototype.dup = function () {
  this.start.set();
  return MachineDerivative({
    alphabet: this.alphabet,
    startStates: [this.start],
    cache: new SuperStateHash(),
    predicate: function () {},
    span: function(states, char) {
      if (states[0].transition[char]) {
      return [states[0].transition[char]];
    } else {
      return [];
    }
    },
    wild: function (states, destinations) {
      destinations._unionById(states[0].transition.$);
    },
    close: function () {},
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = cache.get(pair[1]);
    },
    machineType: DFA,
    enqueue: function (queue, states, cache) {
      if (!cache.get(states)) {
        queue.push(states);
      }
    }
  });
};

var CombinerBinary = function (dfa1, dfa2, predicate) {
  var span = function (states, char) {
    var destinations = [];
    states.forEach(function (state) {
      var destination = state.transition[char]
      if (destination) {
        destinations.push(state.transition[char]);
      }
    });
    return destinations;
  };

  var alphabet = dfa1.alphabet.union(dfa2.alphabet);
  var sinkState = new State(function () {
    var trans = {};
    alphabet.forEach(function (char) {
      trans[char] = sinkState;
    })
    return trans;
  }, false);

  var cache = new SuperStateHash()

  cache.put([], sinkState);
  return MachineDerivative({
    alphabet: alphabet,
    startStates: [dfa1.start, dfa2.start],
    cache: cache,
    predicate: predicate,
    span: span,
    wild: function (states, destinations) {
      var wilds = states.suchThat(function (state) {
        state.transition.$;
      })
      destinations._unionById(states.map(function (state) {
        state.transition.$;
      }));
    },
    close: function () {},
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = cache.get(pair[1]);
    },
    machineType: DFA,
    enqueue: function (queue, states, cache) {
      if (!cache.get(states)) {
      queue.push(states);
    }
    }
  })
};

var Combiner = function () {
  var args = Array.prototype.slice.call(arguments);
  var dfas = args.slice(1)
  var op = args[0];
  return dfas.reduce(function (x, y) {
    return CombinerBinary(x, y, op);
  });
};

DFA.prototype.union = function (dfa) {
  return CombinerBinary(this, dfa, function (x, y) {
    return x || y;
  });
};

DFA.prototype.intersect = function (dfa) {
  return CombinerBinary(this, dfa, function (x, y) {
    return x && y;
  });
};

DFA.prototype.takeAway = function (dfa) {
  return CombinerBinary(this, dfa, function (x, y) {
    return x && !y;
  });
};

DFA.prototype.algebraify = function () {
 return FAAR.algebraify(this);
};

DFA.union = function () {
  var dfas = Array.prototype.slice.call(arguments);
  dfas.unshift(function (x, y) {
    return x || y;
  });
  // unshift is not safe function
  return Combiner.apply(undefined, dfas);
};

DFA.prototype.star = function () {
  return this.toNFA()._star().toDFA();
};

DFA.prototype.starPlus = function () {
  return this.concatenate(this.star()).toDFA();
};

DFA.prototype.concatenate = function (dfa) {
  return (this.toNFA()._concatenate(dfa.toNFA())).toDFA();
};




DFA.prototype.toRegex = function () {
  var cache = {};
  var counter = 0;
  var eps = new Atom('_');
  var states = this.getStates();

  var acceptIds = [];
  var startId;

  var size = states.length;

  states.forEach(function (state, i) {
    if (state.accept) {
      acceptIds.push(i);
    }
    if (this.start === state) {
      startId = i;
    };
  }.bind(this));

  if (acceptIds.length === 0) {
    return emptySet;
  }

  for (var bound = -1; bound < size; bound++) {
    for (var begin = 0; begin < size; begin++) {
      for (var finish = 0; finish < size; finish++) {
        var key = [begin, finish, bound].join(",");
        if (!cache[key]) {
          cache[key] = DFA.toRegex(begin, finish, bound, states, cache);
        };
      };
    };
  };

  // var result = acceptIds.map(function (i) {
  //   return DFA.toRegex(startId, i, size - 1, states, cache)
  // }).reduce(function (left, right) {
  //   return new Union(left, right);
  // });

  var result = acceptIds.map(function (i) {
    var key = [startId, i, size - 1].join(",");
    return cache[key];
  }).reduce(function (left, right) {
    return new Union(left, right);
  });

  var prev;

  while(result.toString() !== prev && counter < 50000) {
    prev = result.toString();
    result = result.simplify();
    counter++;
  }

  return result;
};


DFA.toRegex = function (start, end, k, arr, cache) {

  if (k === -1) {
    var characters = [];
    var transition = arr[start].transition;
    for (k in transition) {
      if (transition[k] === arr[end]) {
        characters.push(k)
      };
    };
    if (start === end) {
      characters.push('_');
    }
    if (characters.length === 0) {
      return emptySet;
    }
    var result = characters.map(function (char) {
      return new Atom(char);
    }).reduce(function (left, right) {
      return new Union(left, right);
    });
    return result;
  };

  var left = cache[[start, k, k - 1].join(",")];
  var starred = cache[[k, k, k - 1].join(",")];
  var right = cache[[k, end , k - 1].join(",")];
  var disjunct = cache[[start, end, k - 1].join(",")];
  if (!left) {
    left = DFA.toRegex(start, k, k - 1, arr, cache);
    cache[[start, k, k - 1].join(",")] = left;
  };
  if (!starred) {
    starred = DFA.toRegex(k, k, k - 1, arr, cache);
    cache[[k, k, k - 1].join(",")] = starred;
  };
  if (!right) {
    right = DFA.toRegex(k, end, k - 1, arr, cache);
    cache[[k, end, k - 1].join(",")] = right;
  };
  if (!disjunct) {
    disjunct = DFA.toRegex(start, end, k - 1, arr, cache);
    cache[[start, end, k - 1].join(",")] = disjunct;
  };

  return new Union(new Concat(new Concat(left, new Star(starred)), right), disjunct);
}



var evenZeros = new State(function () {return {0: oddZeros, 1: evenZeros}}, true);

var oddZeros = new State(function () {return {0: evenZeros, 1: oddZeros}}, false);
//

var justEvenZeros = new State(function () {return {0: justOddZeros}}, true);
var justOddZeros = new State(function () {return {0: justEvenZeros}}, false);

var justEvenZerosDFA = new DFA(justEvenZeros, ['0']);

justEvenZerosDFA.set();

var evenOnes = new State(function () {return {0: evenOnes, 1: oddOnes}}, true);

var oddOnes = new State(function () {return {0: oddOnes, 1: evenOnes}}, false);
//
var evenlyManyZeros = new DFA(evenZeros, ['0', '1']);

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
  this.block = block;
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

Regex.prototype.simplify = function () {
  this.exp = this.exp.simplify()
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

  return new Union(this.left.simplify(), this.right.simplify());
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
  return '[' + this.block + ']';
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
  return other.constructor.name === "Collect" && anagrams(this.block, other.block)
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
  } else {
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
  } else {
    return result;
  }
};


DFA.random = function () {
  return Regex.random(100, "abcdefghijklmnopqrstuvwxyz").toNFA().toDFA();
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
