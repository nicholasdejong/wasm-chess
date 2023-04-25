# Chess Lite `v0.0.1`
Chess Lite takes a more pragmatic approach to my other [chess engine](https://github.com/nickacide/chess-engine). What makes this release much better than my other one is the fact that the `engine.js` file doesn't need any information from other files. It simply distributes all the functions required to create a chess client. Not only is this a huge improvement (making it reusable for other chess-related projects), but this approach also improves performance and readability. 
##  Key differences and Concepts
Along with a whole rewrite of the engine file, this project also boasts:
- **Improved function parameters, preventing your code from repeatedly calculating known data.**
	eg: Since we already determine the board state given the FEN, we don't need to provide the fen to a certain 	function, but rather feed the board as parameter. This saves on performance as code is calculated once and for all.
- **The board stores all the FEN data in a 12x12 array.**
	A key problem in the previous engine is that we were using an 8x8 board to represent the FEN string. Because we had no efficient way of knowing when a piece should stop looking in a certain direction with an 8x8 board, we obscure the readability and performance that we try to improve. 
- **Less hardcoded values, allowing for easily implementing custom chess logic**
	Due to the use of more constants and less hardcoded variable reliability, you can easily change, for example, how a queen moves. Because I was repeating myself so much in the previous engine, implementation became an inconvenience.


## Update
It's been some time. I find it so funny thinking I am optimizing well even though I haven't touched anything like bitboards ( yet ;> ). I have decided to disband this engine in favour of building a C++ chess engine instead. As fun as it was building a chess engine in JavaScript (don't ask me why it was fun), my engine is incredibly slow. After implementing Alpha Beta it sped up a bit but the fact that it can't go past depth 3 in midgame is sad. I am relying on C++ for big performance increases due to the fact that I am very bad at optimizing. I might tamper on this engine here and there but nothing major will be implemented as of now on. 

Goodbye, ChessLite.
