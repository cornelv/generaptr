import PostgresqlSchemaPreprocessor from '../../src/preprocesors/PostgresqlSchemaPreprocessor';
import * as assert from 'assert';
import mocks from '../testUtils/schemaMocks';
import { PostgreSqlColumnSchema, Column, Schema, Table } from '../../src/commons/types';
const preProcessor: PostgresqlSchemaPreprocessor = new PostgresqlSchemaPreprocessor();

describe('Suite for testing PostgresqlPreProcessor class', () => {
  it('should convert a valid column schema to standard schema', () => {
    const colSchema: PostgreSqlColumnSchema = {
      column_name: 'test',
      column_type: '',
      column_key: 'PRIMARY KEY',
      is_nullable: 'NO',
      data_type: 'character varying',
      character_maximum_length: '255',
    };
    const processed: Column = preProcessor.convertToStandardSchema(colSchema);
    assert.equal(processed.name, 'test');
    assert.equal(processed.primary, true);
    assert.equal(processed.allowNull, false);
    assert.equal(processed.foreignKey, false);
    assert.equal(processed.unique, true);
    assert.equal(processed.dataType.type, 'string');
    assert.equal(processed.dataType.size, 255);
  });

  it('should process values for enum data type', () => {
    const processedSchema: Column = preProcessor.convertToStandardSchema(mocks.POSTGRESQL_RAW_ENUM_DATA);

    assert.ok(processedSchema.dataType);
    assert.equal(processedSchema.dataType.type, "enum");
    assert.ok(processedSchema.dataType.values);
    assert(processedSchema.dataType.values);
    assert.deepEqual(processedSchema.dataType.values, ['No', 'Yes']);
  });

  it('should clean up table schema', () => {
    const schema: Schema = mocks.PROCESSED_SCHEMA_ONE_TABLE;
    const valid: Table = schema[0];
    const processed: Table | undefined = preProcessor.normalizeSchemaRelations(mocks.SCHEMA_ONE_TABLE).pop();
    if (processed) {
      assert.equal(processed.name, valid.name);
      assert.equal(processed.columns.length, valid.columns.length);
    } else {
      assert.fail('table schema not cleaned up.');
    }
  });

  it('should normalize one to one relations', () => {
    const schema: Schema = mocks.PROCESSED_SCHEMA_ONE_TO_ONE as Schema;
    const validAccounts: Table = schema[0];
    const validUsers: Table = schema[1];
    const processed: Schema = preProcessor.normalizeSchemaRelations(mocks.SCHEMA_ONE_TO_ONE);
    const processedAccounts: Table = processed[0];
    const processedUsers: Table = processed[1];
    assert.equal(processedAccounts.name, validAccounts.name);
    assert.equal(processedAccounts.columns.length, validAccounts.columns.length);
    assert.equal(processedUsers.name, validUsers.name);
    assert.equal(processedUsers.columns.length, validUsers.columns.length);
  });

  it('should normalize many to one relations', () => {
    const validAccounts: Table = mocks.PROCESSED_SCHEMA_MANY_TO_ONE[0] as Table;
    const validApplications: Table = mocks.PROCESSED_SCHEMA_MANY_TO_ONE[1] as Table;
    const processed: Schema = preProcessor.normalizeSchemaRelations(mocks.SCHEMA_MANY_TO_ONE);
    const processedAccounts: Table = processed[0];
    const processedApplications: Table = processed[1];

    assert.equal(processedAccounts.name, validAccounts.name);
    assert.equal(processedAccounts.columns.length, validAccounts.columns.length);
    assert.equal(processedApplications.name, validApplications.name);
    assert.equal(processedApplications.columns.length, validApplications.columns.length);
  });

  it('should normalize many to many relations', () => {
    const validGroups: Table = mocks.PROCESSED_SCHEMA_MANY_TO_MANY[0] as Table;
    const validUsers: Table = mocks.PROCESSED_SCHEMA_MANY_TO_MANY[1] as Table;
    const processed: Schema = preProcessor.normalizeSchemaRelations(mocks.SCHEMA_MANY_TO_MANY);
    const processedGroups: Table = processed[0];
    const processedUsers: Table = processed[1];

    assert.equal(processedGroups.name, validGroups.name);
    assert.equal(processedGroups.columns.length, validGroups.columns.length);
    assert.equal(processedUsers.name, validUsers.name);
    assert.equal(processedUsers.columns.length, validUsers.columns.length);
  });
});
