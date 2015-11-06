var id = 0;

var idHash = {};

var assignId = function (obj) {
  obj.id = id;
  idHash[id] = obj;
  id++;
};

var get = function (id) {
  return idHash[id];
};




var State = function (transition, accept) {
  assignId(this);
  this._transitionGenerator = transition;
  this.accept = accept;
}

State.prototype.set = function () {
  if (!this.transition) {
    this.transition = this._transitionGenerator();
  }
  return this;
};

State.prototype.trans = function (char) {
  this.set();
  if (this.transition.$) {
    return this.transition.$
  } else {
    return this.transition[char]
  }
};

State.prototype.hasTransition = function (char) {
  this.set();
  return this.transition[char] && this.transition[char].length > 0;
}

State.prototype.epsilonClosure = function () {
  return this.collect(['_']);
};

State.prototype.collect = function (transitions) {
  var bucket = [];
  this.traverse(function (state) {
    bucket.push(state);
  }, transitions)
  return bucket;
};

State.prototype.traverse = function (callback, transitions) {
  var queue = [];
  var cache = {};
  queue.push(this);
  cache[this.id] = true;
  var neighbors = dup(transitions);
  while (queue.length !== 0) {
    var state = queue.shift();
    state.set();
    callback(state);
    if (!transitions) {
      neighbors = keys(state.transition);
    };
    neighbors.forEach(function (char) {
      var destState = state.transition[char];
      if (destState) {
        if (destState.__proto__.length !== 0) {
          destState = [destState]
        }
        destState.forEach(function (state) {
          if (!cache[state.id]) {
            queue.push(state);
            cache[state.id] = true;
          };
        });
      };
    });
  };
}
