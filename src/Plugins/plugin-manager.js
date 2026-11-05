export class PluginManager {
  constructor(context = {}) {
    this.context = context
    this.plugins = new Map()
  }

  async register(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      throw new TypeError('Plugin must be an object')
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new TypeError('Plugin must have a valid name')
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`)
    }

    const instance = {
      ...plugin,
      enabled: true
    }

    this.plugins.set(plugin.name, instance)

    try {
      await instance.init?.({
        ...this.context,
        plugin: instance
      })
    } catch (error) {
      this.plugins.delete(plugin.name)
      throw error
    }

    return instance
  }

  async unregister(name) {
    const plugin = this.plugins.get(name)

    if (!plugin) return false

    try {
      await plugin.destroy?.(this.context)
    } finally {
      this.plugins.delete(name)
    }

    return true
  }

  get(name) {
    return this.plugins.get(name)
  }

  list() {
    return [...this.plugins.values()].map(plugin => ({
      name: plugin.name,
      version: plugin.version ?? '0.0.0',
      enabled: plugin.enabled
    }))
  }

  async destroyAll() {
    const results = await Promise.allSettled(
      [...this.plugins.keys()].map(name => this.unregister(name))
    )

    return results
  }
}
