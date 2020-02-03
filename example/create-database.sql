CREATE TABLE users (
    guid     INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING  NOT NULL
                     UNIQUE,
    password STRING
);

CREATE TABLE groups (
    guid INTEGER       PRIMARY KEY AUTOINCREMENT,
    name VARCHAR (255) UNIQUE
);

CREATE TABLE user_group (
    guid       INTEGER PRIMARY KEY AUTOINCREMENT,
    guid_user  BIGINT  REFERENCES users (guid),
    guid_group BIGINT  REFERENCES groups (guid),
    CONSTRAINT unique_user_group UNIQUE (
        guid_user,
        guid_group
    )
);