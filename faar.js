//finite automaton algebraic representation

var FAAR = function (numStates, transitions, startKey, alphabet, acceptStates, statesMap, nfa) {
  //
  this.numStates = numStates;

  this.transitions = transitions;
  this.startKey = startKey;
  this.alphabet = alphabet;
  this.acceptStates = {};
  acceptStates.forEach(function (key) {
    this.acceptStates[key] = true;
  }.bind(this));
  this.statesMap = statesMap;
  this.nfa = nfa
};

FAAR.algebraify = function (dfa) {
  var states = dfa.getStates();
states.forEach(function (state) {
  if (state === dfa.start) {
    states.unshift(states.pop());
    return;
  };
});
  var statesMap = {};
  states.forEach(function (state, i) {
    statesMap[state.id] = i;
  });
  var alphabet = dfa.alphabet;
  var transitions = {};

  alphabet.union(['$']).forEach(function (char) {
    var transition = [];
    transitions[char] = transition;
    for (var i = 0; i < states.length; i++) {
      var stateRow = [];
      transition.push(stateRow);
      for (var j = 0; j < states.length; j++) {
        stateRow.push(0);
      };
    };
  });

   alphabet.union(['$']).forEach(function (char) {
     var transition = transitions[char];
     states.forEach(function (state, i) {
      if (state.transition[char]) {
         //
      var destStateKey = statesMap[state.transition[char].id];
      transition[i][destStateKey] = 1;

      }
     });
   })
  return new FAAR(states.length, transitions, statesMap[dfa.start.id], alphabet, dfa.getAcceptStates().map(function(state) {
      return statesMap[state.id];
  }), statesMap);
};

FAAR.getState = function (row) {
  for (var i = 0; i < row.length; i++) {
    if (row[i]) {
      return i;
    };
  };
};

FAAR.machineify = function (alg) {
  var faar = alg;
  return alg.machineify();
};

FAAR.prototype.cyNodes = function () {
  var nodes = [];
  var red = "#C29393";
  // "#CF6D6D"
  // "#CF624C"
  // "#D66340"
  // "#E35227"
  // "#D47B8B"
  // '#C9919A'
  var status = red;
  var accept = '0';
  var name;
  for (var i = 0; i < this.numStates; i++) {
    name = i.toString();
    if (this.acceptStates[i]) {
      status = '#ABC9C1';
      accept = '1'
      // "#8FCC8F"
      // "#82CF82";
      // "#73D973"
      // '#ABC9C1';
    };
    // if (i === 0) {
    //   var name = 'ε';
    // }
    nodes.push({data: {id: i.toString(), color: status, name: name, accept: accept}})
    status = red;
    accept = '0';
  }
  return nodes;
};

FAAR.prototype.cyEdges = function () {
  var allEdges = [];
  for (var i = 0; i < this.numStates; i++) {
    var id = i.toString();
    var name = id;
    var edges = [];
    this.alphabet.union(['$']).forEach(function (char) {
      var edge = {data: {source: id}};
      edge.data.name = char;
      // var dest = this.transitions[char];
        var target = FAAR.getState(this.transitions[char][name])
      if (target === 0 || target) {
        edge.id = id + "," + target;
        //
      // var target = FAAR.getState(this.transitions[char][name]).toString();
      edge.data.target = target.toString();
      edges.push(edge);
      }
      //
    }.bind(this));
    allEdges = allEdges.concat(edges);
  };
  return allEdges;
};

FAAR.prototype.cyElements = function () {
  return { nodes: this.cyNodes(), edges: this.cyEdges }
}

FAAR.prototype.machineify = function () {
  if (!this.nfa) {
  var cache = {};
  var range = [];
  for (var i= 0; i < this.numStates; i++) {
    range.push(i);
  }
  while (range.length !== 0) {
    (function () {
      var stateKey = range.pop();

      var stateTransition = function () {
        var trans = {};
        this.alphabet.forEach(function (char) {
          var destStateKey = 0;
          this.transitions[char][stateKey].forEach(function (el, i) {
            if (el) {
              destStateKey = i;
              return;
            };
          });
          trans[char] = cache[destStateKey];
        }.bind(this))
        return trans;
      }.bind(this);

    cache[stateKey] = new State(stateTransition, !!this.acceptStates[stateKey]);
    }.bind(this))();

  }
  return new DFA(cache[this.startKey], this.alphabet);
}

};
