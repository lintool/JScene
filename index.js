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
  var numTokens = 0;
  var startTime;

  var docs;

  function index_tweet(i) {
    if (i != 0 && i % 500 == 0) {
      console.log("Indexed " + i + " documents: Elapsed time = " +
        (new Date().getTime() - startTime) + "ms");
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
      console.log("Error", e.target.error.name);

        // Admittedly, this is a bit janky.
        document.getElementById('message').innerHTML = "<div class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Error!</strong> Does an index already exist? If so, please delete old index first. (Also try refreshing the page.)</div>";

      // Don't continue!
      //index_tweet(i + 1)
    }

    request.onsuccess = function (e) {
      if (j < tokens.length - 1) {
        index_term(i, j + 1, tokens);
      } else if (i < docs.length - 1) {
        index_tweet(i + 1)
      } else {
        var end = new Date().getTime();
        console.log("Number of docs indexed: " + (i + 1));
        console.log("Number of tokens indexed: " + numTokens);
        console.log("Indexing time: " + (end - startTime) + "ms");

        // Admittedly, this is a bit janky.
        document.getElementById('message').innerHTML = "<div class='alert alert-success alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Indexing Complete!</strong> " + (i+1) + " documents indexed in " + (end - startTime) + " ms.</div>";

      }
    }
  }

  function insertDf(i, tuples) {
    var transaction = db.transaction(["df"], "readwrite");
    var store = transaction.objectStore("df");
    var request = store.add(tuples[i][1], tuples[i][0]);

    request.onerror = function (e) {
      console.log("Error", e.target.error.name);
        // Admittedly, this is a bit janky.
        document.getElementById('message').innerHTML = "<div class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Error!</strong> Does an index already exist? If so, please delete old index first. (Also try refreshing the page.)</div>";

    }

    request.onsuccess = function (e) {
      if (i != 0 && i % 1000 == 0) {
        console.log("Inserted " + i + " terms: Elapsed time = " +
          (new Date().getTime() - startTime) + "ms");
      }

      if (i < tuples.length - 1) {
        insertDf(i + 1, tuples);
      } else {
        console.log("Done! Inserted " + tuples.length + " terms: Total elapsed time = " +
          (new Date().getTime() - startTime) + "ms");

        // Admittedly, this is a bit janky.
        document.getElementById('message').innerHTML = "<div class='alert alert-success alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>DF Table successfully built!</strong> Inserted " + tuples.length + " terms in " + (new Date().getTime() - startTime) + " ms.</div>";
      }
    }
  }

  return {
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
