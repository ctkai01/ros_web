// Lightweight shim to emulate a subset of the `mssql` API using `mysql2/promise`
// so the rest of the codebase (routes) can remain unchanged.
//
// Supported features used by this project:
// - new sql.ConnectionPool(config)
// - pool.connect()
// - pool.connected (boolean)
// - req = pool.request(); req.input(name, typeOrVal, maybeVal).query(sql)
// - Named params in SQL as @paramName
// - Special handling for "SELECT SCOPE_IDENTITY() AS ID" → return insertId as recordset [{ ID }]
// - Return shape: { recordset, rowsAffected }

const mysql = require('mysql2/promise');

function createShim(mysqlConfig) {
  // Types placeholder to keep existing code unchanged
  const sqlTypes = {
    Int: 'Int',
    NVarChar: 'NVarChar',
    VarChar: 'VarChar',
    VarCharMax: 'VarCharMax',
    VarBinary: 'VarBinary',
    MAX: 'MAX',
  };

  class ConnectionPool {
    constructor(config) {
      // Prefer provided config, otherwise fallback to constructor arg
      this._config = mysqlConfig || config || {};
      // Sensible defaults
      this._config.waitForConnections = this._config.waitForConnections ?? true;
      this._config.connectionLimit = this._config.pool?.max ?? this._config.connectionLimit ?? 10;
      this._config.queueLimit = this._config.queueLimit ?? 0;
      // Enable multi statements to support semi-colon separated SQL if needed
      this._config.multipleStatements = this._config.multipleStatements ?? true;

      this.connected = false;
      this._pool = null;
    }

    async connect() {
      if (!this._pool) {
        // Normalize config keys from mssql-style to mysql2
        const cfg = {
          host: this._config.server || this._config.host || 'localhost',
          user: this._config.user,
          password: this._config.password,
          database: this._config.database,
          port: this._config.port || 3306,
          waitForConnections: this._config.waitForConnections,
          connectionLimit: this._config.connectionLimit,
          queueLimit: this._config.queueLimit,
          multipleStatements: this._config.multipleStatements,
        };
        this._pool = mysql.createPool(cfg);
      }
      this.connected = true;
      return this;
    }

    request() {
      const pool = this._pool;
      if (!pool) {
        throw new Error('MySQL pool not initialized. Call connect() first.');
      }

      const inputs = [];

      const api = {
        input(name, _typeOrVal, maybeVal) {
          // Support both signatures: (name, type, value) and (name, value)
          let value = maybeVal;
          if (typeof maybeVal === 'undefined') {
            value = _typeOrVal;
          }
          inputs.push({ name, value });
          return api;
        },

        async query(sqlText) {
          // Translate SQL Server TOP to MySQL LIMIT
          let sqlWork = sqlText;

          // Translate SQL Server square-bracket identifiers to MySQL backticks: [ID] -> `ID`
          sqlWork = sqlWork.replace(/\[([A-Za-z0-9_]+)\]/g, '`$1`');
          const topRegex = /SELECT\s+TOP\s*\(?\s*(\d+)\s*\)?\s/i;
          const topMatch = sqlWork.match(topRegex);
          if (topMatch) {
            const n = topMatch[1];
            // Remove TOP n from SELECT
            sqlWork = sqlWork.replace(topRegex, 'SELECT ');
            // Append LIMIT n at end (before trailing semicolon/newlines)
            if (!/\bLIMIT\b/i.test(sqlWork)) {
              sqlWork = sqlWork.replace(/;\s*$/, '');
              sqlWork = sqlWork + `\nLIMIT ${n}`;
            }
          }

          // Quote reserved identifiers (minimal set) when used as table names
          // e.g., FROM Groups -> FROM `Groups`
          sqlWork = sqlWork
            .replace(/\b(FROM|JOIN|UPDATE|INTO)\s+Groups\b/gi, (m, kw) => `${kw} \`Groups\``)
            .replace(/\b(FROM|JOIN|UPDATE|INTO)\s+Users\b/gi, (m, kw) => `${kw} \`Users\``);

          // Strip SQL Server schema prefix for MySQL (e.g., `dbo`.Users or dbo.Users)
          sqlWork = sqlWork.replace(/`dbo`\./gi, '');
          sqlWork = sqlWork.replace(/\bdbo\./gi, '');
          // Build params in the order they APPEAR in SQL, not input() order
          const inputMap = new Map();
          for (const { name, value } of inputs) {
            inputMap.set(name, value);
          }

          const paramNamesInOrder = [];
          const nameRegex = /@([A-Za-z0-9_]+)/g;
          let convertedSql = sqlWork.replace(nameRegex, (_m, p1) => {
            paramNamesInOrder.push(p1);
            return '?';
          });

          const params = paramNamesInOrder.map((n) => {
            const v = inputMap.get(n);
            if (typeof v === 'function') {
              return v.toString();
            }
            // Handle Buffer objects (binary data) for MySQL
            if (Buffer.isBuffer(v)) {
              return v;
            }
            if (v !== null && typeof v === 'object') {
              try { return JSON.stringify(v); } catch { return String(v); }
            }
            return v;
          });

          // Handle INSERT + SCOPE_IDENTITY emulation
          const hasScopeIdentity = /SELECT\s+SCOPE_IDENTITY\(\)\s+AS\s+ID/i.test(convertedSql);
          if (hasScopeIdentity) {
            const insertSql = convertedSql.split(';')[0];
            const [result] = await pool.execute(insertSql, params);
            const insertId = result && typeof result.insertId !== 'undefined' ? result.insertId : null;
            return {
              recordset: [{ ID: insertId }],
              rowsAffected: [result?.affectedRows || 0],
            };
          }

          // Handle SQL Server OUTPUT INSERTED ... pattern (not supported in MySQL)
          if (/INSERT\s+INTO\s+[A-Za-z0-9_`\.]+\s*\([^)]+\)\s*OUTPUT\s+INSERTED\./i.test(sqlWork)) {
            // Remove OUTPUT clause
            const insertSql = sqlWork.replace(/OUTPUT[\s\S]*?VALUES/i, 'VALUES');
            const [result] = await pool.execute(insertSql.replace(nameRegex, '?'), params);
            const insertId = result && typeof result.insertId !== 'undefined' ? result.insertId : null;

            // Try to reconstruct expected recordset from known patterns
            const record = { ID: insertId };
            // Extract column names list from INSERT INTO ... (col1, col2, ...)
            const colsMatch = /INSERT\s+INTO\s+[A-Za-z0-9_`\.]+\s*\(([^)]+)\)/i.exec(sqlWork);
            if (colsMatch) {
              const colNames = colsMatch[1].split(',').map(s => s.trim().replace(/[`\[\]]/g, ''));
              // Map parameter names to values
              const paramMap = new Map();
              paramNamesInOrder.forEach((n, idx) => paramMap.set(n, params[idx]));
              // Common columns
              if (colNames.includes('Name') && paramMap.has('name')) record.Name = paramMap.get('name');
              if (colNames.includes('CreatedBy') && paramMap.has('createdBy')) record.CreatedBy = paramMap.get('createdBy');
              if (colNames.includes('Properties')) record.Properties = paramMap.get('properties');
            }

            return { recordset: [record], rowsAffected: [result?.affectedRows || 0] };
          }

          const [rows, info] = await pool.execute(convertedSql, params);
          // rows can be array (SELECT) or OkPacket (UPDATE/DELETE)
          if (Array.isArray(rows)) {
            // Process binary data in results for MySQL compatibility
            const processedRows = rows.map(row => {
              const processedRow = {};
              for (const [key, value] of Object.entries(row)) {
                // Convert MySQL binary data to Buffer if needed
                if (Buffer.isBuffer(value)) {
                  processedRow[key] = value;
                } else if (value && typeof value === 'object' && value.type === 'Buffer') {
                  // Handle Buffer serialized as object
                  processedRow[key] = Buffer.from(value.data);
                } else {
                  processedRow[key] = value;
                }
              }
              return processedRow;
            });
            
            return {
              recordset: processedRows,
              rowsAffected: [info?.affectedRows || 0],
            };
          }
          return {
            recordset: [],
            rowsAffected: [rows?.affectedRows || 0],
          };
        },

        async execute(procName) {
          // Build CALL procName(?, ?, ...) using inputs order
          const placeholders = inputs.map(() => '?').join(', ');
          const sqlCall = `CALL ${procName}(${placeholders})`;
          const params = inputs.map(p => p.value);

          // Emulate specific stored procedures used by the codebase when running on MySQL
          if (procName === 'CheckUserPermission') {
            // Expect inputs: username, module, action
            const usernameParam = inputs.find(p => p.name.toLowerCase() === 'username')?.value;
            // Determine admin permission based on group
            const checkSql = `
              SELECT g.name AS group_name, g.level AS group_level
              FROM ` + '`Users`' + ` u
              INNER JOIN UserGroups g ON u.group_id = g.id
              WHERE u.username = ?
              LIMIT 1
            `;
            const [rows] = await pool.execute(checkSql, [usernameParam]);
            let has = 0;
            if (Array.isArray(rows) && rows.length > 0) {
              const row = rows[0];
              if (row.group_name === 'Administrators' || (typeof row.group_level === 'number' && row.group_level >= 100)) {
                has = 1;
              }
            }
            return { recordset: [{ has_permission: has }], rowsAffected: [1] };
          }

          const [rows] = await pool.execute(sqlCall, params);
          // mysql2 returns nested arrays for CALL results; first result set is rows[0]
          const firstSet = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : (Array.isArray(rows) ? rows : []);
          return {
            recordset: firstSet,
            rowsAffected: [Array.isArray(firstSet) ? firstSet.length : 0],
          };
        },
      };

      return api;
    }
  }

  return {
    ConnectionPool,
    ...sqlTypes,
  };
}

module.exports = function initShim(mysqlConfig) {
  return createShim(mysqlConfig);
};


