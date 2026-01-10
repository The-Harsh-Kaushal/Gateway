# Gateway - Secure Authentication Middleware for Node.js/Express

**Gateway** is a modular authentication and security middleware for Express applications. It provides **JWT-based authentication**, **refresh token handling**, **rate limiting**, and **security protections** out of the box. It is designed to be **production-ready**, secure, and easy to integrate with any Node.js/Express project.

---

## Features

- **JWT Authentication**: Handles user login and signup using JSON Web Tokens.
- **Refresh Token Management**:
  - Supports rotating refresh tokens for session hijacking protection.
  - Refreshing the token automatically invalidates the old one.
  - Expired or invalid tokens force logout of all user sessions.
- **Session Management**: Maintains all login and signup flows securely.
- **Rate Limiting**: Leaky Bucket algorithm to prevent abuse and DoS attacks.
- **Security Headers**: Uses [Helmet](https://www.npmjs.com/package/helmet) to protect against XSS, clickjacking, MIME sniffing, and other common web vulnerabilities.
- **Easy Configuration**: Environment variables to configure database, JWT secrets, and OAuth settings.

---

## Installation

```bash
git clone https://github.com/The-Harsh-Kaushal/Gateway.git
cd gateway
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory and define the following variables:

| Variable               | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `MONGO_DB_URI`         | MongoDB connection string to store users, sessions, and tokens. |
| `ACCESS_TOKEN_SECRET`  | Secret key for signing JWT access tokens.                       |
| `REFRESH_TOKEN_SECRET` | Secret key for signing JWT refresh tokens.                      |
| `GOOGLE_OAUTH2_URL`    | OAuth2 callback URL for Google authentication.                  |
| `GOOGLE_CLIENT_ID`     | Google OAuth2 client ID.                                        |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret.                                    |

> Make sure to configure these according to your environment. Do \*\*not commit \*\*\`\` to GitHub.

---

## Usage

### Server Setup

```js
const express = require('express');
const helmet = require('helmet');
const gateway = require('./gateway'); // import your gateway module

const app = express();

// Security middleware first
app.use(helmet());

// JSON body parser
app.use(express.json());

// Mount the gateway routes
app.use('/auth', gateway);

// Example protected route
app.get('/dashboard', gateway.verifyToken, (req, res) => {
  res.send(`Welcome ${req.user.email}!`);
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
```

### Endpoints

| Method | Endpoint        | Description                               |
| ------ | --------------- | ----------------------------------------- |
| POST   | `/auth/signup`  | Register a new user                       |
| POST   | `/auth/login`   | Login and receive access & refresh tokens |
| POST   | `/auth/refresh` | Refresh access token using refresh token  |
| POST   | `/auth/logout`  | Logout and invalidate current session     |

> The gateway ensures session hijacking protection by rotating refresh tokens and invalidating all expired or compromised tokens.

---

### Security Notes

- **Helmet**: Protects against common web attacks.
- **Leaky Bucket Rate Limiting**: Prevents abuse and DoS attacks.
- **JWT Security**: Access and refresh tokens are managed to prevent session hijacking.
- **Environment Variables**: Never commit your `.env` file to GitHub.

---

### Contributing

- Fork the repository and create a new branch.
- Make your changes and test them thoroughly.
- Submit a pull request with detailed notes.

---

### License

MIT License

