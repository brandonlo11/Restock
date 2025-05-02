// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getProductInfo") {
    const productInfo = getProductInfo();
    sendResponse({productInfo: productInfo});
  }
});

function getProductInfo() {
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
          '[data-test="size-selector"] select',
          '[data-test="size-selector"] button',
          '.size-selector select',
          '.size-selector button',
          '[data-test="size-selector"] .selected-value'
        ],
        color: [
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
      productName = element.textContent.trim();
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

      if (selectedValue) break;
    }

    if (selectedValue) {
      options[optionType] = selectedValue;
    }
  }

  // If no options were found, try to find them in the page text
  if (Object.keys(options).length === 0) {
    const pageText = document.body.textContent;
    const sizeMatch = pageText.match(/Size:\s*([^\n]+)/i);
    const colorMatch = pageText.match(/Color:\s*([^\n]+)/i);
    
    if (sizeMatch) options.size = sizeMatch[1].trim();
    if (colorMatch) options.color = colorMatch[1].trim();
  }

  return {
    name: productName,
    options: options
  };
}

// Add a visual indicator when the extension is active
function addVisualIndicator() {
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background-color: #007bff;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    display: none;
    z-index: 9999;
  `;
  indicator.textContent = 'Stock Monitor Active';
  document.body.appendChild(indicator);

  // Show indicator when mouse is over the page
  document.addEventListener('mousemove', () => {
    indicator.style.display = 'block';
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 2000);
  });
}

// Initialize
addVisualIndicator();