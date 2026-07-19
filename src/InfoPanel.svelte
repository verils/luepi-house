<script lang="ts">
  import type { Cat } from './lib/game';
  import { getMoodThreshold } from './lib/game/mood-system';

  let { cat, onclose }: {
    cat: Cat;
    onclose: () => void;
  } = $props();

  const moodThreshold = $derived(getMoodThreshold(cat.mood.value));
  const moodName = $derived(
    moodThreshold === 'depressed' ? '沮丧' :
    moodThreshold === 'calm' ? '平静' :
    moodThreshold === 'content' ? '满足' :
    moodThreshold === 'excited' ? '兴奋' : '极度兴奋'
  );
</script>

<div class="cat-info-panel">
  <div class="cat-info-header">
    <span class="cat-name">{cat.name}</span>
    <button class="close-btn" onclick={onclose}>×</button>
  </div>
  <div class="cat-info-content">
    <p><strong>ID:</strong> {cat.id}</p>
    <p><strong>颜色:</strong> <span style="color: {cat.color};">●</span> {cat.color}</p>
    <p><strong>速度:</strong> {cat.speed} px/帧</p>
    <p><strong>位置:</strong> ({Math.round(cat.x)}, {Math.round(cat.y)})</p>
    <p><strong>动作:</strong> {cat.action}</p>
    <p><strong>情绪:</strong> {moodName} ({Math.round(cat.mood.value)})</p>
    <p><strong>体力:</strong> {Math.round(cat.energy)}</p>
    <p><strong>碰撞半径:</strong> {cat.collisionRadius}px</p>
    <p><strong>交互半径:</strong> {cat.interactionRadius}px</p>
  </div>
</div>

<style>
  .cat-info-panel {
    position: absolute;
    top: 80px;
    right: 20px;
    background-color: rgba(255, 255, 255, 0.95);
    border: 2px solid #424242;
    border-radius: 12px;
    padding: 16px;
    min-width: 250px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    backdrop-filter: blur(10px);
  }

  .cat-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e0e0e0;
  }

  .cat-name {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background-color: #f0f0f0;
    color: #333;
  }

  .cat-info-content {
    font-size: 14px;
    color: #555;
  }

  .cat-info-content p {
    margin: 6px 0;
    line-height: 1.4;
  }
</style>
