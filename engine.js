//engine.js should not and will not require any references from index.js and vice versa. There should be no correlation between the two apart from index referencing the necessary functions in engine.
//I will be reusing some of the code from my other repository where needed (https://github.com/nickacide/chess-engine/blob/latest/engine.js)

const STARTING_FEN = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`;
const WHITE = 'w';
const BLACK = 'b';

/*
    I will be taking a different approach that I have seen on YouTube: 
    Instead of representing the board as Array(64), I will be adding to extra files/ranks on each side, giving us Array(144).
    This implementation will make it easier to check whether a piece has 'looked' too far in a certain direction.
    This applies for every piece, justifying the implementation's necessity. The second file/row is for knights. 
    Technically, we only need 1 layer on each side, but I will look into that in the future; let's just get the engine working.
*/

const pieceValues = {
    'k': 600,
    'q': 9.3,
    'r': 4.8,
    'b': 3.2,
    'n': 2.8,
    'p': 1,
    'K': 600,
    'Q': 9.3,
    'R': 4.8,
    'B': 3.2,
    'N': 2.8,
    'P': 1
}

const invertTurn = turn => turn == WHITE ? BLACK : WHITE;
const indexOnBoard = index => {
    index -= 26;
    if (index >= 0 && index <= 91 && index % 12 < 8) return true;
    return false;
}
const inRange = index => index >= 0 && index < 64 ? true : false;
const toIndex8 = pIndex => {
    pIndex -= 26;
    return pIndex - Math.floor(pIndex / 12) * 4;
}
const toIndex12 = pIndex => pIndex + 26 + 4 * Math.floor(pIndex / 8);
const toBoard8 = board => {
    const board8 = [];
    board.map(sq => {
        if (sq !== '_') board8.push(sq);
    });
    return board8;
}
const toFEN = (board8, move, castling) => {
    let fen = '';
    for (i = 1; i <= 64; i++) {
        let piece = board8[i - 1];
        if (piece == ' ') piece = '1';
        fen += piece;
        if (i % 8 == 0 && i != 64) fen += '/';
    };
    fen += ' ' + move + ' ' + castling + ' - 0 1';
    return formatFEN(fen);
}
const pieceColor = (board, pIndex) => {
    const piece = board[pIndex];
    if (piece === ' ' || piece === '_' || piece === undefined) return null;
    if (piece == piece.toUpperCase()) return WHITE;
    return BLACK;
}
const isPiece = piece => 'KQBNRPkqbnrp'.includes(piece) && piece.length == 1 ? true : false;
const checkFEN = fen => {
    if (fen.trim() === '') return false;
    if (fen.match(/^(([1-8]|[kqbnrKQBNR])+\/)(([1-8]|[kqpbrnKQPBRN])+\/){6}([1-8]|[kqbrnKQBRN]){0,8}( [wb]( (?! ))((K?Q?k?q?)|-) (([a-h][1-8])|-) (\d\d?) (\d\d?\d?))$/g)?.length !== 1) return false;
    let position = fen.split(' ')[0];
    if (position.match(/[K]/g)?.length !== 1 || position.match(/[k]/g)?.length !== 1) return false;
    return true;
}
const verifyFEN = fen => {
    if (!checkFEN(fen)) return false;
    const move = fen.split(' ')[1];
    const check = inCheck(fromFEN(fen));
    if (check == 'a') return false;
    if (check) if (move !== check) return false;
    let formatted = formatFEN(fen);
    let chars = 0;
    for (const char of formatted.split(' ')[0] + '/') {
        if (char == '/') {
            if (chars !== 8) return false;
            chars = 0;
        }
        else if (isPiece(char)) { chars++ }
        else if (parseInt(char)) { chars += parseInt(char) }
        else return false;
    }
    return true;
}
const inCheck = board => {
    const { wSpace, bSpace } = spaceControl(board);
    const check = [];
    if (wSpace.includes(board.indexOf('k'))) check.push(BLACK);
    if (bSpace.includes(board.indexOf('K'))) check.push(WHITE);
    if (check.length === 2) return 'a';
    if (check.length === 0) return false;
    return check[0];
}
const fromFEN = fen => {
    const board = [];
    for (i = 0; i < 144; i++) {
        if (indexOnBoard(i)) { board.push('') }
        else board.push('_')
    }
    const position = fen.split(" ")[0];
    let pointer = 26;
    for (const piece of position) {
        if (piece == '/') {
            pointer += 4;
        } else if (parseInt(piece)) {
            for (i = 0; i < parseInt(piece); i++) {
                board[pointer] = ' ';
                pointer++;
            }
        } else if (piece.match(/[KQBNRP]/gi)) {
            board[pointer] = piece;
            pointer++;
        }
    };
    return board;
}
const toSquare = str => toIndex12(7 - (104 - str[0].charCodeAt(0)) + (8 - parseInt(str[1])) * 8);
const applyUCIMove = (board, str) => {
    let from = toIndex12(7 - (104 - str[0].charCodeAt(0)) + (8 - parseInt(str[1])) * 8);
    let to = toIndex12(7 - (104 - str[2].charCodeAt(0)) + (8 - parseInt(str[3])) * 8);
    console.log(from, to);
    return applyMove(board, from, to);
}
const _fromBoard = (board, color) => {
    let fen = '';
    let count = 0;
    let pointer = 1;
    for (const sq of board) {
        if (pointer > 8) {
            if (count !== 0) fen += count;
            count = 0;
            fen += '/';
            pointer = 1;
        }
        if (isPiece(sq)) {
            if (count !== 0) fen += count;
            count = 0;
            fen += sq;
        }
        if (sq == ' ') count++;
        pointer++;
    };
    if (count !== 0) fen += count;
    return `${fen} ${color} - - 0 1`;
}
const formatFEN = fen => {
    let currentTotal = 0;
    let newFEN = '';
    const position = fen.split(' ')[0];
    for (const char of position) {
        if (typeof parseInt(char) == 'number' && parseInt(char) > 0 && parseInt(char) <= 9) {
            currentTotal += parseInt(char);
        } else {
            if (currentTotal !== 0) newFEN += currentTotal;
            currentTotal = 0;
            newFEN += char;
        }
    };
    if (currentTotal !== 0) newFEN += currentTotal;
    newFEN += fen.slice(fen.indexOf(' '), fen.length)
    return newFEN;
}
const pieceLocations = (board, color) => {
    const pieces = [];
    board.forEach((square, sIndex) => {
        if (!isPiece(square)) return;
        if (color == BLACK && square == square.toUpperCase()) return;
        if (color == WHITE && square == square.toLowerCase()) return;
        pieces.push(sIndex);
    });
    return pieces;
}
const pieceMoves = (board, pIndex, options = { space: false }) => {
    if (!indexOnBoard(pIndex)) return [];
    const piece = board[pIndex];
    const pMoves = [];
    const { space } = options;
    // console.log(piece)
    if (piece == undefined) return [];
    if (piece == 'k') {
        if (pIndex == 30 && board[pIndex + 1] == ' ' && board[pIndex + 2] == ' ' && board[pIndex + 3] == 'r') {
            pMoves.push(pIndex + 2);
        } else if (pIndex == 30 && board[pIndex - 1] == ' ' && board[pIndex - 2] == ' ' && board[pIndex - 3] == ' ' && board[pIndex - 4] == 'r') {
            pMoves.push(pIndex - 2);
        }
    } else if (piece == 'K') {

        if (pIndex == 114 && board[pIndex + 1] == ' ' && board[pIndex + 2] == ' ' && board[pIndex + 3] == 'R') {
            pMoves.push(pIndex + 2);
        } else if (pIndex == 114 && board[pIndex - 1] == ' ' && board[pIndex - 2] == ' ' && board[pIndex - 3] == ' ' && board[pIndex - 4] == 'R') {
            pMoves.push(pIndex - 2);
        }
    }
    switch (piece.toLowerCase()) {
        case "p": {
            const pColor = pieceColor(board, pIndex);
            const captures = pColor == WHITE ? [-11, -13] : [11, 13];
            const isstart = pColor == WHITE ? pIndex > 97 && pIndex < 106 : pIndex > 37 && pIndex < 46;
            const moves = pColor == WHITE ? [-12] : [12];
            const double = pColor == WHITE ? -24 : 24;
            captures.map(capture => {
                let cIndex = pIndex + capture;
                if (space) return pMoves.push(cIndex);
                if (board[cIndex] !== ' ') {
                    if (pieceColor(board, cIndex) === pColor) return;
                    return pMoves.push(cIndex);
                }
            });
            if (isstart && board[pIndex + moves[0]] == ' ') moves.push(double);
            moves.map(move => {
                if (space) return;
                let mIndex = pIndex + move;

                if (board[mIndex] !== ' ') return;
                return pMoves.push(mIndex);
            })
            break;
        } case "n": {
            [14, -14, 10, -10, 25, -25, 23, -23].map(move => {
                let newIndex = pIndex + move;
                if (space) return pMoves.push(newIndex);
                if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                if (board[newIndex] !== ' ') {
                    if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                    return pMoves.push(newIndex);
                }
                pMoves.push(newIndex);
            });
            break;
        } case "q": {
            [-11, 13, 11, -13, -12, 12, -1, 1].map(move => {
                for (i = 1; i < 8; i++) {
                    let newIndex = pIndex + move * i;
                    if (!indexOnBoard(newIndex)) return;
                    if (space) {
                        if (board[newIndex] !== ' ') return pMoves.push(newIndex);
                        pMoves.push(newIndex);
                    } else {
                        if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                        if (board[newIndex] !== ' ') {
                            if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                            return pMoves.push(newIndex);
                        }
                        pMoves.push(newIndex);
                    }
                }
            });
            break;
        } case "b": {
            [-11, 13, 11, -13].map(move => {
                for (i = 1; i < 8; i++) {
                    let newIndex = pIndex + move * i;
                    if (space) {
                        if (board[newIndex] !== ' ') return pMoves.push(newIndex);
                        pMoves.push(newIndex)
                    } else {
                        if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                        if (board[newIndex] !== ' ') {
                            if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                            return pMoves.push(newIndex);
                        }
                        pMoves.push(newIndex);
                    }
                }
            });
            break;
        } case "k": {
            // console.log(pIndex);
            [-11, 13, 11, -13, -12, 12, -1, 1].map(move => {
                let newIndex = pIndex + move;
                if (space) return pMoves.push(newIndex);
                if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                if (board[newIndex] !== ' ') {
                    if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                    return pMoves.push(newIndex);
                }
                pMoves.push(newIndex);
            });
            break;
        } case "r": {
            [-12, 12, -1, 1].map(move => {
                for (i = 1; i < 8; i++) {
                    let newIndex = pIndex + move * i;
                    if (space) {
                        if (board[newIndex] !== ' ') return pMoves.push(newIndex);
                        pMoves.push(newIndex);
                    };
                    if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                    if (board[newIndex] !== ' ') {
                        if (pieceColor(board, newIndex) === pieceColor(board, pIndex)) return;
                        return pMoves.push(newIndex);
                    }
                    pMoves.push(newIndex);
                }
            });
            break;
        }
    }
    return [...new Set(pMoves)].filter(move => indexOnBoard(move)).sort((a, b) => a - b);
}
const spaceControl = board => {
    const wSpace = [];
    const bSpace = [];
    board.map((piece, pIndex) => {
        const pMoves = pieceMoves(board, pIndex, { space: true });
        pieceColor(board, pIndex) == WHITE ? wSpace.push(...pMoves) : bSpace.push(...pMoves);
    });
    return {
        wSpace: [...new Set(wSpace)].filter(indexOnBoard).sort((a, b) => a - b),
        bSpace: [...new Set(bSpace)].filter(indexOnBoard).sort((a, b) => a - b),
    }
}
const orderMoves = (board, moves) => {
    // console.log(moves);
    const labelledMoves = []; // move labelled with estimated score
    for (const [pIndex, mIndexes] of moves) {
        for (const mIndex of mIndexes) {
            let piece = board[pIndex];
            let square = board[mIndex];
            let score = 0;
            // console.log(piece, square, isPiece(piece), isPiece(square));
            if (isPiece(piece) && isPiece(square)) {
                score += pieceValues[square] - pieceValues[piece];
            }
            labelledMoves.push({ pIndex, mIndex, score });
        }
    }
    // console.log(labelledMoves);
    return labelledMoves.sort((a, b) => b.score - a.score)//.map(e=>e.move);
}
const validMoves = (board, pIndex) => {
    let moves = [];
    if (inCheck(board)) {
        let piece_moves = pieceMoves(board, pIndex);
        for (const piece_move of piece_moves) {
            let new_pos = applyMove(board, pIndex, piece_move);
            // console.log(new_pos);
            if (inCheck(new_pos) != 'a' && inCheck(new_pos) != pieceColor(board, pIndex)) {
                moves.push(piece_move);
            }
        }
    } else {
        let piece_moves = pieceMoves(board, pIndex);
        for (const piece_move of piece_moves) {
            let new_pos = applyMove(board, pIndex, piece_move);
            if (inCheck(new_pos) != pieceColor(board, pIndex) && inCheck(new_pos) != 'a') {
                moves.push(piece_move);
            }
        }
    };
    return moves;
}
const getMoves = board => {
    // moves = 0;
    // let then = Date.now();
    const wMoves = [];
    const bMoves = [];
    board.map((piece, pIndex) => {
        if (isPiece(piece)) {
            const pMoves = validMoves(board, pIndex);
            // moves+=pMoves.length;
            if (pMoves.length) pieceColor(board, pIndex) == WHITE ? wMoves.push([pIndex, pMoves]) : bMoves.push([pIndex, pMoves]);
        }
    });
    let now = Date.now();
    // console.log(moves, now - then);
    return {
        wMoves,//: orderMoves(board, wMoves),
        bMoves,//: orderMoves(board, bMoves),
    }
}
const applyMove = (board, pIndex, mIndex) => {
    let b = [...board];
    const piece = b[pIndex];
    if (piece == 'k') {
        if (mIndex - pIndex == 2) {
            b[33] = ' ';
            b[31] = 'r';
            b[32] = 'k';
            b[30] = ' ';
            return b;
        } else if (pIndex - mIndex == 2) {
            b[26] = ' ';
            b[29] = 'r';
            b[30] = ' ';
            b[28] = 'k';
            return b;
        }
    } else if (piece == 'K') {
        // console.log(pIndex, mIndex);
        if (mIndex - pIndex == 2) {
            b[114] = ' ';
            b[117] = ' ';
            b[115] = 'R';
            b[116] = 'K';
            return b;
        } else if (pIndex - mIndex == 2) {
            b[110] = ' ';
            b[113] = 'R';
            b[114] = ' ';
            b[112] = 'K';
            return b;
        }
    }
    b[pIndex] = ' ';
    b[mIndex] = piece;
    if (mIndex > 25 && mIndex < 34 && piece == 'P') {
        b[mIndex] = 'Q';
    } else if (mIndex > 109 && mIndex < 118 && piece == 'p') {
        b[mIndex] = 'q';
    }
    return b;
}
const gameOver = board => {
    return inCheck(board) && (pieceMoves(board, board.indexOf('K')).length == 0 || pieceMoves(board, board.indexOf('k')).length == 0);
}
const board64 = board => {
    let display = '';
    for (i = 0; i < board.length; i++) {
        if (board[i] == ' ') display += '__'; else display += board[i] + board[i];
        if ((i + 1) % 8 == 0) display += '\n';
    };
    return display;
}

const displaySquare = sq => {
    return String.fromCharCode(97 + toIndex8(sq) % 8) + (8 - Math.floor(toIndex8(sq) / 8));
}

const displayMove = (from, to) => {
    return displaySquare(from) + displaySquare(to);
}

const displayPV = pv => {
    return pv.map(m => displayMove(...m)).toReversed();
}

let pv = [];

const iterative_deepening = (board, depth, isMax) => {
    let prevMoveOrder = [];
    let moves = isMax ? getMoves(board).wMoves : getMoves(board).bMoves;
    for (let [pIndex, mIndexes] of moves) {
        for (let mIndex of mIndexes) {
            let new_board = applyMove(board, pIndex, mIndex);
            prevMoveOrder.push({pIndex, mIndex, score: evaluate(new_board, !isMax)});
            prevMoveOrder.sort((a,b)=>a.score-b.score);
        }
    }
    for (d = 2; d <= depth; d++) {
        let newMoveOrder = [];
        for (let {pIndex, mIndex} of prevMoveOrder) {
            let new_board = applyMove(board, pIndex, mIndex);
            newMoveOrder.push({pIndex, mIndex, score: negamax(new_board, d - 1, !isMax)});
        }
        newMoveOrder.sort((a,b)=>a.score-b.score);
        prevMoveOrder = newMoveOrder;
    }
    return prevMoveOrder;
}
// const iterative_deepening = (board, depth, isWhite) => {
//     let then = Date.now();
//     let { wMoves, bMoves } = getMoves(board);
//     let moves = isWhite ? wMoves : bMoves;
//     let orderedMoves = [];
//     for (let { pIndex, mIndex } of orderMoves(board, moves)) {
//         let newBoard = applyMove(board, pIndex, mIndex);
//         let score = negamax(newBoard, 1, isWhite);
//         orderedMoves.push({ pIndex, mIndex, score });
//     }
//     orderedMoves = orderedMoves.sort((a, b) => b.score - a.score);
//     negamax(board, 3, isWhite, orderedMoves);
//     let now = Date.now();
//     console.log(`With move ordering: ${now - then}ms`);
//     then = Date.now();
//     negamax(board, 3, isWhite);
//     now = Date.now();
//     console.log(`Without move ordering: ${now - then}ms`);
//     // console.log(orderedMoves.sort((a,b)=>b.score-a.score));
//     console.log(orderedMoves);
// }
const negamax = (board, depth, isWhite, orderedMoves, alpha = -Infinity, beta = Infinity) => {
    function negamaxSearch(board, depth, isWhite, orderedMoves, alpha, beta) {
        if (depth <= 0 || gameOver(board)) return evaluate(board, isWhite);
        let { wMoves, bMoves } = getMoves(board);
        let moves = isWhite ? wMoves : bMoves;
        let bestscore = -Infinity;
        for (const { pIndex, mIndex } of orderedMoves ? orderedMoves : orderMoves(board, moves)) {
            let newBoard = applyMove(board, pIndex, mIndex);
            let score = -negamaxSearch(newBoard, depth - 1, !isWhite, undefined, -beta, -alpha);
            if (score >= beta) return score;
            if (score > bestscore) {
                bestscore = score;
                if (score > alpha) {
                    alpha = score;
                }
            }
        }
        return bestscore;
    }
    let score = negamaxSearch(board, depth, isWhite, orderedMoves, alpha, beta);
    return score;
}
// const minimax = (board, depth, isWhite, alpha = -Infinity, beta = Infinity) => {
//     if (depth <= 0 || gameOver(board)) return [evaluate(board, isWhite), []];
//     let { wMoves, bMoves } = getMoves(board);
//     if (isWhite) {
//         let max = -Infinity;
//         let bestMove = [];
//         outer: for (const { pIndex, mIndex } of orderMoves(board, wMoves)) {
//             // for (const mIndex of mIndexes) {
//             if (!pv[depth - 1]) pv[depth - 1] = [pIndex, mIndex];
//             const newBoard = applyMove(board, pIndex, mIndex);
//             const [score, _] = minimax(newBoard, depth - 1, false, alpha, beta);
//             if (score > max) {
//                 max = score;
//                 bestMove = [pIndex, mIndex];
//                 pv[depth - 1] = bestMove;
//             }
//             alpha = Math.max(alpha, score);
//             if (alpha >= beta) {
//                 break outer;
//             };
//             // }
//         };
//         return [max, bestMove];
//     } else {
//         let min = Infinity;
//         let bestMove = [];
//         outer: for (const { pIndex, mIndex } of orderMoves(board, bMoves)) {
//             // for (const mIndex of mIndexes) {
//             if (!pv[depth - 1]) pv[depth - 1] = [pIndex, mIndex];
//             const newBoard = applyMove(board, pIndex, mIndex);
//             const [score, _] = minimax(newBoard, depth - 1, true, alpha, beta);
//             if (score < min) {
//                 min = score;
//                 bestMove = [pIndex, mIndex];
//                 pv[depth - 1] = bestMove;
//             }
//             beta = Math.min(beta, score);
//             if (alpha >= beta) break outer;
//             // };
//         };
//         return [min, bestMove];
//     }
// }
const b = fromFEN(STARTING_FEN);