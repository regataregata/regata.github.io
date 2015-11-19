var MachineDerivative = function (options) {

  var alphabet = options.alphabet;
  var startStates = options.startStates;
  var cache = options.cache;
  var predicate = options.predicate;
  var span = options.span;
  var close = options.close;
  var setTransition = options.setTransition;
  var machineType = options.machineType;
  var enqueue = options.enqueue;
  var wild = options.wild;
  var queue = [];

  close(startStates)
  queue.push(startStates);
  while (queue.length !== 0) {
    (function() {

    var sourceStates = queue.pop();
    DFA.set(sourceStates);
    var destStateMap = [];
      var horizon;
      if (machineType === NFA) {
           for (k in sourceStates[0].transition) {
             horizon = span(sourceStates, k);
             destStateMap.push([k, horizon]);
           }
      } else {
        alphabet.forEach(function (char) {
          horizon = span(sourceStates, char);
          if (horizon) {
            close(horizon);
            destStateMap.push([char, horizon]);
          }
        });
        var wildStates = sourceStates.suchThat(function (state) {
        return state.transition.$;
      });
      if (wildStates) {
        var wildDests = span(wildStates, '$');
        close(wildDests);

        if (destStateMap.length !== 0) {
          var otherDests = destStateMap.map(function (pair) {
            return pair[1];
          }).reduce(function (x, y) {
            return x.unionById(y);
          });

          destStateMap = destStateMap.map(function (pair) {
            return [pair[0], pair[1].unionById(wildDests)];
            //
          });
        }

        if (!otherDests) {
          otherDests = [];
        }
        // destStateMap = [['$', wildDests.unionById(otherDests)]];
        destStateMap.push(['$', wildDests.takeAwayById(otherDests)]);

        }
      }

    var stateTransition = function () {
      var trans = {};
      destStateMap.forEach(function (pair) {
        setTransition(pair, trans, cache);
      })
      return trans;
    };

    //construct composite state
    if (!cache.get(sourceStates)) {
      var sourceState = new State(stateTransition, sourceStates.map(function (state) {
        return state.accept;
      }).reduce(predicate));

      //cache composite state
      cache.put(sourceStates, sourceState);
    }

    destStateMap.forEach(function (pair) {
      var destStates = pair[1];
        enqueue(queue, destStates, cache);
    })
  })();
  }
  return new machineType(cache.get(startStates), alphabet);
};
