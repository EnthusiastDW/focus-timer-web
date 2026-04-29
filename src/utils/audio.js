const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;
let lastNotificationTime = 0;
let lastNotificationKey = '';

export function playSound(type = 'default') {
  if (!audioContext || type === 'none') return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  switch (type) {
    case 'bell':
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
      break;
    case 'chime':
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      oscillator.start(audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.4);
      oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.6);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      oscillator.stop(audioContext.currentTime + 1);
      break;
    default:
      // 第一声
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
      
      // 第二声
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.setValueAtTime(1000, audioContext.currentTime);
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.8);
      }, 300);
      
      // 第三声
      setTimeout(() => {
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.setValueAtTime(1200, audioContext.currentTime);
        osc3.type = 'sine';
        gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        osc3.start(audioContext.currentTime);
        osc3.stop(audioContext.currentTime + 0.8);
      }, 600);
      break;
  }
}

export function playNotification(title, body, enabled = true) {
  console.log('Notification called:', { title, body, enabled, permission: 'Notification' in window ? Notification.permission : 'not supported' });
  
  if (!enabled) {
    console.log('Notifications are disabled in settings');
    return;
  }
  
  // 防止重复通知：如果 1 秒内相同的通知内容，则忽略
  const now = Date.now();
  const notificationKey = `${title}-${body}`;
  if (now - lastNotificationTime < 1000 && notificationKey === lastNotificationKey) {
    console.log('Duplicate notification ignored');
    return;
  }
  
  if ('Notification' in window && Notification.permission === 'granted') {
    console.log('Sending notification...');
    // 使用时间戳作为唯一标识，确保每次都能弹出通知
    new Notification(title, { 
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      // 不使用 tag，让每次通知都独立显示
    });
    
    // 更新最后通知记录
    lastNotificationTime = now;
    lastNotificationKey = notificationKey;
  } else {
    console.log('Notification permission not granted:', Notification.permission);
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
