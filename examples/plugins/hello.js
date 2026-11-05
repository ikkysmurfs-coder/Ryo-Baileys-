export default {
  name: 'hello-plugin',
  version: '1.0.0',

  async init({ logger }) {
    logger?.info?.('Hello Plugin initialized')
  },

  async destroy() {
    console.log('Hello Plugin stopped')
  }
}
