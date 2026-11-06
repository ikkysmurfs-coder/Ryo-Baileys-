export class PluginManager {
  constructor(context = {}) {
    this.context = context
    this.eventSource =
      context.events ??
      context.socket?.ev ??
      context.ev

    this.plugins = new Map()
  }

  createPluginEvents(plugin) {
    const listeners = new Set()
    const source = this.eventSource

    const on = (event, listener) => {
      if (!source?.on) {
        throw new Error('WhatsApp event source is not available')
      }

      if (typeof listener !== 'function') {
        throw new TypeError('Listener must be a function')
      }

      const wrapped = async (...args) => {
        if (!plugin.enabled) return

        try {
          await listener(...args)
        } catch (error) {
          this.context.logger?.error?.(
            { err: error, plugin: plugin.name, event },
            'Plugin event handler failed'
          )
        }
      }

      source.on(event, wrapped)
      listeners.add({ event, listener: wrapped })
      return plugin
    }

    const off = (event, listener) => {
      for (const entry of listeners) {
        if (
          entry.event === event &&
          (!listener || entry.listener === listener)
        ) {
          source?.off?.(event, entry.listener)
          source?.removeListener?.(event, entry.listener)
          listeners.delete(entry)
        }
      }

      return plugin
    }

    return {
      on,
      off,
      removeAllListeners() {
        for (const entry of listeners) {
          source?.off?.(entry.event, entry.listener)
          source?.removeListener?.(entry.event, entry.listener)
        }

        listeners.clear()
      }
    }
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

    const events = this.createPluginEvents(instance)

    instance.events = events
    this.plugins.set(instance.name, instance)

    try {
      await instance.init?.({
        ...this.context,
        events,
        plugin: instance
      })
    } catch (error) {
      events.removeAllListeners()
      this.plugins.delete(instance.name)
      throw error
    }

    return instance
  }

  async unregister(name) {
    const plugin = this.plugins.get(name)

    if (!plugin) return false

    plugin.enabled = false

    try {
      await plugin.destroy?.({
        ...this.context,
        plugin
      })
    } finally {
      plugin.events.removeAllListeners()
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
    return Promise.allSettled(
      [...this.plugins.keys()].map(name => this.unregister(name))
    )
  }
}
