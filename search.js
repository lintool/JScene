var searcher = (function () {
  var queryTerms;
  var dfs = {};
  var numDocs = 0;

  var startTime;

  function getDfs() {
    for (var i=0; i<queryTerms.length; i++) {
      var request = db.transaction(["df"], "readonly")
                      .objectStore("df").get(queryTerms[i]);
 
      request.onerror = function(e) {
        console.log("Error", e.target.error.name);
      }

      request.onsuccess = (function(query) { return function(e) {
        dfs[query] = e.target.result;
      }})(queryTerms[i]);
    }
  }

  function searchInit(callback) {
    startTime = new Date();
    dfs = {};

    // Note there's a race condition here: we're depending on the stat
    // requests completing before we actual perform query evaluation.
    getDfs();

    // We're going to open a cursor on the first query term now.
    var qterm = queryTerms[0];
    var cursor = db.transaction(["postings"], "readonly").objectStore("postings")
                   .openCursor(IDBKeyRange.bound(qterm + sep, qterm + "."));

    var results = {}; // The accumulator

    cursor.onsuccess = function(e) {
      var res = e.target.result;
      if (res) {
        var parts = res.key.split(sep);
        var pterm = parts[0];
        var pdoc = parts[1];
      }

      if ( res && pterm == qterm ) {
        results[pdoc] = res.value * Math.log(numDocs/dfs[pterm]);;
        res.continue();
      }

      if ( !res || pterm != qterm ) {
        if (queryTerms.length > 1 ) {
          // Query has more than one term: continue evaluating other terms.
          searchContinuation(1, results, callback);
        } else {
          // One term query: we're done.
          callback(results, startTime);
        }
      }
    };
  }

  function searchContinuation(n, results, callback) {
    var qterm = queryTerms[n];
    var cursor = db.transaction(["postings"], "readonly").objectStore("postings")
                   .openCursor(IDBKeyRange.bound(qterm + sep, qterm + "."));

    cursor.onsuccess = function(e) {
      var res = e.target.result;
      if (res) {
        var parts = res.key.split(sep);
        var pterm = parts[0];
        var pdoc = parts[1];
      }

      if ( res && pterm == qterm ) {
        if ( pdoc in results) {
          results[pdoc] += res.value * Math.log(numDocs/dfs[pterm]);
        }
        res.continue();
      }

      if ( !res || pterm != qterm ) {
        if ( n < queryTerms.length-1 ) {
          // More terms to process...
          searchContinuation(n+1, results, callback);
        } else {
          // We're done!
          callback(results, startTime);
        }
      }
    };
  }

  return {
    search : function(qt, callback) {
      queryTerms = qt;
      searchInit(callback);
    },

    setNumDocs : function(n) {
      numDocs = n;
    }
  };
})();
