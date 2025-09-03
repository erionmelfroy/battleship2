import { gameMaps } from './map.js'
import { gameStatus, PlayerUI, ScoreUI } from './playerUI.js'

class EnemyUI extends PlayerUI {
  constructor () {
    super()
    this.board = document.getElementById('enemy-board')
    this.score = new ScoreUI('enemy')
    this.carpetBtn = document.getElementById('carpetBtn')
    this.revealBtn = document.getElementById('revealBtn')
  }
  displayFleetSunk () {
    gameStatus.display('Fleet Destroyed', 'All  - Well Done!')
    this.board.classList.add('destroyed')
  }
  displayAsRevealed (cell, letter) {
    if (cell) {
      cell.style.background =
        gameMaps.shipColors[letter] || 'rgba(255, 209, 102, 0.3)'
      cell.style.color = gameMaps.shipLetterColors[letter] || '#ffd166'
      cell.textContent = letter
    }
  }
  revealShip (ship) {
    for (const [r, c] of ship.cells) {
      const cell = this.gridCellAt(r, c)
      this.displayAsRevealed(cell, ship.letter)
    }
  }
  revealAll (ships) {
    for (const ship of ships) {
      this.revealShip(ship)
    }

    gameStatus.display('Enemy Fleet Revealed', 'You Gave Up')
    this.board.classList.add('destroyed')
  }
  displayAs (cell, what) {
    cell.classList.add(what)
    what[0].toUpperCase()
    gameStatus.info(what[0].toUpperCase() + what.slice(1) + '!')
  }
  cellHit (r, c) {
    const cell = this.gridCellAt(r, c)
    this.displayAs(cell, 'hit')
  }
  displayAsSunk (cell, letter) {
    cell.textContent = letter
    cell.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    cell.style.background =
      gameMaps.shipColors[letter] || 'rgba(255,255,255,0.2)'
    cell.classList.remove('hit')
    cell.classList.remove('miss')
  }
  cellSunkAt (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsSunk(cell, letter)
  }
  clearVisuals () {
    for (const cell of this.board.children) {
      cell.textContent = ''
      cell.style.background = ''
      cell.style.color = ''
      cell.classList.remove('hit', 'miss', 'placed')
    }
  }
  reset () {
    this.board.innerHTML = ''
    this.board.classList.remove('destroyed')
    gameStatus.display('Single Shot Mode', 'Click On Square To Fire')
  }
}
export const enemyUI = new EnemyUI()
