(function ( $ ) {

  $.fn.setCursorPosition = function(pos) {
    this.each(function(index, elem) {
      if (elem.setSelectionRange) {
        elem.setSelectionRange(pos, pos);
      } else if (elem.createTextRange) {
        var range = elem.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
      }
    });
    return this;
  };
}( jQuery ));


var isArray = function (x) {
  return x.__proto__.length === 0;
}

Array.prototype.contains = function (el) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === el) {
      return true;
    }
  }
  return false;
};

Array.prototype.union = function (arr) {
  var occHash = {};
  var newArr = [];
  this.forEach(function (el) {
    if (!occHash[el]) {
      newArr.push(el);
      occHash[el] = true;
    };
  });
  arr.forEach(function (el) {
    if (!occHash[el]) {
      newArr.push(el);
      occHash[el] = true;
    };
  });
  return newArr;
};

Array.prototype.uniq = function () {
  return this.union([]);
};

Array.prototype.uniqById = function () {
  return this.unionById([]);
}

Array.prototype.unionById = function (arr) {
  var occHash = new SuperStateHash();
  // var occHash = new StateHash();
  var newArr = [];
  this.forEach(function (el) {
    if (!occHash.get([el])) {
      newArr.push(el);
      occHash.put([el], true);
    };
  });
  // this.forEach(function (el) {
  //   if (!occHash.get(el)) {
  //     newArr.push(el);
  //     occHash.put(el, true);
  //   };
  // });
  arr.forEach(function (el) {
    if (!occHash.get([el])) {
      newArr.push(el);
      occHash.put([el], true);
    };
  });

  // arr.forEach(function (el) {
  //   if (!occHash.get(el)) {
  //     newArr.push(el);
  //     occHash.put(el, true);
  //   };
  // });
  return newArr;
};

Array.prototype._unionById = function (arr) {
  // var occHash = new SuperStateHash();
  // this.forEach(function (el) {
  //   occHash.put([el], true);
  // });


  var occHash = new StateHash();
  var buffer = [];
  var el;
  while (this.length !== 0) {
    el = this.pop()
    if (!occHash.get(el)) {
      buffer.push(el);
      occHash.put(el, true);
    };
  };
  buffer.forEach(function (el) {
    this.push(el);
  }.bind(this));


  //
  // arr.forEach(function (el) {
  //   if (!occHash.get([el])) {
  //     this.push(el);
  //     occHash.put([el], true);
  //   };
  // }.bind(this));


  arr.forEach(function (el) {
    if (!occHash.get(el)) {
      this.push(el);
      occHash.put(el, true);
    };
  }.bind(this));
  return this
};

Array.prototype.keyify = function () {
  return this.map(function (el) {
    return el.id;
  })
};

Array.prototype.max = function () {
  var max = this[0];
  this.forEach(function (el) {
    if (el > max) {
      max = el;
    };
  });
  return max;
};

Array.prototype.min = function () {
  var min = this[0];
  this.forEach(function (el) {
    if (el < min) {
      min = el;
    };
  });
  return min;
};

Array.prototype.all = function (condition) {
  if (this.length == 0) {
    return true;
  } else {
    return this.map(function (el) {
      return condition(el);
    }).reduce(function (x, y) {
      return x && y;
    });
  };
};

Array.prototype.exists = function (condition) {
  var result = false;
  this.forEach(function (el) {
    if (condition(el)) {
      result = true;
    };
  });
  return result;
};

Array.prototype.suchThat = function (condition) {
  var results = [];
  if (this.exists(condition)) {
  this.forEach(function (el) {
    if (condition(el)) {
      results.push(el);
    };
  });
  return results;
} else {
  return false
}
};

Array.prototype.last = function () {
  return this[this.length - 1];
}

Array.prototype.reflect = function (i) {
  return this[this.length - i - 1];
}

String.prototype.parseIntArray = function () {
  return this.split(',').map(function (el) {
    return el.parseInt();
  });
};

String.prototype.parseStateSet = function () {
  return new Set(this.parseIntArray().map(function (int) {
    return get(int);
  }));
};

var Matrix = function (height, width) {
  this.matrix = [];
  for (var i = 0; i < height; i++) {
  var row = []
  this.matrix.push(row);
    for (var j = 0; j < width; j++) {
      row.push(0);
    };
  };
};

var StateHash = function () {
  this.hash = {};
};

StateHash.prototype.put = function (state, value) {
  this.hash[state.id] = value;
}

StateHash.prototype.get = function (state) {
  return this.hash[state.id];
}

var SuperStateHash = function () {
  this.hash = {};
}

SuperStateHash.prototype.put = function (array, value) {
  this.hash[SuperStateHash.toString(array.keyify())] = value;
}

SuperStateHash.prototype.get = function (array) {
  return this.hash[SuperStateHash.toString(array.keyify())];
}

SuperStateHash.toString = function (array) {
  // var binaryArray = [];
  // array.forEach(function (el) {
  //   if (binaryArray.length <= el) {
  //     while (binaryArray.length <= el) {
  //       binaryArray.push(0);
  //     }
  //   }
  //   binaryArray[el] = 1;
  // });
  // return binaryArray.join();
  return array.toString();
};

SuperStateHash.prototype.keys = function () {
  return keys(this.hash).map(function (key) {
    return key.split(',').map(function (id) {
      return get(id);
    });
  });
};

SuperStateHash.prototype.isEmpty = function () {
  var hash = this.hash;
  for (k in hash) {
    if (hash[k]) {
      return false
    };
  };
  return true
};

SuperStateHash.prototype.give = function () {
  var keys = keys(this.hash);
  for (var i = 0; i < keys.length; i++) {
    if (this.get(keys[i])) {
      return keys[i];
    }
  }
  return false;
};

toArray = function (obj) {
  var arr = [];
  for (k in obj) {
    arr.push(obj[k]);
  };
  return arr
};

dup = function (obj) {
  if ((typeof obj) === "object" || (typeof obj) === "array") {
    var dupped = {};
    for (k in obj) {
      dupped[k] = dup(obj[k]);
    };
    if (obj.__proto__.length === 0) {
      return toArray(obj);
    } else {
      return dupped;
    }
  } else {
    return obj
  };
};

var keys = function (obj) {
  var kys = [];
  for (k in obj) {
    kys.push(k);
  };
  return kys;
};

Array.prototype.or = function () {
  this.reduce(function (x, y) {
    x || y;
  });
};

Array.prototype.takeAway = function (arr) {
  var result = [];
  var out = {};
  arr.forEach(function (el) {
    out[el] = true;
  });
  this.forEach(function (el) {
    if (!out[el]) {
      result.push(el);
    };
  });
  return result
};

Array.prototype.takeAwayById = function (arr) {
  var result = [];
  var out = {};
  arr.forEach(function (el) {
    out[el.id] = true;
  });
  this.forEach(function (el) {
    if (!out[el.id]) {
      result.push(el);
    };
  });
  return result
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var testEquality = function (left, right, num, maxLength) {
  var str;
  var strs = [""];
  var length;
  var cache = {};
  cache[""] = true;

  var alphabet = left.alphabet;
  for (var i = 0; i < num; i++) {
    length = getRandomInt(1, maxLength)
    str = "";
    while (cache[str]) {
      for (var j = 0; j < length; j++) {
        str = str + alphabet[getRandomInt(0, alphabet.length)];
      }
    }
    cache[str] = true;
    strs.push(str);
  }
  return strs.all(function (string) {
    return left.evaluate(string) === right.evaluate(string);
  });
};
