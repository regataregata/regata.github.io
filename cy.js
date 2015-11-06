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
