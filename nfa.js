var NFA = function (start, alphabet) {
  this.start = start;
  this.alphabet = alphabet;

  this.currentState = this.start;
  this.alphabetHash = {};
  this.alphabet.forEach(function(char) {
    this.alphabetHash[char] = true;
  }.bind(this));
}

NFA.epsilonClosure = function (states) {
  if (states.length === 0) {
    return [];
  } else {
    return states.map(function (state) {
      return state.epsilonClosure();
    }).reduce(function (x, y) {
      return x.unionById(y);
    });
  }
};

NFA.prototype.eachState = function (callback) {
  // this.start.span({callback: callback, alphabet: this.alphabet});
  // return this;
  this.start.traverse(function (state) {
    callback(state);
  });
  return this;
};


NFA.prototype.path = function (str) {
  var currentState = this.start
  var insts = str.split(" ")

  insts.forEach(function (num, i) {
    if ((i + 1) % 2 !== 0) {
      currentState = currentState.trans(num)[insts[i + 1]];
    };
  });
  return currentState
};

NFA.set = function (states) {
  states.forEach(function (state) {
    state.set();
  });
};

NFA.prototype.getStates = function () {
  // if (!this.states) {
  var states = [];
  this.eachState(function (state) {
    states.push(state);
  });
  // this.states = states;
// }
  // return this.states
  return states;
};

NFA.prototype.getAcceptStates = function () {
  var acceptStates = [];
  this.eachState(function (state) {
    if (state.accept) {
      acceptStates.push(state)
    };
  });
  return acceptStates;
};

NFA.prototype.dup = function () {
  this.start.set();
  return MachineDerivative({
    alphabet: this.alphabet,
    startStates: [this.start],
    cache: new SuperStateHash(),
    predicate: function () {
    },
    span: function(states, char) {
      // if (!states[0].transition[char]) {
      //   // return states[0].transition.$;
      //   return [];
      // } else {
        return states[0].transition[char];
      // }
    },
    wild: function (states, destinations) {
      destinations._unionById(states[0].transition.$)
    },
    close: function () {
    },
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = pair[1].map(function (state) {
        return cache.get([state]);
      });
    },
    machineType: NFA,
    enqueue: function (queue, states, cache) {
      states.forEach(function (state) {
        if (!cache.get([state])) {
          queue.push([state]);
        };
      });
    }
  });
};

NFA.prototype.toDFA = function () {
  var span = function (states, char) {
    var destinations = [];
    states.forEach(function (state) {
      state.set()
      var destination = state.transition[char]
      if (destination) {
        destinations._unionById(destination);
      }
    });
    // var wildTransitions = states.suchThat(function (state) {
    //   return state.transition.$
    // });
    // if (wildTransitions) {
    //   destinations._unionById(wildTransitions.map(function (state) {
    //     return state.transition.$;
    //   }).reduce(function (x, y) {
    //     return x._unionById(y);
    //   }));
    // };
    return destinations;
  };

  var wild = function (states, destinations) {
    var wildTransitions = states.suchThat(function (state) {
      return state.transition.$
    });
    if (wildTransitions) {
      destinations._unionById(wildTransitions.map(function (state) {
        return state.transition.$;
      }).reduce(function (x, y) {
        return x.unionById(y);
      }));
    };
  }

  var alphabet = this.alphabet
  var sinkState = new State(function () {
    var trans = {};
    alphabet.forEach(function (char) {
      trans[char] = sinkState;
    })
    return trans;
  }, false);

  var cache = new SuperStateHash();
  cache.put([], sinkState);
  this.start.set();
  return MachineDerivative({
    alphabet: this.alphabet,
    // startStates: NFA.epsilonSpan([this.start]),
    startStates: this.start.epsilonClosure(),
    cache: cache,
    predicate: function (x, y) { return x || y },
    span: span,
    wild: wild,
    close: function (states) {
      // states._unionById(NFA.epsilonSpan(states))
      states._unionById(NFA.epsilonClosure(states));
    },
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

NFA.prototype._star = function () {
  var result = this.dup();
  result.eachState(function (state) {
    if (state.accept) {
      if (state.transition["_"]) {
        // state.transition["_"].push(result.start);
        state.transition["_"]._unionById([result.start]);

      } else {
        state.transition["_"] = [result.start];
      }
    };
  });
  result.start.accept = true;
  return result
};

NFA.prototype._concatenate = function (nfa) {
  var result = this.dup();
  result.alphabet = result.alphabet.union(nfa.alphabet);
  var leftStates = result.getStates();
  leftStates.forEach(function (state) {
    if (state.accept) {
      if (state.transition["_"]) {
        // state.transition["_"].push(nfa.start);
        state.transition["_"]._unionById([nfa.start]);
      } else {
        state.transition["_"] = [nfa.start];
      }
      state.accept = false;
    };
  })
  return result;
};

NFA.prototype.union = function (nfa) {
  var start = new State(function () {
    var t = {}
    t._ = [this.start, nfa.start];
    return t;
  }.bind(this), false);
  return new NFA(start, this.alphabet.union(nfa.alphabet));
}

NFA.prototype._starPlus = function () {
  var one = this.dup();
  return one._concatenate(this._star())
}

NFA.prototype.pow = function (e) {
  var baseStart = new State(function () {
    return {};
  }, true);

  var base = new NFA(baseStart, []);

  // base.start.accept = true;
  var power = this.dup();
  for (var i = 0; i < e; i++) {
    base = base._concatenate(power);
  };
  return base;
};

NFA.prototype.atLeast = function (num) {
  var base = this.dup();

  // base.start.accept = true;
  var power = this.dup();
  power.start.accept = true;
  for (var i = 1; i < num; i++) {
    base = base._concatenate(power);
  };
  return base;
};

NFA.prototype.choice = function () {
  var choiceNFA = this.dup();
  choiceNFA.start.accept = true;
  return choiceNFA;
};

var wildStart = new State(function () {
  return {$: [wildSeen]};
}, false);

var wildSeen = new State(function () {
  return {};
}, true);


var anything = new NFA(wildStart, [])
anything.getStates(function () {});
