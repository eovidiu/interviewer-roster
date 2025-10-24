import fp from 'fastify-plugin'
import Database from 'better-sqlite3'
import config from '../config/index.js'

/**
 * Database plugin using better-sqlite3
 * Provides connection pool and helper methods
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} _options
 */
async function databasePlugin(fastify, _options) {
  const db = new Database(config.database.path, {
    verbose: config.isDevelopment ? console.log : null
  })

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Decorator to expose database instance
  fastify.decorate('db', db)

  // Helper: Run query with parameters
  fastify.decorate('query', {
    /**
     * Execute a SELECT query
     * @param {string} sql
     * @param {any[]} params
     * @returns {any[]}
     */
    all: (sql, params = []) => {
      const stmt = db.prepare(sql)
      return stmt.all(...params)
    },

    /**
     * Execute a SELECT query returning single row
     * @param {string} sql
     * @param {any[]} params
     * @returns {any|undefined}
     */
    get: (sql, params = []) => {
      const stmt = db.prepare(sql)
      return stmt.get(...params)
    },

    /**
     * Execute INSERT/UPDATE/DELETE
     * @param {string} sql
     * @param {any[]} params
     * @returns {{ changes: number, lastInsertRowid: number }}
     */
    run: (sql, params = []) => {
      const stmt = db.prepare(sql)
      return stmt.run(...params)
    },

    /**
     * Execute transaction
     * @param {Function} fn Transaction function
     * @returns {any}
     */
    transaction: (fn) => {
      const transaction = db.transaction(fn)
      return transaction()
    }
  })

  // Add shutdown hook
  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Closing database connection')
    db.close()
  })

  fastify.log.info({ path: config.database.path }, 'Database connected')
}

export default fp(databasePlugin, {
  name: 'database'
})
