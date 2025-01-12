import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Use the data in your script
const jsonData = readJSONFile('./config.json')

export const timeFramesSelectors = {
  '1s': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(10) > div > span.labelRow-jFqVJoPk',
  '5s': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(11) > div > span.labelRow-jFqVJoPk',
  '10s':
    '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(12) > div > span.labelRow-jFqVJoPk',
  '15s':
    '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(13) > div > span.labelRow-jFqVJoPk',
  '30s':
    '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(14) > div > span.labelRow-jFqVJoPk',
  '45s':
    '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(15) > div > span.labelRow-jFqVJoPk',
  '1m': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(18) > div > span.labelRow-jFqVJoPk',
  '2m': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(19) > div > span.labelRow-jFqVJoPk',
  '3m': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(20) > div > span.labelRow-jFqVJoPk',
  '5m': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(21) > div > span.labelRow-jFqVJoPk',
  '10m':
    '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(22) > div > span.labelRow-jFqVJoPk',
  '15m':
    '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(23) > div > span.labelRow-jFqVJoPk',
  '30m':
    '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(24) > div > span.labelRow-jFqVJoPk',
  '45m':
    '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(25) > div > span.labelRow-jFqVJoPk',
  '1h': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(28) > div > span.labelRow-jFqVJoPk',
  '2h': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(29) > div > span.labelRow-jFqVJoPk',
  '3h': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(30) > div > span.labelRow-jFqVJoPk',
  '4h': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(31) > div > span.labelRow-jFqVJoPk',
  '1D': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(34) > div > span.labelRow-jFqVJoPk',
  '1W': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(35) > div > span.labelRow-jFqVJoPk',
  '1M': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(36) > div > span.labelRow-jFqVJoPk',
  '3M': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(37) > div > span.labelRow-jFqVJoPk',
  '6M': '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(38) > div > span.labelRow-jFqVJoPk',
  '12M':
    '#overlap-manager-root > div:nth-child(2) > span > div.menuWrap-Kq3ruQo8 > div > div > div > div:nth-child(39) > div > span.labelRow-jFqVJoPk'
}

// Function to read and parse JSON data
export function readJSONFile (filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    console.error(`Error reading or parsing JSON file: ${err}`)
    return null
  }
}

// Function to check if a directory exists, and create it if it does not
export function ensureDirectoryExists (directoryPath) {
  // Resolve the directory path to an absolute path
  const absolutePath = path.resolve(directoryPath)

  // Check if the directory exists
  if (!fs.existsSync(absolutePath)) {
    // Directory does not exist, create it
    fs.mkdirSync(absolutePath, { recursive: true })
    console.log(`Directory created: ${absolutePath}`)
  } else {
    console.log(`Directory already exists: ${absolutePath}`)
  }
}

export async function getNextFileNumber (directory, baseName, extension) {
  const initialFileName = `${baseName}${extension}`
  const initialFilePath = path.join(directory, initialFileName)

  // If the file doesn't exist, return the base name without a number
  if (!fs.existsSync(initialFilePath)) {
    return initialFileName
  }

  // If the file exists, start adding numbers to find the next available name
  let index = 1
  let fileName

  while (true) {
    fileName = `${baseName}-${index}${extension}`
    if (!fs.existsSync(path.join(directory, fileName))) {
      return fileName
    }
    index++
  }
}

export function getIndianDate () {
  // Create a Date object for the current date and time
  const now = new Date()

  // Convert the Date object to Indian Standard Time (IST)
  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  const formatter = new Intl.DateTimeFormat('en-IN', options)

  // Format the date
  const [{ value: day }, , { value: month }, , { value: year }] =
    formatter.formatToParts(now)

  // Return the formatted date in DD-MM-YYYY format
  return `${day}-${month}-${year}`
}

// Function to save cookies to a file
export async function saveCookies (page, filePath) {
  const cookies = await page.cookies()
  fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2))
}

// Function to load cookies from a file
export async function loadCookies (page, filePath) {
  const cookies = JSON.parse(fs.readFileSync(filePath))
  await page.setCookie(...cookies)
}

