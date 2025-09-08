# 🔐 Miden Wallet Chrome Extension

Chrome extension for secure and easy-to-use Miden blockchain wallet.

## ✨ Features

- 🔗 **Wallet Connection**: Secure connection to Miden network
- 💰 **Balance Management**: View and manage token balances
- 🪙 **Token Minting**: Mint tokens from faucet
- 💾 **Import/Export**: Backup and restore wallet
- 🔒 **Secure Storage**: Secure storage using Chrome storage
- 🎨 **Modern UI**: Responsive and user-friendly interface

## 🚀 Installation

### Development Mode

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd miden-web-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build extension**
   ```bash
   npm run build
   ```

4. **Load extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `dist` folder

### Production Build

1. **Build production version**
   ```bash
   npm run build:extension
   ```

2. **Upload to Chrome Web Store**
   - ZIP file available in `builds/` folder
   - Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)

## 🏗️ Project Structure

```
miden-web-app/
├── manifest.json              # Extension manifest
├── webpack.config.js          # Webpack configuration
├── popup/                     # Popup interface
│   ├── popup.html            # Popup HTML
│   ├── popup.tsx             # Popup React component
│   └── popup.css             # Popup styles
├── background/                # Background service worker
│   └── background.ts         # Background script
├── content/                   # Content scripts
│   └── content.ts            # Content script
├── lib/                       # Shared libraries
│   ├── createMintConsume.ts  # Miden SDK integration
│   └── accountExportImport.ts # Wallet import/export
├── icons/                     # Extension icons
│   ├── icon16.png            # 16x16 icon
│   ├── icon48.png            # 48x48 icon
│   └── icon128.png           # 128x128 icon
├── scripts/                   # Build scripts
│   └── build-extension.js    # Extension packaging
└── dist/                      # Built extension files
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Development mode with hot reload
- `npm run build` - Build production version
- `npm run build:extension` - Build and package extension

### Hot Reload

Extension will automatically reload when files change. Make sure extension is loaded in development mode.

### Debugging

1. **Popup**: Right-click extension icon → "Inspect popup"
2. **Background**: Open `chrome://extensions/` → Click "service worker"
3. **Content Scripts**: Open DevTools → Console

## 📱 Chrome Extension Features

### Manifest V3
- Service worker-based background script
- Content scripts for web page interaction
- Secure storage using Chrome storage API

### Permissions
- `storage`: Store wallet data
- `activeTab`: Access to active tab
- `scripting`: Inject content scripts

### Storage
- `chrome.storage.local` for wallet data
- Fallback to localStorage for web app

## 🔒 Security

- Private keys never sent to server
- All blockchain operations performed client-side
- Wallet data encrypted and stored locally
- No tracking or analytics

## 🌐 Browser Support

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Opera 74+
- ❌ Firefox (does not support Manifest V3)

## 📦 Publishing

### Chrome Web Store

1. **Developer Account**: Register at [Chrome Web Store Developer](https://chrome.google.com/webstore/devconsole/)
2. **Upload Extension**: Upload ZIP file from `builds/` folder
3. **Metadata**: Fill description, screenshots, privacy policy
4. **Review**: Wait for Google review (1-3 days)

### Distribution

- **Public**: Available on Chrome Web Store
- **Private**: Share with internal team
- **Unlisted**: Special link for testing

## 🐛 Troubleshooting

### Common Issues

1. **Extension won't load**
   - Make sure "Developer mode" is enabled
   - Check console for error messages
   - Restart Chrome browser

2. **Wallet won't connect**
   - Check network connection
   - Verify Miden node endpoint
   - Check console for SDK errors

3. **Storage errors**
   - Clear extension data
   - Reinstall extension
   - Check Chrome storage permissions

### Debug Mode

Enable debug mode by adding in `manifest.json`:
```json
{
  "background": {
    "service_worker": "background.js",
    "type": "module",
    "persistent": false
  }
}
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Miden Docs](https://docs.miden.io/)
- **Community**: [Miden Discord](https://discord.gg/miden)

---

**Note**: This extension is still in development. Use with caution and don't store large amounts of tokens until production-ready.