
SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

CREATE TABLE accounts (
    id bigint NOT NULL,
    type character varying(255) NOT NULL,
    user_id bigint NOT NULL
);


CREATE SEQUENCE accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE accounts_id_seq OWNED BY accounts.id;

CREATE TABLE applications (
    id bigint NOT NULL,
    name character varying(255),
    account_id bigint NOT NULL
);

CREATE SEQUENCE applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE applications_id_seq OWNED BY applications.id;

CREATE TABLE groups (
    id integer NOT NULL,
    name character varying(255)
);


CREATE SEQUENCE groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE groups_id_seq OWNED BY groups.id;

CREATE TABLE users (
    id bigint NOT NULL,
    "firstName" character varying(255) DEFAULT NULL::character varying,
    "lastName" character varying(255) DEFAULT NULL::character varying,
    email character varying(50) NOT NULL
);

CREATE TABLE users_groups (
    user_id bigint,
    group_id bigint
);

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE users_id_seq OWNED BY users.id;

ALTER TABLE ONLY accounts ALTER COLUMN id SET DEFAULT nextval('accounts_id_seq'::regclass);

ALTER TABLE ONLY applications ALTER COLUMN id SET DEFAULT nextval('applications_id_seq'::regclass);

ALTER TABLE ONLY groups ALTER COLUMN id SET DEFAULT nextval('groups_id_seq'::regclass);

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


SELECT pg_catalog.setval('accounts_id_seq', 1, false);

SELECT pg_catalog.setval('applications_id_seq', 1, false);

SELECT pg_catalog.setval('groups_id_seq', 1, false);

SELECT pg_catalog.setval('users_id_seq', 1, false);


ALTER TABLE ONLY accounts
    ADD CONSTRAINT accounts_id PRIMARY KEY (id);


ALTER TABLE ONLY accounts
    ADD CONSTRAINT accounts_user_id_unique UNIQUE (user_id);


ALTER TABLE ONLY applications
    ADD CONSTRAINT application_id PRIMARY KEY (id);


ALTER TABLE ONLY users
    ADD CONSTRAINT email UNIQUE (email);


ALTER TABLE ONLY groups
    ADD CONSTRAINT group_id PRIMARY KEY (id);


ALTER TABLE ONLY users
    ADD CONSTRAINT id PRIMARY KEY (id);


CREATE INDEX fki_account_id ON applications USING btree (account_id);


CREATE INDEX fki_accounts_user_id ON accounts USING btree (user_id);


ALTER TABLE ONLY applications
    ADD CONSTRAINT account_id FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;


ALTER TABLE ONLY accounts
    ADD CONSTRAINT accounts_user_id FOREIGN KEY (user_id) REFERENCES users(id);


ALTER TABLE ONLY users_groups
    ADD CONSTRAINT usergroupos_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ONLY users_groups
    ADD CONSTRAINT usergroups_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;