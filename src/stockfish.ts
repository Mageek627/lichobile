import {
  Capacitor,
  Plugins,
  WebPlugin,
  registerWebPlugin,
  PluginListenerHandle,
  ListenerCallback,
  FilesystemDirectory,
  FileReadResult,
} from '@capacitor/core'
import { VariantKey } from './lichess/interfaces/variant'
import { isVariant } from './lichess/variant'

const { Filesystem } = Plugins

// TODO change with release tag
// const evalFileDownloadUrl = 'https://github.com/veloce/lichobile/releases/download/untagged-d0a2ac9381c497befad0'
const evalFilename = 'nn-82215d0fd0df.nnue'

// custom web plugin registration done here for now
// because importing code from node_modules causes capacitor runtime code to
// be included twice
if (Capacitor.platform === 'web') {
  class StockfishWeb extends WebPlugin {
    private worker?: Worker
    private listener?: ListenerCallback

    constructor() {
      super({
        name: 'Stockfish',
        platforms: ['web']
      })
    }

    addListener(_: string, callback: ListenerCallback): PluginListenerHandle {
      this.listener = callback
      if (this.worker) {
        this.worker.onmessage = msg => {
          if (this.listener) this.listener({ line: msg.data })
        }
      }

      return {
        remove: () => {
          this.listener = undefined
          if (this.worker) {
            this.worker.onmessage = null
          }
        }
      }
    }

    removeAllListeners(): void {
      this.listener = undefined
      if (this.worker) this.worker.onmessage = null
    }

    async getMaxMemory(): Promise<number> {
      return 1024
    }

    async getCPUArch(): Promise<string> {
      return 'unknown'
    }

    async start() {
      return new Promise((resolve) => {
        if (this.worker) {
          this.worker.onmessage = msg => {
            if (this.listener) this.listener({ line: msg.data })
          }
          setTimeout(resolve, 1)
        } else {
          this.worker = new Worker('../stockfish.js')
          this.worker.onmessage = msg => {
            if (this.listener) this.listener({ line: msg.data })
          }
          setTimeout(resolve, 1)
        }
      })
    }

    async cmd({ cmd }: { cmd: string }) {
      return new Promise((resolve) => {
        if (this.worker) this.worker.postMessage(cmd)
        setTimeout(resolve, 1)
      })
    }

    async exit() {
      return new Promise((resolve) => {
        if (this.worker) {
          this.worker.terminate()
          this.worker = undefined
        }
        setTimeout(resolve, 1)
      })
    }
  }

  const stockfishWeb = new StockfishWeb()

  registerWebPlugin(stockfishWeb)
}

interface StockfishPlugin {
  addListener(event: 'output', callback: (v: { line: string }) => void): void
  removeAllListeners(): void
  getMaxMemory(): Promise<{ value: number }>
  getCPUArch(): Promise<{ value: string }>
  start(): Promise<void>
  cmd(options: { cmd: string }): Promise<void>
  exit(): Promise<void>
}

const StockfishPlugin = Plugins.Stockfish as StockfishPlugin

export class Stockfish {
  public plugin: StockfishPlugin

  constructor(readonly variant: VariantKey) {
    // todo implem variant
    this.plugin = isVariant(variant) ? StockfishPlugin : StockfishPlugin

    this.plugin.getCPUArch()
    .then(({ value }) => console.log('cpuArch', value))
  }

  public addListener(callback: (line: string) => void) {
    this.plugin.removeAllListeners()
    this.plugin.addListener('output', ({ line }) => {
      console.debug('[stockfish >>] ' + line)
      callback(line)
    })
  }

  public send(text: string): Promise<void> {
    console.debug('[stockfish <<] ' + text)
    return this.plugin.cmd({ cmd: text })
  }

  public setOption(name: string, value: string | number | boolean): Promise<void> {
    return this.send(`setoption name ${name} value ${value}`)
  }

  public setVariant(): Promise<void> {
    if (isVariant(this.variant)) {
      if (this.variant === 'chess960')
        return this.setOption('UCI_Chess960', true)
      else if (this.variant === 'antichess')
        return this.setOption('UCI_Variant', 'giveaway')
      else
        return this.setOption('UCI_Variant', this.variant.toLowerCase())
    }

    return Promise.resolve()
  }
}

const memPromise = StockfishPlugin.getMaxMemory().then(r => r.value)

export function getMaxMemory(): Promise<number> {
  return memPromise
}

export function getNbCores(): number {
  const cores = window.deviceInfo.cpuCores
  return cores > 2 ? cores - 1 : 1
}

export function getEvalFile(): Promise<FileReadResult> {
  return Filesystem.readFile({
    path: evalFilename,
    directory: FilesystemDirectory.Data
  })
}

export function getEvalFileStat() {
  return Filesystem.stat({
    path: evalFilename,
    directory: FilesystemDirectory.Data
  })
}
