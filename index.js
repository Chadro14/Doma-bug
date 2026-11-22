const { spawn } = require('child_process')
const path = require('path')

// Avoid a crash loop when a runtime dependency or startup setting is missing.
let failures = 0

function start() {
  const startedAt = Date.now()
  const args = [path.join(__dirname, 'main.js'), ...process.argv.slice(2)]
  console.log('Starting DOMA:', process.execPath, args[0])
  const child = spawn(process.execPath, args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  })

  let requestedReset = false

  child.on('message', message => {
    if (message === 'reset' && !requestedReset) {
      requestedReset = true
      console.log('DOMA: controlled restart requested.')
      child.kill()
    }
  })

  child.on('error', error => {
    console.error('DOMA: unable to start child process:', error)
  })

  child.on('exit', (code, signal) => {
    console.error('DOMA exited:', code, signal || '')
    if (code === 0 && !requestedReset) return

    if (Date.now() - startedAt > 60000) failures = 0
    const delay = requestedReset
      ? 1000
      : Math.min(60000, 3000 * 2 ** Math.min(failures++, 4))

    console.warn(`DOMA: retrying startup in ${Math.round(delay / 1000)} seconds...`)
    setTimeout(start, delay)
  })
}

start()
