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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startMonitoring") {
    checkStockForItem(request.item);
  }
});

// Check stock for all monitored items
async function checkStock() {
  const data = await chrome.storage.sync.get(['monitoringList']);
  const monitoringList = data.monitoringList || [];
  
  for (const item of monitoringList) {
    await checkStockForItem(item);
  }
}

// Check stock for a specific item
async function checkStockForItem(item) {
  try {
    const response = await fetch(item.url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Check if the product is in stock
    const isInStock = checkProductAvailability(doc, item.url);
    
    if (isInStock) {
      notifyUser(item);
    }
  } catch (error) {
    console.error('Error checking stock:', error);
  }
}

// Check product availability based on the site
function checkProductAvailability(doc, url) {
  if (url.includes('nike.com')) {
    const addToCartButton = doc.querySelector('[data-test="add-to-cart"]');
    return addToCartButton && !addToCartButton.disabled;
  } else if (url.includes('amazon.com')) {
    const availability = doc.querySelector('#availability');
    return availability && !availability.textContent.includes('Currently unavailable');
  }
  return false;
}

// Send notification to user
async function notifyUser(item) {
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
    // Note: In a real implementation, you would need to set up an email service
    // This is just a placeholder for the email sending logic
    console.log('Would send email to:', data.email);
  }
}