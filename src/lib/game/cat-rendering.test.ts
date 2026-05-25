import { describe, it, expect } from 'vitest';
import { initGameState } from './init';

describe('Cat Rendering', () => {
  it('should initialize two cats with correct properties', () => {
    const gameState = initGameState();
    
    expect(gameState.cats).toHaveLength(2);
    
    // Check Luelue (橘白猫)
    const luelue = gameState.cats.find(cat => cat.id === 'luelue');
    expect(luelue).toBeDefined();
    expect(luelue?.name).toBe('略略');
    expect(luelue?.color).toBe('#E8945A'); // 暖橘色
    expect(luelue?.collisionRadius).toBe(16);
    expect(luelue?.interactionRadius).toBe(20);
    expect(luelue?.speed).toBe(1.5);
    
    // Check Pipi (暹罗猫)
    const pipi = gameState.cats.find(cat => cat.id === 'pipi');
    expect(pipi).toBeDefined();
    expect(pipi?.name).toBe('皮皮');
    expect(pipi?.color).toBe('#F5E6D3'); // 暖米色
    expect(pipi?.collisionRadius).toBe(14); // 更纤细
    expect(pipi?.interactionRadius).toBe(18);
    expect(pipi?.speed).toBe(1.2);
  });

  it('should have different visual characteristics for each cat', () => {
    const gameState = initGameState();
    
    const luelue = gameState.cats.find(cat => cat.id === 'luelue');
    const pipi = gameState.cats.find(cat => cat.id === 'pipi');
    
    // Verify they have different colors
    expect(luelue?.color).not.toBe(pipi?.color);
    
    // Verify they have different collision radii (Pipi is slimmer)
    expect(luelue?.collisionRadius).toBeGreaterThan(pipi?.collisionRadius!);
    
    // Verify they have different speeds (Luelue is faster)
    expect(luelue?.speed).toBeGreaterThan(pipi?.speed!);
  });
});
