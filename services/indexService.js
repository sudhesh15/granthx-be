import { PlaywrightWebBaseLoader } from "@langchain/community/document_loaders/web/playwright";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { Document } from "@langchain/core/documents";

export async function initIndexing(userInput) {
  let docs;

  if (userInput.endsWith('.pdf')) {
    console.log("Processing PDF input.");
    const loader = new PDFLoader(userInput);
    docs = await loader.load();
  } else if (userInput.endsWith('.csv')) {
    console.log("Processing CSV input.");
    const loader = new CSVLoader(userInput);
    docs = await loader.load();
  } else if (/^https?:\/\/(www\.)?youtu/.test(userInput)) {
    console.log("Processing YouTube URL input.");
    const loader = YoutubeLoader.createFromUrl(userInput, {
      language: "en",
      addVideoInfo: true,
    });
    docs = await loader.load();
  } else if (/^https?:\/\//.test(userInput)) {
    console.log("Processing general URL input.");
    const loader = new PlaywrightWebBaseLoader(userInput, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: "networkidle",
        timeout: 30000,
      },
      evaluate: async (page, browser) => {
        await page.waitForTimeout(3000);
        
        try {
          await page.waitForSelector('main, [role="main"], .content, #content', { 
            timeout: 10000 
          });
        } catch (e) {
          console.log('No main content selector found, proceeding anyway');
        }
        
        return await page.evaluate(() => {
          function extractStructuredContent() {
            let content = [];
            const unwantedSelectors = ['script', 'style', 'noscript', 'iframe', 'object', 'embed'];
            unwantedSelectors.forEach(selector => {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => el.remove());
            });
            
            const title = document.title;
            if (title) {
              content.push(`Page Title: ${title}\n`);
            }
            
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
              content.push(`Description: ${metaDescription.getAttribute('content')}\n`);
            }
            
            function processElement(element, level = 0) {
              const tagName = element.tagName.toLowerCase();
              const text = element.textContent?.trim();
              
              if (!text) return '';
              
              let result = '';
              const indent = '  '.repeat(level);
              
              switch (tagName) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                  result += `\n${indent}${tagName.toUpperCase()}: ${text}\n`;
                  break;
                  
                case 'p':
                  if (text.length > 10) {
                    result += `\n${indent}${text}\n`;
                  }
                  break;
                  
                case 'li':
                  result += `${indent}• ${text}\n`;
                  break;
                  
                case 'a':
                  const href = element.getAttribute('href');
                  if (href && text) {
                    result += `${indent}Link: ${text} (${href})\n`;
                  }
                  break;
                  
                case 'img':
                  const alt = element.getAttribute('alt');
                  const src = element.getAttribute('src');
                  if (alt || src) {
                    result += `${indent}Image: ${alt || 'No alt text'} (${src || 'No source'})\n`;
                  }
                  break;
                  
                case 'button':
                  if (text.length > 0) {
                    result += `${indent}Button: ${text}\n`;
                  }
                  break;
                  
                default:
                  if (text.length > 20 && !element.querySelector('h1,h2,h3,h4,h5,h6,p,li,a,button')) {
                    result += `${indent}${text}\n`;
                  }
              }
              
              return result;
            }
            
            const mainSelectors = [
              'main',
              '[role="main"]',
              '.main-content',
              '.content',
              '#content',
              'article',
              'section',
              '.container',
              'body'
            ];
            
            let mainContent = null;
            for (const selector of mainSelectors) {
              mainContent = document.querySelector(selector);
              if (mainContent) break;
            }
            
            if (!mainContent) {
              mainContent = document.body;
            }

            const navElements = document.querySelectorAll('nav, .nav, .navbar, .navigation, .menu');
            if (navElements.length > 0) {
              content.push('\n=== NAVIGATION ===\n');
              navElements.forEach(nav => {
                const navText = nav.textContent?.trim();
                if (navText && navText.length > 0) {
                  content.push(navText + '\n');
                }
              });
            }
            
            const headers = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headers.length > 0) {
              content.push('\n=== HEADINGS ===\n');
              headers.forEach(header => {
                content.push(processElement(header));
              });
            }
            
            content.push('\n=== MAIN CONTENT ===\n');
            
            const textElements = mainContent.querySelectorAll('p, div, span, li, td, th, blockquote, pre');
            const processedTexts = new Set();
            
            textElements.forEach(el => {
              const text = el.textContent?.trim();
              if (text && text.length > 20 && !processedTexts.has(text)) {
                const isContained = Array.from(processedTexts).some(existingText => 
                  existingText.includes(text) || text.includes(existingText)
                );
                
                if (!isContained) {
                  content.push(text + '\n');
                  processedTexts.add(text);
                }
              }
            });
            
            const links = mainContent.querySelectorAll('a[href]');
            if (links.length > 0) {
              content.push('\n=== LINKS ===\n');
              const uniqueLinks = new Set();
              links.forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent?.trim();
                if (href && text && text.length > 0) {
                  const linkInfo = `${text} -> ${href}`;
                  if (!uniqueLinks.has(linkInfo)) {
                    uniqueLinks.add(linkInfo);
                    content.push(linkInfo + '\n');
                  }
                }
              });
            }
            
            const images = mainContent.querySelectorAll('img[alt]');
            if (images.length > 0) {
              content.push('\n=== IMAGES ===\n');
              images.forEach(img => {
                const alt = img.getAttribute('alt');
                const src = img.getAttribute('src');
                if (alt && alt.trim().length > 0) {
                  content.push(`Image: ${alt} (${src || 'No source'})\n`);
                }
              });
            }
            
            const forms = mainContent.querySelectorAll('form, input, textarea, button, select');
            if (forms.length > 0) {
              content.push('\n=== INTERACTIVE ELEMENTS ===\n');
              forms.forEach(form => {
                const tagName = form.tagName.toLowerCase();
                const text = form.textContent?.trim() || form.getAttribute('placeholder') || form.getAttribute('value');
                const type = form.getAttribute('type');
                const name = form.getAttribute('name');
                
                if (text || type || name) {
                  let formInfo = `${tagName.toUpperCase()}`;
                  if (type) formInfo += ` (${type})`;
                  if (name) formInfo += ` [${name}]`;
                  if (text && text.length > 0) formInfo += `: ${text}`;
                  content.push(formInfo + '\n');
                }
              });
            }
            
            return content.join('');
          }
          
          return extractStructuredContent();
        });
      },
    });
    
    docs = await loader.load();
  } else if (typeof userInput === 'string') {
    console.log("Processing plain text input.");
    docs = [new Document({ pageContent: userInput })];
  } else {
    throw new Error("Unsupported input type.");
  }

  const filteredDocs = docs.filter(doc => 
    doc.pageContent && doc.pageContent.trim().length > 200
  );

  if (filteredDocs.length === 0) {
    throw new Error("No meaningful content extracted from the website.");
  }

  console.log("Extracted content preview:", filteredDocs[0].pageContent.substring(0, 500) + "...");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 3000,
    chunkOverlap: 300,
  });
  
  const splitDocs = await splitter.splitDocuments(filteredDocs);

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large"
  });

  await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    collectionName: "granthX",
  });

  console.log(`Indexing complete. Processed ${splitDocs.length} document chunks.`);
  return { 
    documentsProcessed: filteredDocs.length, 
    chunksCreated: splitDocs.length 
  };
}