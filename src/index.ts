import { Callback, Logger, IPluginAuth } from '@verdaccio/types';
import * as sqlite3 from 'sqlite3';
import * as crypto from 'crypto';
import { existsSync } from 'fs';


interface SQLiteAuthConfig {
    path : string;
    password_secret: string;
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
    
    constructor(configuration : SQLiteAuthConfig, stuff: { logger: Logger}){

        this.database_path = configuration.path;
        this.password_secret = configuration.password_secret;
        this.queries = new SQLiteQueries(configuration.queries);
        this.logger = stuff.logger;
        
        // Basic configuration check
        if(!existsSync(this.database_path)){
            this.logger.error('SQLite - Database doesn\'t exist at path: ' + this.database_path);
        }
        if(this.queries.auth_user.length == 0){
            this.logger.error('SQLite - auth_user query is empty. Users can\'t log in.');
        }
        if(this.password_secret.length === 0){
            this.logger.warn('SQLite - No secret provided. Password encryption disabled.');
        }
        if(this.queries.update_user.length == 0){
            this.logger.warn('SQLite - update_user query is empty. Users can\'t change their passwords.');
        }
        if(this.queries.add_user.length == 0){
            this.logger.warn('SQLite - add_user query is empty. Users can\'t create accounts.');
        }
    }

    private hash(password: string) : string{
        if(this.password_secret.length === 0){
            return password;
        }

        const hashed = crypto.pbkdf2Sync(password, this.password_secret, 10000, 64, 'sha512');
        return hashed.toString('hex');
    }

    authenticate(user: string, password: string, cb: Callback){
        const db = new sqlite3.Database(this.database_path);

        if(this.queries.auth_user.length == 0){
            return cb(null, false);
        }

        db.all(this.queries.auth_user,[user, this.hash(password)], (error, results) => {
            if(error){
                this.logger.error('SQLite - auth_error:' + error.message);
                cb(null, false);
            }
            else if(results.length !== 1){
                cb(null, false);
            }
            else { 
                let groups: string[] = [''];
                if(results[0].usergroups !== null){
                    groups = results[0].usergroups.split(',');
                }

                this.logger.info('SQLite - auth_success: ' + user + '; groups:' + JSON.stringify(groups));
                cb(null, groups);
            }
        });

        db.close();
    }

    adduser(user: string, password: string, cb: Callback){
        const db = new sqlite3.Database(this.database_path);

        if(this.queries.add_user.length == 0){
            cb(null, false)
            return;
        }

        db.get(this.queries.add_user,[user, this.hash(password)], (error, result) => {
            if(error){
                this.logger.error('SQLite - adduser_error' + error.message);
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
            cb(null, false)
            return;
        }

        db.run(this.queries.update_user,[this.hash(newPassword), user, this.hash(password)], (error) => {
            if(error){
                this.logger.error('SQLite - changepassword_error: ' + error.message);
                cb(null, false);
            }
            else { 
                cb(null, true);
            }
        });

        db.close();
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