// Create and inject the floating icon
function createFloatingIcon() {
  console.log('Creating floating icon...');
  const icon = document.createElement('div');
  icon.id = 'restock-floating-icon';
  icon.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#111111"/>
      <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#111111"/>
      <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" fill="#111111"/>
    </svg>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #restock-floating-icon {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      background-color: white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999999;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    #restock-floating-icon:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    #restock-floating-icon svg {
      width: 24px;
      height: 24px;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(icon);
  console.log('Floating icon created and added to DOM');

  // Add click handler
  icon.addEventListener('click', () => {
    console.log('Icon clicked, sending message to open popup');
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
}

// Check if the user is on a Nike or Amazon page
function checkForNikeOrAmazonPage() {
  const url = window.location.href;
  console.log('Checking URL:', url);
  
  if (url.includes('nike.com') || url.includes('amazon.com')) {
    if (!document.getElementById('restock-floating-icon')) {
      createFloatingIcon();
    }
  } else {
    const icon = document.getElementById('restock-floating-icon');
    if (icon) {
      icon.remove();
    }
  }
}

// Create a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver((mutations) => {
  console.log('DOM changed, checking for Nike or Amazon page');
  checkForNikeOrAmazonPage();
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'data-test']
});

// Initial check
console.log('Running initial check for Nike or Amazon page');
checkForNikeOrAmazonPage();

// Add a small delay and check again to ensure we catch any late-loading elements
setTimeout(() => {
  console.log('Running delayed check for Nike or Amazon page');
  checkForNikeOrAmazonPage();
}, 2000); 