import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // 状态
  const cats = ref([])
  const mapConfig = ref(null)
  const isRunning = ref(false)
  const selectedCatId = ref(null)
  const isEditing = ref(false)
  const showDebug = ref(false)

  // 计算属性
  const selectedCat = computed(() => {
    return cats.value.find(cat => cat.id === selectedCatId.value)
  })

  // 动作
  function addCat(cat) {
    cats.value.push(cat)
  }

  function removeCat(catId) {
    const index = cats.value.findIndex(cat => cat.id === catId)
    if (index !== -1) {
      cats.value.splice(index, 1)
    }
  }

  function updateCatPosition(catId, x, y) {
    const cat = cats.value.find(c => c.id === catId)
    if (cat) {
      cat.x = x
      cat.y = y
    }
  }

  function updateCatRotation(catId, rotation) {
    const cat = cats.value.find(c => c.id === catId)
    if (cat) {
      cat.rotation = rotation
    }
  }

  function selectCat(catId) {
    selectedCatId.value = catId
  }

  function deselectCat() {
    selectedCatId.value = null
  }

  function setMapConfig(config) {
    mapConfig.value = config
  }

  function toggleRunning() {
    isRunning.value = !isRunning.value
  }

  function toggleEditing() {
    isEditing.value = !isEditing.value
  }

  function toggleDebug() {
    showDebug.value = !showDebug.value
  }

  return {
    cats,
    mapConfig,
    isRunning,
    selectedCatId,
    selectedCat,
    isEditing,
    showDebug,
    addCat,
    removeCat,
    updateCatPosition,
    updateCatRotation,
    selectCat,
    deselectCat,
    setMapConfig,
    toggleRunning,
    toggleEditing,
    toggleDebug
  }
})
