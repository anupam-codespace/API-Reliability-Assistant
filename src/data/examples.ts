import { ApiDefinition } from '../types';

export interface ExampleApi {
  id: string;
  name: string;
  tag: string;
  description: string;
  definition: ApiDefinition;
}


export const EXAMPLE_APIS: ExampleApi[] = [
  {
    id: 'user-registration',
    name: 'User Registration API',
    tag: 'POST · Auth & Validation',
    description: 'User registration with password policy, email uniqueness, and age verification.',
    definition: {
      method: 'POST',
      endpoint: 'https://api.example.com/api/users',
      pathParams: [],
      queryParams: [],
      headers: [
        { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
        { id: 'h2', key: 'Accept', value: 'application/json', enabled: true },
      ],
      auth: {
        type: 'none',
      },
      requestBody: JSON.stringify(
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'StrongPassword123!',
          age: 25,
        },
        null,
        2
      ),
      expectedBehaviour:
        'Creates a new user record and returns HTTP 201 with the created user object (excluding the password hash). Enforces email field regex pattern "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" rejecting malformed formats with 400 Bad Request. Rejects duplicate emails, weak passwords, or invalid age formats.',
      description: 'Public registration endpoint for new customer accounts.',
      validationRules: [
        {
          id: 'vr-email-regex',
          field: 'email',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Enforces standard RFC 5322 email syntax with valid domain name and TLD.',
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'order-retrieval',
    name: 'Order Retrieval API',
    tag: 'GET · Auth & IDOR/BOLA',
    description: 'Fetch customer order details with strict tenant isolation and Bearer token auth.',
    definition: {
      method: 'GET',
      endpoint: 'https://api.example.com/api/orders/{orderId}',
      pathParams: [
        {
          id: 'pp1',
          key: 'orderId',
          value: 'ord_98421bca',
          description: 'Unique alphanumeric identifier of the order',
          enabled: true,
        },
      ],
      queryParams: [
        {
          id: 'qp1',
          key: 'includeItems',
          value: 'true',
          description: 'Whether to embed order line items',
          enabled: true,
        },
      ],
      headers: [
        { id: 'h1', key: 'Accept', value: 'application/json', enabled: true },
      ],
      auth: {
        type: 'bearer',
        tokenPlaceholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      requestBody: '',
      expectedBehaviour:
        'Returns the authenticated user\'s order details. Users must not be able to access another user\'s order (IDOR/BOLA prevention). If order is not found, returns 404; if belonging to another user, returns 403 Forbidden.',
      description: 'Customer order query API protected by OAuth2 Bearer token.',
    },
  },
  {
    id: 'inventory-update',
    name: 'Inventory Stock Update API',
    tag: 'PUT · Boundary & Concurrency',
    description: 'Update warehouse stock levels, unit pricing, and reorder thresholds with role check.',
    definition: {
      method: 'PUT',
      endpoint: 'https://api.example.com/api/inventory/{productId}',
      pathParams: [
        {
          id: 'pp1',
          key: 'productId',
          value: 'prod_sku_7781',
          description: 'Target product SKU identifier',
          enabled: true,
        },
      ],
      queryParams: [],
      headers: [
        { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
        { id: 'h2', key: 'If-Match', value: '"etag-v4-991"', enabled: true },
      ],
      auth: {
        type: 'apiKey',
        headerName: 'X-Warehouse-API-Key',
        apiKeyValue: 'wh_live_key_placeholder',
      },
      requestBody: JSON.stringify(
        {
          stockQuantity: 150,
          reorderLevel: 20,
          price: 49.99,
          locationCode: 'WH-EAST-A3',
        },
        null,
        2
      ),
      expectedBehaviour:
        'Updates inventory quantity and pricing for the specified product. Prevents negative stock, verifies warehouse staff authorization, enforces numeric boundaries, and checks optimistic locking via ETag (returns 412 Precondition Failed if stale).',
      description: 'Internal warehouse management endpoint for stock reconciliation.',
    },
  },
];
