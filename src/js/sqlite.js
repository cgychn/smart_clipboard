const sqlite3 = require('sqlite3').verbose();

export class Sqlite {
    init (dbPath) {
        this.db = new sqlite3.Database(dbPath);
    }

    run (sqlStr) {
        return new Promise((resolve, reject) => {
            this.db.run(sqlStr, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }
    prepareRun (sqlStr, params) {
        return new Promise((resolve, reject) => {
            try {
                let st = this.db.prepare(sqlStr)
                st.run(...params)
                st.finalize()
                resolve()
            } catch (e) {
                reject(e)
            }
        })
    }
    all (sqlStr) {
        return new Promise((resolve, reject) => {
            this.db.all(sqlStr, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }

    async multiplePrepareRun(sqlStr, paramsArray) {
        console.log(sqlStr, paramsArray)
        return new Promise((resolve, reject) => {
            try {
                let st = this.db.prepare(sqlStr)
                for (let params of paramsArray) {
                    st.run(...params)
                }
                st.finalize()
                resolve()
            } catch (e) {
                reject(e)
            }
        })
    }
}


