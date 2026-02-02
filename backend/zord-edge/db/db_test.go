package db

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestCreateTable(t *testing.T) {
	// Create mock DB
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open sqlmock: %v", err)
	}
	defer mockDB.Close()

	// Assign mockDB to the global DB from db.go
	DB = mockDB

	// Expect Exec to succeed (match quoted table name)
	mock.ExpectExec(`CREATE TABLE IF NOT EXISTS "tenants"`).
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Call CreateTable and check for success
	if err := CreateTable(); err != nil {
		t.Errorf("expected no error, got %v", err)
	}
}
