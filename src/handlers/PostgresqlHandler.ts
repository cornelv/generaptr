import { Client } from 'pg';
import Utils from '../commons/utils/utils';
import BaseHandler from './BaseHandler';
import { Schema, Table, Column, PostgreSqlColumnSchema, TableReference, RawTableReference } from '../commons/types';

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
    super('mysql'); //TODO: change here

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
        (err: Error, results: [{TABLE_NAME: string}]) => {
          /* istanbul ignore next */
          if (err) {
            return reject(err);
          }

          const tables: string[] = results.rows.map((result: {TABLE_NAME: string}) => result.table_name);

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
          COLUMN_NAME,
          IS_NULLABLE,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}';`,
        (err: Error, columns: PostgreSqlColumnSchema[]) => {
          /* istanbul ignore next */
          if (err) {
            return reject(err);
          }

          this.getRelationsForTable(tableName).then((relations: TableReference[]) => {
            columns.rows.forEach((result: PostgreSqlColumnSchema) => {
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

            console.log(table);

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
        (err: Error, relations: RawTableReference[]) => {
          /* istanbul ignore next */
          if (err) {
            return reject(err);
          }

          const references: TableReference[] = relations.rows.map((relation: RawTableReference) => {

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
