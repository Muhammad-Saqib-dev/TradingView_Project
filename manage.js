import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import fs from 'fs'
import { getList, ListDelete, ListInput, login } from './mainFunctions.js'
import {
  delay,
  initializeLogging,
  loadCookies,
  readJSONFile
} from './functions.js'

// Use the data in your script
const jsonData = readJSONFile('./config.json')

puppeteer.use(StealthPlugin())

const URL = jsonData.URL

const BROWSER_PATH =
  //   '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // Change this path to your desired browser's path

if (process.argv.length <= 2) {
  console.log(`
No arguments provided.

Commands:
  --help    Show help information
  --get     Retrieve the lists .
  --input <stockListFilePath> <listNameToShowInTradingView>   Add items to the list with the provided parameters.
  --delete <listname>    Delete items from the list.

Examples:
  node Manage.js --get
  node Manage.js --input StockListFilePath ListNameInTradingView
  node Manage.js --delete listName
`)
  process.exit(0)
}

if (process.argv.includes('--help')) {
  console.log(`
Commands:
  --get     Retrieve the list of items.
  --input <stockListFilePath> <listNameToShowInTradingView>   Add items to the list with the provided parameters.
  --delete <listname>    Delete items from the list.

Examples:
  node Manage.js --get
  node Manage.js --input StockListFilePath ListNameInTradingView
  node Manage.js --delete listName
`)
  process.exit(0)
} else if (process.argv.includes('--get')) {
  console.log('Retrieving the list ....')
} else if (process.argv.includes('--input')) {
  const inputIndex = process.argv.indexOf('--input')
  const stockListFilePath = process.argv[inputIndex + 1]
  const listNameToShowInTradingView = process.argv[inputIndex + 2]

  if (!stockListFilePath || !listNameToShowInTradingView) {
    console.error(
      'Error: --input requires <stockListFilePath> and <listNameToShowInTradingView> arguments.'
    )
    process.exit(1)
  }

  console.log(
    `Adding items from ${stockListFilePath} to the list "${listNameToShowInTradingView}"...`
  )
  // Logic for adding items can be added here
} else if (process.argv.includes('--delete')) {
  const deleteIndex = process.argv.indexOf('--delete')
  const listName = process.argv[deleteIndex + 1]

  if (!listName) {
    console.error('Error: --delete requires <listname> argument.')
    process.exit(1)
  }

  console.log(`Deleting the list "${listName}"...`)
  // Logic for deleting items can be added here
} else {
  console.error('Error: Invalid command. Use --help to see available commands.')
  process.exit(1)
}

let browser
const runTest = async () => {
  const cookieFilePath = './cookies.json'
  try {
    // Launch a headful Chrome browser
    // ignoreing checking http errors(like authenticating(SSL))
    // want our page should take full width of browser
    browser = await puppeteer.launch({
      //   ignoreHTTPSErrors: true,
      // headless: false,
      defaultViewport: null,
      args: [
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-popup-blocking',
        '--disable-notifications'
      ]
    })

    // checking if page is created or not and then selecting the first page to work on otherwise creating a new page
    const pages = await browser.pages()
    const page = pages.length > 0 ? pages[0] : await browser.newPage()

    // Load cookies if they exist
    if (fs.existsSync(cookieFilePath)) {
      await loadCookies(page, cookieFilePath)
    }

    // Navigate to the website
    await page.goto(URL, {
      timeout: 180000,
      waitUntil: ['load', 'domcontentloaded']
    })

    /////////////////////////////////
    //  Log in to the website
    /////////////////////////////////

    const sidebarVisibleSelector = `button[aria-label="Watchlist, details and news"]`

    //Login in the website
    // craeting variable of the inputs and button of the login page
    // const usernLoggedInSelector = '#tv-content > div > div > div > div > strong'
    const usernLoggedInSelector =
      'div.text-yrIMi47q.text_large-yrIMi47q > div > p:nth-child(1) > button'

    const stockPriceSelector =
      'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-detail > div.widgetbar-widgetbody > div > div.wrapper-Tv7LSjUz > div.container-qWcO4bp9.widgetWrapper-BSF4XTsE.userSelectText-BSF4XTsE.offsetDisabled-BSF4XTsE > span.priceWrapper-qWcO4bp9 > span.highlight-maJ2WnzA.price-qWcO4bp9'

    const firstAvailableElement = await Promise.race([
      page
        .waitForSelector(usernLoggedInSelector, {
          visible: true,
          timeout: 60000
        })
        .then(() => 'Not LoggedIn'),
      page
        .waitForSelector(sidebarVisibleSelector, {
          visible: true,
          timeout: 60000
        })
        .then(() => 'sidebar visible')
    ])

    if (firstAvailableElement == 'sidebar visible') {
      let stockPriceVisible = false

      // While loop to check the visibility of the stock price and click sidebar if necessary
      while (!stockPriceVisible) {
        stockPriceVisible = await page.evaluate(selector => {
          const element = document.querySelector(selector)
          return element !== null && element.offsetParent !== null // Check if the stock price element is visible
        }, stockPriceSelector)

        if (!stockPriceVisible) {
          // Click on the sidebar to refresh the content
          await page.click(sidebarVisibleSelector)

          // Wait for 3 seconds before checking again
          await delay(4000)
        }
      }
    }
    if (firstAvailableElement == 'Not LoggedIn') {
      return console.log(
        'please generate the new cookie, old cookie is expired'
      )
    } else {
      // console.log('Already Logged In')

      if (process.argv[2] == '--input') {
        await ListInput(page, process.argv[3], process.argv[4])
      } else if (process.argv[2] == '--delete') {
        await ListDelete(page)
      } else if (process.argv[2] == '--get') {
        await getList(page)
      }
    }

    console.log('Script Finished')
    // Close the browser
  } catch (error) {
    console.log(error)
  } finally {
    await browser.close()
  }
}

runTest()
