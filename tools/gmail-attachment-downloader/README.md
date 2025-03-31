# Gmail Attachment Downloader

A web-based tool that allows you to search through your Gmail emails and download attachments in bulk.

## Features

- Login with your Google account
- Search emails by keywords
- Filter emails by date range
- View emails with attachments
- Download individual attachments
- Download multiple attachments as a ZIP file
- Download email content as JSON
- Pagination for search results
- Progress tracking for downloads

## Setup Instructions

1. Clone this repository or download the files.

2. Create a Google Cloud Platform project and configure the Gmail API:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Gmail API for your project
   - Configure the OAuth consent screen (external or internal)
   - Create OAuth 2.0 credentials (Web application type)
   - Add `http://localhost:8000` (or your hosting URL) to the authorized JavaScript origins
   - Copy your Client ID

3. Update the credentials in `app.js`:
   ```javascript
   const CLIENT_ID = 'YOUR_CLIENT_ID';
   ```

4. Start a local web server to run the application. For example, using Python:
   ```
   # For Python 3
   python -m http.server 8000
   
   # For Python 2
   python -m SimpleHTTPServer 8000
   ```

5. Open your browser and navigate to http://localhost:8000

## Usage

1. Click the "Login with Gmail" button and authorize the application to access your Gmail account.
2. Enter your search terms in the search box. You can use Gmail search operators like `from:`, `to:`, `subject:`, etc.
3. Optionally set a date range to narrow down your search.
4. Click "Search Emails" to find emails with attachments matching your criteria.
5. Click on an email to view its attachments.
6. For downloading:
   - Click the "Download" button next to an attachment to download it individually.
   - Click "Download All Attachments as ZIP" to download all attachments in the current results as a ZIP file.
   - Click "Download All Emails as JSON" to export the email data in JSON format.

## Technical Notes

- This application is built with pure HTML, CSS, and JavaScript with no backend required.
- Uses the Gmail API with OAuth 2.0 authentication to securely access email data.
- Uses Tailwind CSS for styling.
- JSZip library is dynamically loaded when needed for creating ZIP files.
- The app processes attachments in batches to prevent browser freezing with large attachments.
- All authentication and data processing is done client-side.
- Tokens are encrypted and stored in localStorage for session persistence.

## Privacy

- This application only requests read-only access to your Gmail account.
- No email data is stored on any server.
- All processing happens in your browser only.
- You can revoke access at any time by visiting [Google Account Permissions](https://myaccount.google.com/permissions).

## License

MIT 