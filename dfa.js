

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

  // var prev;
  //
  // while(result.toString() !== prev && counter < 50000) {
  //   prev = result.toString();
  //   result = result.simplify();
  //   counter++;
  // }

  return result.simplify();
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
