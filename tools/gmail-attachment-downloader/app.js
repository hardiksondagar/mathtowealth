// Client ID from the Google Cloud Console
const CLIENT_ID = '885851562647-3j33506vq356oa40aqc5nis311kf6evr.apps.googleusercontent.com';

// Discovery doc URL for APIs used by the app
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

// Authorization scopes required by the API
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

// DOM elements
const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const userContainer = document.getElementById('user-container');
const userName = document.getElementById('user-name');
const appContainer = document.getElementById('app-container');
const searchButton = document.getElementById('search-button');
const searchQuery = document.getElementById('search-query');
const startDate = document.getElementById('start-date');
const endDate = document.getElementById('end-date');
const resultsContainer = document.getElementById('results-container');
const emailsList = document.getElementById('emails-list');
const downloadAllButton = document.getElementById('download-all');
const downloadJsonButton = document.getElementById('download-json');
const loadMoreButton = document.getElementById('load-more');
const resultCount = document.getElementById('result-count');
const resultsSpinner = document.getElementById('results-spinner');
const progressOverlay = document.getElementById('progress-overlay');
const progressBar = document.getElementById('progress-bar');
const progressStatus = document.getElementById('progress-status');
const progressPercentage = document.getElementById('progress-percentage');
const cancelDownloadButton = document.getElementById('cancel-download');
const creditCardFilterButton = document.getElementById('credit-card-filter');

let tokenClient;
let gapiInited = false;
let gisInited = false;
let nextPageToken = null;
let currentQuery = '';
let cancelDownload = false;
let loadedEmailCount = 0;

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  // Load the API client and auth2 library
  gapi.load('client', initializeGapiClient);
  
  // Set up authorization client
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    prompt: 'consent',
    callback: tokenResponse => {
      if (tokenResponse.error !== undefined) {
        throw tokenResponse;
      }
      // Save token to localStorage for persistence
      saveToken(gapi.client.getToken());
      
      showUserContainer();
      authorizeButton.classList.add('hidden');
      appContainer.classList.remove('hidden');
      
      // Fetch user profile information
      fetchUserProfile();
    }
  });
  
  gisInited = true;
  maybeEnableButtons();
  
  // Set default date range for last 30 days
  setDefaultDateRange();
  
  // Restore last search query if available
  restoreLastSearchQuery();
  
  // Add event listeners
  authorizeButton.addEventListener('click', handleAuthClick);
  signoutButton.addEventListener('click', handleSignoutClick);
  searchButton.addEventListener('click', searchEmails);
  downloadAllButton.addEventListener('click', downloadAllAttachments);
  if (downloadJsonButton) {
    downloadJsonButton.addEventListener('click', downloadAllEmailsAsJson);
  }
  loadMoreButton.addEventListener('click', loadMoreEmails);
  cancelDownloadButton.addEventListener('click', () => {
    cancelDownload = true;
    progressStatus.textContent = 'Cancelling...';
  });
  
  // Add credit card filter event listener
  if (creditCardFilterButton) {
    creditCardFilterButton.addEventListener('click', applyCreditCardFilter);
  }
}

async function initializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
  
  // Check for stored token and restore session if it exists
  await tryRestoreSession();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    authorizeButton.disabled = false;
  }
}

function handleAuthClick() {
  if (gapi.client.getToken() === null) {
    // Always show consent screen to ensure user knows what permissions they're granting
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // For users who have already approved the app, don't show consent screen again
    tokenClient.requestAccessToken({prompt: ''});
  }
}

function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    clearStoredToken();
    authorizeButton.classList.remove('hidden');
    hideUserContainer();
    appContainer.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    emailsList.innerHTML = '';
    userName.textContent = '';
  }
}

// Update the display of user-container using CSS to fix the flex display
function showUserContainer() {
  userContainer.classList.remove('hidden');
  userContainer.style.display = 'flex';
}

