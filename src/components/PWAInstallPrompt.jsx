import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Snackbar, Button, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

export default function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <Snackbar
      open={showInstallPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity="info"
        action={
          <>
            <Button color="inherit" size="small" onClick={handleInstall}>
              <DownloadIcon sx={{ mr: 0.5, fontSize: 18 }} />
              {t('app.install_app')}
            </Button>
            <Button color="inherit" size="small" onClick={handleClose}>
              {t('app.install_later')}
            </Button>
          </>
        }
      >
        {t('app.install_prompt')}
      </Alert>
    </Snackbar>
  );
}
