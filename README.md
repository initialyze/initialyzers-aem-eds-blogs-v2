# 🧩 Initialyzer AEM EDS Blogs (v2)
This project demonstrates how to build a site using Adobe Edge Delivery Services (EDS) powered by content authored in Google Docs.

## 🌍 Environments
- Preview: https://main--initialyzers-aem-eds-blogs-v2--initialyze.aem.page/en-us/
- Live: https://main--initialyzers-aem-eds-blogs-v2--initialyze.aem.live/en-us/

## 🚀 Installation

```
npm i
```
## Linting
Run ESLint on the codebase:
```
npm run lint
```

## 💻 Local development

1. Git clone the repository into your local. 
   ```
   git clone git@github.com:initialyze/initialyzers-aem-eds-blogs-v2.git
   cd initialyzers-aem-eds-blogs-v2
   ```
2. Install the [AEM CLI](https://github.com/adobe/helix-cli): 
   ```
   npm install -g @adobe/aem-cli
   ```
3. Start Local development server: 
   opens your browser at `http://localhost:3000`) 
   ```
    aem up 
   ```
4. Open the `initialyzers-aem-eds-blogs-v2` directory in your favorite IDE and start coding :)


## 📂 Project Structure

```
├── blocks/         # Custom EDS blocks
├── scripts/        # Utility scripts and helpers
├── styles/         # Styles 
├── fstab.yaml      # Google Drive shared location 
```
