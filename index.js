function tokenizeToHistogram(s) {
  var raw = s.split(' ');

  raw = raw.map(function(x) { return x.replace(/(^[^A-Za-z]+)|([^A-Za-z]+$)/g, "").toLowerCase()})
           .filter(function(x) { return x.length > 0 ? true : false; });

  var tokens = {};

  for (var n = 0; n < raw.length; n++) {
    if (raw[n] in tokens) {
      tokens[raw[n]]++;
    } else {
      tokens[raw[n]] = 1;
    }
  }

  return tokens;
}

var indexer = (function () {
  var postingsMessageHandler = {};
  var dfTableMessageHandler = {};
  var numTokens = 0;
  var startTime;

  var docs;

  function index_tweet(i) {
    if (i != 0 && i % 100 == 0) {
      // Update progress
      postingsMessageHandler.update(startTime, new Date().getTime(), i);
    }

    var tokens = tokenizeToHistogram(docs[i].text);

    var tuples = [];
    for (var key in tokens) tuples.push([key, tokens[key]]);

    if (tuples.length == 0) {
      // NOTES: corner case here, won't work if last tweet is empty.
      index_tweet(i + 1)
    } else {
      index_term(i, 0, tuples);
    }
  }

  function index_term(i, j, tokens) {
    numTokens++;
    var transaction = db.transaction(["postings"], "readwrite");
    var store = transaction.objectStore("postings");

    // Remember to use id_str because of Javascript precision issues.
    var t = tokens[j][0] + sep + docs[i].id_str;

    var request = store.add(tokens[j][1], t);

    request.onerror = function (e) {
      // Dispatch to error message handler
      postingsMessageHandler.error(e);
    }

    request.onsuccess = function (e) {
      if (j < tokens.length - 1) {
        index_term(i, j + 1, tokens);
      } else if (i < docs.length - 1) {
        index_tweet(i + 1)
      } else {
        // We're done!
        postingsMessageHandler.finished(startTime, new Date().getTime(), i+1);
      }
    }
  }

  function insertDf(i, tuples) {
    var transaction = db.transaction(["df"], "readwrite");
    var store = transaction.objectStore("df");
    var request = store.add(tuples[i][1], tuples[i][0]);

    request.onerror = function (e) {
      // Dispatch to error message handler
      dfTableMessageHandler.error(e);
    }

    request.onsuccess = function (e) {
      if (i != 0 && i % 1000 == 0) {
        // Update progress
        dfTableMessageHandler.update(startTime, new Date().getTime(), i);
      }

      if (i < tuples.length - 1) {
        insertDf(i + 1, tuples);
      } else {
        // We're done!
        dfTableMessageHandler.finished(startTime, new Date().getTime(), tuples.length);
      }
    }
  }

  return {
    setPostingsMessageHandler: function(h) {
      postingsMessageHandler = h;
    },

    setDfTableMessageHandler: function(h) {
      dfTableMessageHandler = h;
    },

    index: function (d) {
      startTime = new Date().getTime();
      docs = d;
      index_tweet(0);
    },

    buildDfTable: function (d) {
      startTime = new Date().getTime();
      docs = d;

      var DF = {};
      for (var i = 0; i < docs.length; i++) {
        if (i != 0 && i % 1000 == 0) console.log("Processed " + i + " documents.");

        var tokens = tokenizeToHistogram(docs[i].text);
        for (var t in tokens) {
          if (t in DF) {
            DF[t]++;
          } else {
            DF[t] = 1;
          }
        }
      }

      var tuples = [];
      for (var key in DF) tuples.push([key, DF[key]]);

      insertDf(0, tuples);
    }
  };

})();
