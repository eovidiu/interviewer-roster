import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import Fastify from 'fastify'
import databasePlugin from '../database.js'
import { existsSync, unlinkSync } from 'fs'

describe('Database Plugin', () => {
  let app

  beforeEach(async () => {
    // Override config for testing - use in-memory database
    process.env.DATABASE_PATH = ':memory:'
    process.env.NODE_ENV = 'test'

    app = Fastify({ logger: false })
  })

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  test('should register database plugin', async () => {
    await app.register(databasePlugin)
    await app.ready()

    expect(app.db).toBeDefined()
    expect(typeof app.db.prepare).toBe('function')
  })

  test('should decorate app with db instance', async () => {
    await app.register(databasePlugin)
    await app.ready()

    expect(app.hasDecorator('db')).toBe(true)
  })

  test('should decorate app with query helpers', async () => {
    await app.register(databasePlugin)
    await app.ready()

    expect(app.hasDecorator('query')).toBe(true)
    expect(typeof app.query.all).toBe('function')
    expect(typeof app.query.get).toBe('function')
    expect(typeof app.query.run).toBe('function')
    expect(typeof app.query.transaction).toBe('function')
  })

  test('query.all should execute SELECT queries', async () => {
    await app.register(databasePlugin)
    await app.ready()

    // Create test table
    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()
    app.db.prepare("INSERT INTO test VALUES (1, 'Alice')").run()
    app.db.prepare("INSERT INTO test VALUES (2, 'Bob')").run()

    const results = app.query.all('SELECT * FROM test ORDER BY id')
    expect(results).toHaveLength(2)
    expect(results[0].name).toBe('Alice')
    expect(results[1].name).toBe('Bob')
  })

  test('query.all should support parameters', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()
    app.db.prepare("INSERT INTO test VALUES (1, 'Alice')").run()
    app.db.prepare("INSERT INTO test VALUES (2, 'Bob')").run()

    const results = app.query.all('SELECT * FROM test WHERE id = ?', [1])
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Alice')
  })

  test('query.get should return single row', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()
    app.db.prepare("INSERT INTO test VALUES (1, 'Alice')").run()

    const result = app.query.get('SELECT * FROM test WHERE id = ?', [1])
    expect(result).toBeDefined()
    expect(result.name).toBe('Alice')
  })

  test('query.get should return undefined when no results', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()

    const result = app.query.get('SELECT * FROM test WHERE id = ?', [999])
    expect(result).toBeUndefined()
  })

  test('query.run should execute INSERT/UPDATE/DELETE', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()

    const result = app.query.run('INSERT INTO test VALUES (?, ?)', [1, 'Alice'])
    expect(result.changes).toBe(1)
    expect(result.lastInsertRowid).toBe(1)
  })

  test('query.run should support UPDATE statements', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()
    app.db.prepare("INSERT INTO test VALUES (1, 'Alice')").run()

    const result = app.query.run('UPDATE test SET name = ? WHERE id = ?', ['Bob', 1])
    expect(result.changes).toBe(1)

    const updated = app.query.get('SELECT * FROM test WHERE id = ?', [1])
    expect(updated.name).toBe('Bob')
  })

  test('query.run should support DELETE statements', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()
    app.db.prepare("INSERT INTO test VALUES (1, 'Alice')").run()

    const result = app.query.run('DELETE FROM test WHERE id = ?', [1])
    expect(result.changes).toBe(1)

    const rows = app.query.all('SELECT * FROM test')
    expect(rows).toHaveLength(0)
  })

  test('query.transaction should execute transactions', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()

    const insertMany = (items) => {
      for (const item of items) {
        app.db.prepare('INSERT INTO test VALUES (?, ?)').run(item.id, item.name)
      }
    }

    app.query.transaction(() => {
      insertMany([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
    })

    const results = app.query.all('SELECT * FROM test')
    expect(results).toHaveLength(2)
  })

  test('query.transaction should rollback on error', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)').run()

    // Attempt transaction that will fail
    expect(() => {
      app.query.transaction(() => {
        app.db.prepare('INSERT INTO test VALUES (?, ?)').run(1, 'Alice')
        app.db.prepare('INSERT INTO test VALUES (?, ?)').run(2, 'Bob')
        // This will fail due to primary key constraint
        app.db.prepare('INSERT INTO test VALUES (?, ?)').run(1, 'Charlie')
      })
    }).toThrow()

    // Verify rollback - table should be empty
    const results = app.query.all('SELECT * FROM test')
    expect(results).toHaveLength(0)
  })

  test('query.transaction should rollback when function throws', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()

    // Transaction that throws an error
    expect(() => {
      app.query.transaction(() => {
        app.db.prepare('INSERT INTO test VALUES (?, ?)').run(1, 'Alice')
        app.db.prepare('INSERT INTO test VALUES (?, ?)').run(2, 'Bob')
        throw new Error('Intentional error for testing rollback')
      })
    }).toThrow('Intentional error for testing rollback')

    // Verify rollback - no rows should be inserted
    const results = app.query.all('SELECT * FROM test')
    expect(results).toHaveLength(0)
  })

  test('query.transaction should handle nested operations', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS test').run()
    app.db.prepare('CREATE TABLE test (id INTEGER, name TEXT)').run()

    // Complex transaction with multiple operations
    app.query.transaction(() => {
      app.db.prepare('INSERT INTO test VALUES (?, ?)').run(1, 'Alice')
      app.db.prepare('INSERT INTO test VALUES (?, ?)').run(2, 'Bob')
      app.db.prepare('UPDATE test SET name = ? WHERE id = ?').run('Alice Updated', 1)
      app.db.prepare('DELETE FROM test WHERE id = ?').run(2)
    })

    const results = app.query.all('SELECT * FROM test')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Alice Updated')
  })

  test('query.transaction should maintain data integrity across multiple tables', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS users').run()
    app.db.prepare('DROP TABLE IF EXISTS orders').run()
    app.db.prepare('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)').run()
    app.db.prepare('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount INTEGER)').run()

    // Transaction affecting multiple tables
    app.query.transaction(() => {
      app.db.prepare('INSERT INTO users VALUES (?, ?)').run(1, 'Alice')
      app.db.prepare('INSERT INTO orders VALUES (?, ?, ?)').run(1, 1, 100)
      app.db.prepare('INSERT INTO orders VALUES (?, ?, ?)').run(2, 1, 200)
    })

    const users = app.query.all('SELECT * FROM users')
    const orders = app.query.all('SELECT * FROM orders')
    expect(users).toHaveLength(1)
    expect(orders).toHaveLength(2)
  })

  test('query.transaction should rollback all tables on error', async () => {
    await app.register(databasePlugin)
    await app.ready()

    app.db.prepare('DROP TABLE IF EXISTS users').run()
    app.db.prepare('DROP TABLE IF EXISTS orders').run()
    app.db.prepare('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)').run()
    app.db.prepare('CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount INTEGER)').run()

    // Transaction that fails partway through
    expect(() => {
      app.query.transaction(() => {
        app.db.prepare('INSERT INTO users VALUES (?, ?)').run(1, 'Alice')
        app.db.prepare('INSERT INTO orders VALUES (?, ?, ?)').run(1, 1, 100)
        // This will fail
        app.db.prepare('INSERT INTO orders VALUES (?, ?, ?)').run(1, 1, 200)
      })
    }).toThrow()

    // Verify both tables are empty (complete rollback)
    const users = app.query.all('SELECT * FROM users')
    const orders = app.query.all('SELECT * FROM orders')
    expect(users).toHaveLength(0)
    expect(orders).toHaveLength(0)
  })

  test('should enable WAL mode', async () => {
    await app.register(databasePlugin)
    await app.ready()

    const result = app.db.pragma('journal_mode', { simple: true })
    expect(result).toBe('wal')
  })

  test('should enable foreign keys', async () => {
    await app.register(databasePlugin)
    await app.ready()

    const result = app.db.pragma('foreign_keys', { simple: true })
    expect(result).toBe(1)
  })

  test('should close database connection on app close', async () => {
    await app.register(databasePlugin)
    await app.ready()

    const dbInstance = app.db
    await app.close()

    // Database should be closed
    expect(() => {
      dbInstance.prepare('SELECT 1')
    }).toThrow()
  })
})
