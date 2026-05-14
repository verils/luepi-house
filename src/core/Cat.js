/**
 * 猫实体类
 * 管理猫的视觉和物理属性
 */
export class Cat {
  constructor(id, name, colorConfig) {
    // 基本信息
    this.id = id
    this.name = name
    this.colorConfig = colorConfig
    
    // 位置和变换
    this.x = 0
    this.y = 0
    this.rotation = 0
    this.scale = 1
    
    // 状态
    this.state = 'IDLE' // IDLE, WALKING, SLEEPING, PLAYING
    this.animationFrame = 0
    this.animationTimer = 0
    
    // 物理刚体引用（由 PhysicsEngine 设置）
    this.body = null
    
    // 移动目标
    this.targetX = null
    this.targetY = null
    
    // 动画配置
    this.animationSpeed = 0.15
    this.blinkTimer = 0
    this.isBlinking = false
  }

  /**
   * 更新猫的状态
   * @param {number} deltaTime - 帧时间差（秒）
   */
  update(deltaTime) {
    // 更新动画计时器
    this.animationTimer += deltaTime
    
    // 眨眼逻辑
    this.blinkTimer += deltaTime
    if (this.blinkTimer > 3 + Math.random() * 2) {
      this.isBlinking = true
      setTimeout(() => {
        this.isBlinking = false
      }, 150)
      this.blinkTimer = 0
    }
    
    // 如果正在移动到目标点
    if (this.targetX !== null && this.targetY !== null) {
      this.updateMovement(deltaTime)
    }
    
    // 更新动画帧
    this.updateAnimation(deltaTime)
  }

  /**
   * 更新移动逻辑
   */
  updateMovement(deltaTime) {
    if (!this.body) return
    
    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // 如果接近目标点，停止
    if (distance < 5) {
      this.targetX = null
      this.targetY = null
      this.state = 'IDLE'
      return
    }
    
    // 计算朝向角度
    this.rotation = Math.atan2(dy, dx)
    
    // 设置状态为行走
    this.state = 'WALKING'
  }

  /**
   * 更新动画帧
   */
  updateAnimation(deltaTime) {
    const frameDuration = 0.15 // 每帧持续时间（秒）
    
    if (this.state === 'WALKING') {
      // 行走动画：8帧循环
      if (this.animationTimer > frameDuration) {
        this.animationFrame = (this.animationFrame + 1) % 8
        this.animationTimer = 0
      }
    } else if (this.state === 'IDLE') {
      // 空闲动画：4帧循环
      if (this.animationTimer > frameDuration * 2) {
        this.animationFrame = (this.animationFrame + 1) % 4
        this.animationTimer = 0
      }
    } else if (this.state === 'SLEEPING') {
      // 睡觉动画：4帧循环
      if (this.animationTimer > frameDuration * 3) {
        this.animationFrame = (this.animationFrame + 1) % 4
        this.animationTimer = 0
      }
    }
  }

  /**
   * 设置移动目标
   */
  moveTo(x, y) {
    this.targetX = x
    this.targetY = y
  }

  /**
   * 停止移动
   */
  stop() {
    this.targetX = null
    this.targetY = null
    this.state = 'IDLE'
  }

  /**
   * 同步物理刚体位置到视觉位置
   */
  syncFromBody() {
    if (this.body) {
      this.x = this.body.position.x
      this.y = this.body.position.y
      this.rotation = this.body.angle
    }
  }
}
