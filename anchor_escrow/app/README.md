# Solana Escrow Frontend

A modern, responsive web application for creating and managing secure token escrows on the Solana blockchain.

## Features

- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Wallet Integration**: Seamless Solana wallet connection (Phantom, Solflare, Backpack)
- **Create Escrows**: Easy-to-use form for setting up new escrow transactions
- **Manage Escrows**: View and manage all your active escrow transactions
- **Real-time Updates**: Live transaction status and balance updates
- **Mobile Responsive**: Optimized for all device sizes

##  Tech Stack

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Solana Web3.js** - Solana blockchain integration
- **Anchor Framework** - Solana program integration
- **Lucide React** - Beautiful icons
- **React Hot Toast** - User-friendly notifications

## Installation

1. **Install Dependencies**
   ```bash
   cd app
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

##  Configuration

### Environment Variables

Create a `.env` file in the `app` directory:

```env
REACT_APP_SOLANA_NETWORK=devnet
REACT_APP_RPC_ENDPOINT=https://api.devnet.solana.com
REACT_APP_PROGRAM_ID=D5uvm16TNKJxfvcMj3mPpY5mBQSyWNJ3bHEXkHm4YEH5
```

### Program Integration

The frontend is designed to work with the Solana escrow program. Make sure:

1. The program is deployed to the correct network
2. The program ID is correctly configured
3. The IDL file is properly generated and imported

##  Design System

### Colors
- **Primary**: Blue gradient (#3b82f6 to #22c55e)
- **Secondary**: Slate gray (#64748b)
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)

### Components
- **Glass Effect**: Semi-transparent backgrounds with blur
- **Cards**: Rounded containers with glass effect
- **Buttons**: Interactive buttons with hover animations
- **Forms**: Styled input fields with focus states

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## Security Features

- **Wallet Authentication**: Secure wallet connection
- **Input Validation**: Client-side form validation
- **Transaction Confirmation**: User confirmation for all transactions
- **Error Handling**: Comprehensive error handling and user feedback

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Build the project: `npm run build`
2. Upload the `build` folder to Netlify
3. Configure environment variables

### Traditional Hosting
1. Build the project: `npm run build`
2. Upload the `build` folder to your web server
3. Configure your server to serve the static files

##  Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues:

1. Check the browser console for errors
2. Ensure your wallet is connected to the correct network
3. Verify the program is deployed and accessible
4. Check the Solana network status

## 🔗 Links

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [React Documentation](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
