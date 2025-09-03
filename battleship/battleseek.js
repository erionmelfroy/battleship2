import { mapUI } from './mapUI.js'
import { enemy } from './enemy.js'

const newGameBtn = document.getElementById('newGame')
enemy.UI.resetBoardSize()
function newGame () {
  enemy.resetModel()
  enemy.resetUI(enemy.ships)
}
// wire buttons
newGameBtn.addEventListener('click', newGame)

mapUI.setup(function () {
  enemy.UI.resetBoardSize()
  newGame()
})
enemy.wireupButtons()
document.addEventListener('keydown', function (event) {
  switch (event.key) {
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

// initial
newGame()