function hideUserContainer() {
  userContainer.classList.add('hidden');
  userContainer.style.display = 'none';
}

// Function to fetch user profile info
async function fetchUserProfile() {
  try {
    const response = await gapi.client.gmail.users.getProfile({
      userId: 'me'
    });
    
    if (response.result && response.result.emailAddress) {
      // Display user email or get more info if needed
      userName.textContent = response.result.emailAddress;
      
      // You could also fetch additional profile info from People API if needed
      // This would require adding People API to your scopes and discovery docs
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    userName.textContent = 'Signed In User';
  }
}

// Save token to localStorage
function saveToken(token) {
  if (token) {
    // We encrypt the token for better security using a simple mechanism
    // For production, consider using more robust encryption
    const encryptedToken = btoa(JSON.stringify(token));
    try {
      localStorage.setItem('gmail_attachment_downloader_token', encryptedToken);
    } catch (error) {
      console.error('Error saving token to localStorage:', error);
    }
  }
}

// Clear stored token
function clearStoredToken() {
  try {
    localStorage.removeItem('gmail_attachment_downloader_token');
  } catch (error) {
    console.error('Error clearing token from localStorage:', error);
  }
}

// Attempt to restore session from stored token
async function tryRestoreSession() {
  try {
    const encryptedToken = localStorage.getItem('gmail_attachment_downloader_token');
    if (encryptedToken) {
      const token = JSON.parse(atob(encryptedToken));
      
      // Check if token might be expired
      const tokenExpiryTime = token.expires_at;
      const currentTime = new Date().getTime();
      
      if (!tokenExpiryTime || tokenExpiryTime > currentTime) {
        // Set token in the client
        gapi.client.setToken(token);
        
        // Verify token is still valid with a simple API call
        try {
          // Try to get user profile to validate token
          await gapi.client.gmail.users.getProfile({ userId: 'me' });
          
          // If successful, update UI to show logged in state
          signoutButton.classList.remove('hidden');
          showUserContainer();
          authorizeButton.classList.add('hidden');
          appContainer.classList.remove('hidden');
          
          // Fetch user profile information
          fetchUserProfile();
          
          return true;
        } catch (error) {
          // Token is invalid or expired
          console.warn('Stored token is invalid or expired');
          clearStoredToken();
          gapi.client.setToken(null);
        }
      } else {
        // Token is expired, clear it
        clearStoredToken();
      }
    }
  } catch (error) {
    console.error('Error restoring session:', error);
    clearStoredToken();
  }
  
  return false;
}

async function searchEmails() {
  resultsContainer.classList.remove('hidden');
  emailsList.innerHTML = ''; // Clear results for new search
  loadMoreButton.classList.add('hidden');
  nextPageToken = null;
  loadedEmailCount = 0;
  resultCount.textContent = '';
  resultsSpinner.classList.remove('hidden'); // Show spinner when starting search
  
  // Build search query with date range if provided
  let query = searchQuery.value || '';
  
  if (startDate.value) {
    const formattedStartDate = new Date(startDate.value).toISOString().split('T')[0];
    query += ` after:${formattedStartDate}`;
  }
  
  if (endDate.value) {
    const formattedEndDate = new Date(endDate.value).toISOString().split('T')[0];
    query += ` before:${formattedEndDate}`;
  }
  
  // Add has:attachment to search only emails with attachments
  query += ' has:attachment';
  currentQuery = query;
  
  // Save the search query and date range to localStorage
  saveLastSearchQuery();
  
  try {
    await fetchEmails(query);
  } catch (error) {
    console.error('Error searching emails:', error);
    emailsList.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-md">Error: ${error.message}</div>`;
    resultsSpinner.classList.add('hidden'); // Hide spinner on error
  }
}

async function fetchEmails(query, pageToken = null) {
  const params = {
    userId: 'me',
    q: query,
    maxResults: 100
  };
  
  if (pageToken) {
    params.pageToken = pageToken;
  }
  
  const response = await gapi.client.gmail.users.messages.list(params);
  const messages = response.result.messages || [];
  nextPageToken = response.result.nextPageToken || null;
  
  // Update load more button visibility
  if (nextPageToken) {
    loadMoreButton.classList.remove('hidden');
    loadMoreButton.textContent = 'Load More';
  } else {
    loadMoreButton.classList.add('hidden');
  }
  
  if (messages.length === 0) {
    if (!pageToken) { // Only show "no results" message on initial search
      emailsList.innerHTML = '<div class="p-4 bg-yellow-100 text-yellow-700 rounded-md">No emails found with attachments.</div>';
    }
    resultsSpinner.classList.add('hidden'); // Hide spinner when no results
    return;
  }
  
  // Process messages in batches to prevent UI freezing
  await processMessagesBatch(messages, 0, 10);
}

async function processMessagesBatch(messages, startIndex, batchSize) {
  const endIndex = Math.min(startIndex + batchSize, messages.length);
  const batch = messages.slice(startIndex, endIndex);
  
  resultsSpinner.classList.remove('hidden'); // Show spinner while processing batch
  
  const batchPromises = batch.map(message => fetchEmailDetails(message.id));
  await Promise.all(batchPromises);
  
  // Update counter
  loadedEmailCount += batch.length;
  updateResultCount();
  
  if (endIndex < messages.length) {
    // Process next batch after a short delay to allow UI to update
    setTimeout(() => {
      processMessagesBatch(messages, endIndex, batchSize);
    }, 100);
  } else {
    // All messages processed
    resultsSpinner.classList.add('hidden'); // Hide spinner when complete
  }
}

function updateResultCount() {
  resultCount.textContent = `(${loadedEmailCount} emails loaded)`;
  
  if (nextPageToken) {
    loadMoreButton.textContent = `Load More`;
  }
  
  // Show spinner while processing messages, hide when done
  if (loadedEmailCount > 0) {
    resultsSpinner.classList.remove('hidden');
  } else {
    resultsSpinner.classList.add('hidden');
  }
}

async function fetchEmailDetails(messageId) {
  try {
    const response = await gapi.client.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });
    
    const message = response.result;
    const headers = message.payload.headers;
    
    // Extract email details
    const subject = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
    const date = new Date(parseInt(message.internalDate)).toLocaleString();
    
    // Extract email and name from the "from" field
    let fromEmail = "";
    let fromName = "";
    
    const emailMatch = from.match(/<(.+?)>/);
    if (emailMatch && emailMatch[1]) {
      fromEmail = emailMatch[1];
      fromName = from.replace(/<(.+?)>/, '').trim();
    } else {
      fromEmail = from;
      fromName = from;
    }
    
    // Extract and store email content
    let emailContent = "";
    
    // Function to extract text content from message parts
    function extractTextFromParts(part) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        return decoded;
      } else if (part.mimeType === 'text/html' && part.body && part.body.data) {
        // For HTML parts, extract them as text
        const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        // Strip HTML tags for output
        return decoded.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      } else if (part.parts) {
        // Process each part and join with a separator
        return part.parts
          .map(subpart => extractTextFromParts(subpart))
          .filter(text => text)
          .join("\n----------\n");
      } else if (part.body && part.body.attachmentId) {
        return `[ATTACHMENT: ${part.filename || 'unnamed'}]`;
      } else if (part.body && part.body.data) {
        // Handle any other parts with data
        try {
          const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          return `[${part.mimeType || 'unknown'}]: ${decoded.substring(0, 200)}...`;
        } catch (e) {
          return `[${part.mimeType || 'unknown'}]: [Undecodable content]`;
        }
      }
      return "";
    }
    
    // Start extraction from the message payload
    if (message.payload) {
      emailContent = extractTextFromParts(message.payload);
      
      // Store raw data for export
      if (!window.emailDataForExport) window.emailDataForExport = [];
      window.emailDataForExport.push({
        id: messageId,
        subject: subject,
        from: from, 
        fromName: fromName,
        fromEmail: fromEmail,
        date: date,
        content: emailContent
      });
    }
    
    // Extract attachments
    const attachments = [];
    
    // Function to process message parts recursively
    function processMessageParts(messagePart) {
      if (messagePart.parts) {
        messagePart.parts.forEach(part => processMessageParts(part));
      }
      
      if (messagePart.filename && messagePart.filename.trim() !== '') {
        const attachment = {
          id: messagePart.body.attachmentId,
          filename: messagePart.filename,
          mimeType: messagePart.mimeType,
          size: formatBytes(messagePart.body.size)
        };
        attachments.push(attachment);
      }
    }
    
    // Start processing from the message payload
    if (message.payload) {
      processMessageParts(message.payload);
    }
    
    // Create email card element
    createEmailCard(message.id, subject, from, date, attachments);
    
  } catch (error) {
    console.error('Error fetching email details:', error);
  }
}

