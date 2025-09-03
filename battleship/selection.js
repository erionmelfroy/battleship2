import { gameMaps } from './map.js'
import { friend } from './friend.js'
import {
  setSelectionBuilder,
  setClickedShipBuilder,
  canPlace,
  placeVariant
} from './utils.js'

function normalize (cells) {
  const minR = Math.min(...cells.map(s => s[0]))
  const minC = Math.min(...cells.map(s => s[1]))
  return cells.map(([r, c]) => [r - minR, c - minC])
}

function normalizeVariants (variants) {
  return variants.map(v => normalize(v))
}

class Ghost {
  constructor (variant, letter) {
    const el = document.createElement('div')
    el.classList.add('selection')
    this.element = el
    this.letter = letter
    el.className = 'ship-ghost'
    friend.UI.setDragShipContents(el, variant, letter)
    document.body.appendChild(el)
  }
  hide () {
    this.element.style.opacity = 0
  }
  show () {
    this.element.style.opacity = ''
  }
  setVariant (variant) {
    if (this.element) {
      this.element.innerHTML = ''
      friend.UI.setDragShipContents(this.element, variant, this.letter)
    }
  }
  remove () {
    if (this.element) this.element.remove()
    this.element = null
  }
  moveTo (x, y) {
    if (this.element) {
      //  this.element.style.left = x + 10 + 'px'
      //   this.element.style.top = y + 10 + 'px'

      this.element.style.left = x + 'px'
      this.element.style.top = y + 'px'
    }
  }
}

class SelectedShip {
  constructor (ship, variantIndex) {
    this.ship = ship
    const shape = ship.shape()
    this.shape = shape
    this.type = shape.type()
    this.id = ship.id
    const letter = ship.letter
    this.letter = letter
    this.index = variantIndex || 0
    this.letter = ship.letter
    this.variants = normalizeVariants(shape.variants())
  }
  setVariantByIndex (index) {
    this.index = index
  }
  canFlip () {
    const symmetry = this.shape.symmetry
    return symmetry === 'H' || symmetry === 'A'
  }
  canRotate () {
    const symmetry = this.shape.symmetry
    return symmetry === 'H' || symmetry === 'A' || symmetry === 'L'
  }

  variant () {
    return this.variants[this.index]
  }
  rotate () {
    let index = this.index
    const symmetry = this.shape.symmetry
    switch (symmetry) {
      case 'L':
        index = index === 0 ? 1 : 0
        break
      case 'H':
        index = (index + 1) % 4
        break
      case 'A':
        index = (index > 1 ? 2 : 0) + (index % 2 === 0 ? 1 : 0)
        break
    }
    this.setVariantByIndex(index)
  }

  leftRotate () {
    let index = this.index
    const symmetry = this.shape.symmetry
    switch (symmetry) {
      case 'L':
        index = index === 0 ? 1 : 0
        break
      case 'H':
        index = (index - 1) % 4
        break
      case 'A':
        index = (index > 1 ? 2 : 0) + (index % 2 === 0 ? 1 : 0)
        break
    }
    this.setVariantByIndex(index)
  }
  flip () {
    let index = this.index
    const symmetry = this.shape.symmetry
    switch (symmetry) {
      case 'H':
        index = (index + 2) % 4
        break
      case 'A':
        index = (index > 1 ? 0 : 2) + (index % 2)
        break
    }
    this.setVariantByIndex(index)
  }
}

class ClickedShip extends SelectedShip {
  constructor (ship, source, variantIndex) {
    super(ship, variantIndex)
    this.source = source
  }
  setVariantByIndex (index) {
    this.index = index
    const variant = this.variants[index]
    if (this.source) {
      this.source.innerHTML = ''
      friend.UI.setDragShipContents(this.source, variant, this.letter)
      this.source.dataset.variant = index
    }
  }
}

class DraggedShip extends SelectedShip {
  constructor (ship, offsetX, offsetY, cellSize, source, variantIndex) {
    super(ship, variantIndex)
    const row = Math.floor(offsetY / cellSize)
    const col = Math.floor(offsetX / cellSize)
    this.source = source
    this.cursor = [row, col]
    this.offset = [offsetX, offsetY]
    this.ghost = new Ghost(super.variant(), super.letter)
    this.shown = true
  }
  isNotShown () {
    return !this.shown
  }
  hide () {
    this.shown = false
    if (this.ghost) this.ghost.hide()
  }
  show () {
    this.shown = true
    if (this.ghost) this.ghost.show()
  }
  remove () {
    if (this.ghost) this.ghost.remove()
    this.ghost = null
  }
  moveTo (x, y) {
    if (this.ghost) this.ghost.moveTo(x, y)
  }
  move (e) {
    this.moveTo(e.pageX - this.offset[0] - 13, e.pageY - this.offset[1] - 13)
  }
  setVariantByIndex (index) {
    this.index = index
    const variant = this.variants[index]
    this.ghost.setVariant(variant)
  }

  rotate () {
    this.resetOffset()
    super.rotate()
  }
  resetOffset () {
    //  const [x,y] = this.offset
    //   this.offset = [-y,x]
    //  const [r,c] = this.cursor
    //  this.cursor = [r,-c]
    this.offset = [0, 0]
    this.cursor = [0, 0]
  }

  leftRotate () {
    this.resetOffset()
    super.leftRotate()
  }
  flip () {
    this.resetOffset()
    super.flip()
  }
  inAllBounds (r, c, variant) {
    variant = variant || this.variant()

    try {
      const maxShipR = Math.max(...variant.map(s => s[0]))
      const maxShipC = Math.max(...variant.map(s => s[1]))
      return gameMaps.inAllBounds(r, c, maxShipR, maxShipC)
    } catch (error) {
      console.error('An error occurred:', error.message)
      return false
    }
  }
  canPlace (r, c, shipCellGrid) {
    const variant = this.variant()
    if (this.ghost && this.inAllBounds(r, c, variant)) {
      return canPlace(variant, r, c, this.letter, shipCellGrid)
    }
    return false
  }
  addToShipCell (r, c, shipCellGrid) {
    return placeVariant(
      this.variant(),
      r,
      c,
      this.letter,
      this.id,
      shipCellGrid
    )
  }
  offsetCell (r, c) {
    const r0 = r - this.cursor[0]
    const c0 = c - this.cursor[1]
    return [r0, c0]
  }
  canPlaceCells (r, c, shipCellGrid) {
    const r0 = r - this.cursor[0]
    const c0 = c - this.cursor[1]
    return this.canPlace(r0, c0, shipCellGrid)
  }
  placeCells (r, c, shipCellGrid) {
    const r0 = r - this.cursor[0]
    const c0 = c - this.cursor[1]
    if (this.canPlace(r0, c0, shipCellGrid)) {
      return this.addToShipCell(r0, c0, shipCellGrid)
    }
    return null
  }
  place (r, c, shipCellGrid) {
    const placed = this.placeCells(r, c, shipCellGrid)
    if (placed) {
      return this.ship.place(placed)
    }
    return null
  }
}

setSelectionBuilder((ship, offsetX, offsetY, cellSize, source, index) => {
  return new DraggedShip(ship, offsetX, offsetY, cellSize, source, index)
})
setClickedShipBuilder((ship, source, index) => {
  return new ClickedShip(ship, source, index)
})
