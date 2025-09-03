import { mapUI } from './mapUI.js'
import { friend } from './friend.js'
import { selection } from './utils.js'
import { friendUI } from './friendUI.js'

const newGameBtn = document.getElementById('newGame')
friend.UI.resetBoardSize()

function newGame () {
  friend.testContinue = false
  friend.UI.testBtn.disabled = false
  friend.UI.placeMode()
  friend.resetModel()
  friend.resetUI(friend.ships)
}
// wire buttons
newGameBtn.addEventListener('click', newGame)
friend.wireupButtons()

mapUI.setup(function () {
  friend.UI.resetBoardSize()
  newGame()
})
document.addEventListener('keydown', function (event) {
  switch (event.key) {
    case 'c':
    case 'C':
      newGame()
      break
    case 'r':
    case 'R':
      friend.onClickRotate()
      break
    case 'l':
    case 'L':
      friend.onClickRotateLeft()
      break
    case 'f':
    case 'F':
      friend.onClickFlip()
      break
    case 't':
    case 'T':
      friend.onClickTest()
      break
    case 's':
    case 'S':
      friend.onClickStop()
      break
  }
})

let lastmodifier = ''
let dragCounter = 0
friend.UI.dragEnd(document, () => {
  lastmodifier = ''
  dragCounter = 0
})

friend.UI.board.addEventListener('dragenter', e => {
  e.preventDefault()

  dragCounter++

  if (dragCounter > 1 || !selection) return

  selection.hide()
})

friend.UI.board.addEventListener('dragleave', e => {
  e.preventDefault()
  dragCounter--
  if (dragCounter > 0) return

  friend.UI.removeHighlight()

  if (!selection) return
  selection.show()
})

document.addEventListener('dragover', e => {
  e.preventDefault()

  if (!selection) return
  //const effect = e.dataTransfer.dropEffect
  const allow = e.dataTransfer.effectAllowed

  let changed = false
  if (lastmodifier !== allow) {
    lastmodifier = allow
    if (allow === 'link') {
      selection.rotate()
      changed = true
    } else if (allow === 'copy') {
      selection.flip()
      changed = true
    } else if (allow === 'none') {
      changed = true
    }
  }

  // position highlight under cursor
  if (changed && selection?.isNotShown()) {
    friendUI.highlight(friend.shipCellGrid)
  }

  // position ghost under cursor
  if (selection?.isNotShown()) {
    selection.move(e)
  }
})

// initial
newGame()
