import { Callback, Logger, IPluginAuth } from '@verdaccio/types';
import * as sqlite3 from 'sqlite3';
import * as crypto from 'crypto';


interface SQLiteAuthConfig {
    path : string;
    secret: string;
    mode : number;
    queries : ISQLiteQueries;
}

interface ISQLiteQueries{
    readonly add_user: string;
    readonly update_user: string;
    readonly auth_user: string;
}

export default class SQLiteAuth  implements IPluginAuth<SQLiteAuthConfig> {

    private database_path : string;
    private password_secret: string;
    private queries : ISQLiteQueries;

    private logger: Logger;
    private connOK: boolean;
    
    constructor(configuration : SQLiteAuthConfig, stuff: { logger: Logger}){

        this.database_path = configuration.path;
        this.password_secret = configuration.secret;
        this.queries = new SQLiteQueries(configuration.queries);
        this.logger = stuff.logger;
        
        this.connOK = false;

        // Calling initialization at the constructor check connection to the database.
        this.test()
            .then((success : boolean) => {
                if(success) {
                    this.connOK = true;
                }
            })
            .catch((reason) => {
                this.connOK = false;
            });
    }

    private hash(password: string) : string{
        const hashed = crypto.pbkdf2Sync(password, this.password_secret, 10000, 64, 'sha512');
        return hashed.toString('hex');
    }

    authenticate(user: string, password: string, cb: Callback){
        const db = new sqlite3.Database(this.database_path);

        if(this.queries.auth_user.length == 0){
            this.logger.info('SQLite - Can\'t authenticate: authenticate query is empty');
            cb(null, false)
            return;
        }

        db.all(this.queries.auth_user,[user, this.hash(password)], (error, results) => {
            if(error){
                this.logger.error('SQLite - ' + error.message);
                cb(null, false);
            }
            else if(results.length !== 1 || results[0].usergroups === null){
                this.logger.error('SQLite - No results :' + JSON.stringify(results));
                cb(null, false);
            }
            else { 
                this.logger.info('SQLite - logged in: '+ results[0].username);
                cb(null, results[0].usergroups.split(','));
            }
        });

        db.close();
    }

    adduser(user: string, password: string, cb: Callback){
        const db = new sqlite3.Database(this.database_path);

        if(this.queries.add_user.length == 0){
            this.logger.info('SQLite - Can\'t add user: add_user query is empty');
            cb(null, false)
            return;
        }

        db.get(this.queries.add_user,[user, this.hash(password)], (error, result) => {
            if(error){
                this.logger.error('SQLite - ' + error.message);
                cb(null, false);
            }
            else { 
                cb(null, true);
            }
        });

        db.close();
    }

    changePassword(user: string, password: string, newPassword: string, cb: Callback){
        const db = new sqlite3.Database(this.database_path);

        if(this.queries.update_user.length == 0){
            this.logger.info('SQLite - Can\'t change password: update_user query is empty');
            cb(null, false)
            return;
        }

        db.run(this.queries.update_user,[this.hash(newPassword), user, this.hash(password)], (error) => {
            if(error){
                this.logger.error('SQLite - ' + error.message);
                cb(null, false);
            }
            else { 
                cb(null, true);
            }
        });

        db.close();
    }

    private async test() : Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const db = new sqlite3.Database(this.database_path);

            db.get('SELECT 1', (err, res) => {
                if(err){
                    this.logger.error('SQLite - Test connection did not work');
                    this.logger.error('SQLite - Error: '+ err.message);
                    reject();
                }
                db.close();
                resolve();
                return;
            });
        });
    }
}


class SQLiteQueries implements ISQLiteQueries{

    constructor(private custom : ISQLiteQueries){

    }

    public get add_user() : string{
        if(this.custom.add_user !== undefined){
            return this.custom.add_user;
        }

        return '';
    }

    public get update_user() : string{
        if(this.custom.update_user !== undefined){
            return this.custom.update_user;
        }
        return '';
    }

    public get auth_user(): string{
        if(this.custom.auth_user !== undefined){
            return this.custom.auth_user;
        }
        return '';
    }
}