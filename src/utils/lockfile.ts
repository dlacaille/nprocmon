import fs from 'node:fs'
import readline from 'readline-sync'
import { LockFile } from '../types/types.js'
import YAML from 'yaml'
import { processIsRunning } from './process.js'
import kill from 'tree-kill'

function createLockFile(lockFile: string) {
    const data = {
        pid: process.pid,
    }
    fs.writeFileSync(lockFile, YAML.stringify(data), 'utf8')

    process.on('exit', () => {
        deleteLockFile(lockFile)
    })
}

function checkLockFile(lockFile: string) {
    // LockFile exists, parse it
    const data = fs.readFileSync(lockFile, 'utf8')
    const parsed = YAML.parse(data) as LockFile
    // Check if the process exists
    if (processIsRunning(parsed.pid)) {
        if (
            readline.keyInYN(
                `Another instance with pid ${parsed.pid} is already running. Would you like to terminate it?`,
            )
        ) {
            console.log('Terminating process ' + parsed.pid + '...')
            kill(parsed.pid, () => {
                deleteLockFile(lockFile)
                createLockFile(lockFile)
            })
        } else {
            console.log('Not terminating the other instance.')
            console.error('Exiting to avoid conflicts.')
            process.exit(1)
        }
    } else {
        deleteLockFile(lockFile)
        createLockFile(lockFile)
    }
}

function deleteLockFile(lockFile: string) {
    fs.rmSync(lockFile)
}

export function checkOrCreateLockFile(configFile: string) {
    // Check for lockFile
    var lockFile = configFile + '.lock'
    if (fs.existsSync(lockFile)) {
        checkLockFile(lockFile)
    } else {
        createLockFile(lockFile)
    }
}
