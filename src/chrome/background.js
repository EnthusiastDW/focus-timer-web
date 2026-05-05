chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  chrome.notifications.clear(notificationId);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'timer-phase-end') return;

  // Get current settings to check if notifications are enabled and get phase info
  chrome.storage.sync.get(['settings'], (result) => {
    const settings = result.settings || {};
    
    // Only show notification if enabled in settings
    if (settings.notifications === false) {
      // Still notify the app tab even if notifications are disabled
      chrome.runtime.sendMessage({ type: 'TIME_UP' }).catch(() => {});
      return;
    }

    // Determine the next phase to show appropriate message
    // We'll send TIME_UP first so the app can update its state,
    // then show a generic notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: 'Focus Timer',
      message: '阶段时间到！',
    });

    // Notify any open app tab so it can catch up immediately
    chrome.runtime.sendMessage({ type: 'TIME_UP' }).catch(() => {});
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_TIMER':
      if (message.endTime) {
        chrome.alarms.create('timer-phase-end', { when: message.endTime });
      }
      sendResponse({ success: true });
      break;

    case 'PAUSE_TIMER':
    case 'RESET_TIMER':
    case 'PHASE_COMPLETE':
      chrome.alarms.clear('timer-phase-end');
      sendResponse({ success: true });
      break;

    case 'SHOW_NOTIFICATION':
      // Check if notifications are enabled in settings
      chrome.storage.sync.get(['settings'], (result) => {
        const settings = result.settings || {};
        
        // Only show notification if enabled
        if (settings.notifications !== false) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
            title: message.title || 'Focus Timer',
            message: message.body || '',
          });
        }
        sendResponse({ success: true });
      });
      return true;
  }
  return true;
});