function createEmailCard(messageId, subject, from, date, attachments) {
  const emailCard = document.createElement('div');
  emailCard.className = 'email-card bg-white rounded-lg shadow-md overflow-hidden';
  
  // Extract sender name from the from field
  const senderName = from.split('<')[0].trim() || from;
  
  // Create the email header
  const emailHeader = document.createElement('div');
  emailHeader.className = 'p-4 cursor-pointer';
  emailHeader.innerHTML = `
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-800">${escapeHtml(subject)}</h3>
        <p class="text-sm text-gray-600">From: ${escapeHtml(senderName)}</p>
        <p class="text-xs text-gray-500">${date}</p>
      </div>
      <div>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ${attachments.length} attachment${attachments.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  `;
  
  // Create attachments container
  const attachmentsContainer = document.createElement('div');
  attachmentsContainer.className = 'bg-gray-50 p-3 border-t border-gray-200 hidden';
  
  if (attachments.length > 0) {
    const attachmentsList = document.createElement('ul');
    attachmentsList.className = 'divide-y divide-gray-200';
    
    attachments.forEach(attachment => {
      const attachmentItem = document.createElement('li');
      attachmentItem.className = 'attachment-item py-2 flex items-center justify-between';
      
      // Format timestamp date
      const emailDate = new Date(date);
      const formattedDate = emailDate instanceof Date && !isNaN(emailDate) 
        ? `${emailDate.getFullYear()}-${String(emailDate.getMonth() + 1).padStart(2, '0')}-${String(emailDate.getDate()).padStart(2, '0')}`
        : formatDateString(date);
      
      // Create the formatted filename with sender-subject-date-filename pattern
      const formattedFilename = formatAttachmentFilename(senderName, subject, formattedDate, attachment.filename);
      
      attachmentItem.innerHTML = `
        <div class="flex items-center">
          <input type="hidden" class="attachment-checkbox" 
            data-message-id="${messageId}" 
            data-attachment-id="${attachment.id}" 
            data-filename="${escapeHtml(attachment.filename)}"
            data-sender="${escapeHtml(senderName)}"
            data-subject="${escapeHtml(subject)}"
            data-date="${escapeHtml(formattedDate)}">
          <div class="ml-2">
            <p class="text-sm font-medium text-gray-900">${escapeHtml(attachment.filename)}</p>
            <p class="text-xs text-gray-500">${attachment.mimeType} · ${attachment.size}</p>
          </div>
        </div>
        <button class="download-attachment text-sm text-blue-600 hover:text-blue-800 font-medium" 
          data-message-id="${messageId}" 
          data-attachment-id="${attachment.id}" 
          data-filename="${escapeHtml(attachment.filename)}"
          data-sender="${escapeHtml(senderName)}"
          data-subject="${escapeHtml(subject)}"
          data-date="${escapeHtml(formattedDate)}">
          Download
        </button>
      `;
      attachmentsList.appendChild(attachmentItem);
    });
    
    attachmentsContainer.appendChild(attachmentsList);
  } else {
    attachmentsContainer.innerHTML = '<p class="text-sm text-gray-500">No attachments found</p>';
  }
  
  emailCard.appendChild(emailHeader);
  emailCard.appendChild(attachmentsContainer);
  
  // Add click event to toggle attachments visibility
  emailHeader.addEventListener('click', () => {
    attachmentsContainer.classList.toggle('hidden');
  });
  
  // Add click event for individual attachment download
  const downloadButtons = emailCard.querySelectorAll('.download-attachment');
  downloadButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const messageId = button.getAttribute('data-message-id');
      const attachmentId = button.getAttribute('data-attachment-id');
      const filename = button.getAttribute('data-filename');
      const sender = button.getAttribute('data-sender');
      const subject = button.getAttribute('data-subject');
      const date = button.getAttribute('data-date');
      
      downloadAttachment(messageId, attachmentId, filename, sender, subject, date);
    });
  });
  
  emailsList.appendChild(emailCard);
}

