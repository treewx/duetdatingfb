const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'duet.db');
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('📚 Connected to SQLite database');
        this.initTables();
      }
    });
  }

  initTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messenger_id TEXT UNIQUE NOT NULL,
        gender TEXT CHECK(gender IN ('Man', 'Woman')) NOT NULL,
        preference TEXT CHECK(preference IN ('Looking for a Man', 'Looking for a Woman')) NOT NULL,
        photo_url TEXT,
        summary TEXT,
        setup_completed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createRatingsTable = `
      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rater_id TEXT NOT NULL,
        person1_id TEXT NOT NULL,
        person2_id TEXT NOT NULL,
        rating BOOLEAN NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rater_id) REFERENCES users (messenger_id),
        FOREIGN KEY (person1_id) REFERENCES users (messenger_id),
        FOREIGN KEY (person2_id) REFERENCES users (messenger_id),
        UNIQUE(rater_id, person1_id, person2_id)
      )
    `;

    const createUserStateTable = `
      CREATE TABLE IF NOT EXISTS user_states (
        messenger_id TEXT PRIMARY KEY,
        current_step TEXT DEFAULT 'START',
        temp_data TEXT DEFAULT '{}',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (messenger_id) REFERENCES users (messenger_id)
      )
    `;

    this.db.run(createUsersTable, (err) => {
      if (err) console.error('Error creating users table:', err);
    });

    this.db.run(createRatingsTable, (err) => {
      if (err) console.error('Error creating ratings table:', err);
    });

    this.db.run(createUserStateTable, (err) => {
      if (err) console.error('Error creating user_states table:', err);
    });
  }

  getUser(messengerId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE messenger_id = ?',
        [messengerId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  createUser(userData) {
    return new Promise((resolve, reject) => {
      const { messenger_id, gender, preference, photo_url, summary } = userData;
      this.db.run(
        `INSERT INTO users (messenger_id, gender, preference, photo_url, summary, setup_completed)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [messenger_id, gender, preference, photo_url, summary],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getUserState(messengerId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM user_states WHERE messenger_id = ?',
        [messengerId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || { messenger_id: messengerId, current_step: 'START', temp_data: '{}' });
        }
      );
    });
  }

  updateUserState(messengerId, step, tempData = {}) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO user_states (messenger_id, current_step, temp_data, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [messengerId, step, JSON.stringify(tempData)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getRandomCouple() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM users 
         WHERE setup_completed = TRUE
         ORDER BY RANDOM() 
         LIMIT 2`,
        (err, rows) => {
          if (err) reject(err);
          else if (rows.length >= 2) resolve(rows);
          else resolve(null);
        }
      );
    });
  }

  addRating(raterId, person1Id, person2Id, rating) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO ratings (rater_id, person1_id, person2_id, rating)
         VALUES (?, ?, ?, ?)`,
        [raterId, person1Id, person2Id, rating],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getTopMatches(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT u.*, COUNT(r.rating) as match_score
         FROM users u
         JOIN ratings r ON (
           (r.person1_id = u.messenger_id AND r.person2_id = ?) OR
           (r.person2_id = u.messenger_id AND r.person1_id = ?)
         )
         WHERE u.messenger_id != ? 
         AND r.rating = TRUE
         GROUP BY u.messenger_id
         ORDER BY match_score DESC
         LIMIT 10`,
        [userId, userId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('Database connection closed');
        resolve();
      });
    });
  }
}

module.exports = Database;