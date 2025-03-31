# Jekyll Implementation Guide for Math to Wealth

This repository is structured to use Jekyll with GitHub Pages to share header and footer components across all tools.

## Structure Overview

- `_includes/`: Contains shared components like header.html and footer.html
- `_layouts/`: Contains the default.html layout that all tool pages use
- `_config.yml`: Jekyll configuration
- `.nojekyll`: Ensures GitHub Pages processes this as a Jekyll site

## How to Add a New Tool

1. Create a new folder in the `tools/` directory for your tool
2. Create an index.html file with the following front matter:

```yaml
---
layout: default
title: Your Tool Name
description: Description of your tool
keywords: keyword1, keyword2, keyword3
custom_css: styles.css
custom_js: script.js
---

<!-- Your tool's content here -->
```

3. Your tool's content should go directly in the body of the HTML file
4. Tool-specific CSS should be in a styles.css file in your tool's folder
5. Tool-specific JavaScript should be in a script.js file in your tool's folder

## Testing Locally

To test locally, you'll need to install Ruby and Jekyll:

```bash
# Install Ruby (if not already installed)
# For MacOS:
brew install ruby

# Install bundler
gem install bundler

# Install Jekyll and dependencies
bundle install

# Start the Jekyll server
bundle exec jekyll serve
```

Then visit http://localhost:4000 in your browser.

## Notes for GitHub Pages

GitHub Pages will automatically process and serve the Jekyll site if the repository is configured properly. Make sure:

1. The repository has GitHub Pages enabled in Settings
2. The main branch is chosen as the source branch
3. The `github-pages` gem is included in the Gemfile

## Troubleshooting

If your changes aren't reflected on GitHub Pages:
1. Make sure your commits have been pushed to the main branch
2. Check the GitHub Pages build log in the repository's "Actions" tab
3. Ensure all Jekyll files have the correct permissions and format 