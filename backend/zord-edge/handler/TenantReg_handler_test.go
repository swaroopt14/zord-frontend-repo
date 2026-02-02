package handler

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"main.go/db"
)

// Success case: TenantReg inserts tenant and returns API key
func TestTenantRegistry_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Mock DB
	mockDB, mock, _ := sqlmock.New()
	defer mockDB.Close()
	db.DB = mockDB // replace global DB with mock

	tenantID := uuid.New()
	mock.ExpectQuery("INSERT INTO tenants").
		WithArgs("MerchantX", "merchantx", sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"tenant_id"}).AddRow(tenantID))

	body := []byte(`{"Name":"MerchantX"}`)
	req := httptest.NewRequest(http.MethodPost, "/tenant", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r := gin.Default()
	r.POST("/tenant", Tenant_Registry)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201 Created, got %d", w.Code)
	}
}

// Failure case: DB error
func TestTenantRegistry_Failure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockDB, mock, _ := sqlmock.New()
	defer mockDB.Close()
	db.DB = mockDB

	mock.ExpectQuery("INSERT INTO tenants").
		WithArgs("MerchantY", "merchanty", sqlmock.AnyArg()).
		WillReturnError(errors.New("db error"))

	body := []byte(`{"Name":"MerchantY"}`)
	req := httptest.NewRequest(http.MethodPost, "/tenant", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r := gin.Default()
	r.POST("/tenant", Tenant_Registry)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d", w.Code)
	}
}
