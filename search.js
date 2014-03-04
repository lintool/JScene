var searcher = (function () {
  var queryTerms;
  var dfs = {};
  var numDocs = 0;

  var startTime;

  function search_init(callback) {
    startTime = new Date();
    dfs = {};

    for (var i=0; i<queryTerms.length; i++) {
      var transaction = db.transaction(["df"],"readonly");
      var store = transaction.objectStore("df");
      var request = store.get(queryTerms[i]);
 
      request.onerror = function(e) {
        console.log("Error", e.target.error.name);
      }

      request.onsuccess = (function(query) { return function(e) {
        dfs[query] = e.target.result;
        //console.log(query + ", df=" + e.target.result);
      }})(queryTerms[i]);
    }

    // Note there's a race condition here: we're depending on the stat
    // requests completing before we actual perform query evaluation...

    var query = queryTerms[0];
    //console.log("query term[0]: " + query);
    var transaction = db.transaction(["postings"], "readonly");
    var store = transaction.objectStore("postings");

    var startTime = new Date().getTime();

    //console.log("Start time: " + startTime);

    var range = IDBKeyRange.bound(query + sep, query + ".");
    var cursor = store.openCursor(range);

    var cnt = 0;

    var results = {};
    cursor.onsuccess = function(e) {
      var res = e.target.result;
      if (res) {
        var parts = res.key.split(sep);
      }

      if ( res && parts[0] == query ) {
        // tweets.length is hardcoded
        results[parts[1]] = res.value * Math.log(numDocs/dfs[parts[0]]);;
        cnt++;
        res.continue();
      }

      if ( !res || parts[0] != query ) {
        var end = new Date().getTime();
        //console.log(Object.keys(results).length + " hits in " + (end-startTime) + "ms");
        //console.log(results);

        if (queryTerms.length > 1 ) {
          search_cont(1, results, callback);
        } else {
          callback(results, startTime);
        }
      }
    };
  }

  function search_cont(n, results, callback) {
    var query = queryTerms[n];
    //console.log("query term[" + n + "]: " + query);

    var transaction = db.transaction(["postings"], "readonly");
    var store = transaction.objectStore("postings");

    var startTime = new Date().getTime();

    var range = IDBKeyRange.bound(query + sep, query + ".");
    var cursor = store.openCursor(range);

    var cnt = 0;

    cursor.onsuccess = function(e) {
      var res = e.target.result;
      if (res) {
        var parts = res.key.split(sep);
      }

      if ( res && parts[0] == query ) {
        if ( parts[1] in results) {
          // tweets.length is hardcoded
          results[parts[1]] += res.value * Math.log(numDocs/dfs[parts[0]]);
        }

        cnt++;
        res.continue();
      }

      if ( !res || parts[0] != query ) {
        var end = new Date().getTime();
        //console.log((end-startTime) + "ms");
        if ( n < queryTerms.length-1 ) {
          search_cont(n+1, results, callback);
        } else {
          callback(results, startTime);
        }
      }
    };
  }

  return {
    search : function(qt, callback) {
      queryTerms = qt;
      search_init(callback);
    },

    setNumDocs : function(n) {
      numDocs = n;
    }
  };
})();
