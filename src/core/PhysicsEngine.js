import Matter from 'matter-js'

/**
 * 物理引擎管理类
 * 封装 Matter.js 物理引擎功能
 */
export class PhysicsEngine {
  constructor() {
    // 创建引擎
    this.engine = Matter.Engine.create()
    
    // 配置物理参数（俯视角，无重力）
    this.engine.gravity.y = 0
    this.engine.gravity.x = 0
    
    // 创建世界
    this.world = this.engine.world
    
    // 碰撞事件回调列表
    this.collisionCallbacks = []
    
    // 设置碰撞检测事件
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      this.collisionCallbacks.forEach(callback => callback(event))
    })
  }

  /**
   * 更新物理引擎
   * @param {number} deltaTime - 帧时间差（秒）
   */
  update(deltaTime) {
    Matter.Engine.update(this.engine, deltaTime * 1000)
  }

  /**
   * 添加刚体到世界
   * @param {Matter.Body} body - Matter.js 刚体
   */
  addBody(body) {
    Matter.World.add(this.world, body)
  }

  /**
   * 从世界移除刚体
   * @param {Matter.Body} body - Matter.js 刚体
   */
  removeBody(body) {
    Matter.World.remove(this.world, body)
  }

  /**
   * 创建墙壁刚体
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {Object} options - 额外选项
   * @returns {Matter.Body}
   */
  createWall(x, y, width, height, options = {}) {
    const wall = Matter.Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      friction: 0.5,
      restitution: 0,
      label: 'wall',
      ...options
    })
    
    this.addBody(wall)
    return wall
  }

  /**
   * 创建猫的圆形碰撞体
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} radius - 半径
   * @param {Object} options - 额外选项
   * @returns {Matter.Body}
   */
  createCatBody(x, y, radius, options = {}) {
    const catBody = Matter.Bodies.circle(x, y, radius, {
      friction: 0.3,
      frictionAir: 0.05,
      restitution: 0.2,
      density: 0.001,
      label: 'cat',
      ...options
    })
    
    this.addBody(catBody)
    return catBody
  }

  /**
   * 对刚体施加力
   * @param {Matter.Body} body - 目标刚体
   * @param {number} forceX - X方向力
   * @param {number} forceY - Y方向力
   */
  applyForce(body, forceX, forceY) {
    Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY })
  }

  /**
   * 设置刚体速度
   * @param {Matter.Body} body - 目标刚体
   * @param {number} velocityX - X方向速度
   * @param {number} velocityY - Y方向速度
   */
  setVelocity(body, velocityX, velocityY) {
    Matter.Body.setVelocity(body, { x: velocityX, y: velocityY })
  }

  /**
   * 直接设置刚体位置（用于拖拽）
   * @param {Matter.Body} body - 目标刚体
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  setPosition(body, x, y) {
    Matter.Body.setPosition(body, { x, y })
  }

  /**
   * 注册碰撞事件回调
   * @param {Function} callback - 回调函数
   */
  onCollision(callback) {
    this.collisionCallbacks.push(callback)
  }

  /**
   * 清除所有碰撞回调
   */
  clearCollisionCallbacks() {
    this.collisionCallbacks = []
  }

  /**
   * 销毁物理引擎
   */
  destroy() {
    Matter.World.clear(this.world)
    Matter.Engine.clear(this.engine)
  }
}
