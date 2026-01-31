# API Reference

## Data APIs

### Get Menus
Returns a list of menus from configuration files (`/config/data/menus/*.json`).

- **URL:** `/api/data/menus`
- **Method:** `GET`
- **Description:** Reads JSON files from the config directory, parses them, and returns a sorted list of menu items.
- **Sorting:** Ascending by `order` field.

#### Response
- **Status:** 200 OK
- **Content-Type:** `application/json`
- **Body:**
  ```json
  [
    {
      "id": "apps",
      "name": "应用中心",
      "path": "/apps",
      "icon": "IconApps",
      "order": 1
    },
    {
      "id": "orders",
      "name": "订单",
      "path": "/portal",
      "icon": "IconApps",
      "order": 2
    }
  ]
  ```
