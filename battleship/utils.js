import { gameMaps } from './map.js'

// placement rules: no-touch (including diagonals), and area restrictions
export function canPlace (variant, r0, c0, letter, shipCellGrid) {
  for (const [dr, dc] of variant) {
    const rr = r0 + dr,
      cc = c0 + dc
    if (!gameMaps.inBounds(rr, cc)) return false
    const shipType = gameMaps.shipTypes[letter]
    const isLand = gameMaps.isLand(rr, cc)
    // area rules
    if (shipType === 'G' && !isLand)
      return false
    if (shipType === 'S' && isLand)
      return false
    // no-touch check neighbors
    for (let nr = rr - 1; nr <= rr + 1; nr++)
      for (let nc = cc - 1; nc <= cc + 1; nc++) {
        if (gameMaps.inBounds(nr, nc) && shipCellGrid[nr][nc]) return false
      }
  }
  return true
} 
export function placeVariant (variant, r0, c0, letter, id, shipCellGrid) {
  const placedCells = []
  for (const [dr, dc] of variant) {
    const rr = r0 + dr,
      cc = c0 + dc
    shipCellGrid[rr][cc] = { id, letter }
    placedCells.push([rr, cc])
  }
  return placedCells
}

function shuffleArray (array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}
export function randomPlaceShape (ship, shipCellGrid) {
  const letter = ship.letter
  const id = ship.id
  const shape = ship.shape()
  if (!shape) throw new Error('No shape for letter ' + letter)
  let variants0 = shape.variants()
  const variants = shuffleArray(variants0)

  // try random placements
  const maxAttempts = 20000
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const variant of variants) {
      // compute bounds for random origin so variant fits
      const maxR = Math.max(...variant.map(s => s[0]))
      const maxC = Math.max(...variant.map(s => s[1]))
      const r0 = Math.floor(Math.random() * (gameMaps.current.rows - maxR))
      const c0 = Math.floor(Math.random() * (gameMaps.current.cols - maxC))
      if (canPlace(variant, r0, c0, letter, shipCellGrid)) {
        return placeVariant(variant, r0, c0, letter, id, shipCellGrid)
      }
    }
  }
  return null
}

export let clickedShip = null

let createClickedShip = () => {
  return null
}
export function setClickedShip (ship,  source, variantIndex) {
  if(!ship)
  {
    clickedShip = null
    return null
  }

  clickedShip = createClickedShip(ship, source, variantIndex)
  return clickedShip
}
export function setClickedShipBuilder (builder) {
  createClickedShip = builder
}
export let selection = null

let createSelection = () => {
  return null
}
export function setSelection (ship, offsetX, offsetY, cellSize, source, variantIndex) {
  if(!ship)
  {
    selection = null
    return null
  }

  selection = createSelection(ship, offsetX, offsetY, cellSize, source, variantIndex)
  return selection
}
export function removeSelection () {
  if (selection) selection.remove()
  selection = null
}

export function setSelectionBuilder (builder) {
  createSelection = builder
}

export function throttle(func, delay) {
  let inThrottle;
  let lastFn;
  let lastTime;

  return function() {
    const context = this;
    const args = arguments;

    if (!inThrottle) {
      func.apply(context, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(function() {
        if (Date.now() - lastTime >= delay) {
          func.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(delay - (Date.now() - lastTime), 0));
    }
  };
}
