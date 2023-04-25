//The reason I am making a seperate project from my chess engine is because my chess engine is inefficient and poorly written. I'm trying to apply what I've learnt there, here.
const board = document.querySelector('#board');
const overlay = document.querySelector('#overlay');
const fenInput = document.querySelector('#fen');
const makeMove = document.querySelector('#makeMove');
// document.querySelector('#depth').value = '3'
let fen;
let brd;

//not very proud of this segment, please suggest a better way to go about reacting accordingly to a resize of the board
const maintainAspectRatio = (el) => {
    el = el[0].target;
    if (parseInt(el.style.width) > 650) return;
    el.style.height = el.style.width;
    board.style.width = el.style.width;
    board.style.height = el.style.height;
    if (board.style.width == '') board.style.width = '500px';
    bWidth = parseInt(board.style.width)
    // if (bWidth == '') bWidth = '500';
    board.style['grid-template-columns'] = `repeat(8, ${(bWidth) / 8}px)`;
    overlay.style['grid-template-columns'] = `repeat(8, ${(bWidth) / 8}px)`;
    document.querySelector('#menu').style.width = board.style.width;
    // let fenLabel = document.querySelector('#fen');
    // if (fenLabel.style.width == '') fenLabel.style.width = '36px';
    document.querySelector('#fen').style.width = (bWidth - parseInt(document.querySelector('#fenLabel').offsetWidth) - 30) + 'px'
}
new ResizeObserver(maintainAspectRatio).observe(overlay);

const applyFEN = fen => {
    const board8 = toBoard8(fromFEN(fen));
    board8.map((piece, pIndex) => {
        overlay.children[pIndex].style.backgroundImage = '';
        if (isPiece(piece)) {
            let resourceName = pieceColor(board8, pIndex) == WHITE ? `w${piece.toLowerCase()}` : `b${piece}`;
            overlay.children[pIndex].style.backgroundImage = `url(./assets/${resourceName}.svg)`
        };
    });
    brd = fromFEN(fen)
}
const _applyBoard = board => {
    board.map((piece, pIndex) => {
        // console.log(pIndex)
        overlay.children[pIndex].style.backgroundImage = '';
        if (isPiece(piece)) {
            let resourceName = pieceColor(board, pIndex) == WHITE ? `w${piece.toLowerCase()}` : `b${piece}`;
            overlay.children[pIndex].style.backgroundImage = `url(./assets/${resourceName}.svg)`
        };
    });
}
const cleanBoard = () => {
    for (i = 0; i < 64; i++) {
        board.children[i].style.backgroundColor = '';
    }
}
const showMove = (pIndex, mIndex) => {
    board.children[pIndex].style.backgroundColor = '#beffad';
    board.children[mIndex].style.backgroundColor = '#96ff7a';
    console.log(displayPV(pv));
}
const getTurn = fen => fen.split(' ')[1];
const main = () => {
    // let then = Date.now();
    // let now = Date.now();
    // console.log(now - then + 'ms')
    fen = STARTING_FEN;
    let clickedPieceIndex = NaN;
    applyFEN(fen)
    makeMove.onclick = () => {
        let depth = parseInt(document.querySelector('#depth').value);
        if (!isNaN(depth) && getTurn(fen) == 'w') {
            best_move(fen, depth);
            // let [evaluation, [pIndex, mIndex]] = minimax(fromFEN(fen), depth, true);
            // brd = applyMove(fromFEN(fen), pIndex, mIndex);
            // fen = _fromBoard(toBoard8(brd), 'b');
            // document.querySelector('#evaluation').innerText = 'Evaluation: ' + (evaluation > 0 ? '+' : '-') + Math.abs(evaluation.toFixed(4)) + ', fen: ' + fen;
            // applyFEN(fen);
            // cleanBoard();
            // showMove(toIndex8(pIndex), toIndex8(mIndex));
        }
    }
    const squareClick = (e, sIndex) => {
        if (getTurn(fen) == 'b') {
            if (isNaN(clickedPieceIndex)) {
                if (pieceColor(toBoard8(fromFEN(fen)), sIndex) == BLACK) {
                    clickedPieceIndex = sIndex;
                    board.children[sIndex].style.backgroundColor = '#54ed1c';
                    for (const [pIndex, mIndexes] of getMoves(fromFEN(fen)).bMoves) {
                        if (toIndex8(pIndex) == sIndex) {
                            for (mIndex of mIndexes) {
                                board.children[toIndex8(mIndex)].style.backgroundColor = '#1cdfed';
                            }
                        }
                    }
                }
            } else {
                if (pieceColor(toBoard8(fromFEN(fen)), sIndex) == BLACK) {
                    cleanBoard();
                    clickedPieceIndex = sIndex;
                    board.children[sIndex].style.backgroundColor = '#54ed1c';
                    for (const [pIndex, mIndexes] of getMoves(fromFEN(fen)).bMoves) {
                        if (toIndex8(pIndex) == sIndex) {
                            for (mIndex of mIndexes) {
                                board.children[toIndex8(mIndex)].style.backgroundColor = '#1cdfed';
                            }
                        }
                    }
                } else {
                    cleanBoard();
                    for (const [pIndex, mIndexes] of getMoves(fromFEN(fen)).bMoves) {
                        if (toIndex8(pIndex) == clickedPieceIndex) {
                            for (mIndex of mIndexes) {
                                if (toIndex8(mIndex) == sIndex) {
                                    // board.children[clickedPieceIndex].style.backgroundColor = '#beffad';
                                    // board.children[sIndex].style.backgroundColor = '#96ff7a';
                                    showMove(clickedPieceIndex, sIndex);
                                    brd = applyMove(fromFEN(fen), toIndex12(clickedPieceIndex), toIndex12(sIndex));
                                    fen = _fromBoard(toBoard8(brd), 'w');
                                    applyFEN(fen);
                                    setTimeout(makeMove.onclick, 500);
                                    // makeMove.onclick();
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    const overlayArr = Array.from(document.querySelector('#overlay').children);
    overlayArr.map((square, sIndex) => {
        square.onclick = e => squareClick(e, sIndex);
    });

    const fenChange = () => {
        if (verifyFEN(fenInput.value)) {
            fen = fenInput.value;
            brd = fromFEN(fen);
            applyFEN(fen);
        }
    }
    fenInput.onkeydown = fenChange;
    fenInput.onkeyup = fenChange;
    //makeMove.onclick();
}

document.addEventListener('DOMContentLoaded', main)
