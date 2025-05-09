// Initialize alarm for checking stock
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['checkInterval'], function(data) {
    const interval = data.checkInterval || 5;
    setupAlarm(interval);
  });
});

// Listen for changes in check interval
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.checkInterval) {
    setupAlarm(changes.checkInterval.newValue);
  }
});

// Setup alarm for periodic checking
function setupAlarm(interval) {
  chrome.alarms.clearAll();
  chrome.alarms.create('checkStock', {
    periodInMinutes: interval
  });
}

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkStock') {
    checkStock();
  }
});

// Send confirmation email when monitoring starts
async function sendConfirmationEmail(item, email) {
  try {
    const response = await fetch('http://localhost:3000/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    console.log('Confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startMonitoring") {
    // Send confirmation email if email notifications are enabled
    chrome.storage.sync.get(['emailNotifications', 'email'], async function(data) {
      if (data.emailNotifications && data.email) {
        await sendConfirmationEmail(request.item, data.email);
      }
    });
  } else if (request.action === "updateInterval") {
    setupAlarm(request.interval);
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    chrome.action.openPopup();
  }
});

// Check stock for all monitored items
async function checkStock() {
  try {
    const data = await chrome.storage.sync.get(['monitoringList']);
    const monitoringList = data.monitoringList || [];
    
    for (const item of monitoringList) {
      await checkStockForItem(item);
    }
  } catch (error) {
    console.error('Error checking stock:', error);
  }
}

// Check stock for a specific item
async function checkStockForItem(item) {
  try {
    // Create a new tab
    const tab = await chrome.tabs.create({ url: item.url, active: false });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      // Send message to content script to check availability
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: "checkAvailability" }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });

      if (response && response.isInStock) {
        await notifyUser(item);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      // Always try to close the tab
      try {
        await chrome.tabs.remove(tab.id);
      } catch (error) {
        console.error('Error closing tab:', error);
      }
    }
  } catch (error) {
    console.error('Error in checkStockForItem:', error);
  }
}

// Send notification to user
async function notifyUser(item) {
  try {
    // Create notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Product Back in Stock!',
      message: `${item.productName} is now available with your selected options.`
    });

    // Send email if enabled
    const data = await chrome.storage.sync.get(['emailNotifications', 'email']);
    if (data.emailNotifications && data.email) {
      try {
        const response = await fetch('http://localhost:3000/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: data.email
          })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        console.log('Stock alert email sent successfully');
      } catch (error) {
        console.error('Error sending stock alert email:', error);
      }
    }
  } catch (error) {
    console.error('Error in notifyUser:', error);
  }
}