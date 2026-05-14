/**
 * 渲染器类
 * 负责 Canvas 绘制逻辑
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    // 启用像素化渲染
    this.ctx.imageSmoothingEnabled = false
    
    // 画布尺寸
    this.width = canvas.width
    this.height = canvas.height
    
    // FPS 计数器
    this.fps = 0
    this.frameCount = 0
    this.lastFpsUpdate = 0
  }

  /**
   * 调整画布尺寸
   */
  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
    this.width = width
    this.height = height
    this.ctx.imageSmoothingEnabled = false
  }

  /**
   * 清空画布
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  /**
   * 绘制白色背景
   */
  drawBackground() {
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  /**
   * 绘制地面纹理
   */
  drawFloor(x, y, width, height, floorType) {
    const colors = {
      wood: '#D4A574',
      carpet: '#FF8C9E',
      tile: '#B0E0E6',
      concrete: '#C0C0C0'
    }
    
    this.ctx.fillStyle = colors[floorType] || colors.wood
    this.ctx.fillRect(x, y, width, height)
    
    // 添加简单的纹理效果
    this.drawFloorTexture(x, y, width, height, floorType)
  }

  /**
   * 绘制地面纹理细节
   */
  drawFloorTexture(x, y, width, height, type) {
    this.ctx.save()
    this.ctx.globalAlpha = 0.3
    
    if (type === 'wood') {
      // 木纹
      this.ctx.strokeStyle = '#C49464'
      this.ctx.lineWidth = 2
      for (let i = 0; i < width; i += 20) {
        this.ctx.beginPath()
        this.ctx.moveTo(x + i, y)
        this.ctx.lineTo(x + i, y + height)
        this.ctx.stroke()
      }
    } else if (type === 'carpet') {
      // 地毯花纹
      this.ctx.fillStyle = '#FFB6C1'
      for (let i = 0; i < width; i += 30) {
        for (let j = 0; j < height; j += 30) {
          this.ctx.fillRect(x + i, y + j, 15, 15)
        }
      }
    } else if (type === 'tile') {
      // 瓷砖缝隙
      this.ctx.strokeStyle = '#87CEEB'
      this.ctx.lineWidth = 2
      for (let i = 0; i < width; i += 40) {
        this.ctx.beginPath()
        this.ctx.moveTo(x + i, y)
        this.ctx.lineTo(x + i, y + height)
        this.ctx.stroke()
      }
      for (let j = 0; j < height; j += 40) {
        this.ctx.beginPath()
        this.ctx.moveTo(x, y + j)
        this.ctx.lineTo(x + width, y + j)
        this.ctx.stroke()
      }
    }
    
    this.ctx.restore()
  }

  /**
   * 绘制房间区域
   */
  drawRoom(room) {
    const { x, y, width, height, themeColor, name, floorType } = room
    
    // 绘制半透明色块
    this.ctx.save()
    this.ctx.globalAlpha = 0.3
    this.ctx.fillStyle = themeColor
    this.ctx.fillRect(x, y, width, height)
    this.ctx.restore()
    
    // 绘制虚线边框
    this.ctx.save()
    this.ctx.strokeStyle = themeColor
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([10, 5])
    this.ctx.strokeRect(x, y, width, height)
    this.ctx.restore()
    
    // 绘制地面纹理
    this.drawFloor(x, y, width, height, floorType || 'wood')
    
    // 绘制房间名称
    this.drawRoomName(name, x + 10, y + 20)
  }

  /**
   * 绘制房间名称
   */
  drawRoomName(name, x, y) {
    this.ctx.save()
    this.ctx.font = 'bold 12px monospace'
    this.ctx.fillStyle = '#424242'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(name, x, y)
    this.ctx.restore()
  }

  /**
   * 绘制墙壁
   */
  drawWall(x, y, width, height) {
    // 墙壁主体
    this.ctx.fillStyle = '#8B7355'
    this.ctx.fillRect(x, y, width, height)
    
    // 顶部高光
    this.ctx.fillStyle = '#A08060'
    this.ctx.fillRect(x, y, width, 4)
    
    // 侧面阴影
    this.ctx.fillStyle = '#6B5340'
    this.ctx.fillRect(x, y + height - 4, width, 4)
    
    // 黑色描边
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x, y, width, height)
  }

  /**
   * 绘制猫
   */
  drawCat(cat, isSelected) {
    const { x, y, rotation, colorConfig, name, state, isBlinking } = cat
    
    this.ctx.save()
    
    // 移动到猫的位置并旋转
    this.ctx.translate(x, y)
    this.ctx.rotate(rotation)
    
    // 绘制阴影
    this.drawShadow()
    
    // 绘制猫的身体（简化版几何图形）
    this.drawCatBody(colorConfig, state, isBlinking)
    
    this.ctx.restore()
    
    // 绘制名称标签（不随旋转）
    this.drawCatName(name, x, y - 40, isSelected)
    
    // 如果选中，绘制高亮边框
    if (isSelected) {
      this.drawSelectionRing(x, y)
    }
    
    // 绘制状态气泡
    if (state === 'SLEEPING') {
      this.drawSleepBubble(x, y - 50)
    }
  }

  /**
   * 绘制阴影
   */
  drawShadow() {
    this.ctx.save()
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    this.ctx.beginPath()
    this.ctx.ellipse(0, 15, 20, 8, 0, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.restore()
  }

  /**
   * 绘制猫的身体（简化版）
   */
  drawCatBody(colorConfig, state, isBlinking) {
    const { mainColor, secondaryColor, accentColor } = colorConfig
    
    // 身体
    this.ctx.fillStyle = mainColor
    this.ctx.beginPath()
    this.ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = 2
    this.ctx.stroke()
    
    // 头部
    this.ctx.fillStyle = mainColor
    this.ctx.beginPath()
    this.ctx.arc(0, -15, 12, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.stroke()
    
    // 耳朵
    this.drawEar(-8, -22, mainColor, accentColor)
    this.drawEar(8, -22, mainColor, accentColor)
    
    // 眼睛
    if (isBlinking || state === 'SLEEPING') {
      this.drawClosedEyes()
    } else {
      this.drawOpenEyes()
    }
    
    // 鼻子
    this.ctx.fillStyle = accentColor
    this.ctx.beginPath()
    this.ctx.arc(0, -12, 2, 0, Math.PI * 2)
    this.ctx.fill()
    
    // 胡须
    this.drawWhiskers()
    
    // 尾巴
    this.drawTail(state)
  }

  /**
   * 绘制耳朵
   */
  drawEar(x, y, outerColor, innerColor) {
    this.ctx.fillStyle = outerColor
    this.ctx.beginPath()
    this.ctx.moveTo(x - 5, y + 5)
    this.ctx.lineTo(x, y - 5)
    this.ctx.lineTo(x + 5, y + 5)
    this.ctx.closePath()
    this.ctx.fill()
    this.ctx.stroke()
    
    // 内侧
    this.ctx.fillStyle = innerColor
    this.ctx.beginPath()
    this.ctx.moveTo(x - 3, y + 3)
    this.ctx.lineTo(x, y - 2)
    this.ctx.lineTo(x + 3, y + 3)
    this.ctx.closePath()
    this.ctx.fill()
  }

  /**
   * 绘制睁开的眼睛
   */
  drawOpenEyes() {
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.beginPath()
    this.ctx.arc(-5, -16, 3, 0, Math.PI * 2)
    this.ctx.arc(5, -16, 3, 0, Math.PI * 2)
    this.ctx.fill()
    
    this.ctx.fillStyle = '#000000'
    this.ctx.beginPath()
    this.ctx.arc(-5, -16, 1.5, 0, Math.PI * 2)
    this.ctx.arc(5, -16, 1.5, 0, Math.PI * 2)
    this.ctx.fill()
  }

  /**
   * 绘制闭合的眼睛
   */
  drawClosedEyes() {
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(-7, -16)
    this.ctx.lineTo(-3, -16)
    this.ctx.moveTo(3, -16)
    this.ctx.lineTo(7, -16)
    this.ctx.stroke()
  }

  /**
   * 绘制胡须
   */
  drawWhiskers() {
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    // 左侧胡须
    this.ctx.moveTo(-10, -13)
    this.ctx.lineTo(-18, -14)
    this.ctx.moveTo(-10, -12)
    this.ctx.lineTo(-18, -12)
    this.ctx.moveTo(-10, -11)
    this.ctx.lineTo(-18, -10)
    // 右侧胡须
    this.ctx.moveTo(10, -13)
    this.ctx.lineTo(18, -14)
    this.ctx.moveTo(10, -12)
    this.ctx.lineTo(18, -12)
    this.ctx.moveTo(10, -11)
    this.ctx.lineTo(18, -10)
    this.ctx.stroke()
  }

  /**
   * 绘制尾巴
   */
  drawTail(state) {
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = 4
    this.ctx.lineCap = 'round'
    
    this.ctx.beginPath()
    this.ctx.moveTo(15, 5)
    
    if (state === 'WALKING') {
      // 行走时尾巴摆动
      const swing = Math.sin(Date.now() / 200) * 5
      this.ctx.quadraticCurveTo(25, 0 + swing, 30, -5 + swing)
    } else {
      this.ctx.quadraticCurveTo(25, 0, 28, -8)
    }
    
    this.ctx.stroke()
  }

  /**
   * 绘制猫名称标签
   */
  drawCatName(name, x, y, isSelected) {
    this.ctx.save()
    
    // 背景框
    const textWidth = this.ctx.measureText(name).width
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(x - textWidth / 2 - 4, y - 10, textWidth + 8, 16)
    
    // 文字
    this.ctx.font = 'bold 12px monospace'
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.textAlign = 'center'
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = 2
    this.ctx.strokeText(name, x, y + 2)
    this.ctx.fillText(name, x, y + 2)
    
    this.ctx.restore()
  }

  /**
   * 绘制选中光环
   */
  drawSelectionRing(x, y) {
    this.ctx.save()
    this.ctx.strokeStyle = '#FFD93D'
    this.ctx.lineWidth = 3
    this.ctx.setLineDash([5, 5])
    this.ctx.beginPath()
    this.ctx.arc(x, y, 35, 0, Math.PI * 2)
    this.ctx.stroke()
    this.ctx.restore()
  }

  /**
   * 绘制睡觉气泡
   */
  drawSleepBubble(x, y) {
    this.ctx.save()
    this.ctx.font = 'bold 16px monospace'
    this.ctx.fillStyle = '#4D96FF'
    this.ctx.textAlign = 'center'
    
    const offset = Math.sin(Date.now() / 500) * 5
    this.ctx.fillText('Zzz', x + 20, y + offset)
    
    this.ctx.restore()
  }

  /**
   * 绘制调试信息
   */
  drawDebugInfo(cats) {
    this.ctx.save()
    this.ctx.font = '10px monospace'
    this.ctx.fillStyle = '#424242'
    this.ctx.textAlign = 'left'
    
    let yPos = 20
    cats.forEach(cat => {
      this.ctx.fillText(
        `${cat.name}: (${Math.round(cat.x)}, ${Math.round(cat.y)}) [${cat.state}]`,
        10,
        yPos
      )
      yPos += 15
    })
    
    this.ctx.restore()
  }

  /**
   * 更新 FPS 计数器
   */
  updateFPS(timestamp) {
    this.frameCount++
    if (timestamp - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastFpsUpdate = timestamp
    }
  }

  /**
   * 绘制 FPS 计数器
   */
  drawFPS() {
    this.ctx.save()
    this.ctx.font = 'bold 12px monospace'
    this.ctx.fillStyle = '#424242'
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`FPS: ${this.fps}`, this.width - 10, 20)
    this.ctx.restore()
  }
}
