// Indexing code

var gNumTokens = 0;
var gIndexStartTime;

function index(e) {
  gIndexStartTime = new Date().getTime();
  index_tweet(0);
}

function index_tweet(i) {
  if ( i % 100 == 0 ) {
    console.log("Indexed " + i + " documents: Elapsed time = " + 
      (new Date().getTime()-gIndexStartTime) + "ms");
  }

  var tokens = tokenizeToHistogram(tweets[i].text);

  // console.log(tweets[i].id_str, tokens);

  var tuples = [];
  for (var key in tokens) tuples.push([key, tokens[key]]);

  if ( tuples.length == 0 ) {
    // NOTES: corner case here, won't work if last tweet is empty.
    index_tweet(i+1)
  } else {
    index_term(i, 0, tuples);
  }
}

function index_term(i, j, tokens) {
  gNumTokens++;
  var transaction = db.transaction(["postings"], "readwrite");
  var store = transaction.objectStore("postings");

  // Remember to use id_str because of Javascript precision issues.
  var t = tokens[j][0] + sep + tweets[i].id_str;

  var request = store.add(tokens[j][1], t);
 
  request.onerror = function(e) {
    console.log("Error", e.target.error.name);
    // Need better error trapping up this will do for now.
    index_tweet(i+1)
  }

  request.onsuccess = function(e) {
    if (j < tokens.length-1) {
      index_term(i, j+1, tokens);
    } else if (i < tweets.length-1) {
      index_tweet(i+1)
    } else {
      var end = new Date().getTime();
      console.log("Number of tweets indexed: " + (i+1));
      console.log("Number of tokens indexed: " + gNumTokens);
      console.log("Indexing time: " + (end - gIndexStartTime) + "ms");
    }
  }
}

function tokenizeToHistogram(s) {
  var raw = s.split(' ');

//  raw = raw.map(function(x) { return x.replace(/(^[^A-Za-z]+)|([^A-Za-z]+$)/g, "").toLowerCase()})
//           .filter(function(x) { return x.length > 0 ? true : false; });

  var tokens = {};

  for (var n=0; n<raw.length; n++) {
    if ( raw[n] in tokens ) {
      tokens[raw[n]]++;
    } else {
      tokens[raw[n]] = 1;
    }
  }

  return tokens;
}
