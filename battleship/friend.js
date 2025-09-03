import { gameMaps } from './map.js'
import { friendUI } from './friendUI.js'
import { Player } from './player.js'
import { clickedShip } from './utils.js'

class Friend extends Player {
  constructor (friendUI) {
    super(friendUI)
    this.shipCellGrid = []
    this.testContinue = true
  }
  resetShipCell () {
    this.shipCellGrid = Array.from({ length: gameMaps.current.rows }, () =>
      Array(gameMaps.current.cols).fill(null)
    )
  }
  updateUI (ships) {
    ships = ships || this.ships

    this.UI.placeTally(ships)
  }
  randomHit (hits) {
    const len = hits.length
    if (len > 1) return null
    if (len === 1) return hits[0]
    const pick = Math.floor(Math.random() * len)
    return hits[pick]
  }
  chase (hits, seeking) {
    for (let i = 0; i < 30; i++) {
      const [r, c] = this.randomHit(hits)
      for (let j = 0; j < 15; j++) {
        if (!friend.testContinue) {
          clearInterval(seeking)
          return
        }
        if (this.walkShot(r, c)) return
      }
    }
  }
  seekHit (r, c) {
    const key = this.score.createShotKey(r, c)
    if (key === null) {
      // if we are here, it is because of carpet bomb, so we can just
      return false
    }

    this.fireShot(r, c, key)

    this.updateUI(this.ships)
    return true
  }
  walkShot (r, c) {
    const dir = gameMaps.isLand(r, c) ? 5 : 4
    const p = Math.floor(Math.random() * dir)
    switch (p) {
      case 0:
        return this.seekHit(r, c + 1)
      case 1:
        return this.seekHit(r, c - 1)
      case 2:
        return this.seekHit(r + 1, c)
      case 3:
        return this.seekHit(r - 1, c + 1)
      case 4:
        switch (Math.floor(Math.random() * 4)) {
          case 0:
            return this.seekHit(r + 1, c + 1)
          case 1:
            return this.seekHit(r - 1, c - 1)
          case 2:
            return this.seekHit(r + 1, c - 1)
          case 3:
            return this.seekHit(r - 1, c + 1)
        }
    }
  }

  randomSeek (seeking) {
    const maxAttempts = 200
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (!friend.testContinue) {
        clearInterval(seeking)
        return
      }
      const r = Math.floor(Math.random() * gameMaps.current.rows)
      const c = Math.floor(Math.random() * gameMaps.current.cols)
      if (this.seekHit(r, c)) {
        return
      }
    }
  }
  seek () {
    this.testContinue = true
    this.score.shot = new Set()
    let seeking = setInterval(function () {
      if (friend.testContinue) {
        friend.seekStep(seeking)
      } else {
        clearInterval(seeking)
      }
    }, 350)
  }
  seekStep (seeking) {
    const hits = this.ships.filter(s => !s.sunk).flatMap(s => [...s.hits])

    if (hits.length > 0) {
      this.chase(hits, seeking)
    } else {
      this.randomSeek(seeking)
    }
  }

  onClickRotate () {
    if (clickedShip?.canRotate()) {
      clickedShip.rotate()
    }
  }
  onClickRotateLeft () {
    if (clickedShip?.canRotate()) {
      clickedShip.leftRotate()
    }
  }
  onClickFlip () {
    if (clickedShip) {
      clickedShip.flip()
    }
  }
  onClickTest () {
    friend.UI.testMode()
    friend.UI.testBtn.disabled = true
    friend.score.reset()
    friend.seek()
  }
  onClickStop () {
    friend.testContinue = false
    friend.UI.readyMode()
    friend.UI.testBtn.disabled = false
  }
  wireupButtons () {
    this.UI.rotateBtn.addEventListener('click', friend.onClickRotate)
    this.UI.flipBtn.addEventListener('click', friend.onClickFlip)
    this.UI.testBtn.addEventListener('click', friend.onClickTest)
    this.UI.stopBtn.addEventListener('click', friend.onClickStop)
  }
  resetModel () {
    this.score.reset()
    this.ships = this.createShips()
  }
  buildBoard () {
    this.UI.buildBoard()
    this.resetShipCells()
    this.UI.makeDroppable(this.shipCellGrid, this.ships)
    //  this.UI.dragLeave(this.UI.board)
  }

  resetUI (ships) {
    ships = ships || this.ships
    this.UI.reset(ships)
    // this.UI.clearVisuals()

    this.buildBoard()
    this.UI.buildTrays(ships, this.shipCellGrid)
    this.updateUI(ships)
  }
}
export const friend = new Friend(friendUI)
