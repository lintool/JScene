var sep = "+";
var db;

function indexedDBOk() {
  return "indexedDB" in window;
}

document.addEventListener("DOMContentLoaded", function() {
  if (!indexedDBOk) return;

  var openRequest = indexedDB.open("index", 1);

  openRequest.onupgradeneeded = function (e) {
    var thisDB = e.target.result;

    if (!thisDB.objectStoreNames.contains("postings")) {
      thisDB.createObjectStore("postings");
    }

    if (!thisDB.objectStoreNames.contains("df")) {
      thisDB.createObjectStore("df");
    }
  }

  openRequest.onsuccess = function (e) {
    db = e.target.result;
    console.log("Initialization complete!");
  }

  openRequest.onerror = function (e) {
    console.log("Initialization error!");
  }
}, false);
