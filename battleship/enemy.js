import { randomPlaceShape } from './utils.js'
import { gameMaps } from './map.js'
import { enemyUI } from './enemyUI.js'
import { Player } from './player.js'
import { gameStatus } from './playerUI.js'

class Enemy extends Player {
  constructor (enemyUI) {
    super(enemyUI)
    this.shipCellGrid = []
    this.carpetBombsUsed = 0
    this.carpetMode = false
    this.isRevealed = false
    this.boardDestroyed = false
  }

  placeAll (ships) {
    ships = ships || this.ships

    // attempt whole-board placement; retry if any shape fails
    for (let attempt = 0; attempt < 100; attempt++) {
      this.resetShipCells()

      let ok = true
      for (const ship of ships) {
        const placed = randomPlaceShape(ship, this.shipCellGrid)
        if (placed) {
          ship.place(placed)
        } else {
          ok = false
          break
        }
      }

      if (ok) return true
    }

    throw new Error('Failed to place all ships after many attempts')
  }
  revealAll () {
    this.UI.revealAll(this.ships)

    this.boardDestroyed = true
    this.isRevealed = true
  }
  updateUI (ships) {
    ships = ships || this.ships
    // stats
    this.UI.score.display(ships, this.score.noOfShots())
    // mode
    if (this.isRevealed) {
      /// this.UI.modeStatus.textContent = 'Enemy Fleet Revealed' // already done
    } else if (this.boardDestroyed) {
      /// this.UI.displayFleetSunk() // already done
    } else if (this.carpetMode) {
      gameStatus.displayBombStatus(
        this.carpetBombsUsed,
        'Click On Square To Drop Bomb'
      )
      this.UI.carpetBtn.innerHTML = '<span class="shortcut">S</span>ingle Shot'
    } else {
      this.UI.carpetBtn.innerHTML = '<span class="shortcut">M</span>ega Bomb'
      gameStatus.display('Single Shot Mode', 'Click On Square To Fire')
    }
    // buttons
    this.UI.carpetBtn.disabled =
      this.boardDestroyed ||
      this.isRevealed ||
      this.carpetBombsUsed >= gameMaps.maxBombs
    this.UI.revealBtn.disabled = this.boardDestroyed || this.isRevealed
    this.UI.score.buildTally(this.ships, this.carpetBombsUsed)
  }
  onClickCell (r, c) {
    if (enemy.boardDestroyed || enemy.isRevealed) return // no action if game over

    enemy.fireAt(r, c)
  }
  fireAt (r, c) {
    if (!this.score.newShotKey(r, c) && !this.carpetMode) {
      gameStatus.info('Already Shot Here - Try Again')
      return
    }
    if (this.carpetMode) {
      // Mega Bomb mode: affect 3x3 area centered on (r,c)
      if (this.carpetBombsUsed >= gameMaps.maxBombs) {
        gameStatus.info('No Mega Bombs Left')
        return
      }
      this.processCarpetBomb(r, c)
      return
    }
    enemy.processShot(r, c)
  }
  processCarpetBomb (r, c) {
    let hits = 0
    let sunks = ''
    this.carpetBombsUsed++
    ;({ hits, sunks } = this.dropBomb(r, c, hits, sunks))
    // update status
    this.updateResultsOfBomb(hits, sunks)

    this.updateBombStatus()
  }
  dropBomb (r, c, hits, sunks) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr
        const nc = c + dc
        if (gameMaps.inBounds(nr, nc)) {
          const result = this.processShot(nr, nc)
          if (result?.hit) hits++
          if (result?.sunkLetter) sunks += result.sunkLetter
        }
      }
    }
    return { hits, sunks }
  }

  updateBombStatus () {
    gameStatus.displayBombStatus(this.carpetBombsUsed)
    if (this.carpetBombsUsed >= gameMaps.maxBombs) {
      this.carpetMode = false
      gameStatus.display('Single Shot Mode')
    }
  }

  updateResultsOfBomb (hits, sunks) {
    if (this.boardDestroyed) {
      // already handled  in updateUI
    } else if (hits === 0) {
      gameStatus.info('The Mega Bomb missed everything!')
    } else if (sunks.length === 0) {
      gameStatus.info(hits.toString() + ' Hits')
    } else if (sunks.length === 1) {
      gameStatus.info(
        hits.toString() + ' Hits and ' + gameMaps.sunkDescription(sunks)
      )
    } else {
      let message = hits.toString() + ' Hits,'
      for (let sunk of sunks) {
        message += ' and ' + gameMaps.sunkDescription(sunk)
      }
      message += ' Destroyed'
      gameStatus.info(message)
    }
  }

  onClickCarpetMode () {
    if (!enemy.isRevealed && enemy.carpetBombsUsed < gameMaps.maxBombs) {
      enemy.carpetMode = !enemy.carpetMode
      enemy.updateUI(enemy.ships)
    }
  }
  onClickReveal () {
    if (!enemy.isRevealed) {
      enemy.revealAll()
      enemy.updateUI(enemy.ships)
    }
  }
  wireupButtons () {
    this.UI.carpetBtn.addEventListener('click', enemy.onClickCarpetMode)
    this.UI.revealBtn.addEventListener('click', enemy.onClickReveal)
  }
  resetModel () {
    this.carpetMode = false
    this.carpetBombsUsed = 0
    this.boardDestroyed = false
    this.isRevealed = false
    this.score.reset()
    this.ships = this.createShips()
  }
  buildBoard () {
    this.UI.buildBoard(enemy.onClickCell)

    // update destroyed state class
    this.UI.board.classList.toggle('destroyed', this.boardDestroyed)
  }
  resetUI (ships) {
    this.UI.reset()
    // this.UI.clearVisuals()
    this.buildBoard()
    this.placeAll(ships)
    this.updateUI(ships)
  }
}

export const enemy = new Enemy(enemyUI)
