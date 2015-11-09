function CY() {

};

CY.outs = function (g, node) {
  var result = [];
  g.edges().each(function (i, edge) {
    if (edge.data().source === node.id() && edge.data().target !== node.id()) {
      result.push(edge);
    }
  });
  return result.length;
};

CY.ins = function (g, node) {
  var result = [];
  g.edges().each(function (i, edge) {
    if (edge.data().target === node.id()) {
      result.push(edge);
    }
  });
  return result.length;
};

CY.weight = function (g, node) {
  return CY.ins(g, node) + CY.outs(g, node);
}

CY.toFAAR = function (cy) {
  var numStates = cy.elements().nodes().length;
  function newMatrix() {
    var newMatrx = [];
    for (var i = 0; i < numStates; i++) {
      var row = [];
      newMatrx.push(row);
      for (var j = 0; j < numStates; j++) {
        row.push(0);
      };
    };
    return newMatrx
  };

  var transitions = {};
  var acceptStates = [];
  var startKey = 0;
  var statesMap = {};
  var alphabet = [];
  var multiTransition;
  var missingTransition;
  var numTransitions = 0;

  cy.elements().edges().each(function (i, edge) {
    var char = edge.data().name;
    if (!char) {
      missingTransition = true;
    };
    var source = parseInt(edge.data().source);
    var target =  parseInt(edge.data().target);
    if (!alphabet.contains(char)) {
      alphabet.push(char);
    };
    if (!transitions[char]) {
      transitions[char] = newMatrix();
    };
    if (transitions[char] && transitions[char][source].contains(1)) {
      multiTransition = true;
    };
    transitions[char][source][target] = 1;
    numTransitions++;
  });

  cy.elements().nodes().each(function (i, state) {
    var accept = !!parseInt(state.data().accept);
    if (accept) {
      acceptStates.push(parseInt(state.id()));
    };
  });

  missingTransition = (missingTransition || numTransitions !== alphabet.length * numStates);

  return new FAAR(numStates, transitions, 0, alphabet, acceptStates, statesMap, multiTransition || missingTransition);
};
