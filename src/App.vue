<template>
  <div id="app">
    <GameCanvas />
  </div>
</template>

<script setup>
import GameCanvas from './components/GameCanvas.vue'
</script>

<style>
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #FFFFFF;
}
</style>
