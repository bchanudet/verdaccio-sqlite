CREATE TABLE users (
    guid     INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING  NOT NULL
                     UNIQUE,
    password STRING
);
