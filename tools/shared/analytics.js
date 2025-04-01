// Helper function to track tool usage
function trackToolUsage(toolName, action) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': 'Tool Usage',
            'event_label': toolName,
            'page_location': window.location.pathname
        });
    }
}

// Track when calculator is used
function trackCalculatorUsage(toolName, result) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'Calculator Used', {
            'event_category': 'Tool Usage',
            'event_label': toolName,
            'value': result ? 1 : 0,
            'page_location': window.location.pathname
        });
    }
}

// Track when user views results
function trackResultsView(toolName) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'Results Viewed', {
            'event_category': 'Tool Usage',
            'event_label': toolName,
            'page_location': window.location.pathname
        });
    }
}

// Track when user shares results
function trackShare(toolName, shareMethod) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'Share', {
            'event_category': 'Tool Usage',
            'event_label': toolName,
            'value': shareMethod,
            'page_location': window.location.pathname
        });
    }
} 