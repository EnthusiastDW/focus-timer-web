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

  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
    title: '专注时间到！',
    message: '该休息一下了',
  });

  // Notify any open app tab so it can catch up immediately
  chrome.runtime.sendMessage({ type: 'TIME_UP' }).catch(() => {});
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
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: message.title || 'Focus Timer',
        message: message.body || '',
      });
      sendResponse({ success: true });
      break;
  }
  return true;
});
