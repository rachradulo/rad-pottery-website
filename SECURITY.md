# Security Policy

## Reporting Security Issues

If you discover a security issue in this repository, please contact the project owner directly at:
- Email: rradulovich2@gmail.com

Please include:
- The type of issue (e.g., exposed API key, vulnerability, etc.)
- The location of the affected code
- Any potential impact you're aware of

## Rotating Exposed API Keys

If you discover an API key or other credential has been exposed:

### For Firebase API Keys:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find the exposed API key in the list
4. Click the trash icon to delete it, or click on it to restrict its usage
5. Create a new API key with appropriate restrictions
6. Update your `config.local.js` file with the new key
7. Deploy the updated configuration to production systems

### For Rownd API Keys:

1. Go to the [Rownd Dashboard](https://app.rownd.io/)
2. Navigate to "Settings" > "API Keys"
3. Revoke the exposed key
4. Generate a new key
5. Update your `config.local.js` file with the new key

## Best Practices

1. Use environment variables or secure configuration files for all sensitive values
2. Never commit API keys, passwords, or other credentials to version control
3. Apply the principle of least privilege - restrict API keys to only what they need
4. Regularly rotate keys, especially for production environments
5. Use IP restrictions and API key restrictions when possible
6. Monitor for unauthorized use of API keys 