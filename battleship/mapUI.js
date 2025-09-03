import { gameMaps } from './map.js'

export let mapUI = {
  chooseMap: document.getElementById('chooseMap'),
  containerWidth: 520,
  setup: function (callback) {
    let mapId = 0
    gameMaps.list.forEach(mapOption => {
      let option = document.createElement('option')
      option.value = mapId
      option.textContent = mapOption.title
      this.chooseMap.appendChild(option)
      mapId++
    })
    this.onChange(callback)
  },
  onChange: function (callback) {
    this.chooseMap.addEventListener('change', function () {
      const index = this.value
      gameMaps.setTo(index)
      callback()
    })
  }
}
