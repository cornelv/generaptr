
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;


CREATE TYPE status AS ENUM (
    'open',
    'closed',
    'testt'
);


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


CREATE TABLE test_status (
    id bigint NOT NULL,
    status status
);


CREATE SEQUENCE test_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE test_status_id_seq OWNED BY test_status.id;

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
ALTER TABLE ONLY test_status ALTER COLUMN id SET DEFAULT nextval('test_status_id_seq'::regclass);
ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


COPY accounts (id, type, user_id) FROM stdin;
\.


SELECT pg_catalog.setval('accounts_id_seq', 1, false);


COPY applications (id, name, account_id) FROM stdin;
\.


SELECT pg_catalog.setval('applications_id_seq', 1, false);


COPY groups (id, name) FROM stdin;
\.


SELECT pg_catalog.setval('groups_id_seq', 1, false);


COPY test_status (id, status) FROM stdin;
1   open
2   closed
3   open
\.

SELECT pg_catalog.setval('test_status_id_seq', 3, true);


COPY users (id, "firstName", "lastName", email) FROM stdin;
\.


COPY users_groups (user_id, group_id) FROM stdin;
\.

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


ALTER TABLE ONLY test_status
    ADD CONSTRAINT status_pk PRIMARY KEY (id);

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


REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

