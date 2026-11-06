import { DEFAULT_CONNECTION_CONFIG } from '../Defaults'
import type { UserFacingSocketConfig } from '../Types'
import { makeCommunitiesSocket } from './communities'
import { PluginManager } from '../Plugins/plugin-manager'

// export the last socket layer
const makeWASocket = (config: UserFacingSocketConfig) => {
	const newConfig = {
		...DEFAULT_CONNECTION_CONFIG,
		...config
	}

	const socket = makeCommunitiesSocket(newConfig)
	const plugins = new PluginManager({
		...newConfig,
		socket,
		events: socket.ev,
		logger: newConfig.logger
	})

	const socketWithPlugins = Object.assign(socket, { plugins })

	let pluginsDestroyed = false

	socket.ev.on('connection.update', ({ connection }) => {
		if (connection === 'close' && !pluginsDestroyed) {
			pluginsDestroyed = true
			void plugins.destroyAll()
		}
	})

	return socketWithPlugins
}

export default makeWASocket
