document.addEventListener('DOMContentLoaded', function() {
  // Load settings
  loadSettings();
  // Load monitoring list
  loadMonitoringList();

  // Event listeners
  document.getElementById('start-monitoring').addEventListener('click', startMonitoring);
  document.getElementById('email-notifications').addEventListener('change', toggleEmailInput);
  document.getElementById('check-interval').addEventListener('change', saveSettings);
  document.getElementById('email').addEventListener('change', saveSettings);
});

function loadSettings() {
  chrome.storage.sync.get(['checkInterval', 'emailNotifications', 'email'], function(data) {
    document.getElementById('check-interval').value = data.checkInterval || 5;
    document.getElementById('email-notifications').checked = data.emailNotifications || false;
    document.getElementById('email').value = data.email || '';
    document.getElementById('email-input-container').style.display = 
      data.emailNotifications ? 'block' : 'none';
  });
}

function loadMonitoringList() {
  chrome.storage.sync.get(['monitoringList'], function(data) {
    const monitoringList = data.monitoringList || [];
    const listContainer = document.getElementById('monitoring-list');
    listContainer.innerHTML = '';

    monitoringList.forEach((item, index) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'monitoring-item';
      itemElement.innerHTML = `
        <h3>${item.productName}</h3>
        <p>URL: ${item.url}</p>
        <p>Options: ${JSON.stringify(item.options)}</p>
        <button class="remove-button" data-index="${index}">Remove</button>
      `;
      listContainer.appendChild(itemElement);
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-button').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        removeMonitoringItem(index);
      });
    });
  });
}

function startMonitoring() {
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
}

function removeMonitoringItem(index) {
  chrome.storage.sync.get(['monitoringList'], function(data) {
    const monitoringList = data.monitoringList || [];
    monitoringList.splice(index, 1);
    chrome.storage.sync.set({monitoringList: monitoringList}, function() {
      loadMonitoringList();
    });
  });
}

function toggleEmailInput() {
  const emailContainer = document.getElementById('email-input-container');
  emailContainer.style.display = this.checked ? 'block' : 'none';
  saveSettings();
}

function saveSettings() {
  const settings = {
    checkInterval: parseInt(document.getElementById('check-interval').value),
    emailNotifications: document.getElementById('email-notifications').checked,
    email: document.getElementById('email').value
  };
  chrome.storage.sync.set(settings);
}