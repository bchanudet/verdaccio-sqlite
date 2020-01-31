import { Callback, Logger, IPluginAuth } from '@verdaccio/types';
import * as sqlite3 from 'sqlite3';

interface SQLiteAuthConfig {
    path : string;
    mode : number;
    queries : ISQLiteQueries;
}

interface ISQLiteQueries{
    readonly add_user: string;
    readonly update_user: string;
    readonly auth_user: string;
}

export default class MysqlAuth  implements IPluginAuth<SQLiteAuthConfig> {

    private database_path : string;
    private queries : ISQLiteQueries;

    private logger: Logger;
    private connOK: boolean;
    
    constructor(configuration : SQLiteAuthConfig, stuff: { logger: Logger}){

        this.database_path = configuration.path;
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

    authenticate(user: string, password: string, cb: Callback){
        const db = new sqlite3.Database(this.database_path);

        if(this.queries.auth_user.length == 0){
            this.logger.info('SQLite - Can\'t authenticate: authenticate query is empty');
            cb(null, false)
            return;
        }

        db.get(this.queries.auth_user,[user, password], (error, result) => {
            if(error || result.length !== 1 || result[0].usergroups === null){
                cb(null, false);
            }
            else { 
                cb(null, result[0].usergroups.split(','));
            }
        });

        db.close();
    }

    adduser(user: string, password: string, cb: Callback){
        const db = new sqlite3.Database(this.database_path);

        if(this.queries.auth_user.length == 0){
            this.logger.info('SQLite - Can\'t add user: add_user query is empty');
            cb(null, false)
            return;
        }

        db.get(this.queries.auth_user,[user, password], (error, result) => {
            if(error || result.length !== 1 || result[0].usergroups === null){
                cb(null, false);
            }
            else { 
                cb(null, result[0].usergroups.split(','));
            }
        });

        db.close();
    }

    changePassword(user: string, password: string, newPassword: string, cb: Callback){
        const db = new sqlite3.Database(this.database_path);

        if(this.queries.update_user.length == 0){
            this.logger.info('MySQL - Can\'t change password: update_user query is empty');
            cb(null, false)
            return;
        }

        db.run(this.queries.update_user,[newPassword, user, password], (error) => {
            if(error){
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