# SQLite Authentication plugin for Verdaccio

This plugin allows you to use a SQLite database as the store for your user data. This is especially useful if you already one and you want to use it for Verdaccio as well. 

## Install the plugin

### 1. Get the package with NPM

    > npm install -g verdaccio-sqlite

Current release version is v1.0.0

### 2. Add the plugin in your Verdaccio configuration

In your `config.yaml` file, look for the `auth` section. Add the following part right after, replacing the string `YOUR_[...]` with your values.

```yaml
auth:
    sqlite:
        path: "PATH/TO/YOUR_DB.db"
        queries:
            auth_user: 'SELECT QUERY'
            add_user: 'INSERT QUERY'
            update_user: 'UPDATE QUERY'
```

### 3. Specify custom queries to match your database schema.

Similarly as prepared queries, the parameters for each query must be declared in the query with `?` as placeholders.

#### `auth_user`: Authentication query

This is the query that will be ran for each authentication tentative. 

This query has two parameters in this exact order:

1. The username provided by the user
2. The password given

If the authentication is successful, the query must return one row with two columns: 

- `username`: Username of the user.
- `usergroups`: comma-separated list of all user's groups.

If not successful, the query must return an empty recordset.


#### `add_user`: New user query 

This query allows users to create a new record in the MySQL database.

This query has two parameters in this exact order:

1. The username for the new user
2. The password given

Declare `add_user` as an empty string to forbid anyone to create a new user in the database from Verdaccio or the npm CLI. 

#### `update_user`: Update user password

This query allows users to change their password with Verdaccio.

This query has three parameters in this exact order:

1. The new password for the user
2. The username 
3. The original password 

Declare `update_user` as an empty string to forbid anyone to update their password from Verdaccio or the npm CLI.

## See an example of the configuration

Have a look inside the [example](example/) folder to find an example of the configuration on a simple server:

- [mysql-database.sql](example/mysql-database.sql) contains queries to setup a really simple database with 3 tables: `users`, `groups` and `user_group`
- [mysql-config.yaml](example/mysql-config.yaml) describes the configuration to put into `config.yaml` to work with the schema described in the SQL file.

## Development / Building

This plugin is a regular TypeScript project. 

### Get the sources

    $ git clone https://github.com/bchanudet/verdaccio-mysql.git
    $ npm install 

### Build the plugin and link it globally

For plugins, Verdaccio only looks for packages installed in its directory, or globally installed. 

    $ npm link

This command wil build verdaccio-mysql, and add a symbolic link to the new version in the global repository of npm. This way it can be used with your local version of Verdaccio.

## Found a bug?

[Create a new issue](https://github.com/bchanudet/verdaccio-mysql/issues/new), I'll do my best to answer and fix the problem! 