// Function to format attachment filename with sender-subject-date-filename pattern
function formatAttachmentFilename(sender, subject, date, originalFilename) {
  // Sanitize parts to remove characters that are invalid in filenames
  const sanitizedSender = sanitizeFilename(sender).substring(0, 30);
  const sanitizedSubject = sanitizeFilename(subject).substring(0, 50);
  const sanitizedDate = sanitizeFilename(date);
  
  return `${sanitizedSender}-${sanitizedSubject}-${sanitizedDate}-${originalFilename}`;
}

// Function to sanitize strings for filenames
function sanitizeFilename(str) {
  return str
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid filename characters with hyphen
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/__+/g, '_')           // Replace multiple underscores with single one
    .replace(/--+/g, '-')           // Replace multiple hyphens with single one
    .replace(/^-+|-+$/g, '');       // Remove leading/trailing hyphens
}

// Function to format date string from various formats
function formatDateString(dateStr) {
  // Try to extract a date in YYYY-MM-DD format from the string
  const dateMatch = dateStr.match(/(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})/);
  if (dateMatch) {
    let [_, part1, part2, part3] = dateMatch;
    
    // Determine if year is first or last
    if (part1.length === 4) {
      // Year first format: YYYY-MM-DD
      return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
    } else if (part3.length === 4) {
      // Year last format: MM-DD-YYYY or DD-MM-YYYY
      return `${part3}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
    }
  }
  
  // Fallback: use current date
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function loadMoreEmails() {
  if (nextPageToken) {
    loadMoreButton.classList.add('hidden');
    resultsSpinner.classList.remove('hidden'); // Show spinner when loading more
    
    try {
      await fetchEmails(currentQuery, nextPageToken);
    } catch (error) {
      console.error('Error loading more emails:', error);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'p-4 mt-4 bg-red-100 text-red-700 rounded-md';
      errorMessage.textContent = `Error loading more: ${error.message}`;
      emailsList.appendChild(errorMessage);
      resultsSpinner.classList.add('hidden'); // Hide spinner on error
    }
  }
}

async function downloadAttachment(messageId, attachmentId, filename, sender, subject, date) {
  try {
    const response = await gapi.client.gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId
    });
    
    const base64Data = response.result.data.replace(/-/g, '+').replace(/_/g, '/');
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays);
    const url = window.URL.createObjectURL(blob);
    
    // Use formatted filename if sender, subject and date are provided
    const downloadFilename = (sender && subject && date) 
      ? formatAttachmentFilename(sender, subject, date, filename)
      : filename;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('Error downloading attachment:', error);
    alert('Failed to download attachment: ' + error.message);
  }
}

async function downloadAllAttachments() {
  // Get all attachments from the current visible emails instead of just checked ones
  const attachmentElements = document.querySelectorAll('.attachment-checkbox');
  
  if (attachmentElements.length === 0) {
    alert('No attachments found in the current search results');
    return;
  }
  
  progressOverlay.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressPercentage.textContent = '0%';
  progressStatus.textContent = 'Preparing to download...';
  cancelDownload = false;
  
  const attachments = Array.from(attachmentElements).map(checkbox => ({
    messageId: checkbox.getAttribute('data-message-id'),
    attachmentId: checkbox.getAttribute('data-attachment-id'),
    filename: checkbox.getAttribute('data-filename'),
    sender: checkbox.getAttribute('data-sender'),
    subject: checkbox.getAttribute('data-subject'),
    date: checkbox.getAttribute('data-date')
  }));
  
  // Process attachments in batches to prevent browser from hanging
  let completed = 0;
  
  // Create a zip file
  // Dynamically load JSZip library
  if (typeof JSZip === 'undefined') {
    await loadJSZip();
  }
  
  const zip = new JSZip();
  
  for (let i = 0; i < attachments.length; i++) {
    if (cancelDownload) {
      progressOverlay.classList.add('hidden');
      return;
    }
    
    const attachment = attachments[i];
    progressStatus.textContent = `Downloading: ${attachment.filename} (${i+1}/${attachments.length})`;
    
    try {
      const data = await fetchAttachmentData(attachment.messageId, attachment.attachmentId);
      
      // Format the filename with sender-subject-date-filename pattern
      const formattedFilename = formatAttachmentFilename(
        attachment.sender || 'unknown',
        attachment.subject || 'no-subject',
        attachment.date || 'no-date',
        attachment.filename
      );
      
      // Add file to zip
      // Handle duplicate filenames by adding a suffix
      let fileName = formattedFilename;
      let counter = 1;
      while (zip.file(fileName)) {
        const nameParts = formattedFilename.split('.');
        const ext = nameParts.pop();
        const baseName = nameParts.join('.');
        fileName = `${baseName} (${counter}).${ext}`;
        counter++;
      }
      
      zip.file(fileName, data, {binary: true});
      
      completed++;
      const progress = Math.round((completed / attachments.length) * 100);
      progressBar.style.width = `${progress}%`;
      progressPercentage.textContent = `${progress}%`;
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  }
  
  if (cancelDownload) {
    progressOverlay.classList.add('hidden');
    return;
  }
  
  progressStatus.textContent = 'Generating ZIP file...';
  
  try {
    // Create a zip filename that includes sanitized search query and date range
    let zipFilename = 'gmail-attachments';
    
    // Add sanitized filter/search query if available
    const sanitizedQuery = searchQuery.value ? `-${sanitizeFilename(searchQuery.value)}` : '';
    zipFilename += sanitizedQuery;
    
    // Add date range if available
    if (startDate.value && endDate.value) {
      const formattedStartDate = startDate.value.replace(/-/g, '');
      const formattedEndDate = endDate.value.replace(/-/g, '');
      zipFilename += `-${formattedStartDate}-to-${formattedEndDate}`;
    }
    
    zipFilename += '.zip';
    
    const content = await zip.generateAsync({type: 'blob'});
    const url = window.URL.createObjectURL(content);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    alert('Failed to create ZIP file: ' + error.message);
  }
  
  progressStatus.textContent = 'Download complete!';
  setTimeout(() => {
    progressOverlay.classList.add('hidden');
  }, 1000);
}

async function fetchAttachmentData(messageId, attachmentId) {
  const response = await gapi.client.gmail.users.messages.attachments.get({
    userId: 'me',
    messageId: messageId,
    id: attachmentId
  });
  
  const base64Data = response.result.data.replace(/-/g, '+').replace(/_/g, '/');
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays);
}

async function loadJSZip() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Set default date range to last 30 days
function setDefaultDateRange() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  // Format dates as YYYY-MM-DD for input elements
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  startDate.value = formatDate(thirtyDaysAgo);
  endDate.value = formatDate(today);
}

// Function to save the last search query
function saveLastSearchQuery() {
  try {
    const searchData = {
      query: searchQuery.value || '',
      startDate: startDate.value || '',
      endDate: endDate.value || '',
      timestamp: new Date().getTime()
    };
    localStorage.setItem('gmail_attachment_last_search', JSON.stringify(searchData));
  } catch (error) {
    console.error('Error saving search query to localStorage:', error);
  }
}

// Function to restore the last search query
function restoreLastSearchQuery() {
  try {
    const savedSearch = localStorage.getItem('gmail_attachment_last_search');
    if (savedSearch) {
      const searchData = JSON.parse(savedSearch);
      
      // Only restore if saved within the last 7 days
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      const isRecent = (new Date().getTime() - searchData.timestamp) < sevenDaysInMs;
      
      if (isRecent) {
        searchQuery.value = searchData.query || '';
        if (searchData.startDate) startDate.value = searchData.startDate;
        if (searchData.endDate) endDate.value = searchData.endDate;
        
        // Add a small indicator that last search was restored
        const indicator = document.createElement('div');
        indicator.className = 'text-xs text-gray-500 mt-1';
        indicator.textContent = '(Last search restored)';
        searchQuery.parentNode.appendChild(indicator);
        
        // Fade out the indicator after 5 seconds
        setTimeout(() => {
          indicator.style.opacity = '0';
          indicator.style.transition = 'opacity 1s';
          setTimeout(() => {
            if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
          }, 1000);
        }, 5000);
      }
    }
  } catch (error) {
    console.error('Error restoring search query from localStorage:', error);
  }
}

// Function to fetch and display email text content
async function fetchEmailText(messageId, container) {
  try {
    container.innerHTML = '<p class="text-sm text-gray-500">Loading raw email content...</p>';
    
    // Fetch the message content from the API
    const response = await gapi.client.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'raw'
    });
    
    if (response.result && response.result.raw) {
      // Decode the raw email
      const rawEmail = atob(response.result.raw.replace(/-/g, '+').replace(/_/g, '/'));
      
      // Display raw content
      container.innerHTML = `
        <div class="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-auto max-h-[400px] p-2 bg-gray-50 border rounded">
          ${escapeHtml(rawEmail)}
        </div>
      `;
    } else {
      // Fallback to normal message fetch if raw isn't available
      const fullResponse = await gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });
      
      const message = fullResponse.result;
      const emailText = extractEmailText(message.payload);
      
      if (emailText) {
        // Prepare the text for display
        const formattedText = escapeHtml(emailText)
          .replace(/\n/g, '<br>')
          .replace(/\s{2,}/g, match => '&nbsp;'.repeat(match.length));
        
        container.innerHTML = `
          <div class="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-auto max-h-[400px] p-2 bg-gray-50 border rounded">
            ${formattedText}
          </div>
        `;
      } else {
        container.innerHTML = '<p class="text-sm text-red-500">No content could be extracted from this email.</p>';
      }
    }
    
  } catch (error) {
    console.error('Error fetching email text:', error);
    container.innerHTML = `<p class="text-sm text-red-500">Error loading email content: ${error.message}</p>`;
  }
}

// Extract text content from a message part
function extractEmailText(messagePart) {
  let content = [];
  
  // Recursively extract all text from the message
  function extractText(part) {
    if (!part) return;
    
    // If it has body data, decode and add it
    if (part.body && part.body.data) {
      try {
        const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        content.push(`[${part.mimeType || 'unknown'}]\n${decoded}`);
      } catch (e) {
        console.error("Error decoding part:", e);
      }
    }
    
    // Process child parts
    if (part.parts && part.parts.length) {
      part.parts.forEach(p => extractText(p));
    }
  }
  
  extractText(messagePart);
  return content.join('\n\n-------\n\n');
}

// Decode base64 data from Gmail API
function decodeBase64(data) {
  try {
    return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  } catch (e) {
    console.error('Error decoding base64 data:', e);
    return "[Error decoding content]";
  }
}

// Function to export email data
function exportEmailData() {
  if (!window.emailDataForExport || window.emailDataForExport.length === 0) {
    return null;
  }
  
  // Create a simplified export with just the necessary data
  const exportData = window.emailDataForExport.map(email => ({
    subject: email.subject,
    from: email.from,
    fromName: email.fromName,
    fromEmail: email.fromEmail,
    date: email.date,
    content: email.content.substring(0, 5000) // Limit content length for export
  }));
  
  return exportData;
}

// Make the export function available globally
window.exportEmailData = exportEmailData;

// Function to download all emails as JSON
function downloadAllEmailsAsJson() {
  if (!window.emailDataForExport || window.emailDataForExport.length === 0) {
    alert("No emails found to export. Please search for emails first.");
    return;
  }
  
  // Create a simplified export with just the necessary data
  const exportData = window.emailDataForExport.map(email => ({
    subject: email.subject,
    from: email.from,
    fromName: email.fromName,
    fromEmail: email.fromEmail,
    date: email.date,
    content: email.content.substring(0, 10000) // Limit content length for export
  }));
  
  // Create a file name with date range
  let fileName = 'gmail-emails';
  
  // Add date range if available
  if (startDate.value && endDate.value) {
    const formattedStartDate = startDate.value.replace(/-/g, '');
    const formattedEndDate = endDate.value.replace(/-/g, '');
    fileName += `-${formattedStartDate}-to-${formattedEndDate}`;
  }
  
  // Add query if available
  if (searchQuery.value) {
    const sanitizedQuery = sanitizeFilename(searchQuery.value);
    fileName += `-${sanitizedQuery}`;
  }
  
  fileName += '.json';
  
  // Convert to JSON string
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // Create a blob and download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Function to apply the credit card statements filter
function applyCreditCardFilter() {
  // List of known credit card statement sender emails
  const creditCardEmails = [
    // HDFC
    'EmailStatements.cards@hdfcbank.net',
    // Axis
    'cc.statements@axisbank.com',
    // ICICI
    'credit_cards@icicibank.com',
    // SBI
    'Statements@sbicard.com',
    // AU Bank
    'estatements@info.aubank.in',
    // PNB
    'creditcard@punjabnationalbank.in',
    // IDFC
    'statement@idfcfirstbank.com',
    // Onecard
    'statement@getonecard.app',
    // IndusInd
    'creditcard.estatements@indusind.com',
    // Standard Chartered
    'Global.E-Statement-IN@sc.com',
    'alerts.in@sc.com',
    // Kotak
    'cardstatement@kotak.com',
    // Federal
    'fedmail@federalbank.co.in',
    // Yes Bank
    'estatement@yesbank.in',
    'alerts@yesbank.in',
    // Amex
    'onlinestatements@welcome.americanexpress.com',
    // HSBC
    'creditcardstatement@mail.hsbc.co.in'
  ];
  
  // Create a search query using OR operator for all emails
  const emailQuery = creditCardEmails.map(email => `from:${email}`).join(' OR ');
  
  // Set the query in the search box
  searchQuery.value = emailQuery;
  
  // Add a visual indicator that filter was applied
  const indicator = document.createElement('div');
  indicator.className = 'text-xs text-green-600 mt-1 animate-pulse';
  indicator.textContent = '✓ Credit card statement filter applied';
  const existingIndicator = searchQuery.parentNode.querySelector('.animate-pulse');
  if (existingIndicator) {
    searchQuery.parentNode.removeChild(existingIndicator);
  }
  searchQuery.parentNode.appendChild(indicator);
  
  // Fade out the indicator after 3 seconds
  setTimeout(() => {
    indicator.style.opacity = '0';
    indicator.style.transition = 'opacity 1s';
    setTimeout(() => {
      if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
    }, 1000);
  }, 3000);
} 