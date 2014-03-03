var sep = "+";
var db;
 
function indexedDBOk() {
 return "indexedDB" in window;
}
 
document.addEventListener("DOMContentLoaded", function() {
  if (!indexedDBOk) return;

  //indexedDB.deleteDatabase("index");

  var openRequest = indexedDB.open("index", 1);

  openRequest.onupgradeneeded = function(e) {
    var thisDB = e.target.result;

    if (!thisDB.objectStoreNames.contains("postings")) {
      thisDB.createObjectStore("postings");
    }

    if (!thisDB.objectStoreNames.contains("df")) {
      thisDB.createObjectStore("df");
    }
  }

  openRequest.onsuccess = function(e) {
    db = e.target.result;

    document.querySelector("#indexButton").addEventListener("click", index, false);
    document.querySelector("#searchButton").addEventListener("click", search, false);
    document.querySelector("#statsButton").addEventListener("click", stats, false);
    document.querySelector("#dfButton").addEventListener("click", buildDf, false);

    console.log("Initialization complete!");
  }
 
  openRequest.onerror = function(e) {
    // Do something for the error
  }
 
}, false);
