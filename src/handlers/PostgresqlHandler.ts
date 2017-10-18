import { Client } from 'pg';
import Utils from '../commons/utils/utils';
import BaseHandler from './BaseHandler';
import { Schema, Table, Column, PostgreSqlColumnSchema, TableReference, PostgresqlRawTableReference } from '../commons/types';

/**
 * Postgresql Handler.
 *
 * @export
 * @class PostgresqlHandler
 * @extends {BaseHandler}
 */
export default class PostgresqlHandler extends BaseHandler {
  /**
   * Postgresql connection object.
   *
   * @private
   * @type {pg.Connection}
   * @memberof PostgresqlHandler
   */
  private connection: Client;

  /**
   * Potgresql connection options
   *
   * @private
   * @type {pg.IConnectionParameters}
   * @memberof MysqlHandler
   */
  private options: Client.IConnectionParameters;
  /**
   * Constructor for the MySqlHandler.
   *
   * @param {Client.IConnectionParameters} options Connection parameters.
   */
  public constructor(options: Client.IConnectionParameters) {
    super('postgresql');

    this.options = options;

    this.connection = new Client({
      host: this.options.host,
      port: this.options.port,
      user: this.options.user,
      password: this.options.password,
      database: this.options.database,
    });    

  }

  /**
   * Connect to PostgreSql based on the connection data.
   */
  public connect(): void {
    this.connection.connect();
  }

  /**
   * Reads the database schema, processes it and returns a normalized version of it.
   *
   * @returns {Promise<Schema>} database schema
   */
  public async readSchema(): Promise<Schema> {
    return new Promise<Schema>((resolve: (schema: Schema) => void, reject: (reason: Error) => void): void => {
      this.getTables().then((tablesNames: string[]) => {
        const tables: Promise<Table>[] = tablesNames.map(async (tableName: string) => this.getTableSchema(tableName));
        Promise.all(tables).then((schema: Schema) => {
          resolve(this.normalizeRelations(schema));
        }).catch(reject);
      }).catch(reject);
    });
  }

  /**
   * Reads the information schema and returns an array of tables.
   *
   * @returns {Promise<string[]>} array of table names.
   */
  public async getTables(): Promise<string[]> {
    return new Promise<string[]>((resolve: (tables: string[]) => void, reject: (reason: Error) => void): void => {
      this.connection.query(
        `SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = 'public' and table_name <> 'pg_stat_statements';`,
        (err: Error, results: {rows: [{table_name: string}] }) => {
          /* istanbul ignore next */
          if (err) {
            return reject(err);
          }

          const tables: string[] = results.rows.map((result: {table_name: string}) => result.table_name);

          return resolve(tables);
        },
      );
    });
  }

  /**
   * Reads the schema for a given table.
   *
   * @param {string} tableName table name
   * @returns {Promise<Table>} table schema
   */
  public async getTableSchema(tableName: string): Promise<Table> {
    return new Promise<Table>((resolve: (table: Table) => void, reject: (reason: Error) => void): void => {
      const table: Table = {
        name: tableName,
        columns: [],
      };

      /*
          COLUMN_KEY,
          COLUMN_TYPE
      */
      this.connection.query(
        `SELECT
          c.COLUMN_NAME,
          c.IS_NULLABLE,
          c.DATA_TYPE,
          c.CHARACTER_MAXIMUM_LENGTH, constraint_type as COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS c
        left join information_schema.key_column_usage kcu on 
          kcu.table_catalog = c.table_catalog and
          kcu.table_name = c.table_name and 
          kcu.column_name = c.column_name    
        left join information_schema.table_constraints tc on 
          tc.constraint_catalog = c.table_catalog and
          tc.table_name = c.table_name and
          kcu.constraint_name = tc.constraint_name
        WHERE c.TABLE_NAME = '${tableName}' and c.table_catalog = '${this.options.database}' ;`,
        (err: Error, columns: {rows: PostgreSqlColumnSchema[]}) => {

          /* istanbul ignore next */
          if (err) {
            return reject(err);
          }

          this.getRelationsForTable(tableName).then((relations: TableReference[]) => {

            columns.rows.forEach((result: PostgreSqlColumnSchema) => {

              if(result.data_type == 'USER-DEFINED') {



                console.log(tableName);
                console.log(result);
                
                // check if we found an enum column

                // make a query to get the column type from pg_catalog

                /*
                `
                SELECT
                   a.attname as "Column",
                   pg_catalog.format_type(a.atttypid, a.atttypmod) as "Datatype"


                  FROM
                  pg_catalog.pg_attribute a
                  WHERE
                  a.attnum > 0
                  AND NOT a.attisdropped
                  AND a.attrelid = (
                      SELECT c.oid
                      FROM pg_catalog.pg_class c
                    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                      WHERE c.relname = 'test_status' AND a.attname = 'status' and 
                       pg_catalog.pg_table_is_visible(c.oid)
                  );

                `

                // make a query to get the enum values

                `  select -- n.nspname as enum_schema,  
                     t.typname as enum_name,  
                     e.enumlabel as enum_value
              from pg_type t 
                 join pg_enum e on t.oid = e.enumtypid  
                 join pg_catalog.pg_namespace n ON n.oid = t.typnamespace

                 where t.typname = 'status'

                `
                */

              }
              

              const column: Column = this.normalizeColumnSchema(result);
              const relation: TableReference | undefined = relations.filter(
                (rel: TableReference) => rel.name === column.name,
              ).pop();
              if (relation) {
                column.foreignKey = true;
                column.dataType.references = relation;
                column.dataType.type = Utils.toTitleCase(relation.table);
                column.name = Utils.singular(relation.table);
              }
              table.columns.push(column);
            });

            // 

            return resolve(table);
          }).catch(reject);
        },
      );
    });
  }

  /**
   * Reads all the relations for a given table.
   *
   * @param {string} table table name
   * @return {Promise<TableReference[]>} foreign key relations
   */
  public async getRelationsForTable(table: string): Promise<TableReference[]> {
    return new Promise<TableReference[]>(
      (resolve: (references: TableReference[]) => void, reject: (reason: Error) => void): void => {
        this.connection.query(
        `SELECT
            kcu.COLUMN_NAME, 
            ccu.table_name AS REFERENCED_TABLE_NAME,
            ccu.column_name AS REFERENCED_COLUMN_NAME 
         FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
         WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${table}';`,
        (err: Error, relations: {rows: PostgresqlRawTableReference[]}) => {
          /* istanbul ignore next */
          if (err) {
            return reject(err);
          }

          const references: TableReference[] = relations.rows.map((relation: PostgresqlRawTableReference) => {

            const reference: TableReference = {
              name: relation.column_name,
              table: relation.referenced_table_name,
              column: relation.referenced_column_name,
            };

            return reference;
          });

          resolve(references);
        },
      );
    },
  );
}

  /**
   * Closes the MySql connection.
   */
  public close(): void {
    this.connection.end();
  }
}
