// analytics-tracker.js
// Save this file or use inline in your HTML <script> tag

(function() {
  // ⚙️ CONFIGURATION - Change these values for each website
  const ANALYTICS_URL = 'https://your-analytics-domain.vercel.app/api/track';
  const SITE_ID = 'site1'; // Change this: 'site1', 'site2', or 'site3'
  
  // 📊 Track page view function
  function trackPageView() {
    // Prepare tracking data
    const trackingData = {
      siteId: SITE_ID,
      path: window.location.pathname,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent
    };
    
    // Send to analytics API
    fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(trackingData),
      keepalive: true // Ensures request completes even if page unloads
    })
    .then(response => {
      if (!response.ok) {
        console.error('Analytics tracking failed:', response.status);
      }
    })
    .catch(error => {
      console.error('Analytics error:', error);
    });
  }
  
  // 🚀 Execute tracking when page loads
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }
})();