const symbols = ['🍎', '🍌', '🍇', '🍉', '🍒', '🥝', '🍑', '🍍'];
let cards = [];
let flipped = [];
let score = 0;
let timer = 0;
let interval;

const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const board = document.getElementById('game-board');
const restartButton = document.getElementById('restart-game');

function startGame() {
  clearInterval(interval);
  score = 0;
  timer = 0;
  scoreElement.textContent = score;
  timerElement.textContent = timer;
  flipped = [];
  cards = [...symbols, ...symbols].sort(() => 0.5 - Math.random());
  board.innerHTML = '';

  cards.forEach((symbol) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.symbol = symbol;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">?</div>
        <div class="card-back">${symbol}</div>
      </div>`;
    card.addEventListener('click', () => flipCard(card));
    board.appendChild(card);
  });

  interval = setInterval(() => {
    timer += 1;
    timerElement.textContent = timer;
  }, 1000);
}

function flipCard(card) {
  if (card.classList.contains('flipped') || flipped.length === 2) {
    return;
  }

  card.classList.add('flipped');
  flipped.push(card);
  if (flipped.length === 2) {
    setTimeout(checkMatch, 700);
  }
}

function checkMatch() {
  const [firstCard, secondCard] = flipped;
  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    score += 1;
    scoreElement.textContent = score;
  } else {
    firstCard.classList.remove('flipped');
    secondCard.classList.remove('flipped');
  }

  flipped = [];
  if (score === symbols.length) {
    clearInterval(interval);
    setTimeout(() => alert(`🎉 You won in ${timer} seconds!`), 300);
  }
}

restartButton.addEventListener('click', startGame);
startGame();
  