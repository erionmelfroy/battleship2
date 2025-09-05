import { enemy } from './enemy.js'

const newGameBtn = document.getElementById('newGame')
export function newGame () {
  enemy.resetModel()
  enemy.resetUI(enemy.ships)
}

function setupSeekShortcuts (placement) {
  if (placement) {
    document.getElementById('newPlace2').addEventListener('click', placement)
  }
  document.addEventListener('keydown', function (event) {
    switch (event.key) {
      case 'p':
      case 'P':
        if (placement) placement()
        break
      case 'r':
      case 'R':
        newGame()
        break
      case 'v':
      case 'V':
        enemy.onClickReveal()
        break
      case 'm':
      case 'M':
        if (!enemy.carpetMode) enemy.onClickCarpetMode()
        break
      case 's':
      case 'S':
        if (enemy.carpetMode) enemy.onClickCarpetMode()
        break
    }
  })
}
export function setupEnemy (placement) {
  // wire buttons
  newGameBtn.addEventListener('click', newGame)
  enemy.wireupButtons()
  setupSeekShortcuts(placement)
}