export function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export function convertTimeFrame (timeFrame) {
  if (timeFrame == '1D') {
    return 'D'
  } else if (timeFrame == '1W') {
    return 'W'
  } else if (timeFrame == '1M') {
    return 'M'
  } else {
    return timeFrame
  }
}

export function getSelectors (key1) {
  const result = [timeFramesSelectors[key1]]

  return result
}

export function checkKeysAvailability (...keys) {
  let missingKeys = []

  // Iterate over each provided key
  keys.forEach(key => {
    if (!(key in timeFramesSelectors)) {
      missingKeys.push(key) // Add to missingKeys if the key is not found
    }
  })

  // Return the missing keys or null if all keys are found
  return missingKeys.length > 0 ? missingKeys : []
}

export function ensureDirSync (dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export function getUniqueFileName (dir, baseName, extension) {
  let fileName = `${baseName}${extension}`
  let counter = 1

  while (fs.existsSync(path.join(dir, fileName))) {
    fileName = `${baseName}_${counter}${extension}`
    counter++
  }

  return fileName
}

//  // Convert `import.meta.url` to a file path and get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Replace with the actual path to the Media Player application
const mediaPlayerPath = jsonData.mediaPlayerPath

export function playVideo (filePath) {
  return new Promise((resolve, reject) => {
    // Convert relative path to absolute path
    const absoluteFilePath = join(__dirname, filePath)

    // Command to open Media Player with the specified video file
    const command = `"${mediaPlayerPath}" "${absoluteFilePath}"`

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error playing video: ${error.message}`)
        reject(error)
        return
      }
      if (stderr) {
        console.error(`Error: ${stderr}`)
        reject(new Error(stderr))
        return
      }
      resolve()
    })
  })
}

const getIndianDateTimeStringForFile = () => {
  const indianTimeZone = 'Asia/Kolkata'
  const options = {
    timeZone: indianTimeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }

  // Format the date-time with 'T' separator between date and time
  const formattedDate = new Intl.DateTimeFormat('en-GB', options)
    .formatToParts(new Date())
    .reduce((acc, part) => {
      if (part.type === 'day' || part.type === 'month') {
        return acc + part.value + '-'
      } else if (part.type === 'year') {
        return acc + part.value + 'T'
      } else if (part.type === 'hour' || part.type === 'minute') {
        return acc + part.value + ':'
      } else if (part.type === 'second') {
        return acc + part.value
      }
      return acc
    }, '')

  return formattedDate.trim()
}

const getIndianTimeForFileName = () => {
  const now = new Date()

  // Get the current time in IST (Indian Standard Time)
  const indianTime = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })

  // Create a new Date object from the IST time string
  const istDate = new Date(indianTime)

  const day = String(istDate.getDate()).padStart(2, '0')
  const month = String(istDate.getMonth() + 1).padStart(2, '0') // Months are 0-indexed
  const year = String(istDate.getFullYear()).slice(2) // Last two digits of the year
  const hours = String(istDate.getHours()).padStart(2, '0')
  const minutes = String(istDate.getMinutes()).padStart(2, '0')

  return `${day}${month}${year}${hours}${minutes}` // ddmmyyhhmm format
}

const getLogDirectoryPath = () => {
  // Define main log directory
  const mainLogDirectory = path.join(__dirname, 'logs')

  // Create main log directory if it doesn't exist
  if (!fs.existsSync(mainLogDirectory)) {
    fs.mkdirSync(mainLogDirectory)
  }

  // Format the current date as YYYY-MM-DD in IST
  const currentDate = getIndianDate()
  const dateSpecificLogDirectory = path.join(mainLogDirectory, currentDate)

  // Create date-specific log directory if it doesn't exist
  if (!fs.existsSync(dateSpecificLogDirectory)) {
    fs.mkdirSync(dateSpecificLogDirectory)
  }

  return dateSpecificLogDirectory
}

// Function to initialize logging with custom file name using IST
export const initializeLogging = (arg1, arg2) => {
  const logDirectory = getLogDirectoryPath()

  // Get the current timestamp in IST for file name
  const formattedTime = getIndianTimeForFileName()

  // Create file name using args and IST timestamp
  const logFileName = `${arg1}-${arg2}-${formattedTime}.log`
  const logFilePath = path.join(logDirectory, logFileName)

  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' })

  // Redirect console methods to write to the log file
  console.log = (...args) => {
    const message = args.join(' ')
    logStream.write(`${getIndianDateTimeStringForFile()} LOG: ${message}\n`)
  }

  console.error = (...args) => {
    const message = args.join(' ')
    logStream.write(`${getIndianDateTimeStringForFile()} ERROR: ${message}\n`)
  }

  return logStream
}

export async function clickAdjBtn (page) {
  await delay(1000)
  try {
    const adjBtn = await page.$(
      'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--center > div.chart-toolbar.chart-controls-bar > div > div.seriesControlWrapper-BXXUwft2 > div:nth-child(3) > button'
    )

    if (adjBtn) {
      // Get the value of the 'aria-pressed' attribute
      const ariaPressedValue = await page.evaluate(() => {
        const button = document.querySelector('button[data-name="adj"]')
        return button.getAttribute('aria-pressed')
      })

      if (ariaPressedValue == 'false') {
        await page.click(
          'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--center > div.chart-toolbar.chart-controls-bar > div > div.seriesControlWrapper-BXXUwft2 > div:nth-child(3) > button'
        )
      } else if (ariaPressedValue == 'true') {
        await page.click(
          'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--center > div.chart-toolbar.chart-controls-bar > div > div.seriesControlWrapper-BXXUwft2 > div:nth-child(3) > button'
        )
        await delay(1000)
        await page.click(
          'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--center > div.chart-toolbar.chart-controls-bar > div > div.seriesControlWrapper-BXXUwft2 > div:nth-child(3) > button'
        )
      }
    }
  } catch (error) {
    console.log('adj btn', error)
  }
}

// Function to get the list based on the number dynamically
export function getCompareList (number) {
  const listKey = `list${number}` // Construct the key dynamically, e.g., 'list1', 'list2', etc.
  return jsonData[listKey] // Access the list using the dynamically constructed key
}

// Function to delete all files in the "StockList" folder
const clearStockListFolder = folderPath => {
  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath)

    // Loop through and delete each file in the folder
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath)
        // console.log(`Deleted file: ${filePath}`)
      }
    }
  }
}

export const splitFileIntoChunks = (inputFilePath, linesPerFile, baseName) => {
  return new Promise((resolve, reject) => {
    try {
      const outputFolder = './StockList'

      // Check if the "StockList" folder exists, if not, create it
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder)
        console.log(`Created folder: ${outputFolder}`)
      } else {
        // Clear the folder if it already exists
        clearStockListFolder(outputFolder)
      }

      // Read the file content
      const fileContent = fs.readFileSync(inputFilePath, 'utf-8')

      // Split the content into an array of lines
      const lines = fileContent.split('\n')

      // Initialize an array to store the file paths of the newly created files
      const createdFilePaths = []

      // If total lines are 20 or fewer, create a single file without suffix
      if (lines.length <= 20) {
        const outputFilePath = path.join(outputFolder, `${baseName}.txt`)
        fs.writeFileSync(outputFilePath, lines.join('\n'), 'utf-8')
        console.log(`Created file: ${outputFilePath}`)
        createdFilePaths.push(outputFilePath)
      } else {
        // Split the lines into chunks of the desired size (20 lines)
        for (let i = 0; i < lines.length; i += linesPerFile) {
          // Create a subset of the lines
          const chunk = lines.slice(i, i + linesPerFile).join('\n')

          // Determine file name with suffix only if the total lines are greater than 20
          const outputFilePath = path.join(
            outputFolder,
            `${baseName}-${Math.floor(i / linesPerFile) + 1}.txt`
          )

          // Write the chunk to a new file inside the "StockList" folder
          fs.writeFileSync(outputFilePath, chunk, 'utf-8')
          console.log(`Created file: ${outputFilePath}`)

          // Add the file path to the array
          createdFilePaths.push(outputFilePath)
        }
      }

      // Resolve the promise with the array of created file paths
      resolve(createdFilePaths)
    } catch (error) {
      reject(error)
    }
  })
}
