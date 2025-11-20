const btnTic = document.getElementById('btnTic');
btnTic.addEventListener('click', startTicTacToe);

function hideMenu() {
  document.getElementById('menu').classList.add('hidden');
}

function showCanvas() {
  document.getElementById('gameContainer').classList.remove('hidden');
}

function hideCanvas() {
  document.getElementById('gameContainer').classList.add('hidden');
}

function startTicTacToe() {
  hideMenu();
  showCanvas();

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const size = 600;
  const cell = size / 3;

  let board = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];

  let currentPlayer = 'X';
  let gameOver = false;

  function drawBoard() {
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;

    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(size, i * cell);
      ctx.stroke();
    }

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const val = board[row][col];
        if (val) {
          ctx.font = '120px sans-serif';
          ctx.fillStyle = val === 'X' ? 'rgba(30, 30, 166, 1)' : 'rgba(194, 24, 24, 1)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val, col * cell + cell / 2, row * cell + cell / 2);
        }
      }
    }
  }

  function checkWin() {
    const lines = [
      // Filas
      [board[0][0], board[0][1], board[0][2]],
      [board[1][0], board[1][1], board[1][2]],
      [board[2][0], board[2][1], board[2][2]],
      // Columnas
      [board[0][0], board[1][0], board[2][0]],
      [board[0][1], board[1][1], board[2][1]],
      [board[0][2], board[1][2], board[2][2]],
      // Diagonales
      [board[0][0], board[1][1], board[2][2]],
      [board[0][2], board[1][1], board[2][0]]
    ];

    for (let line of lines) {
      if (line[0] && line[0] === line[1] && line[1] === line[2]) {
        return line[0];
      }
    }

    return board.flat().includes('') ? null : 'Empate';
  }

  function handleClick(e) {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);

    if (board[row][col] !== '') return;

    board[row][col] = currentPlayer;
    const result = checkWin();

    if (result) {
      gameOver = true;
      drawBoard();
      setTimeout(() => showResult(result), 300);
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      drawBoard();
    }
  }

  function showResult(result) {
    hideCanvas();
    const countdownEl = document.getElementById('countdown');
    const countdownText = document.getElementById('countdownText');
    countdownEl.classList.remove('hidden');
    countdownText.innerHTML = result === 'Empate' ? '🤝 Empate 🤝' : `🎉 Jugador ${result} Gana 🎉`;
    countdownText.className = 'text-5xl animate-pulse';

    setTimeout(() => {
      countdownEl.classList.add('hidden');
      document.getElementById('menu').classList.remove('hidden');
    }, 3001);
  }

  canvas.addEventListener('click', handleClick);
  drawBoard();
}