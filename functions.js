import fs from "fs";
import path from "path";


export const timeFramesSelectors = {
    "1s": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(10) > div > span.labelRow-jFqVJoPk",
    "5s": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(11) > div > span.labelRow-jFqVJoPk",
    "10s":
      "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(12) > div > span.labelRow-jFqVJoPk",
    "15s":
      "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(13) > div > span.labelRow-jFqVJoPk",
    "30s":
      "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(14) > div > span.labelRow-jFqVJoPk",
    "45s":
      "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(15) > div > span.labelRow-jFqVJoPk",
    "1m": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(18) > div > span.labelRow-jFqVJoPk",
    "2m": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(19) > div > span.labelRow-jFqVJoPk",
    "3m": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(20) > div > span.labelRow-jFqVJoPk",
    "5m": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(21) > div > span.labelRow-jFqVJoPk",
    "10m":
      "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(22) > div > span.labelRow-jFqVJoPk",
    "15m":
      "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(23) > div > span.labelRow-jFqVJoPk",
    "30m":
      "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(24) > div > span.labelRow-jFqVJoPk",
    "45m":
      "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(25) > div > span.labelRow-jFqVJoPk",
    "1h": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(28) > div > span.labelRow-jFqVJoPk",
    "2h": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(29) > div > span.labelRow-jFqVJoPk",
    "3h": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(30) > div > span.labelRow-jFqVJoPk",
    "4h": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(31) > div > span.labelRow-jFqVJoPk",
    "1D": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(34) > div > span.labelRow-jFqVJoPk",
    "1W": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(35) > div > span.labelRow-jFqVJoPk",
    "1M": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(36) > div > span.labelRow-jFqVJoPk",
    "3M": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(37) > div > span.labelRow-jFqVJoPk",
    "6M": "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(38) > div > span.labelRow-jFqVJoPk",
    "12M":
      "#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(39) > div > span.labelRow-jFqVJoPk",
  };


  // Function to read and parse JSON data
export function readJSONFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading or parsing JSON file: ${err}`);
      return null;
    }
  }

   // Function to check if a directory exists, and create it if it does not
   export function ensureDirectoryExists(directoryPath) {
    // Resolve the directory path to an absolute path
    const absolutePath = path.resolve(directoryPath);
  
    // Check if the directory exists
    if (!fs.existsSync(absolutePath)) {
      // Directory does not exist, create it
      fs.mkdirSync(absolutePath, { recursive: true });
      console.log(`Directory created: ${absolutePath}`);
    } else {
      console.log(`Directory already exists: ${absolutePath}`);
    }
  }

  export async function getNextFileNumber(directory, baseName, extension) {
    const initialFileName = `${baseName}${extension}`;
    const initialFilePath = path.join(directory, initialFileName);
  
    // If the file doesn't exist, return the base name without a number
    if (!fs.existsSync(initialFilePath)) {
      return initialFileName;
    }
  
    // If the file exists, start adding numbers to find the next available name
    let index = 1;
    let fileName;
    
    while (true) {
      fileName = `${baseName}-${index}${extension}`;
      if (!fs.existsSync(path.join(directory, fileName))) {
        return fileName;
      }
      index++;
    }
  }


  export function getIndianDate() {
    // Create a Date object for the current date and time
    const now = new Date();
    
    // Convert the Date object to Indian Standard Time (IST)
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-IN', options);
    
    // Format the date
    const [{ value: day },,{ value: month },,{ value: year }] = formatter.formatToParts(now);
    
    // Return the formatted date in DD-MM-YYYY format
    return `${day}-${month}-${year}`;
  }


  // Function to save cookies to a file
export async function saveCookies(page, filePath) {
    const cookies = await page.cookies();
    fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
  }
  
  // Function to load cookies from a file
 export async function loadCookies(page, filePath) {
    const cookies = JSON.parse(fs.readFileSync(filePath));
    await page.setCookie(...cookies);
  }
  
 export function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }


export function convertTimeFrame(timeFrame){
    if(timeFrame == "1D"){
        return "D"
    }else if(timeFrame == "1W"){
        return "W"
    }else if(timeFrame == "1M"){
        return "M"
    }else{
        return timeFrame
    }

}

export function getSelectors(key1) {
    const result = [timeFramesSelectors[key1]];

    return result;
  }

 export function checkKeysAvailability(...keys) {
    let missingKeys = [];

    // Iterate over each provided key
    keys.forEach((key) => {
      if (!(key in timeFramesSelectors)) {
        missingKeys.push(key); // Add to missingKeys if the key is not found
      }
    });

    // Return the missing keys or null if all keys are found
    return missingKeys.length > 0 ? missingKeys : [];
  }


  export function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }


  export function getUniqueFileName(dir, baseName, extension) {
    let fileName = `${baseName}${extension}`;
    let counter = 1;
  
    while (fs.existsSync(path.join(dir, fileName))) {
      fileName = `${baseName}_${counter}${extension}`;
      counter++;
    }
  
    return fileName;
  }
