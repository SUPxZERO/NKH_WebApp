# **Bakong Open API — Full Accurate Specification (Reconstructed)**

## **Change Logs**

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 1.0.0   | 21.05.2021 | Initial document.                                   |
| 1.0.1   | 27.07.2021 | Add check transaction status API.                   |
| 1.0.2   | 04.11.2021 | Add check Bakong account API.                       |
| 1.0.3   | 11.01.2022 | - Remove API request token and verify token         |
|         |            | - Add check transaction by instruction reference    |
|         |            | - Add check transaction by external reference       |
| 1.0.4   | 24.01.2022 | Add account status to check Bakong account API.     |
| 1.0.5   | 01.01.2023 | Add check transaction by hash list & MD5 list APIs. |

---

# **Table of Contents**

1. Introduction
2. API Documentation

   * 1. Renew Token
   * 2. Generate Deeplink
   * 3. Check Transaction Status by MD5
   * 4. Check Transaction Status by Full Hash
   * 5. Check Transaction Status by Short Hash
   * 6. Check Bakong Account
   * 7. Check Transaction Status by Instruction Reference
   * 8. Check Transaction Status by External Reference
   * 9. Check Transaction Status by MD5 List
   * 10. Check Transaction Status by Full Hash List

---

# **Introduction**

## **1. Purpose**

This document specifies the Bakong Open API provided by the National Bank of Cambodia. It is intended for NBC’s technical team and third-party technical teams integrating Bakong services.

## **2. Scope**

Includes full API details: endpoints, request/response structure, parameters, and sample payloads.

## **3. Overall API List**

| No | Name                                       | Method | URL                                                 |
| -- | ------------------------------------------ | ------ | --------------------------------------------------- |
| 1  | Renew token                                | POST   | {{baseUrl}}/v1/renew_token                          |
| 2  | Generate deeplink                          | POST   | {{baseUrl}}/v1/generate_deeplink_by_qr              |
| 3  | Check transaction by MD5                   | POST   | {{baseUrl}}/v1/check_transaction_by_md5             |
| 4  | Check transaction by full hash             | POST   | {{baseUrl}}/v1/check_transaction_by_hash            |
| 5  | Check transaction by short hash            | POST   | {{baseUrl}}/v1/check_transaction_by_short_hash      |
| 6  | Check Bakong account                       | POST   | {{baseUrl}}/v1/check_bakong_account                 |
| 7  | Check transaction by instruction reference | POST   | {{baseUrl}}/v1/check_transaction_by_instruction_ref |
| 8  | Check transaction by external reference    | POST   | {{baseUrl}}/v1/check_transaction_by_external_ref    |
| 9  | Check transaction by MD5 list              | POST   | {{baseUrl}}/v1/check_transaction_by_md5_list        |
| 10 | Check transaction by full hash list        | POST   | {{baseUrl}}/v1/check_transaction_by_hash_list       |

---

# **Status Code**

## **HTTP Response Codes**

| Code | Description           |
| ---- | --------------------- |
| 200  | OK                    |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 429  | Too many requests     |
| 500  | Internal server error |

## **Custom Response Codes**

### **Main Codes**

| Key  | Type | Code | Description |
| ---- | ---- | ---- | ----------- |
| Code | Int  | 0    | Success     |
|      |      | 1    | Fail        |

### **Error Codes**

| Code | Description                             |
| ---- | --------------------------------------- |
| 1    | Transaction could not be found          |
| 2    | System does not support static QR code  |
| 3    | Transaction failed                      |
| 4    | Error requesting deeplink from provider |
| 5    | Missing required fields                 |
| 6    | Unauthorized                            |
| 7    | Email server down                       |
| 8    | Email already registered                |
| 9    | Cannot connect to server                |
| 10   | Not registered                          |
| 11   | Account ID not found                    |
| 12   | Invalid Account ID                      |

---

# **API Documentation**

Below is the accurate detail for each endpoint exactly as in your source.

---

---

# **1. Renew Token**

**POST** — `{{baseUrl}}/v1/renew_token`
Used to renew expired tokens.

### **Headers**

| Parameter    | Mandatory | Value            |
| ------------ | --------- | ---------------- |
| Content-Type | No        | application/json |

### **Body**

| Field | Type   | Required | Description |
| ----- | ------ | -------- | ----------- |
| email | String | Yes      | MaxLen 30   |

### **Sample Request**

```json
{
  "email": "string"
}
```

### **Sample Response**

```json
{
  "data": {
    "token": "eyJ0eXAiOiJ...."
  },
  "errorCode": null,
  "responseCode": 0,
  "responseMessage": "Token has been issued"
}
```

---

# **2. Generate Deeplink**

**POST** — `{{baseUrl}}/v1/generate_deeplink_by_qr`

### **Body**

| Field      | Required | Description |
| ---------- | -------- | ----------- |
| qr         | Yes      | KHQR string |
| sourceInfo | Optional | App info    |

sourceInfo structure:

* appIconUrl
* appName
* appDeepLinkCallback

### **Sample Request**

```json
{
  "qr": "0002010....",
  "sourceInfo": {
    "appIconUrl": "https://bakong.nbc.gov.kh/images/logo.svg",
    "appName": "Bakong",
    "appDeepLinkCallback": "https://bakong.nbc.gov.kh/"
  }
}
```

### **Sample Response**

```json
{
  "data": {
    "shortLink": "https://bakongsit.page.link/dGZAr1McBs1UaNmH9"
  },
  "errorCode": null,
  "responseCode": 0,
  "responseMessage": "Getting deep link successfully"
}
```

---
