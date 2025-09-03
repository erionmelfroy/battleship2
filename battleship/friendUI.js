import { gameMaps } from './map.js'
import { gameStatus, playerUI, ScoreUI } from './playerUI.js'
import {
  selection,
  setSelection,
  removeSelection,
  clickedShip,
  setClickedShip
} from './utils.js'

let lastEntered = [-1, -1]
export const friendUI = {
  __proto__: playerUI,
  board: document.getElementById('friend-board'),
  score: new ScoreUI('friend'),
  rotateBtn: document.getElementById('rotateBtn'),
  flipBtn: document.getElementById('flipBtn'),
  testBtn: document.getElementById('testBtn'),
  stopBtn: document.getElementById('stopBtn'),
  trays: document.getElementById('tray-container'),
  shipTray: document.getElementById('shipTray'),
  planeTray: document.getElementById('planeTray'),
  buildingTray: document.getElementById('buildingTray'),
  displayFleetSunk: function () {
    this.gameStatus.display('Your Fleet is Destroyed', '')
    this.board.classList.add('destroyed')
  },
  markPlaced: function (cells, letter) {
    this.displaySurround(
      cells,
      letter,
      (r, c) => this.cellMiss(r, c),
      (r, c, letter) => this.cellPlacedAt(r, c, letter)
    )
  },
  makeDroppable: function (shipCellGrid, ships) {
    for (const cell of this.board.children) {
      cell.textContent = ''
      cell.classList.remove('hit', 'miss', 'placed')
      this.drop(cell, shipCellGrid, ships)
      this.dragEnter(cell, shipCellGrid)
    }
  },
  drop: function (cell, shipCellGrid, ships) {
    cell.addEventListener('drop', e => {
      e.preventDefault()
      this.removeHighlight()
      if (!selection) return

      const el = e.target
      const r = parseInt(el.dataset.r)
      const c = parseInt(el.dataset.c)

      const placed = selection.place(r, c, shipCellGrid)
      if (placed) {
        this.markPlaced(placed, selection.letter)
        this.placeTally(ships)
        if (selection) {
          selection.remove()
          selection.source.remove()
        }
        this.displayInfo(ships)
      }
    })
  },
  removeHighlight: function () {
    for (const el of this.board.children) {
      el.classList.remove('good', 'bad')
    }
  },
  highlight: function (shipCellGrid, r, c) {
    if (!selection) return
    r = r || lastEntered[0]
    c = c || lastEntered[1]
    const [r0, c0] = selection.offsetCell(r, c)
    if (!gameMaps.inBounds(r0, c0)) return

    this.removeHighlight()
    const canPlace = selection.canPlace(r0, c0, shipCellGrid)
    const variant = selection.variant()
    for (const [dr, dc] of variant) {
      const rr = dr + r0
      const cc = dc + c0

      if (gameMaps.inBounds(rr, cc)) {
        const cell = this.gridCellAt(rr, cc)
        cell.classList.add(canPlace ? 'good' : 'bad')
      }
    }
  },
  dragEnter: function (cell, shipCellGrid) {
    cell.addEventListener('dragenter', e => {
      e.preventDefault()

      const el = e.target
      const r = parseInt(el.dataset.r)
      const c = parseInt(el.dataset.c)
      if (lastEntered[0] === r && lastEntered[1] === c) return

      lastEntered = [r, c]
      this.highlight(shipCellGrid, r, c)
    })
  },
  removeClicked: function () {
    const elements = document.getElementsByClassName('clicked')
    ;[...elements].forEach(element => {
      // Perform actions on each element
      element.classList.remove('clicked')
    })

    this.rotateBtn.disabled = true
    this.flipBtn.disabled = true
  },
  assignClicked: function (ship, clicked) {
    const variantIndex = parseInt(clicked.dataset.variant)
    this.removeClicked()
    setClickedShip(ship, clicked, variantIndex)
    clicked.classList.add('clicked')
    this.rotateBtn.disabled = !clickedShip.canRotate()
    this.flipBtn.disabled = !clickedShip.canFlip()
  },
  dragEnd: function (div, callback) {
    div.addEventListener('dragend', e => {
      const shipElement = e.target
      shipElement.style.opacity = ''
      for (const el of this.board.children) {
        el.classList.remove('good', 'bad')
      }
      removeSelection()
      if (e.dataTransfer.dropEffect !== 'none') {
        // The item was successfully dropped on a valid drop target

        this.rotateBtn.disabled = true
        this.flipBtn.disabled = true
      } else {
        // The drag operation was canceled or dropped on an invalid target
        this.assignClicked(selection.ship, shipElement)
      }
      if (callback) callback()
    })
  },
  dragLeave: function (div) {
    div.addEventListener('dragleave', e => {
      e.preventDefault()
      for (const el of this.board.children) {
        el.classList.remove('good', 'bad')
      }
    })
  },
  makeDraggable: function (dragShip, ship) {
    dragShip.setAttribute('draggable', 'true')
    this.dragStart(dragShip, ship)
    this.onClick(dragShip, ship)
  },
  onClick: function (dragShip, ship) {
    dragShip.addEventListener('click', e => {
      const shipElement = e.currentTarget
      this.assignClicked(ship, shipElement)
    })
  },
  dragStart: function (dragShip, ship) {
    dragShip.addEventListener('dragstart', e => {
      const shipElement = e.currentTarget
      const rect = shipElement.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      this.removeClicked()

      e.dataTransfer.effectAllowed = 'all'

      e.dataTransfer.setDragImage(new Image(), 0, 0)
      const variantIndex = parseInt(shipElement.dataset.variant)
      setSelection(
        ship,
        offsetX,
        offsetY,
        friendUI.cellSize(),
        shipElement,
        variantIndex
      )
      selection.moveTo(e.clientX, e.clientY)
      e.target.style.opacity = 0.6
    })
  },
  setDragShipContents (dragShip, cells, letter) {
    const maxR = Math.max(...cells.map(s => s[0])) + 1
    const maxC = Math.max(...cells.map(s => s[1])) + 1

    dragShip.setAttribute(
      'style',
      `display:grid;place-items: center;--boxSize:${
        this.cellSize().toString() + 'px'
      };grid-template-rows:repeat(${maxR}, var(--boxSize));grid-template-columns:repeat(${maxC}, var(--boxSize));gap:0px;`
    )
    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) {
        const cell = document.createElement('div')
        cell.className = 'cell'
        if (cells.some(shipcell => shipcell[0] === r && shipcell[1] === c)) {
          cell.style.background =
            gameMaps.shipColors[letter] || 'rgba(255, 209, 102, 0.3)'
          cell.style.color = gameMaps.shipLetterColors[letter] || '#ffd166'
          cell.textContent = letter
        } else {
          cell.classList.add('empty')
        }
        cell.dataset.r = r
        cell.dataset.c = c
        dragShip.appendChild(cell)
      }
    }
  },
  displayAsPlaced: function (cell, letter) {
    cell.textContent = letter
    cell.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    cell.style.background =
      gameMaps.shipColors[letter] || 'rgba(255,255,255,0.2)'

    cell.classList.add('placed')
    cell.classList.remove('miss')
  },
  cellPlacedAt: function (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsPlaced(cell, letter)
  },
  buildTrayItem: function (ship, tray) {
    const shape = ship.shape()

    const dragShipContainer = document.createElement('div')

    dragShipContainer.className = 'drag-ship-container'
    dragShipContainer.dataset.id = ship.id
    dragShipContainer.setAttribute(
      'style',
      'display: flex;justify-content: center;align-items: center;'
    )
    const dragShip = document.createElement('div')
    dragShip.className = 'drag-ship'
    dragShip.dataset.variant = 0
    dragShip.dataset.id = ship.id
    this.setDragShipContents(dragShip, shape.cells, shape.letter)
    this.makeDraggable(dragShip, ship)
    dragShipContainer.appendChild(dragShip)
    tray.appendChild(dragShipContainer)
  },
  buildTrays: function (ships) {
    for (const ship of ships) {
      const type = ship.type()
      switch (type) {
        case 'A':
          this.buildTrayItem(ship, this.planeTray)
          break
        case 'S':
          this.buildTrayItem(ship, this.shipTray)
          break
        case 'G':
          this.buildTrayItem(ship, this.buildingTray)
          break
        default:
          throw new Error('Unknown type for ' + JSON.stringify(ship, null, 2)) // The 'null, 2' adds indentation for readability);
      }
    }
  },
  placeShipBox: function (ship) {
    const box = document.createElement('div')
    box.className = 'tally-box'
    const letter = ship.letter
    if (ship.cells.length === 0) {
      box.textContent = ''
    } else {
      box.textContent = letter
    }
    box.style.background = gameMaps.shipColors[letter] || '#333'
    box.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    return box
  },
  placeTally: function (ships) {
    this.score.buildShipTally(ships, this.placeShipBox)
    // no bombs row
  },
  clearVisuals: function () {
    for (const el of this.board.children) {
      el.textContent = ''
      el.style.background = ''
      el.style.color = ''
      el.classList.remove('hit', 'miss')
    }
  },
  placeMode: function () {
    const flexStyle =
      'display: flex; flex-flow: row wrap;gap: 8px; margin-bottom: 8px'
    this.testBtn.style.display = 'none'
    this.score.shotsLabel.style.display = 'none'
    this.score.hitsLabel.style.display = 'none'
    this.score.sunkLabel.style.display = 'none'
    this.score.placedLabel.style.display = 'block'
    this.rotateBtn.style.display = 'block'
    this.flipBtn.style.display = 'block'
    this.stopBtn.style.display = 'none'
    this.trays.style.display = 'block'
    this.shipTray.setAttribute('style', flexStyle)
    this.planeTray.setAttribute('style', flexStyle)
    this.buildingTray.setAttribute('style', flexStyle)
    gameStatus.game.style.display = 'none'
    gameStatus.mode.style.display = 'none'
    gameStatus.line.style.display = 'none'
  },
  readyMode: function () {
    this.testBtn.style.display = 'block'
    this.rotateBtn.style.display = 'none'
    this.flipBtn.style.display = 'none'
    this.stopBtn.style.display = 'none'
    this.shipTray.style.display = 'none'
    this.planeTray.style.display = 'none'
    this.buildingTray.style.display = 'none'
    this.trays.style.display = 'none'
    for (const cell of this.board.children) {
      cell.classList.remove('hit', 'miss', 'placed')
    }
    gameStatus.game.setAttribute(
      'style',
      'display:block;float: left; text-align: left; width: 65%;'
    )
    gameStatus.mode.setAttribute(
      'style',
      'display:block;float: right; text-align: right; width: 35%;'
    )
    gameStatus.line.setAttribute(
      'style',
      'display:block;font-weight: bold;height: 52px;margin-bottom: 30px;margin-top: 45px;'
    )
  },
  testMode: function () {
    this.testBtn.style.display = 'block'
    this.stopBtn.style.display = 'block'
    this.score.shotsLabel.style.display = 'block'
    this.score.hitsLabel.style.display = 'block'
    this.score.sunkLabel.style.display = 'block'
    this.score.placedLabel.style.display = 'none'
    this.rotateBtn.style.display = 'none'
    this.flipBtn.style.display = 'none'
    this.shipTray.style.display = 'none'
    this.planeTray.style.display = 'none'
    this.buildingTray.style.display = 'none'
    this.trays.style.display = 'none'
    gameStatus.game.setAttribute(
      'style',
      'display:block;float: left; text-align: left; width: 65%;'
    )
    gameStatus.mode.setAttribute(
      'style',
      'display:block;float: right; text-align: right; width: 35%;'
    )
    gameStatus.line.setAttribute(
      'style',
      'display:block;font-weight: bold;height: 52px;margin-bottom: 30px;margin-top: 45px;'
    )
  },
  displayInfo: function (ships) {
    const total = ships.length
    const placed = ships.filter(s => s.cells.length > 0).length
    this.score.placed.textContent = `${placed} / ${total}`
    if (total === placed) {
      this.readyMode()
    }
  },
  reset: function (ships) {
    this.board.innerHTML = ''
    this.shipTray.innerHTML = ''
    this.planeTray.innerHTML = ''
    this.buildingTray.innerHTML = ''
    this.displayInfo(ships)
  }
}
