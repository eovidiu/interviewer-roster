import { createApp } from './app.js'
import config from './config/index.js'

/**
 * Start the server
 */
async function start() {
  try {
    const app = await createApp()

    // Graceful shutdown
    const closeListeners = ['SIGINT', 'SIGTERM']
    closeListeners.forEach((signal) => {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}, closing server gracefully`)
        await app.close()
        process.exit(0)
      })
    })

    // Start listening
    await app.listen({
      port: config.server.port,
      host: config.server.host
    })

    app.log.info(`Server listening on http://${config.server.host}:${config.server.port}`)

    if (config.swagger.enabled) {
      app.log.info(`API documentation available at http://localhost:${config.server.port}/docs`)
    }
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
