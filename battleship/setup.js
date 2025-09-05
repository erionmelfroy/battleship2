import { mapUI, huntUI } from './mapUI.js'
import { gameMaps } from './map.js'

export function removeShortcuts () {
  document.removeEventListener('keydown')
}

export function setupDropdowns (boardSetup, refresh, huntMode) {
  // Define urlParams using the current window's search string
  const urlParams = new URLSearchParams(window.location.search)
  const mapChoices = urlParams.getAll('map')

  const mapIndex = parseInt(mapChoices[0]) || 0
  mapUI.setup(function () {
    boardSetup()
    refresh()
  }, mapIndex)

  gameMaps.setTo(mapIndex)
  boardSetup()
  function switchToSeek () {
    const params = new URLSearchParams()
    params.append('map', mapUI.choose.value || `0`)

    window.location.href = `./battleseek.html?${params.toString()}`
  }
  function switchToHide () {
    const params = new URLSearchParams()
    params.append('map', mapUI.choose.value || `0`)

    window.location.href = `./battlehide.html?${params.toString()}`
  }

  huntUI.setup(function () {
    switch (huntUI.choose.value) {
      case '0':
        if (huntMode !== 'hide') switchToHide()
        break
      case '1':
        if (huntMode !== 'seek') switchToSeek()
        break
      default:
        console.log('unknown hunt mode')
        break
    }
  }, 0)
}
