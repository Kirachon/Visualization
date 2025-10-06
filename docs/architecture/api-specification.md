# API Specification

### REST API Endpoints

```yaml
openapi: 3.0.0
info:
  title: Open-Source BI Platform API
  version: 1.0.0
  description: REST API for the open-source business intelligence platform
servers:
  - url: https://api.bi-platform.com/v1
    description: Production server
  - url: https://staging-api.bi-platform.com/v1
    description: Staging server

paths:
  /auth/login:
    post:
      summary: User authentication
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
              required:
                - username
                - password
      responses:
        '200':
          description: Successful authentication
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                  refreshToken:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Authentication failed

  /dashboards:
    get:
      summary: List dashboards
      tags:
        - Dashboards
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: search
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of dashboards
          content:
            application/json:
              schema:
                type: object
                properties:
                  dashboards:
                    type: array
                    items:
                      $ref: '#/components/schemas/Dashboard'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: Create dashboard
      tags:
        - Dashboards
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateDashboardRequest'
      responses:
        '201':
          description: Dashboard created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Dashboard'

  /dashboards/{id}:
    get:
      summary: Get dashboard by ID
      tags:
        - Dashboards
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Dashboard details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Dashboard'
        '404':
          description: Dashboard not found

    put:
      summary: Update dashboard
      tags:
        - Dashboards
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateDashboardRequest'
      responses:
        '200':
          description: Dashboard updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Dashboard'

    delete:
      summary: Delete dashboard
      tags:
        - Dashboards
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Dashboard deleted

  /data-sources:
    get:
      summary: List data sources
      tags:
        - Data Sources
      responses:
        '200':
          description: List of data sources
          content:
            application/json:
              schema:
                type: object
                properties:
                  dataSources:
                    type: array
                    items:
                      $ref: '#/components/schemas/DataSource'

    post:
      summary: Create data source
      tags:
        - Data Sources
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateDataSourceRequest'
      responses:
        '201':
          description: Data source created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DataSource'

  /data-sources/{id}/test:
    post:
      summary: Test data source connection
      tags:
        - Data Sources
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Connection test result
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  message:
                    type: string
                  latency:
                    type: number

  /data-sources/{id}/schema:
    get:
      summary: Get data source schema
      tags:
        - Data Sources
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Database schema
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DatabaseSchema'

  /queries:
    post:
      summary: Execute query
      tags:
        - Queries
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExecuteQueryRequest'
      responses:
        '200':
          description: Query results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QueryResult'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        username:
          type: string
        email:
          type: string
        firstName:
          type: string
        lastName:
          type: string
        role:
          type: string
        tenantId:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Dashboard:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        tenantId:
          type: string
        ownerId:
          type: string
        layout:
          $ref: '#/components/schemas/DashboardLayout'
        components:
          type: array
          items:
            $ref: '#/components/schemas/DashboardComponent'
        filters:
          type: array
          items:
            $ref: '#/components/schemas/DashboardFilter'
        permissions:
          type: array
          items:
            $ref: '#/components/schemas/DashboardPermission'
        tags:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        publishedAt:
          type: string
          format: date-time
        version:
          type: integer

    DataSource:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        type:
          type: string
        connectionConfig:
          $ref: '#/components/schemas/ConnectionConfig'
        tenantId:
          type: string
        ownerId:
          type: string
        status:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
```

