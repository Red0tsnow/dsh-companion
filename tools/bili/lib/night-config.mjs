import { ROOT as COMPANION_ROOT, P as COMPANION_PATHS } from '../../runtime.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { DSH_HOME, configPath } from './paths.mjs'
export function readNightConfig(home = DSH_HOME) {
  let user = {}, legacy = {}
  try { user = JSON.parse(fs.readFileSync(configPath, 'utf8')).night ?? {} } catch {}
  try { legacy = JSON.parse(fs.readFileSync(path.join(home, 'whale-night.config.json'), 'utf8')) } catch {}
  return { windows: [{ start: '20:00', end: '24:00', wakes: 1 }], skipChance: 0.3, maxVideos: 5, ...user, ...legacy }
}
