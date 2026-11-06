export interface RyoPlugin {
	name: string
	version?: string
	enabled?: boolean
	init?: (context: any) => void | Promise<void>
	destroy?: (context: any) => void | Promise<void>
	[key: string]: any
}

export declare class PluginManager {
	constructor(context?: any)
	register(plugin: RyoPlugin): Promise<RyoPlugin>
	unregister(name: string): Promise<boolean>
	get(name: string): RyoPlugin | undefined
	list(): Array<{ name: string; version: string; enabled: boolean }>
	destroyAll(): Promise<any>
}
