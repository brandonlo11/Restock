document.addEventListener('DOMContentLoaded', function() {
  const checkIntervalInput = document.getElementById('checkInterval');
  const emailNotificationsCheckbox = document.getElementById('emailNotifications');
  const emailGroup = document.getElementById('emailGroup');
  const emailInput = document.getElementById('email');
  const saveSettingsButton = document.getElementById('saveSettings');
  const startMonitoringButton = document.getElementById('startMonitoring');
  const monitoringList = document.getElementById('monitoringList');

  // Load saved settings
  chrome.storage.sync.get(['checkInterval', 'emailNotifications', 'email'], function(data) {
    checkIntervalInput.value = data.checkInterval || 5;
    emailNotificationsCheckbox.checked = data.emailNotifications || false;
    emailInput.value = data.email || '';
    emailGroup.style.display = data.emailNotifications ? 'block' : 'none';
  });

  // Load monitoring list
  loadMonitoringList();

  // Toggle email input visibility
  emailNotificationsCheckbox.addEventListener('change', function() {
    emailGroup.style.display = this.checked ? 'block' : 'none';
  });

  // Save settings
  saveSettingsButton.addEventListener('click', function() {
    const settings = {
      checkInterval: parseInt(checkIntervalInput.value),
      emailNotifications: emailNotificationsCheckbox.checked,
      email: emailInput.value
    };

    chrome.storage.sync.set(settings, function() {
      // Update the alarm with new interval
      chrome.runtime.sendMessage({
        action: 'updateInterval',
        interval: settings.checkInterval
      });

      // Show confirmation
      const status = document.createElement('div');
      status.textContent = 'Settings saved!';
      status.style.color = 'green';
      status.style.marginTop = '10px';
      document.querySelector('.container').appendChild(status);
      setTimeout(() => status.remove(), 2000);
    });
  });

  // Start monitoring current product
  startMonitoringButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getProductInfo"}, function(response) {
        if (response && response.productInfo) {
          const monitoringItem = {
            url: tabs[0].url,
            productName: response.productInfo.name,
            options: response.productInfo.options,
            timestamp: new Date().toISOString()
          };

          chrome.storage.sync.get(['monitoringList'], function(data) {
            const monitoringList = data.monitoringList || [];
            monitoringList.push(monitoringItem);
            chrome.storage.sync.set({monitoringList: monitoringList}, function() {
              loadMonitoringList();
              // Notify background script to start monitoring
              chrome.runtime.sendMessage({
                action: "startMonitoring",
                item: monitoringItem
              });
            });
          });
        } else {
          alert('Could not get product information. Please make sure you are on a product page and have selected the desired options.');
        }
      });
    });
  });
});

function loadMonitoringList() {
  chrome.storage.sync.get(['monitoringList'], function(data) {
    const list = data.monitoringList || [];
    const monitoringList = document.getElementById('monitoringList');
    monitoringList.innerHTML = '';

    if (list.length === 0) {
      monitoringList.innerHTML = '<p class="empty-list">No items being monitored</p>';
      return;
    }

    list.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'monitoring-item';
      
      const productInfo = document.createElement('div');
      productInfo.className = 'product-info';
      
      // Clean up the product name
      const cleanName = item.productName.replace(/[^\w\s-]/g, '').trim();
      
      // Create the product info HTML
      let optionsHtml = '';
      if (Object.keys(item.options).length > 0) {
        optionsHtml = Object.entries(item.options)
          .map(([key, value]) => {
            // Clean up the option value
            const cleanValue = value.replace(/[^\w\s-]/g, '').trim();
            return `${key}: ${cleanValue}`;
          })
          .join('<br>');
      }
      
      productInfo.innerHTML = `
        <strong>${cleanName}</strong>
        ${optionsHtml ? '<br>' + optionsHtml : ''}
      `;
      
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.className = 'remove-button';
      removeButton.onclick = () => removeItem(index);
      
      itemDiv.appendChild(productInfo);
      itemDiv.appendChild(removeButton);
      monitoringList.appendChild(itemDiv);
    });
  });
}

function removeItem(index) {
  chrome.storage.sync.get(['monitoringList'], function(data) {
    const list = data.monitoringList || [];
    list.splice(index, 1);
    chrome.storage.sync.set({ monitoringList: list }, function() {
      loadMonitoringList();
    });
  });
}