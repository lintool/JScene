JScene
======
(pronounced Jay-Scene, rhymes with Lucene) It's like Lucene, but in JavaScript!

I wondered if it were possible to build a JavaScript search engine that runs completely self-contained inside a browser, using only HTML5 standards. As it turns out, it's possible to take advantage of the IndexDB API, which is implemented by [LevelDB](https://github.com/google/leveldb) inside Google's Chrome browser, to serve as the underlying storage engine. Experiments show that such a design is possible, but much slower than a native search engine such as Lucene (big surprise). Nevertheless, the performance is still sufficient for interactive querying.

This feasibility demonstration opens the door to interesting applications in offline and private search across multiple platforms as well as hybrid split-execution architectures whereby clients and servers collaboratively perform query evaluation.

For more details, check out this paper:

Jimmy Lin. [On the Feasibility and Implications of Self-Contained Search Engines in the Browser](http://arxiv.org/abs/1410.4500). *arXiv:1410.4500*, October 2014.

This repo contains code for experiments in the paper. (Note I've only tried running on Chrome; YMMV on other browsers.)

License
-------

Licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
