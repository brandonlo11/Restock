// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getProductInfo") {
    const productInfo = getProductInfo();
    sendResponse({productInfo: productInfo});
  }
  return true; // Keep the message channel open for async response
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkAvailability") {
    try {
      const isInStock = checkProductAvailability();
      sendResponse({ isInStock });
    } catch (error) {
      console.error('Error checking availability:', error);
      sendResponse({ isInStock: false, error: error.message });
    }
  }
  return true; // Keep the message channel open for async response
});

function getProductInfo() {
  try {
    // Common selectors for different e-commerce sites
    const selectors = {
      nike: {
        name: [
          '[data-test="product-title"]',
          'h1[data-test="product-title"]',
          '.product-title',
          'h1.headline-5'
        ],
        options: {
          size: [
            '#variation_size_name select',
            '#variation_size_name button',
            '#size_name select',
            '#size_name button',
            '#size_name .selected-value',
            '#variation_size_name .selected-value',
            '[data-test="size-selector"] select',
            '[data-test="size-selector"] button',
            '.size-selector select',
            '.size-selector button',
            '[data-test="size-selector"] .selected-value'
          ],
          color: [
            '#variation_color_name select',
            '#variation_color_name button',
            '#color_name select',
            '#color_name button',
            '#color_name .selected-value',
            '#variation_color_name .selected-value',
            '[data-test="color-selector"] select',
            '[data-test="color-selector"] button',
            '.color-selector select',
            '.color-selector button',
            '[data-test="color-selector"] .selected-value'
          ]
        }
      },
      amazon: {
        name: [
          '#productTitle',
          '#title',
          'h1.a-size-large',
          'h1.a-size-medium'
        ],
        options: {
          size: [
            '#variation_size_name select',
            '#variation_size_name button',
            '#size_name select',
            '#size_name button',
            '#size_name .selected-value',
            '#variation_size_name .selected-value'
          ],
          color: [
            '#variation_color_name select',
            '#variation_color_name button',
            '#color_name select',
            '#color_name button',
            '#color_name .selected-value',
            '#variation_color_name .selected-value'
          ]
        }
      }
    };

    // Try to detect which site we're on
    let site = null;
    if (window.location.hostname.includes('nike.com')) {
      site = 'nike';
    } else if (window.location.hostname.includes('amazon.com')) {
      site = 'amazon';
    }

    if (!site) {
      return null;
    }

    const siteSelectors = selectors[site];
    
    // Find product name using multiple selectors
    let productName = null;
    for (const selector of siteSelectors.name) {
      const element = document.querySelector(selector);
      if (element) {
        // Clean up the product name by removing any HTML tags and extra whitespace
        productName = element.textContent.trim().replace(/\s+/g, ' ');
        break;
      }
    }
    
    if (!productName) {
      return null;
    }

    // Get selected options
    const options = {};
    for (const [optionType, selectorList] of Object.entries(siteSelectors.options)) {
      let selectedValue = null;
      
      // Try each selector for this option type
      for (const selector of selectorList) {
        const element = document.querySelector(selector);
        if (!element) continue;

        // Handle different types of selectors
        if (element.tagName === 'SELECT') {
          selectedValue = element.options[element.selectedIndex]?.text;
        } else if (element.tagName === 'BUTTON') {
          selectedValue = element.textContent.trim();
        } else {
          // For other elements, try to get the selected value
          selectedValue = element.textContent.trim();
        }

        if (selectedValue) {
          // Clean up the selected value
          selectedValue = selectedValue.replace(/\s+/g, ' ').trim();
          break;
        }
      }

      if (selectedValue) {
        options[optionType] = selectedValue;
      }
    }

    return {
      name: productName,
      options: options,
      url: window.location.href
    };
  } catch (error) {
    console.error('Error getting product info:', error);
    return null;
  }
}

// Check product availability based on the site
function checkProductAvailability() {
  try {
    const url = window.location.href;
    
    if (url.includes('nike.com')) {
      const addToCartButton = document.querySelector('[data-test="add-to-cart"]');
      return addToCartButton && !addToCartButton.disabled;
    } else if (url.includes('amazon.com')) {
      const availability = document.querySelector('#availability');
      return availability && !availability.textContent.includes('Currently unavailable');
    }
    
    return false;
  } catch (error) {
    console.error('Error checking product availability:', error);
    return false;
  }
}