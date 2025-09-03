import { gameMaps } from './map.js'
import { gameStatus } from './playerUI.js'

class Score {
  constructor () {
    this.shot = new Set()
    this.autoMisses = 0
  }
  reset () {
    this.shot.clear()
    this.autoMisses = 0
  }
  newShotKey (r, c) {
    const key = `${r},${c}`
    if (this.shot.has(key)) return null
    return key
  }
  createShotKey (r, c) {
    const key = this.newShotKey(r, c)
    if (key) {
      this.shot.add(key)
    }
    return key
  }
  noOfShots () {
    return this.shot.size - this.autoMisses
  }

  addAutoMiss (r, c) {
    const key = this.createShotKey(r, c)
    if (!key) return null // already shot here
    this.autoMisses++
    return key
  }
}

export class Ship {
  constructor (id, symmetry, letter) {
    this.id = id
    this.symmetry = symmetry
    this.letter = letter
    this.cells = []
    this.hits = new Set()
    this.sunk = false
  }
  place (placed) {
    this.cells = placed
    this.hits = new Set()
    this.sunk = false
    return placed
  }
  shape () {
    return gameMaps.shapesByLetter[this.letter]
  }
  sunkDescription () {
    return gameMaps.sunkDescription(this.letter)
  }
  type () {
    return gameMaps.shipTypes[this.letter]
  }
}

export class Player {
  constructor (ui) {
    this.ships = []
    this.score = new Score()
    this.UI = ui
  }
  createShips () {
    const ships = []
    let id = 1
    for (const base of gameMaps.baseShapes) {
      const letter = base.letter
      const symmetry = base.symmetry
      const num = gameMaps.current.shipNum[letter]
      for (let i = 0; i < num; i++) {
        ships.push(new Ship(id, symmetry, letter))
        id++
      }
    }
    return ships
  }

  resetShipCells () {
    this.shipCellGrid = Array.from({ length: gameMaps.current.rows }, () =>
      Array(gameMaps.current.cols).fill(null)
    )
  }
  recordAutoMiss (r, c) {
    const key = this.score.addAutoMiss(r, c)
    if (!key) return // already shot here
    this.UI.cellMiss(r, c)
  }
  recordFleetSunk () {
    this.UI.displayFleetSunk()
    this.boardDestroyed = true
  }
  checkFleetSunk () {
    if (this.ships.every(s => s.sunk)) {
      this.recordFleetSunk()
    }
  }
  shipCellAt (r, c) {
    return this.shipCellGrid[r]?.[c]
  }
  markSunk (ship) {
    ship.sunk = true
    gameStatus.info(ship.sunkDescription())
    this.UI.displaySurround(
      ship.cells,
      ship.letter,
      (r, c) => this.recordAutoMiss(r, c),
      (r, c, letter) => this.UI.cellSunkAt(r, c, letter)
    )
    this.checkFleetSunk()
  }
  checkForHit (r, c, key, shipCell) {
    const hitShip = this.ships.find(s => s.id === shipCell.id)
    if (!hitShip) {
      this.UI.cellMiss(r, c)
      return { hit: false, sunk: '' }
    }
    hitShip.hits.add(key)

    this.UI.cellHit(r, c)

    if (hitShip.hits.size === hitShip.cells.length) {
      // ship sunk
      this.markSunk(hitShip)

      return { hit: true, sunkLetter: hitShip.letter }
    }
    return { hit: true, sunkLetter: '' }
  }

  fireShot (r, c, key) {
    const shipCell = this.shipCellAt(r, c)
    if (!shipCell) {
      this.UI.cellMiss(r, c)
      return { hit: false, sunk: '' }
    }
    return this.checkForHit(r, c, key, shipCell)
  }

  processShot (r, c) {
    const key = this.score.createShotKey(r, c)
    if (key === null) {
      // if we are here, it is because of carpet bomb, so we can just
      return { hit: false, sunk: '' }
    }

    const result = this.fireShot(r, c, key)

    this.updateUI(this.ships)
    return result
  }
}
